import { router, protectedProcedure } from "../../trpc";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { uploadFile, deleteFile, minioClient, BUCKET_NAME } from "@/lib/minio";
import { TRPCError } from "@trpc/server";
import { ErrorCode, createErrorWithCode } from "@/lib/error-codes";

export const adminMediaRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().optional(),
          limit: z.number().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 50;
      const skip = (page - 1) * limit;

      const [media, totalDocs] = await Promise.all([
        prisma.media.findMany({
          include: { product: { select: { id: true, name: true, slug: true } } },
          skip,
          take: limit,
          orderBy: { id: "desc" },
        }),
        prisma.media.count(),
      ]);

      return {
        docs: media,
        totalDocs,
        limit,
        page,
        totalPages: Math.ceil(totalDocs / limit),
      };
    }),

  get: protectedProcedure.input(z.string()).query(async ({ input: id }) => {
    const media = await prisma.media.findUnique({
      where: { id },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });

    if (!media) {
      throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, {
        message: "Media not found",
        details: { resource: "media", id },
      });
    }

    const objectName = media.url.split("/").pop();
    if (!objectName)
      throw new Error("Could not determine object name from URL");

    try {
      const stat = await minioClient.statObject(BUCKET_NAME, objectName);
      return { ...media, stat };
    } catch (error) {
      console.error("Error getting object stat:", error);
      // If stat fails, just return media. The object might be missing from storage.
      return { ...media, stat: null };
    }
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), alt: z.string() }))
    .mutation(async ({ input }) => {
      const { id, alt } = input;

      const media = await prisma.media.update({
        where: { id },
        data: { alt },
      });
      return media;
    }),

  upload: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        alt: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const url = await uploadFile(buffer, input.fileName, input.mimeType);

      const media = await prisma.media.create({
        data: { url, alt: input.alt ?? input.fileName },
      });
      return media;
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    try {
      const media = await prisma.media.findUnique({ where: { id: input } });

      if (!media) {
        throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, {
          message: "Media not found",
          details: { resource: "media", id: input },
        });
      }

      // Check if the media is associated with a product
      if (media.productId) {
        throw createErrorWithCode(ErrorCode.RESOURCE_IN_USE, {
          message:
            "La multimedia está asociada a un producto y no se puede eliminar.",
          details: {
            resource: "media",
            linkedTo: "product",
            productId: media.productId,
          },
        });
      }

      const fileName = media.url.split("/").pop();
      if (fileName) await deleteFile(fileName);
      await prisma.media.delete({ where: { id: input } });
      return { success: true };
    } catch (error: any) {
      // If it's already a TRPCError (one we created), rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected error in media.delete:", error);
      throw createErrorWithCode(ErrorCode.SERVER_ERROR);
    }
  }),
});