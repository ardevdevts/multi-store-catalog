import React from "react";
import { Header } from "@/components/layout/header";
import { CategoryBarWrapper } from "@/components/categories/category-bar-wrapper";
import { getFilterContent } from "@/components/filters/filter-sidebar";
import { ProductGridClient } from "@/components/products/product-grid-client";
import { NavigationLoadingBar } from "@/components/utils/navigation-loading";
import { LoadingProvider } from "@/components/utils/loading-context";
import { PageLayoutWrapper } from "@/components/layout/page-layout-wrapper";
import { getSiteSettings, readSiteTheme } from "@/lib/site";
import { isDatabaseUnavailableError, withPrismaRetry } from "@/lib/prisma-resilience";
import { StoreThemeProvider } from "@/components/theme/store-theme-provider";
import type { StoreTheme } from "@/lib/theme";
import { Metadata } from "next";

// Enable ISR with 1 minute revalidation
export const revalidate = 60;

interface HomePageProps {
  searchParams: Promise<{
    category?: string;
    subcategory?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  let site;
  try {
    site = await getSiteSettings();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        title: "Store Temporarily Unavailable",
        description:
          "This store is temporarily unavailable. Please try again in a moment.",
      };
    }

    throw error;
  }

  const theme = readSiteTheme(site.theme);
  const logoUrl = theme.branding?.logoUrl?.trim() ? theme.branding.logoUrl : undefined;

  // Add cache-busting timestamp to force browser to refresh favicon
  const faviconPath = `/favicon.png?v=${site.updatedAt.getTime()}`;

  const ogImage = logoUrl || faviconPath;

  const title = site.name;
  const description =
    site.description ||
    `Welcome to ${site.name} - Shop our collection of quality products.`;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    keywords: [site.name, "online store", "shopping", "e-commerce"],
    metadataBase: new URL(appUrl),
    alternates: {
      canonical: appUrl,
    },
    openGraph: {
      title,
      description,
      url: appUrl,
      siteName: title,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${site.name} Logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: faviconPath,
      shortcut: faviconPath,
      apple: faviconPath,
    },
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const queryParams = await searchParams;
  const categorySlug = queryParams.category;
  const subcategorySlug = queryParams.subcategory;

  const site = await withPrismaRetry(() => getSiteSettings());

  const filterContent = await getFilterContent(categorySlug, subcategorySlug);

  return (
    <StoreThemeProvider theme={site.theme as StoreTheme}>
      <LoadingProvider>
        <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
          <NavigationLoadingBar />
          <Header storeName={site.name} />
          <CategoryBarWrapper selectedCategorySlug={categorySlug} />
          <PageLayoutWrapper filterContent={filterContent}>
            <div className="flex flex-1">
              <main className="flex-1 ">
                <ProductGridClient
                  categorySlug={categorySlug}
                  subcategorySlug={subcategorySlug}
                  filterContent={filterContent}
                />
              </main>
            </div>
          </PageLayoutWrapper>
        </div>
      </LoadingProvider>
    </StoreThemeProvider>
  );
}