import { NextResponse } from "next/server";
import { Readable } from "stream";
import type { Readable as NodeReadable } from "stream";
import { minioClient, BUCKET_NAME } from "@/lib/minio";
import { isObjectStorageAvailable, readImageAsset } from "@/lib/media-storage";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json(
            { error: 'Media ID is required' },
            { status: 400 }
        );
    }

    // Object storage is the primary backend; it is only consulted when MinIO answers.
    if (await isObjectStorageAvailable()) {
        try {
            const stat = await minioClient.statObject(BUCKET_NAME, id);
            const stream = await minioClient.getObject(BUCKET_NAME, id) as unknown as NodeReadable;

            return new Response(Readable.toWeb(stream) as BodyInit, {
                headers: {
                    "Content-Type": stat.metaData["content-type"] ?? "image/jpeg",
                    "Cache-Control": "public, max-age=3600",
                },
            });
        } catch (err) {
            console.error("MinIO read failed, falling back to the database:", err);
        }
    }

    const asset = await readImageAsset(id);
    if (!asset) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return new Response(new Uint8Array(asset.bytes), {
        headers: {
            "Content-Type": asset.contentType,
            "Cache-Control": "public, max-age=3600",
        },
    });
}
