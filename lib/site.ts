import { prisma } from "@/lib/db";
import { withPrismaRetry } from "@/lib/prisma-resilience";
import { defaultStoreTheme, mergeTheme, type StoreTheme } from "@/lib/theme";

const SITE_SETTINGS_ID = "singleton";

export const defaultSiteName = "Una Ganga";

export interface SiteSettingsRecord {
  id: string;
  name: string;
  description: string | null;
  theme: unknown;
  settings: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns the singleton catalog settings row, creating it with defaults when it
 * does not exist yet. Every caller can rely on a non-null result.
 */
export async function getSiteSettings(): Promise<SiteSettingsRecord> {
  const settings = await withPrismaRetry(() =>
    prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } }),
  );

  if (settings) {
    return settings;
  }

  // Prisma compiles this model's upsert to a non-atomic SELECT-then-INSERT
  // inside a transaction, so parallel callers (next build prerender workers,
  // concurrent first requests) race on the primary key and one fails with
  // P2002. createMany + skipDuplicates emits INSERT ... ON CONFLICT DO
  // NOTHING, which makes the bootstrap safe for any number of callers.
  await withPrismaRetry(() =>
    prisma.siteSettings.createMany({
      data: [
        {
          id: SITE_SETTINGS_ID,
          name: defaultSiteName,
          theme: defaultStoreTheme as unknown as object,
          settings: {},
        },
      ],
      skipDuplicates: true,
    }),
  );

  return withPrismaRetry(() =>
    prisma.siteSettings.findUniqueOrThrow({ where: { id: SITE_SETTINGS_ID } }),
  );
}

export function readSiteTheme(theme: unknown): StoreTheme {
  return (theme ?? {}) as StoreTheme;
}

export function readSiteBranding(theme: unknown) {
  return mergeTheme(readSiteTheme(theme)).branding;
}

export function readSiteContact(settings: unknown) {
  const raw = (settings ?? {}) as {
    contact?: { email?: string; phoneNumber?: string; address?: string };
  };

  return {
    email: raw.contact?.email ?? "",
    phoneNumber: raw.contact?.phoneNumber ?? "",
    address: raw.contact?.address ?? "",
  };
}