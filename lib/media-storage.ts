import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { BUCKET_NAME, deleteFile, minioClient, uploadFile } from "@/lib/minio";

const PROBE_TTL_MS = 60_000;
const PROBE_TIMEOUT_MS = 4_000;

type StorageProbe = { checkedAt: number; available: boolean };

let probe: StorageProbe | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            },
        );
    });
}

function rememberProbe(available: boolean) {
    probe = { checkedAt: Date.now(), available };
}

/**
 * MinIO is only "set up correctly" once it actually answers. `bucketExists`
 * returning false still means the server replied, so only a rejection counts as
 * unavailable. The result is cached so a missing MinIO costs at most one probe
 * per minute instead of one per image request.
 */
export async function isObjectStorageAvailable(): Promise<boolean> {
    if (probe && Date.now() - probe.checkedAt < PROBE_TTL_MS) {
        return probe.available;
    }

    let available = false;
    try {
        await withTimeout(minioClient.bucketExists(BUCKET_NAME), PROBE_TIMEOUT_MS);
        available = true;
    } catch {
        available = false;
    }

    rememberProbe(available);
    return available;
}

export type StoredImage = {
    url: string;
    storage: "object" | "database";
};

/**
 * Store an uploaded image in MinIO when it is reachable, otherwise keep the
 * bytes in the database so uploads keep working without any storage service.
 */
export async function storeImage(
    buffer: Buffer,
    fileName: string,
    contentType: string,
): Promise<StoredImage> {
    if (await isObjectStorageAvailable()) {
        try {
            const url = await uploadFile(buffer, fileName, contentType);
            return { url, storage: "object" };
        } catch (error) {
            console.error("MinIO upload failed, storing image in the database:", error);
            rememberProbe(false);
        }
    }

    const id = randomUUID();
    await prisma.imageAsset.create({
        data: {
            id,
            mimeType: contentType || "application/octet-stream",
            // Copy so Prisma gets an ArrayBuffer-backed view instead of Buffer's pooled memory
            data: new Uint8Array(buffer),
        },
    });

    return { url: `/api/media/${id}`, storage: "database" };
}

export async function readImageAsset(id: string) {
    const asset = await prisma.imageAsset.findUnique({ where: { id } });
    if (!asset) return null;

    return { bytes: asset.data, contentType: asset.mimeType };
}

export type ImageStat = {
    size: number;
    etag: string;
    lastModified: Date;
    metaData: Record<string, unknown>;
};

/** Size/last-modified metadata for a stored image, from either backend. */
export async function describeImage(url: string): Promise<ImageStat | null> {
    const key = url.split("/").pop();
    if (!key) return null;

    const asset = await prisma.imageAsset.findUnique({ where: { id: key } });
    if (asset) {
        return {
            size: asset.data.length,
            etag: `"${asset.id}"`,
            lastModified: asset.createdAt,
            metaData: { "content-type": asset.mimeType },
        };
    }

    if (!(await isObjectStorageAvailable())) return null;

    try {
        const stat = await minioClient.statObject(BUCKET_NAME, key);
        const modified = stat.metaData["last-modified"];
        return {
            size: stat.size,
            etag: stat.etag,
            lastModified: modified ? new Date(modified) : new Date(),
            metaData: stat.metaData,
        };
    } catch (error) {
        console.error("Error getting object stat:", error);
        return null;
    }
}

/** Remove the bytes behind a stored image from whichever backend holds them. */
export async function deleteStoredImage(url: string): Promise<void> {
    const key = url.split("/").pop();
    if (!key) return;

    const asset = await prisma.imageAsset.findUnique({
        where: { id: key },
        select: { id: true },
    });
    if (asset) {
        await prisma.imageAsset.delete({ where: { id: key } });
        return;
    }

    if (await isObjectStorageAvailable()) {
        await deleteFile(key);
    }
}
