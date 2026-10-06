"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useProductForm } from "./hooks/useProductForm";
import {
    useCreateCategory,
    useCreateSubcategory,
    useCreateCurrency,
} from "./hooks/useCreateDialogs";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { VariantsSection } from "./sections/VariantsSection";
import { PricingSection } from "./sections/PricingSection";
import { CategorySection } from "./sections/CategorySection";
import { ImagesSection } from "./sections/ImagesSection";
import { SpecificationsSection } from "./sections/SpecificationsSection";
import { StatusSection } from "./sections/StatusSection";
import { ProductVariantEditor } from "../product-variants-form";
import {
    CreateCategoryDialog,
    CreateSubcategoryDialog,
    CreateCurrencyDialog,
} from "./dialogs/CreateResourceDialogs";
import type { ProductFormProps } from "./types";

export function ProductForm({ productId }: ProductFormProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const {
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
    } = useProductForm(productId);

    const variantParam = searchParams.get("variant");
    const parsedVariantIndex = variantParam ? Number.parseInt(variantParam, 10) : Number.NaN;
    const isVariantIndexValid =
        Number.isInteger(parsedVariantIndex) &&
        parsedVariantIndex >= 0 &&
        parsedVariantIndex < formData.variants.length;
    const editingVariantIndex = isVariantIndexValid ? parsedVariantIndex : null;

    const categoryDialog = useCreateCategory();
    const subcategoryDialog = useCreateSubcategory();
    const currencyDialog = useCreateCurrency();

    const updateFormData = (data: Partial<typeof formData>) => {
        setFormData({ ...formData, ...data });
    };

    const clearVariantParam = useCallback(() => {
        const params = new URLSearchParams(searchParams);
        params.delete("variant");
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
    }, [pathname, router, searchParams]);

    useEffect(() => {
        if (!loading && variantParam && !isVariantIndexValid) {
            clearVariantParam();
        }
    }, [loading, variantParam, isVariantIndexValid, clearVariantParam]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <main className=" pt-20 lg:pt-0">
                    <div className="p-8 flex items-center justify-center min-h-screen">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </main>
            </div>
        );
    }

    if (editingVariantIndex !== null) {
        return (
            <div className="min-h-screen bg-background">
                <main className="pt-20 lg:pt-0">
                    <div className="p-2 md:p-8 w-full max-w-none mx-auto">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div>
                                <p className="text-3xl font-bold">Editar Variante</p>
                                <p className="text-sm text-muted-foreground">
                                    Producto: {formData.name || "Producto sin nombre"}
                                </p>
                            </div>
                            <Button type="button" variant="outline" onClick={clearVariantParam}>
                                Volver al producto
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <ProductVariantEditor
                                variants={formData.variants}
                                variantIndex={editingVariantIndex}
                                onChange={(variants) => updateFormData({ variants })}
                                currencies={currencies}
                            />

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full sm:w-auto"
                                >
                                    {saving ? "Guardando..." : "Guardar Producto"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={clearVariantParam}
                                    disabled={saving}
                                    className="w-full sm:w-auto"
                                >
                                    Volver
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <main className=" pt-20 lg:pt-0">
                <div className="p-2 md:p-8 w-full max-w-none mx-auto">
                    <p className="text-3xl font-bold mb-6">
                        {productId ? "Editar Producto" : "Crear Producto"}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="lg:col-span-2">
                                <BasicInfoSection
                                    formData={formData}
                                    onUpdate={updateFormData}
                                    manuallyEditedSlug={manuallyEditedSlug}
                                    onSlugEditChange={setManuallyEditedSlug}
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <VariantsSection
                                    formData={formData}
                                    onUpdate={updateFormData}
                                    currencies={currencies}
                                />
                            </div>

                            {!formData.hasVariants && (
                                <PricingSection
                                    formData={formData}
                                    onUpdate={updateFormData}
                                    currencies={currencies}
                                    loading={loading}
                                    onCreateCurrency={() => currencyDialog.setIsOpen(true)}
                                />
                            )}

                            <CategorySection
                                formData={formData}
                                onUpdate={updateFormData}
                                categories={categories}
                                subcategories={subcategories}
                                loading={loading}
                                onCreateCategory={() => categoryDialog.setIsOpen(true)}
                                onCreateSubcategory={() =>
                                    subcategoryDialog.setIsOpen(true)
                                }
                            />

                            <div className="lg:col-span-2">
                                <ImagesSection
                                    formData={formData}
                                    onUpdate={updateFormData}
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <SpecificationsSection
                                    formData={formData}
                                    onUpdate={updateFormData}
                                />
                            </div>

                            <StatusSection
                                formData={formData}
                                onUpdate={updateFormData}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto"
                            >
                                {saving
                                    ? "Guardando..."
                                    : productId
                                        ? "Actualizar Producto"
                                        : "Crear Producto"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/admin/products")}
                                disabled={saving}
                                className="w-full sm:w-auto"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            </main>

            <CreateCategoryDialog
                open={categoryDialog.isOpen}
                onOpenChange={categoryDialog.setIsOpen}
                name={categoryDialog.name}
                onNameChange={categoryDialog.setName}
                onConfirm={() =>
                    categoryDialog.handleCreate((categoryId) =>
                        updateFormData({ categoryId, subcategoryId: null })
                    )
                }
                isLoading={categoryDialog.isLoading}
            />

            <CreateSubcategoryDialog
                open={subcategoryDialog.isOpen}
                onOpenChange={subcategoryDialog.setIsOpen}
                name={subcategoryDialog.name}
                onNameChange={subcategoryDialog.setName}
                onConfirm={() =>
                    subcategoryDialog.handleCreate(
                        formData.categoryId || "",
                        (subcategoryId) => updateFormData({ subcategoryId })
                    )
                }
                isLoading={subcategoryDialog.isLoading}
                hasCategorySelected={!!formData.categoryId}
            />

            <CreateCurrencyDialog
                open={currencyDialog.isOpen}
                onOpenChange={currencyDialog.setIsOpen}
                data={currencyDialog.data}
                onDataChange={currencyDialog.setData}
                onConfirm={currencyDialog.handleCreate}
                isLoading={currencyDialog.isLoading}
            />
        </div>
    );
}
