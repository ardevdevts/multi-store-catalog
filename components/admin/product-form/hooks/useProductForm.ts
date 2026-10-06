import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { getErrorMessage } from "@/lib/error-messages";
import type { ProductFormData, Specifications } from "../types";
import type { Variant } from "../../product-variants-form";
import { generateSlug } from "../utils";

const initialFormData: ProductFormData = {
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    categoryId: null,
    subcategoryId: null,
    coverImages: [],
    prices: [],
    specifications: {},
    isActive: true,
    inStock: true,
    featured: false,
    variants: [],
    hasVariants: false,
};

export function useProductForm(productId?: string) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [manuallyEditedSlug, setManuallyEditedSlug] = useState(false);
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [isFormInitialized, setIsFormInitialized] = useState(!productId); // true for create, false for edit

    const { data: productData, isLoading: productLoading } =
        trpc.admin.products.get.useQuery(
            { id: productId || "" },
            { enabled: !!productId }
        );

    const { data: categoriesData, isLoading: categoriesLoading } =
        trpc.admin.categories.list.useQuery();

    const { data: subcategoriesData, isLoading: subcategoriesLoading } =
        trpc.admin.subcategories.list.useQuery();

    const { data: currenciesData, isLoading: currenciesLoading } =
        trpc.admin.currencies.list.useQuery();

    const utils = trpc.useUtils();

    // When editing (productId exists), we need to wait for product data to load and form to initialize
    // When creating (no productId), we just wait for other queries
    const loading = productId
        ? productLoading || categoriesLoading || subcategoriesLoading || currenciesLoading || !isFormInitialized
        : categoriesLoading || subcategoriesLoading || currenciesLoading;

    const categories = useMemo(() => {
        if (categoriesData) return categoriesData as any[];
        if (productData?.categories) return productData.categories as any[];
        return [];
    }, [categoriesData, productData?.categories]);

    const subcategories = useMemo(() => {
        const allSubs =
            (subcategoriesData as any[]) ??
            (productData?.subcategories as any[]) ??
            [];
        if (formData.categoryId) {
            return allSubs.filter((sub: any) => sub.categoryId === formData.categoryId);
        }
        return [];
    }, [subcategoriesData, productData?.subcategories, formData.categoryId]);

    const currencies = useMemo(() => {
        const list = (productData?.currencies as any[]) ?? (currenciesData as any[]) ?? [];
        return list.filter((currency) => currency?.isActive ?? true);
    }, [productData?.currencies, currenciesData]);

    useEffect(() => {
        if (productData?.product) {
            const product = productData.product;
            setFormData({
                name: product.name,
                slug: product.slug,
                description: product.description,
                shortDescription: product.shortDescription || "",
                categoryId: product.categoryId,
                subcategoryId: product.subcategoryId ?? null,
                coverImages: (product.coverImages || []).map((img: any, index: number) => ({
                    ...img,
                    isUploaded: true,
                    isPrimary: index === 0,
                })),
                prices: (product.prices || []).map((p: any) => ({
                    price: Number(p.amount ?? 0),
                    salePrice: p.saleAmount ?? undefined,
                    currency: p.currency?.code || "",
                    isDefault:
                        (product.prices || []).length === 1 ? true : (p.isDefault ?? false),
                    taxIncluded: p.taxIncluded ?? true,
                })),
                specifications: (product as any).specifications || {},
                isActive: product.isActive,
                inStock: product.inStock,
                featured: product.featured,
                variants: (product.variants || []).map<Variant>((v: any) => {
                    const specs = (v as { specifications?: unknown }).specifications;

                    return {
                        id: v.id,
                        name: v.name,
                        sku: v.sku ?? undefined,
                        stock: v.stock ?? 0,
                        isActive: v.isActive ?? true,
                        description: v.description ?? undefined,
                        shortDescription: v.shortDescription ?? undefined,
                        ...(specs ? { specifications: specs as Specifications } : {}),
                        coverImages: (v.images || []).map((img: any, index: number) => ({
                            url: img.url,
                            alt: img.alt || "",
                            isUploaded: true,
                            isPrimary: index === 0,
                        })),
                        prices: (v.prices || []).map((p: any) => ({
                            price: Number(p.amount ?? 0),
                            salePrice:
                                p.saleAmount != null ? Number(p.saleAmount) : undefined,
                            currency: p.currency?.code || "",
                            isDefault: p.isDefault ?? false,
                            taxIncluded: p.taxIncluded ?? true,
                        })),
                    };
                }),
                hasVariants: (product.variants || []).length > 0,
            });
            setManuallyEditedSlug(product.slug !== generateSlug(product.name));
            setIsFormInitialized(true);
        }
    }, [productData]);

    const createProductMutation = trpc.admin.products.create.useMutation();
    const updateProductMutation = trpc.admin.products.update.useMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setSaving(true);
        let savingToastId: string | number | undefined;

        try {
            let updatedCoverImages = formData.coverImages;
            const pendingImages = formData.coverImages.filter(
                (img) => !img.isUploaded
            );

            if (pendingImages.length > 0) {
                let uploadToastId: string | number | undefined;
                try {
                    uploadToastId = toast.loading("Uploading images...");
                    const uploadPromises = pendingImages.map(async (img) => {
                        const formDataToUpload = new FormData();
                        formDataToUpload.append("file", img.file!);
                        formDataToUpload.append("alt", img.alt);

                        const res = await fetch("/api/admin/media", {
                            method: "POST",
                            body: formDataToUpload,
                        });

                        const media = await res.json();
                        return { ...img, url: media.url, alt: media.alt, isUploaded: true };
                    });

                    const uploadedImages = await Promise.all(uploadPromises);
                    updatedCoverImages = formData.coverImages.map((img) => {
                        const uploaded = uploadedImages.find((u) => u.file === img.file);
                        return uploaded || img;
                    });

                    pendingImages.forEach((img) => URL.revokeObjectURL(img.url));
                    toast.success("Imágenes subidas", { id: uploadToastId });
                } catch (uploadError) {
                    toast.error(getErrorMessage(uploadError), { id: uploadToastId });
                    setSaving(false);
                    return;
                }
            }

            const primaryImage = updatedCoverImages.find((img) => img.isPrimary);
            const otherImages = updatedCoverImages.filter((img) => !img.isPrimary);
            const orderedImages = primaryImage
                ? [primaryImage, ...otherImages]
                : otherImages;

            const submitData = {
                ...formData,
                coverImages: orderedImages.map((img) => ({
                    url: img.url,
                    alt: img.alt,
                })),
                specifications: {
                    ...(formData.specifications || {}),
                    weightUnit: formData.specifications?.weightUnit || "g",
                    volumeUnit: formData.specifications?.volumeUnit || "ml",
                    dimensions: {
                        ...(formData.specifications?.dimensions || {}),
                        unit: formData.specifications?.dimensions?.unit || "cm",
                    },
                },
            };

            const normalizedCategoryId =
                typeof submitData.categoryId === "string"
                    ? submitData.categoryId.trim()
                    : null;
            const normalizedSubcategoryId =
                typeof submitData.subcategoryId === "string"
                    ? submitData.subcategoryId.trim()
                    : null;

            submitData.categoryId = normalizedCategoryId || null;
            submitData.subcategoryId = submitData.categoryId
                ? normalizedSubcategoryId || null
                : null;

            if (submitData.prices && submitData.prices.length > 0) {
                (submitData as any).prices = (submitData.prices as any[]).map(
                    (p) => ({
                        price: p.price,
                        salePrice: p.salePrice ?? null,
                        currency: p.currency,
                        isDefault: p.isDefault ?? false,
                        taxIncluded: p.taxIncluded ?? true,
                    })
                );
            }

            if (submitData.hasVariants) {
                const processedVariants = await Promise.all(
                    submitData.variants.map(async (v) => {
                        let variantImages = v.coverImages || [];
                        const pendingVariantImages = variantImages.filter(
                            (img) => !img.isUploaded
                        );

                        if (pendingVariantImages.length > 0) {
                            const uploadPromises = pendingVariantImages.map(async (img) => {
                                const formDataToUpload = new FormData();
                                formDataToUpload.append("file", img.file!);
                                formDataToUpload.append("alt", img.alt);

                                const res = await fetch("/api/admin/media", {
                                    method: "POST",
                                    body: formDataToUpload,
                                });

                                if (!res.ok) throw new Error("Failed to upload variant image");

                                const media = await res.json();
                                return {
                                    ...img,
                                    url: media.url,
                                    alt: media.alt,
                                    isUploaded: true,
                                };
                            });

                            const uploadedImages = await Promise.all(uploadPromises);
                            variantImages = variantImages.map((img) => {
                                const uploaded = uploadedImages.find(
                                    (u) => u.file === img.file
                                );
                                return uploaded || img;
                            });

                            pendingVariantImages.forEach((img) =>
                                URL.revokeObjectURL(img.url)
                            );
                        }

                        const primaryImage = variantImages.find((img) => img.isPrimary);
                        const otherImages = variantImages.filter((img) => !img.isPrimary);
                        const orderedImages = primaryImage
                            ? [primaryImage, ...otherImages]
                            : otherImages;

                        return {
                            id: v.id,
                            name: v.name,
                            sku: v.sku,
                            stock: v.stock,
                            isActive: v.isActive,
                            attributes: v.attributes,
                            image: v.image,
                            description: v.description,
                            shortDescription: v.shortDescription,
                            specifications: v.specifications,
                            coverImages: orderedImages.map((img) => ({
                                url: img.url,
                                alt: img.alt,
                            })),
                            prices: v.prices?.map((p) => ({
                                price: p.price,
                                salePrice: p.salePrice ?? null,
                                currency: p.currency,
                                isDefault: p.isDefault ?? false,
                                taxIncluded: p.taxIncluded ?? true,
                            })),
                        };
                    })
                );
                (submitData as any).variants = processedVariants;
            } else {
                (submitData as any).variants = [];
            }

            savingToastId = toast.loading("Guardando producto...");

            if (productId) {
                await updateProductMutation.mutateAsync({
                    id: productId,
                    data: submitData as any,
                });
            } else {
                await createProductMutation.mutateAsync({
                    ...(submitData as any),
                });
            }

            void utils.admin.products.list.invalidate();
            toast.success("Producto guardado", { id: savingToastId });
            router.push("/admin/products");
            router.refresh();
        } catch (error) {
            toast.error(getErrorMessage(error), { id: savingToastId });
        } finally {
            setSaving(false);
        }
    };

    return {
        formData,
        setFormData,
        saving,
        loading,
        categories,
        subcategories,
        currencies,
        manuallyEditedSlug,
        setManuallyEditedSlug,
        handleSubmit,
        utils,
    };
}
