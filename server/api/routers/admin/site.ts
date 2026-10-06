import { router, protectedProcedure } from "../../trpc";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  ErrorCode,
  createErrorWithCode,
  mapPrismaError,
} from "@/lib/error-codes";
import { isValidE164PhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { getSiteSettings } from "@/lib/site";
import { revalidatePath } from "next/cache";

const brandingPhoneSchema = z
  .string()
  .optional()
  .transform((value) => normalizePhoneNumber(value))
  .refine((value) => value === undefined || isValidE164PhoneNumber(value), {
    message: "Phone number must be a valid international number",
  });

export const siteSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  theme: z
    .object({
      light: z.record(z.string(), z.string()).optional(),
      dark: z.record(z.string(), z.string()).optional(),
      branding: z
        .object({
          logoUrl: z.string().optional(),
          logoAlt: z.string().optional(),
          logoWidth: z.number().optional(),
          logoHeight: z.number().optional(),
          slogan: z.string().optional(),
          contactEmail: z.string().optional(),
          contactPhone: brandingPhoneSchema,
          contactAddress: z.string().optional(),
          socialFacebook: z.string().optional(),
          socialInstagram: z.string().optional(),
          socialTwitter: z.string().optional(),
        })
        .optional(),
      fontId: z.string().optional(),
    })
    .optional(),
  contact: z
    .object({
      email: z.string(),
      phoneNumber: z.string(),
      address: z.string(),
    })
    .optional(),
});

const mergeThemeSection = (
  existingSection: Record<string, unknown> | undefined,
  incomingSection: Record<string, unknown> | undefined,
) => {
  if (!incomingSection) {
    return { ...(existingSection ?? {}) };
  }

  const merged: Record<string, unknown> = { ...(existingSection ?? {}) };

  for (const [key, value] of Object.entries(incomingSection)) {
    if (value === null) {
      delete merged[key];
      continue;
    }
    merged[key] = value;
  }

  return merged;
};

export const adminSiteRouter = router({
  get: protectedProcedure.query(async () => {
    return getSiteSettings();
  }),

  update: protectedProcedure
    .input(siteSchema)
    .mutation(async ({ input }) => {
      const existing = await getSiteSettings();

      try {
        const updateData: Record<string, unknown> = {};

        if (input.name !== undefined) {
          updateData.name = input.name;
        }

        if (input.description !== undefined) {
          updateData.description = input.description;
        }

        if (input.theme !== undefined) {
          const existingTheme = (existing.theme as Record<string, unknown>) ?? {};
          const incomingTheme = input.theme ?? {};

          updateData.theme = {
            ...existingTheme,
            ...incomingTheme,
            light: mergeThemeSection(
              (existingTheme.light ?? {}) as Record<string, unknown>,
              incomingTheme.light as Record<string, unknown> | undefined,
            ),
            dark: mergeThemeSection(
              (existingTheme.dark ?? {}) as Record<string, unknown>,
              incomingTheme.dark as Record<string, unknown> | undefined,
            ),
            branding: mergeThemeSection(
              (existingTheme.branding ?? {}) as Record<string, unknown>,
              incomingTheme.branding as Record<string, unknown> | undefined,
            ),
            fontId:
              incomingTheme.fontId ?? (existingTheme.fontId as string | undefined),
          };
        }

        if (input.contact !== undefined) {
          const currentSettings = (existing.settings ?? {}) as Record<
            string,
            unknown
          >;

          updateData.settings = {
            ...currentSettings,
            contact: input.contact,
          };
        }

        if (Object.keys(updateData).length === 0) {
          return existing;
        }

        const site = await prisma.siteSettings.update({
          where: { id: existing.id },
          data: updateData,
        });

        revalidatePath("/");

        return site;
      } catch (error: any) {
        const prismaErrorCode = mapPrismaError(error);
        if (prismaErrorCode) {
          throw createErrorWithCode(prismaErrorCode);
        }

        if (error instanceof TRPCError) throw error;

        console.error("Unexpected error in site.update:", error);
        throw createErrorWithCode(ErrorCode.SERVER_ERROR);
      }
    }),
});