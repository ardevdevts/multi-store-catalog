'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Copy, Upload, Star, Edit } from 'lucide-react'
import type { Currency } from '@/lib/currency-client'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Specifications } from '@/lib/api-validators'
import { Separator } from '@/components/ui/separator'
import { CreateCurrencyDialog } from './product-form/dialogs/CreateResourceDialogs'
import { useCreateCurrency } from './product-form/hooks/useCreateDialogs'
import { SpecificationsFormFields } from './product-form/sections/SpecificationsFormFields'
import { PricingSection } from './product-form/sections/PricingSection'
import type { PriceInput } from './product-form/types'


// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface VariantPrice extends PriceInput {
    // Additional fields specific to variants can be added here if needed
}

export interface VariantImage {
    url: string
    alt: string
    isPrimary: boolean
    isUploaded: boolean
    file?: File
}

export interface Variant {
    id?: string
    name: string
    sku?: string
    stock?: number
    prices: VariantPrice[]
    isActive: boolean
    attributes?: any
    image?: string
    description?: string
    shortDescription?: string
    specifications?: Specifications
    coverImages?: VariantImage[]
}

interface ProductVariantsFormProps {
    variants: Variant[]
    onChange: (variants: Variant[]) => void
    currencies: Currency[]
}

export function ProductVariantsForm({ variants, onChange, currencies }: ProductVariantsFormProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const openVariantEditor = (index: number) => {
        const params = new URLSearchParams(searchParams)
        params.set('variant', String(index))
        router.push(`${pathname}?${params.toString()}`)
    }

    const addVariant = () => {
        const defaultCurrency = currencies[0]?.code || 'USD'
        const newVariant: Variant = {
            name: '',
            sku: '',
            isActive: true,
            prices: [{
                price: 0,
                currency: defaultCurrency,
                isDefault: true,
                taxIncluded: true
            }],
            specifications: {},
            coverImages: []
        }
        onChange([...variants, newVariant])
        openVariantEditor(variants.length)
    }

    const removeVariant = (index: number) => {
        const newVariants = variants.filter((_, i) => i !== index)
        onChange(newVariants)
    }

    const duplicateVariant = (index: number) => {
        const variantToCopy = variants[index]
        const newVariant = {
            ...variantToCopy,
            id: undefined,
            name: `${variantToCopy.name} (Copia)`,
            sku: variantToCopy.sku ? `${variantToCopy.sku}-copy` : '',
            coverImages: variantToCopy.coverImages?.map(img => ({ ...img, isUploaded: img.isUploaded }))
        }
        const newVariants = [...variants]
        newVariants.splice(index + 1, 0, newVariant)
        onChange(newVariants)
    }

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-20">Imagen</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {variants.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                No hay variantes. Haz clic en &quot;Agregar Variante&quot; para crear una.
                            </TableCell>
                        </TableRow>
                    ) : (
                        variants.map((variant, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="h-12 w-12 relative rounded-md overflow-hidden border border-border bg-muted">
                                        {variant.coverImages && variant.coverImages.length > 0 ? (
                                            <Image
                                                src={variant.coverImages.find(i => i.isPrimary)?.url || variant.coverImages[0].url}
                                                alt={variant.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                                                <span className="text-xs">-</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {variant.name || <span className="text-muted-foreground">Nueva Variante</span>}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {variant.sku || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {variant.stock ?? <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell className="text-right">
                                    {variant.prices.length > 0
                                        ? `${variant.prices[0].currency} ${variant.prices[0].price}`
                                        : <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openVariantEditor(index)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => duplicateVariant(index)}
                                            title="Duplicar"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => removeVariant(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <Button type="button" onClick={addVariant} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Variante
            </Button>
        </div>
    )
}

interface ProductVariantEditorProps {
    variants: Variant[]
    variantIndex: number
    onChange: (variants: Variant[]) => void
    currencies: Currency[]
}

export function ProductVariantEditor({
    variants,
    variantIndex,
    onChange,
    currencies,
}: ProductVariantEditorProps) {
    const currencyDialog = useCreateCurrency()
    const currentVariant = variants[variantIndex]

    const updateVariant = (index: number, data: Partial<Variant>) => {
        const newVariants = [...variants]
        newVariants[index] = { ...newVariants[index], ...data }
        onChange(newVariants)
    }

    const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const newImages = Array.from(files).map((file, idx) => ({
            url: URL.createObjectURL(file),
            alt: file.name,
            isPrimary: (variants[index].coverImages?.length || 0) === 0 && idx === 0,
            isUploaded: false,
            file,
        }))

        const currentImages = variants[index].coverImages || []
        updateVariant(index, { coverImages: [...currentImages, ...newImages] })
    }

    const removeImage = (index: number, imageIndex: number) => {
        const currentImages = variants[index].coverImages || []
        const img = currentImages[imageIndex]
        if (!img.isUploaded) {
            URL.revokeObjectURL(img.url)
        }
        const newImages = currentImages.filter((_, i) => i !== imageIndex)
        if (img.isPrimary && newImages.length > 0) {
            newImages[0].isPrimary = true
        }
        updateVariant(index, { coverImages: newImages })
    }

    const setPrimaryImage = (index: number, imageIndex: number) => {
        const currentImages = variants[index].coverImages || []
        const newImages = currentImages.map((img, i) => ({
            ...img,
            isPrimary: i === imageIndex,
        }))
        updateVariant(index, { coverImages: newImages })
    }

    if (!currentVariant) {
        return (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No se encontró la variante seleccionada.
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Información Básica</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                            placeholder="ej. Rojo / L"
                            value={currentVariant.name}
                            onChange={(e) => updateVariant(variantIndex, { name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input
                            placeholder="SKU-123"
                            value={currentVariant.sku || ''}
                            onChange={(e) => updateVariant(variantIndex, { sku: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Stock (opcional)</Label>
                        <Input
                            type="number"
                            placeholder="Sin definir"
                            value={currentVariant.stock ?? ''}
                            onChange={(e) => {
                                const value = e.target.value
                                if (value === '') {
                                    updateVariant(variantIndex, { stock: undefined })
                                } else {
                                    const parsed = parseInt(value, 10)
                                    updateVariant(variantIndex, { stock: isNaN(parsed) ? undefined : parsed })
                                }
                            }}
                            onBlur={(e) => {
                                const value = e.target.value
                                if (value === '') {
                                    updateVariant(variantIndex, { stock: undefined })
                                } else {
                                    const parsed = parseInt(value, 10)
                                    updateVariant(variantIndex, { stock: isNaN(parsed) || parsed < 0 ? undefined : parsed })
                                }
                            }}
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                        <Switch
                            checked={currentVariant.isActive}
                            onCheckedChange={(checked) => updateVariant(variantIndex, { isActive: checked })}
                        />
                        <Label>Activo</Label>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Descriptions */}
            <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Descripciones</p>
                <div className="space-y-2">
                    <Label>Descripción Corta</Label>
                    <Textarea
                        value={currentVariant.shortDescription || ''}
                        onChange={(e) => updateVariant(variantIndex, { shortDescription: e.target.value })}
                        rows={2}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Descripción Completa</Label>
                    <Textarea
                        value={currentVariant.description || ''}
                        onChange={(e) => updateVariant(variantIndex, { description: e.target.value })}
                        rows={4}
                    />
                </div>
            </div>

            <Separator />

            {/* Prices */}
            <div className="space-y-4">
                <PricingSection
                    formData={{
                        prices: currentVariant.prices,
                    } as any}
                    onUpdate={(data) => {
                        if (data.prices) {
                            updateVariant(variantIndex, { prices: data.prices as VariantPrice[] })
                        }
                    }}
                    currencies={currencies}
                    loading={false}
                    onCreateCurrency={() => currencyDialog.setIsOpen(true)}
                />
            </div>

            <Separator />

            {/* Images */}
            <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Imágenes</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(currentVariant.coverImages || []).map((img, imgIndex) => (
                        <div key={imgIndex} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                            <Image
                                src={img.url}
                                alt={img.alt || 'Variant image'}
                                fill
                                className="object-cover"
                            />
                            {img.isPrimary && (
                                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                                    Principal
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {!img.isPrimary && (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8"
                                        onClick={() => setPrimaryImage(variantIndex, imgIndex)}
                                    >
                                        <Star className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    className="h-8 w-8"
                                    onClick={() => removeImage(variantIndex, imgIndex)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-all">
                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Subir</span>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(variantIndex, e)}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            <Separator />

            {/* Specifications */}
            <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Especificaciones</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SpecificationsFormFields
                        specifications={currentVariant.specifications || {}}
                        onUpdate={(updates) => updateVariant(variantIndex, {
                            specifications: { ...(currentVariant.specifications || {}), ...updates }
                        })}
                    />
                </div>
            </div>

            <CreateCurrencyDialog
                open={currencyDialog.isOpen}
                onOpenChange={currencyDialog.setIsOpen}
                data={currencyDialog.data}
                onDataChange={currencyDialog.setData}
                onConfirm={currencyDialog.handleCreate}
                isLoading={currencyDialog.isLoading}
            />
        </div>
    )
}
