import { router, protectedProcedure } from "../../trpc";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { describeImage, deleteStoredImage, storeImage } from "@/lib/media-storage";
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

    return { ...media, stat: await describeImage(media.url) };
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
      const alt = input.alt ?? input.fileName;
      const stored = await storeImage(buffer, input.fileName, input.mimeType);

      const media = await prisma.media.create({
        data: { url: stored.url, alt },
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

      await deleteStoredImage(media.url);
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