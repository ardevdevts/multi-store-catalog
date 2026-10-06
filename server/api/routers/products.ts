import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/number";
import { getProductSortablePrice } from "@/lib/product-pricing";

export const productsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        sort: z.string().optional(),
        category: z.union([z.string(), z.number()]).optional(),
        subcategory: z.union([z.string(), z.number()]).optional(),
        inStock: z.string().optional(),
        featured: z.string().optional(),
        search: z.string().optional(),
        currency: z.string().optional(),
        price: z.string().optional().nullable(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const searchParams = input;

        const enabledCurrencyIds = (
          await prisma.currency.findMany({
            where: { isActive: true },
            select: { id: true },
          })
        ).map((currency) => currency.id);

        const page = parseInt(searchParams.page ?? "1");
        const limit = parseInt(searchParams.limit ?? "12");
        const skip = (page - 1) * limit;

        const sort = searchParams.sort ?? "-createdAt";
        let orderBy: any = {};
        let shouldSortByPrice = false;

        if (sort === "-createdAt") orderBy = { id: "desc" };
        else if (sort === "createdAt") orderBy = { id: "asc" };
        else if (sort === "name") orderBy = { name: "asc" };
        else if (sort === "-name") orderBy = { name: "desc" };
        else if (sort === "price" || sort === "-price") {
          shouldSortByPrice = true;
        }

        const where: any = { isActive: true };

        if (searchParams.category) where.categoryId = searchParams.category;
        if (searchParams.subcategory)
          where.subcategoryId = searchParams.subcategory;
        if (searchParams.inStock === "true") where.inStock = true;
        if (searchParams.featured === "true") where.featured = true;

        const search = searchParams.search;

        const currency = searchParams.currency;
        const isCurrencyEnabled =
          currency ? enabledCurrencyIds.includes(currency) : false;
        if (currency) {
          where.prices = isCurrencyEnabled
            ? { some: { currencyId: currency } }
            : { some: { currencyId: "__disabled_currency__" } };
        }

        const price = searchParams.price;
        if (price) {
          const [minStr, maxStr] = price.split("-");
          const min = minStr !== "" ? parseFloat(minStr) : undefined;
          const max = maxStr !== "" ? parseFloat(maxStr) : undefined;
          const priceWhere: any = {};
          if (min !== undefined && !isNaN(min))
            priceWhere.amount = { ...(priceWhere.amount ?? {}), gte: min };
          if (max !== undefined && !isNaN(max))
            priceWhere.amount = { ...(priceWhere.amount ?? {}), lte: max };

          if (Object.keys(priceWhere).length > 0) {
            if (currency && !isCurrencyEnabled) {
              where.prices = {
                some: { currencyId: "__disabled_currency__" },
              };
            } else if (where.prices) {
              where.prices = {
                some: {
                  currencyId: currency ?? { in: enabledCurrencyIds },
                  ...priceWhere,
                },
              };
            } else {
              where.prices = {
                some: {
                  currencyId: { in: enabledCurrencyIds },
                  ...priceWhere,
                },
              };
            }
          }
        }

        const rawProducts = await prisma.product.findMany({
          where,
          orderBy: shouldSortByPrice ? { id: "asc" } : orderBy,
          select: {
            id: true,
            name: true,
            slug: true,
            shortDescription: true,
            description: true,
            categoryId: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
            subcategory: {
              select: {
                name: true,
                slug: true,
              },
            },
            prices: {
              where: { currencyId: { in: enabledCurrencyIds } },
              include: { currency: true },
            },
            coverImages: {
              select: {
                id: true,
                url: true,
                alt: true,
              },
            },
            inStock: true,
            isActive: true,
            featured: true,
            specifications: true,
            variants: {
              where: { isActive: true },
              select: {
                id: true,
                isActive: true,
                prices: {
                  where: { currencyId: { in: enabledCurrencyIds } },
                  include: { currency: true },
                },
              },
            },
          },
        });

        let filteredProducts = rawProducts;

        if (search) {
          const normalizedSearch = search
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
          filteredProducts = rawProducts.filter((prod) => {
            const normalizedName = prod.name
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase();
            const normalizedShort =
              prod.shortDescription
                ?.normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase() || "";
            const normalizedDesc =
              prod.description
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase() || "";
            return (
              normalizedName.includes(normalizedSearch) ||
              normalizedShort.includes(normalizedSearch) ||
              normalizedDesc.includes(normalizedSearch)
            );
          });
        }

        let products = filteredProducts.map((prod) => ({
          ...prod,
          prices:
            prod.prices?.map((p) => ({
              ...p,
              amount: toNumber(p.amount),
              saleAmount: p.saleAmount == null ? null : toNumber(p.saleAmount),
            })) || [],
          variants:
            prod.variants?.map((v) => ({
              ...v,
              prices:
                v.prices?.map((p) => ({
                  ...p,
                  amount: toNumber(p.amount),
                  saleAmount:
                    p.saleAmount == null ? null : toNumber(p.saleAmount),
                })) || [],
            })) || [],
        }));

        if (shouldSortByPrice) {
          products = products.sort((a, b) => {
            const priceA = getProductSortablePrice(a, currency);
            const priceB = getProductSortablePrice(b, currency);

            if (priceA == null && priceB == null) {
              return a.id.localeCompare(b.id);
            }
            if (priceA == null) return 1;
            if (priceB == null) return -1;

            const comparison =
              sort === "price" ? priceA - priceB : priceB - priceA;

            if (comparison !== 0) return comparison;
            return a.id.localeCompare(b.id);
          });
        }

        const totalDocs = products.length;
        const paginatedProducts = products.slice(skip, skip + limit);
        const totalPages = Math.ceil(totalDocs / limit);

        return {
          docs: paginatedProducts,
          totalDocs,
          page,
          limit,
          totalPages,
          pagingCounter: skip + 1,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
          prevPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
        };
      } catch (error) {
        console.log("Error in products list query:", error);
        throw error;
      }
    }),
});