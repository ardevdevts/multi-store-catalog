import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Star } from "lucide-react";
import Image from "next/image";
import type { ProductFormData } from "../types";

interface ImagesSectionProps {
    formData: ProductFormData;
    onUpdate: (data: Partial<ProductFormData>) => void;
}

export function ImagesSection({ formData, onUpdate }: ImagesSectionProps) {
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newImages = Array.from(files).map((file, idx) => ({
            url: URL.createObjectURL(file),
            alt: file.name,
            isPrimary: formData.coverImages.length === 0 && idx === 0,
            isUploaded: false,
            file,
        }));

        onUpdate({
            coverImages: [...formData.coverImages, ...newImages],
        });
    };

    const removeImage = (index: number) => {
        const img = formData.coverImages[index];
        if (!img.isUploaded) {
            URL.revokeObjectURL(img.url);
        }
        const newImages = formData.coverImages.filter((_, i) => i !== index);
        if (img.isPrimary && newImages.length > 0) {
            newImages[0].isPrimary = true;
        }
        onUpdate({ coverImages: newImages });
    };

    const setPrimaryImage = (index: number) => {
        const newImages = formData.coverImages.map((img, i) => ({
            ...img,
            isPrimary: i === index,
        }));
        onUpdate({ coverImages: newImages });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Imágenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.coverImages.map((img, index) =>
                        img.url ? (
                            <div key={index} className="flex flex-col gap-2">
                                <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-border">
                                    <Image
                                        src={img.url}
                                        alt={img.alt || "Product image"}
                                        fill
                                        className="object-cover"
                                    />
                                    {img.isPrimary && (
                                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                            Principal
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 justify-center">
                                    {!img.isPrimary && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setPrimaryImage(index)}
                                        >
                                            <Star className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => removeImage(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : null
                    )}

                    <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                            Agregar Imágenes
                        </span>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <div className="block sm:hidden text-xs text-muted-foreground mt-2 text-center">
                            Consejo: Sube hasta múltiples imágenes, marca una como principal
                            después.
                        </div>
                    </label>
                </div>
            </CardContent>
        </Card>
    );
}
