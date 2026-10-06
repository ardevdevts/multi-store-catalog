import type { Specifications as ApiSpecifications } from "@/lib/api-validators";
import type { Currency } from "@/lib/currency-client";
import type { Variant } from "../product-variants-form";

export type Specifications = ApiSpecifications;

export interface Category {
    id: string;
    name: string;
}

export interface Subcategory {
    id: string;
    name: string;
    categoryId: string;
}

export interface CoverImage {
    url: string;
    alt: string;
    isPrimary: boolean;
    isUploaded: boolean;
    file?: File;
}

export interface PriceInput {
    price: number;
    salePrice?: number | null;
    currency: string;
    isDefault?: boolean;
    taxIncluded?: boolean;
    validationError?: string;
}

export interface ProductFormData {
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    categoryId: string | null;
    subcategoryId: string | null;
    coverImages: CoverImage[];
    prices: PriceInput[];
    specifications: Specifications;
    isActive: boolean;
    inStock: boolean;
    featured: boolean;
    variants: Variant[];
    hasVariants: boolean;
}

export interface ProductFormProps {
    productId?: string;
}

export interface ProductData {
    product: any;
    categories: Category[];
    subcategories: Subcategory[];
    currencies: Currency[];
}
