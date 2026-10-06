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

  return withPrismaRetry(() =>
    prisma.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      update: {},
      create: {
        id: SITE_SETTINGS_ID,
        name: defaultSiteName,
        theme: defaultStoreTheme as unknown as object,
        settings: {},
      },
    }),
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