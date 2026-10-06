import { router, protectedProcedure } from "../../trpc";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { productSchema, productUpdateSchema } from "@/lib/api-validators";
import { toNumber } from "@/lib/number";
import { TRPCError } from "@trpc/server";
import {
  ErrorCode,
  mapPrismaError,
  createErrorWithCode,
} from "@/lib/error-codes";
import { revalidatePath } from "next/cache";

const getEnabledCurrencies = async () => {
  const currencies = await prisma.currency.findMany({
    where: { isActive: true },
  });

  return new Map(currencies.map((currency) => [currency.code, currency.id]));
};

export const adminProductsRouter = router({
  list: protectedProcedure.query(async () => {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        prices: { include: { currency: true } },
        coverImages: true,
        variants: {
          include: {
            prices: { include: { currency: true } },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return products.map((product) => ({
      ...product,
      prices: product.prices.map((p) => ({
        ...p,
        amount: toNumber(p.amount),
        saleAmount: p.saleAmount == null ? null : toNumber(p.saleAmount),
      })),
      variants: product.variants.map((v) => ({
        ...v,
        prices: v.prices.map((p) => ({
          ...p,
          amount: toNumber(p.amount),
          saleAmount: p.saleAmount == null ? null : toNumber(p.saleAmount),
        })),
      })),
    }));
  }),

  create: protectedProcedure
    .input(productSchema)
    .mutation(async ({ input }) => {
      const payload = input;

      // Normalize empty strings to undefined
      const normalizedCategoryId = payload.categoryId?.trim() || undefined;
      const normalizedSubcategoryId = payload.subcategoryId?.trim() || undefined;

      let resolvedSubcategoryId: string | undefined = undefined;
      if (normalizedSubcategoryId) {
        const subcategory = await prisma.subcategory.findFirst({
          where: {
            OR: [
              { id: normalizedSubcategoryId },
              { slug: normalizedSubcategoryId },
            ],
          },
        });
        if (!subcategory) {
          throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, {
            message: "Subcategory not found",
            details: { resource: "subcategory", id: normalizedSubcategoryId },
          });
        }
        resolvedSubcategoryId = subcategory.id;
      }

      // Only validate category if categoryId is provided
      if (normalizedCategoryId) {
        const category = await prisma.category.findUnique({
          where: { id: normalizedCategoryId },
        });
        if (!category) {
          throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, {
            message: "Category not found",
            details: { resource: "category", id: normalizedCategoryId },
          });
        }
      }

      try {
        const currencyMap = await getEnabledCurrencies();
        const allowedCurrencyCodes = new Set(currencyMap.keys());
        const requestedCurrencyCodes = new Set<string>();

        if (Array.isArray(payload.prices)) {
          for (const price of payload.prices) {
            if (price?.currency) requestedCurrencyCodes.add(price.currency);
          }
        }
        if (Array.isArray(payload.variants)) {
          for (const variant of payload.variants) {
            if (!Array.isArray(variant?.prices)) continue;
            for (const price of variant.prices) {
              if (price?.currency) requestedCurrencyCodes.add(price.currency);
            }
          }
        }

        const inactiveCurrencies = Array.from(requestedCurrencyCodes).filter(
          (code) => !allowedCurrencyCodes.has(code),
        );
        if (inactiveCurrencies.length > 0) {
          throw createErrorWithCode(ErrorCode.INVALID_INPUT, {
            message: "Some prices use currencies that are not enabled.",
            details: { currencies: inactiveCurrencies },
          });
        }

        const product = await prisma.product.create({
          data: {
            name: payload.name,
            slug: payload.slug,
            description: payload.description,
            shortDescription: payload.shortDescription,
            categoryId: normalizedCategoryId || null,
            subcategoryId: resolvedSubcategoryId,
            coverImages: {
              create: (payload.coverImages || []).map((image: any) => ({
                url: image.url,
                alt: image.alt,
              })),
            },
            specifications: payload.specifications || {},
            filterValues: payload.filterValues || [],
            tags: payload.tags || [],
            metaData: payload.metaData || {},
            isActive: payload.isActive ?? true,
            inStock: payload.inStock ?? true,
            featured: payload.featured ?? false,
            variants: {
              create: (payload.variants || []).map((variant: any) => ({
                name: variant.name,
                sku: variant.sku,
                stock: variant.stock || 0,
                attributes: variant.attributes || {},
                isActive: variant.isActive ?? true,
                image: variant.image,
                description: variant.description,
                shortDescription: variant.shortDescription,
                specifications: variant.specifications || {},
                images: {
                  create: (variant.coverImages || []).map((image: any) => ({
                    url: image.url,
                    alt: image.alt,
                  })),
                },
                prices: {
                  create: (variant.prices || [])
                    .map((p: any) => {
                      const currencyId = currencyMap.get(p.currency);
                      if (!currencyId) return null;
                      return {
                        amount: p.price || 0,
                        saleAmount: p.salePrice ?? null,
                        currencyId,
                        isDefault: p.isDefault ?? false,
                        taxIncluded: p.taxIncluded ?? true,
                      };
                    })
                    .filter((p: any) => p !== null),
                },
              })),
            },
          },
        });

        if (Array.isArray(payload.prices) && payload.prices.length > 0) {
          for (const p of payload.prices) {
            const currencyId = currencyMap.get(p.currency);
            if (currencyId) {
              await prisma.price.create({
                data: {
                  amount: p.price || 0,
                  saleAmount: p.salePrice ?? null,
                  currencyId,
                  productId: product.id,
                  isDefault: p.isDefault ?? false,
                  taxIncluded: p.taxIncluded ?? true,
                },
              });
            }
          }
        }

        // Revalidate the catalog page to refresh the product listing
        revalidatePath("/");

        return product;
      } catch (error: any) {
        const prismaErrorCode = mapPrismaError(error);
        if (prismaErrorCode) {
          throw createErrorWithCode(prismaErrorCode);
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Unexpected error in products.create:", error);
        throw createErrorWithCode(ErrorCode.SERVER_ERROR);
      }
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;

      const [product, allCategories, allSubcategories, allCurrencies] =
        await Promise.all([
          prisma.product.findUnique({
            where: { id },
            include: {
              coverImages: true,
              category: { include: { subcategories: true } },
              subcategory: true,
              prices: { include: { currency: true } },
              variants: {
                include: {
                  prices: { include: { currency: true } },
                  images: true,
                },
              },
            },
          }),
          prisma.category.findMany({
            orderBy: { name: "asc" },
          }),
          prisma.subcategory.findMany({
            orderBy: { name: "asc" },
          }),
          prisma.currency.findMany({
            where: { isActive: true },
            orderBy: { code: "asc" },
          }),
        ]);

      if (!product) {
        throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, {
          message: "Product not found",
          details: { resource: "product", id },
        });
      }

      return {
        product: {
          ...product,
          prices:
            product.prices?.map((p) => ({
              ...p,
              amount: toNumber(p.amount),
              saleAmount: p.saleAmount == null ? null : toNumber(p.saleAmount),
            })) || [],
          variants:
            product.variants?.map((v) => ({
              ...v,
              prices:
                v.prices?.map((p) => ({
                  ...p,
                  amount: toNumber(p.amount),
                  saleAmount:
                    p.saleAmount == null ? null : toNumber(p.saleAmount),
                })) || [],
            })) || [],
        },
        categories: allCategories,
        subcategories: allSubcategories,
        currencies: allCurrencies,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: productUpdateSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const { id, data } = input;

      const rawCategoryId = data.categoryId;
      const rawSubcategoryId = data.subcategoryId;

      const normalizedCategoryId =
        typeof rawCategoryId === "string" ? rawCategoryId.trim() : rawCategoryId;
      const normalizedSubcategoryId =
        typeof rawSubcategoryId === "string"
          ? rawSubcategoryId.trim()
          : rawSubcategoryId;

      const shouldClearCategory =
        normalizedCategoryId === null || normalizedCategoryId === "";
      const shouldClearSubcategory =
        normalizedSubcategoryId === null ||
        normalizedSubcategoryId === "" ||
        shouldClearCategory;

      let resolvedCategoryId: string | undefined = undefined;
      let resolvedSubcategoryId: string | null | undefined = undefined;

      if (!shouldClearCategory && typeof normalizedCategoryId === "string") {
        const category = await prisma.category.findUnique({
          where: { id: normalizedCategoryId },
        });
        if (!category) {
          throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, {
            message: "Category not found",
            details: { resource: "category", id: normalizedCategoryId },
          });
        }
        resolvedCategoryId = normalizedCategoryId;
      }

      if (shouldClearSubcategory) {
        resolvedSubcategoryId = null;
      } else if (typeof normalizedSubcategoryId === "string") {
        const subcategory = await prisma.subcategory.findFirst({
          where: {
            OR: [{ id: normalizedSubcategoryId }, { slug: normalizedSubcategoryId }],
          },
        });
        if (!subcategory) {
          throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, {
            message: "Subcategory not found",
            details: { resource: "subcategory", id: normalizedSubcategoryId },
          });
        }
        resolvedSubcategoryId = subcategory.id;
      }

      const {
        coverImages,
        prices,
        variants,
        categoryId: _categoryId,
        subcategoryId: _subcategoryId,
        ...restOfData
      } = data;

      const currencyMap = await getEnabledCurrencies();
      const allowedCurrencyCodes = new Set(currencyMap.keys());
      const requestedCurrencyCodes = new Set<string>();

      if (Array.isArray(prices)) {
        for (const price of prices) {
          if (price?.currency) requestedCurrencyCodes.add(price.currency);
        }
      }
      if (Array.isArray(variants)) {
        for (const variant of variants) {
          if (!Array.isArray(variant?.prices)) continue;
          for (const price of variant.prices) {
            if (price?.currency) requestedCurrencyCodes.add(price.currency);
          }
        }
      }

      const inactiveCurrencies = Array.from(requestedCurrencyCodes).filter(
        (code) => !allowedCurrencyCodes.has(code),
      );
      if (inactiveCurrencies.length > 0) {
        throw createErrorWithCode(ErrorCode.INVALID_INPUT, {
          message: "Some prices use currencies that are not enabled.",
          details: { currencies: inactiveCurrencies },
        });
      }

      try {
        const existingProduct = await prisma.product.findUnique({ where: { id } });
        if (!existingProduct) {
          throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, {
            message: "Product not found",
            details: { resource: "product", id },
          });
        }

        const updateData: Prisma.ProductUpdateInput = {
          ...(restOfData as Prisma.ProductUpdateInput),
        };

        if (shouldClearCategory) {
          updateData.category = { disconnect: true };
        } else if (resolvedCategoryId) {
          updateData.category = { connect: { id: resolvedCategoryId } };
        }

        if (resolvedSubcategoryId !== undefined) {
          updateData.subcategory =
            resolvedSubcategoryId === null
              ? { disconnect: true }
              : { connect: { id: resolvedSubcategoryId } };
        }

        const product = await prisma.product.update({
          where: { id },
          data: {
            ...updateData,
          },
        });

        if (coverImages) {
          await prisma.media.deleteMany({ where: { productId: id } });
          if (coverImages.length > 0) {
            await prisma.media.createMany({
              data: coverImages.map((image: any) => ({
                url: image.url,
                alt: image.alt,
                productId: id,
              })),
            });
          }
        }

        if (Array.isArray(prices)) {
          await prisma.price.deleteMany({ where: { productId: id } });
          for (const p of prices) {
            const currencyId = currencyMap.get(p.currency);
            if (currencyId) {
              await prisma.price.create({
                data: {
                  amount: p.price || 0,
                  saleAmount: p.salePrice ?? null,
                  currencyId,
                  productId: id,
                  isDefault: p.isDefault ?? false,
                  taxIncluded: p.taxIncluded ?? true,
                },
              });
            }
          }
        }

        if (Array.isArray(variants)) {
          const existingVariants = await prisma.productVariant.findMany({
            where: { productId: id },
          });
          const existingVariantIds = new Set(existingVariants.map((v) => v.id));

          const inputVariantIds = new Set(
            variants.map((v) => v.id).filter(Boolean),
          );
          const variantsToDelete = existingVariants.filter(
            (v) => !inputVariantIds.has(v.id),
          );

          if (variantsToDelete.length > 0) {
            await prisma.productVariant.deleteMany({
              where: { id: { in: variantsToDelete.map((v) => v.id) } },
            });
          }

          for (const v of variants) {
            let variantId = v.id;

            if (variantId && existingVariantIds.has(variantId)) {
              await prisma.productVariant.update({
                where: { id: variantId },
                data: {
                  name: v.name,
                  sku: v.sku,
                  stock: v.stock,
                  attributes: v.attributes,
                  isActive: v.isActive,
                  image: v.image,
                  description: v.description,
                  shortDescription: v.shortDescription,
                  specifications: v.specifications,
                },
              });
            } else {
              const newVariant = await prisma.productVariant.create({
                data: {
                  productId: id,
                  name: v.name,
                  sku: v.sku,
                  stock: v.stock || 0,
                  attributes: v.attributes || {},
                  isActive: v.isActive ?? true,
                  image: v.image,
                  description: v.description,
                  shortDescription: v.shortDescription,
                  specifications: v.specifications || {},
                },
              });
              variantId = newVariant.id;
            }

            if (v.coverImages) {
              await prisma.media.deleteMany({
                where: { productVariantId: variantId },
              });
              if (v.coverImages.length > 0) {
                await prisma.media.createMany({
                  data: v.coverImages.map((image: any) => ({
                    url: image.url,
                    alt: image.alt,
                    productVariantId: variantId,
                  })),
                });
              }
            }

            if (v.prices && Array.isArray(v.prices)) {
              await prisma.price.deleteMany({
                where: { productVariantId: variantId },
              });
              for (const p of v.prices) {
                const currencyId = currencyMap.get(p.currency);
                if (currencyId) {
                  await prisma.price.create({
                    data: {
                      amount: p.price || 0,
                      saleAmount: p.salePrice ?? null,
                      currencyId,
                      productVariantId: variantId,
                      isDefault: p.isDefault ?? false,
                      taxIncluded: p.taxIncluded ?? true,
                    },
                  });
                }
              }
            }
          }
        }

        // Revalidate the catalog page to refresh the product listing
        revalidatePath("/");

        return product;
      } catch (error: any) {
        const prismaErrorCode = mapPrismaError(error);
        if (prismaErrorCode) {
          throw createErrorWithCode(prismaErrorCode);
        }

        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Unexpected error in products.update:", error);
        throw createErrorWithCode(ErrorCode.SERVER_ERROR);
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await prisma.product.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, {
          message: "Product not found",
        });
      }
      await prisma.product.delete({ where: { id: input.id } });

      // Revalidate the catalog page to refresh the product listing
      revalidatePath("/");

      return { success: true };
    }),
});