import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProductVariantsForm } from "@/components/admin/product-variants-form";
import type { ProductFormData } from "../types";
import type { Currency } from "@/lib/currency-client";

interface VariantsSectionProps {
    formData: ProductFormData;
    onUpdate: (data: Partial<ProductFormData>) => void;
    currencies: Currency[];
}

export function VariantsSection({
    formData,
    onUpdate,
    currencies,
}: VariantsSectionProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Variantes de Producto</CardTitle>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="hasVariants">¿Tiene variantes?</Label>
                        <Switch
                            id="hasVariants"
                            checked={formData.hasVariants}
                            onCheckedChange={(checked) =>
                                onUpdate({ hasVariants: checked })
                            }
                        />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Activa esto si el producto tiene múltiples opciones (ej. tallas,
                    colores) con diferentes precios o stock.
                </p>
            </CardHeader>
            {formData.hasVariants && (
                <CardContent>
                    <ProductVariantsForm
                        variants={formData.variants}
                        onChange={(variants) => onUpdate({ variants })}
                        currencies={currencies}
                    />
                </CardContent>
            )}
        </Card>
    );
}
