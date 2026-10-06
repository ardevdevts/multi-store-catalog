'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { defaultStoreBranding, defaultStoreTheme, StoreTheme } from '@/lib/theme'
import { defaultStoreFontId } from '@/lib/store-fonts'
import { BrandingCard } from '../theme/components/branding-card'
import { fileToBase64 } from '../theme/theme-utils'

export default function BrandingPage() {
    const router = useRouter()

    const { data: site, isLoading: siteLoading, refetch: refetchSite } = trpc.admin.site.get.useQuery()

    const updateSite = trpc.admin.site.update.useMutation({
        onSuccess: async () => {
            await refetchSite()
        },
    })

    const uploadMedia = trpc.admin.media.upload.useMutation()

    const baseTheme = useMemo<StoreTheme>(() => {
        if (!site) return defaultStoreTheme
        const rawTheme = (site.theme ?? {}) as Partial<StoreTheme>

        return {
            light: { ...defaultStoreTheme.light, ...(rawTheme.light ?? {}) },
            dark: { ...defaultStoreTheme.dark, ...(rawTheme.dark ?? {}) },
            branding: { ...defaultStoreBranding, ...(rawTheme.branding ?? {}) },
            fontId: rawTheme.fontId ?? defaultStoreFontId,
        }
    }, [site])

    const [themeDraft, setThemeDraft] = useState<StoreTheme | null>(null)

    const theme = useMemo<StoreTheme>(() => themeDraft ?? baseTheme, [baseTheme, themeDraft])
    const branding = theme.branding ?? defaultStoreBranding
    const numericBrandingKeys = new Set<keyof NonNullable<StoreTheme['branding']>>(['logoWidth', 'logoHeight'])

    const handleBrandingChange = (key: keyof NonNullable<StoreTheme['branding']>, value: string | number | undefined) => {
        const normalizedValue = value === undefined && !numericBrandingKeys.has(key)
            ? ''
            : value

        setThemeDraft((prev) => {
            const current = prev ?? baseTheme

            return {
                ...current,
                branding: {
                    ...(current.branding ?? defaultStoreBranding),
                    [key]: normalizedValue,
                },
            }
        })
    }

    const handleLogoFile = async (file: File) => {
        try {
            const base64 = await fileToBase64(file)
            const uploaded = await uploadMedia.mutateAsync({
                fileBase64: base64,
                fileName: file.name,
                mimeType: file.type,
                alt: branding.logoAlt || file.name,
            })

            handleBrandingChange('logoUrl', uploaded.url)
            handleBrandingChange('logoAlt', uploaded.alt ?? branding.logoAlt)
            toast.success('Logo subido')
        } catch (error) {
            console.error(error)
            toast.error('No se pudo subir el logo')
        }
    }

    const handleSave = async () => {
        try {
            const nextTheme = themeDraft ?? baseTheme
            await updateSite.mutateAsync({ theme: nextTheme })
            await refetchSite()
            setThemeDraft(null)
            router.refresh()
            toast.success('Identidad actualizada')
        } catch {
            toast.error('No se pudo guardar la identidad')
        }
    }

    if (siteLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!site) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">No se pudo cargar la configuracion del catalogo.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="md:pt-20 lg:pt-0">
                <div className="p-4 md:p-8 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-3xl font-bold">Identidad del catalogo</p>
                            <p className="text-sm text-muted-foreground">Logo, datos de contacto y redes sociales.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleSave} disabled={updateSite.isPending}>
                                {updateSite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <BrandingCard
                            branding={branding}
                            onBrandingChange={handleBrandingChange}
                            onLogoFile={handleLogoFile}
                            uploading={uploadMedia.isPending}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}