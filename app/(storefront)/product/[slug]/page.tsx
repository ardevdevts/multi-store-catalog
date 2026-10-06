import "@/app/globals.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/number";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/products/product-card";
import { CategoryBarWrapper } from "@/components/categories/category-bar-wrapper";
import { Header } from "@/components/layout/header";
import { StoreThemeProvider } from "@/components/theme/store-theme-provider";
import { LoadingProvider } from "@/components/utils/loading-context";
import { NavigationLoadingBar } from "@/components/utils/navigation-loading";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RichTextRenderer } from "@/components/utils/rich-text-editor";
import { ProductDetailClient } from "./product-detail-client";
import { Metadata } from "next";
import Script from "next/script";
import { getSiteSettings, readSiteTheme } from "@/lib/site";

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Helper function to extract plain text from rich text content
function extractPlainText(content: any): string {
  if (!content) return '';

  // If it's a string, strip HTML tags
  if (typeof content === 'string') {
    return content.replace(/<[^>]*>/g, '').trim();
  }

  // If it's Lexical format, extract text from nodes
  if (content?.root?.children) {
    const extractTextFromNode = (node: any): string => {
      if (node.type === 'text') {
        return node.text || '';
      }
      if (node.children) {
        return node.children.map(extractTextFromNode).join(' ');
      }
      return '';
    };

    return content.root.children
      .map(extractTextFromNode)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return '';
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const site = await getSiteSettings();

  const product = await prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      coverImages: true,
      prices: { include: { currency: true } },
      category: true,
    },
  });

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const coverImages = (product.coverImages as any[]) || [];
  const imageData = coverImages[0];
  const ogImage = imageData?.url || '/favicon.png';

  const title = `${product.name} | ${site.name}`;

  // Extract plain text from rich text description for metadata
  const plainTextDescription = extractPlainText(product.description);
  const description =
    product.shortDescription ||
    plainTextDescription ||
    `Buy ${product.name} at ${site.name}. High quality product at great prices.`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
  const canonicalUrl = `${appUrl}/product/${slug}`;

  // Get price for schema markup
  const defaultPrice =
    product.prices.find((p) => p.isDefault) || product.prices[0];
  const price = defaultPrice ? toNumber(defaultPrice.amount) : 0;
  const currency = defaultPrice?.currency?.code || "USD";

  return {
    title,
    description,
    keywords: [
      product.name,
      site.name,
      product.category?.name || "",
      "buy",
      "shop",
      "product",
    ].filter(Boolean),
    metadataBase: new URL(appUrl),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.name,
      description,
      url: canonicalUrl,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: imageData?.alt || product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
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
    other: {
      "og:price:amount": price.toString(),
      "og:price:currency": currency,
      "og:availability": product.inStock ? "instock" : "outofstock",
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  const site = await getSiteSettings();
  const storeTheme = readSiteTheme(site.theme);

  const product = await prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      category: true,
      subcategory: true,
      prices: { include: { currency: true } },
      coverImages: true,
      variants: {
        where: { isActive: true },
        include: {
          prices: { include: { currency: true } },
          images: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const coverImages = (product.coverImages as any[]) || [];
  const imageData = coverImages[0];
  const primaryImageUrl = imageData?.url || "";
  const primaryImageAlt = imageData?.alt || product.name;

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    include: {
      category: true,
      prices: { include: { currency: true } },
      coverImages: true,
    },
    take: 4,
  });

  const category = product.category;
  const categoryName = category?.name || "Categoría";
  const categorySlug = category?.slug || "";

  const specifications = product.specifications as any;
  const tags = product.tags as any;

  const serializedProduct = {
    ...product,
    shortDescription: product.shortDescription ?? undefined,
    coverImages: coverImages.map((img: any) => ({
      ...img,
      url: img.url,
      alt: img.alt,
    })),
    prices: product.prices.map((p: any) => ({
      ...p,
      amount: toNumber(p.amount),
      saleAmount: p.saleAmount ? toNumber(p.saleAmount) : undefined,
    })),
    variants: product.variants.map((v: any) => ({
      ...v,
      prices: v.prices.map((p: any) => ({
        ...p,
        amount: toNumber(p.amount),
        saleAmount: p.saleAmount ? toNumber(p.saleAmount) : undefined,
      })),
    })),
    specifications,
    tags,
    primaryImageUrl,
    primaryImageAlt,
    currency: product.prices[0]?.currency || null,
  };

  const parseNumeric = (value: any) => toNumber(value ?? 0);

  // Build JSON-LD structured data for product
  const defaultPrice =
    product.prices.find((p) => p.isDefault) || product.prices[0];
  const price = defaultPrice ? parseNumeric(defaultPrice.amount) : 0;
  const currency = defaultPrice?.currency?.code || "USD";
  const salePrice = defaultPrice?.saleAmount
    ? parseNumeric(defaultPrice.saleAmount)
    : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || extractPlainText(product.description),
    image: coverImages.map((img: any) => img.url),
    sku: (product.specifications as any)?.sku || undefined,
    brand: {
      "@type": "Brand",
      name: site.name,
    },
    offers: {
      "@type": "Offer",
      url: `${appUrl}/product/${slug}`,
      priceCurrency: currency,
      price: salePrice || price,
      ...(defaultPrice?.saleAmount && {
        // eslint-disable-next-line react-hooks/purity
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      }),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: site.name,
      },
    },
    ...(product.category && {
      category: product.category.name,
    }),
  };

  return (
    <StoreThemeProvider theme={storeTheme}>
      <LoadingProvider>
        <Script
          id="product-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="min-h-screen bg-background flex flex-col">
          <NavigationLoadingBar />
          <Header storeName={site.name} />
          <CategoryBarWrapper selectedCategorySlug={categorySlug} />

          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/">Inicio</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  {category && (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href={`/?category=${categorySlug}`}>
                            {categoryName}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </>
                  )}
                  <BreadcrumbItem>
                    <BreadcrumbPage>{product.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <ProductDetailClient product={serializedProduct} />

            {product.description && (
              <Card className="mb-16">
                <CardContent className="p-6">
                  <p className="text-2xl font-bold mb-4 text-foreground">
                    Descripción
                  </p>
                  <RichTextRenderer content={String(product.description)} />
                </CardContent>
              </Card>
            )}

            {relatedProducts.length > 0 && (
              <div className="mb-24">
                <p className="text-2xl font-bold mb-6 text-foreground">
                  Productos relacionados
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedProducts.map((relatedProduct) => {
                    const relatedCoverImages =
                      (relatedProduct.coverImages as any[]) || [];
                    const relatedImageData = relatedCoverImages[0];
                    const relatedImageUrl = relatedImageData?.url || "";

                    const relatedDefaultPriceObj =
                      (relatedProduct as any).prices?.find(
                        (p: any) => p.isDefault,
                      ) || (relatedProduct as any).prices?.[0];
                    const relatedPrice = relatedDefaultPriceObj
                      ? parseNumeric(
                        relatedDefaultPriceObj.saleAmount ??
                        relatedDefaultPriceObj.amount,
                      )
                      : 0;
                    const relatedRegularPrice = relatedDefaultPriceObj
                      ? relatedDefaultPriceObj.saleAmount
                        ? parseNumeric(relatedDefaultPriceObj.amount)
                        : undefined
                      : undefined;
                    const relatedCurrency =
                      relatedDefaultPriceObj?.currency ?? null;

                    return (
                      <ProductCard
                        key={relatedProduct.id}
                        id={relatedProduct.id}
                        name={relatedProduct.name}
                        description={relatedProduct.shortDescription || ""}
                        price={relatedPrice}
                        regularPrice={relatedRegularPrice}
                        currency={relatedCurrency}
                        image={relatedImageUrl}
                        imageAlt={relatedImageData?.alt}
                        slug={relatedProduct.slug}
                        featured={relatedProduct.featured}
                        inStock={relatedProduct.inStock}
                        unit={(relatedProduct.specifications as any)?.unit}
                        weight={(relatedProduct.specifications as any)?.weight}
                        weightUnit={
                          (relatedProduct.specifications as any)?.weightUnit
                        }
                        volume={(relatedProduct.specifications as any)?.volume}
                        volumeUnit={
                          (relatedProduct.specifications as any)?.volumeUnit
                        }
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </LoadingProvider>
    </StoreThemeProvider>
  );
}