import { z } from 'zod'

export const idString = z.string().min(1)

export const categorySchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    icon: z.string().optional(),
    isActive: z.boolean().optional(),
    filters: z.array(z.any()).optional(),
})

export const subcategorySchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    categoryId: idString,
    isActive: z.boolean().optional(),
    filters: z.array(z.any()).optional(),
})

export const currencySchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    symbol: z.string().min(1),
    symbolPosition: z.string().optional(),
    decimalSeparator: z.string().optional(),
    thousandsSeparator: z.string().optional(),
    decimalPlaces: z.number().int().optional(),
    isActive: z.boolean().optional(),
})

export const priceInputSchema = z.object({
    currency: z.string().min(1),
    price: z.number().optional(),
    salePrice: z.number().optional().nullable(),
    isDefault: z.boolean().optional(),
    taxIncluded: z.boolean().optional(),
}).refine((data) => {
    if (data.price !== undefined && data.salePrice !== undefined && data.salePrice !== null) {
        return data.salePrice <= data.price;
    }
    return true;
}, {
    message: "El precio de venta no puede ser mayor al precio regular",
    path: ["salePrice"],
})

export const specificationsSchema = z.object({
    sku: z.string().optional(),
    weight: z.number().optional(),
    weightUnit: z.string().optional(),
    dimensions: z.object({
        length: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        unit: z.string().optional(),
    }).optional(),
    volume: z.number().optional(),
    volumeUnit: z.string().optional(),
    unit: z.string().optional(),
}).optional()

export const productSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().min(1),
    shortDescription: z.string().optional(),
    categoryId: z.string().optional().nullable(),
    subcategoryId: z.string().optional().nullable(),
    coverImages: z.array(z.any()).optional(),
    specifications: specificationsSchema,
    filterValues: z.array(z.any()).optional(),
    tags: z.array(z.any()).optional(),
    metaData: z.any().optional(),
    isActive: z.boolean().optional(),
    inStock: z.boolean().optional(),
    featured: z.boolean().optional(),
    prices: z.array(z.object({
        currency: z.string().min(1),
        price: z.number().optional(),
        salePrice: z.number().optional().nullable(),
        isDefault: z.boolean().optional(),
        taxIncluded: z.boolean().optional().nullable(),
    })).refine((prices) => {
        return prices.every(price => {
            if (price.price !== undefined && price.salePrice !== undefined && price.salePrice !== null) {
                return price.salePrice <= price.price;
            }
            return true;
        });
    }, {
        message: "El precio de venta no puede ser mayor al precio regular",
    }).optional(),
    variants: z.array(z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        sku: z.string().optional(),
        stock: z.number().int().optional(),
        attributes: z.any().optional(),
        image: z.string().optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        specifications: specificationsSchema,
        coverImages: z.array(z.any()).optional(),
        isActive: z.boolean().optional(),
        prices: z.array(priceInputSchema).optional(),
    })).optional(),
})

export const mediaAltSchema = z.object({ alt: z.string().optional() })

export const productUpdateSchema = productSchema
export const categoryUpdateSchema = categorySchema
export const subcategoryUpdateSchema = subcategorySchema
export const currencyUpdateSchema = currencySchema

export type ProductInput = z.infer<typeof productSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type SubcategoryInput = z.infer<typeof subcategorySchema>
export type Specifications = z.infer<typeof specificationsSchema>
