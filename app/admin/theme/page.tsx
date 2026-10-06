'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { defaultStoreBranding, defaultStoreTheme, mergeTheme, StoreTheme, ThemeKeys } from '@/lib/theme'
import { defaultStoreFontId, StoreFontId } from '@/lib/store-fonts'
import { ThemeHeader } from './components/theme-header'
import { ImportThemeCard } from './components/import-theme-card'
import { ShadowHelpCard } from './components/shadow-help-card'
import { FontCard } from './components/font-card'
import { ThemeModeCard } from './components/theme-mode-card'
import { ShadowField } from './components/shadow-field'
import { ColorField } from './components/color-field'
import { buildThemeFromPalette, parseThemeFromJson, ThemePalette } from './theme-utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export default function ThemePage() {
    const router = useRouter()
    const { data: site, isLoading: siteLoading, refetch: refetchSite } = trpc.admin.site.get.useQuery()
    const updateSite = trpc.admin.site.update.useMutation()

    const [importText, setImportText] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)

    const [themeDraft, setThemeDraft] = useState<StoreTheme | null>(null)

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

    const theme = useMemo<StoreTheme>(() => themeDraft ?? baseTheme, [baseTheme, themeDraft])

    const mergedTheme = useMemo(() => mergeTheme(theme), [theme])
    const selectedFontId = theme.fontId ?? defaultStoreFontId
    const palette = useMemo<ThemePalette>(() => ({
        background: theme.light?.background ?? mergedTheme.light.background,
        primary: theme.light?.primary ?? mergedTheme.light.primary,
        secondary: theme.light?.secondary ?? mergedTheme.light.secondary,
        accent: theme.light?.accent ?? mergedTheme.light.accent,
    }), [mergedTheme, theme.light?.accent, theme.light?.background, theme.light?.primary, theme.light?.secondary])

    const handleChange = (mode: 'light' | 'dark', key: ThemeKeys, value: string) => {
        setThemeDraft((prev) => {
            const current = prev ?? baseTheme

            return {
                ...current,
                [mode]: {
                    ...(current[mode] ?? defaultStoreTheme[mode]),
                    [key]: value,
                },
            }
        })
    }

    const handlePaletteChange = (key: keyof ThemePalette, value: string) => {
        const nextPalette = { ...palette, [key]: value }
        const generated = buildThemeFromPalette(nextPalette)

        setThemeDraft((prev) => {
            const current = prev ?? baseTheme

            return {
                ...current,
                light: {
                    ...(current.light ?? defaultStoreTheme.light),
                    ...generated.light,
                },
                dark: {
                    ...(current.dark ?? defaultStoreTheme.dark),
                    ...generated.dark,
                },
            }
        })
    }

    const handleGlobalStyleChange = (key: ThemeKeys, value: string) => {
        setThemeDraft((prev) => {
            const current = prev ?? baseTheme

            return {
                ...current,
                light: {
                    ...(current.light ?? defaultStoreTheme.light),
                    [key]: value,
                },
                dark: {
                    ...(current.dark ?? defaultStoreTheme.dark),
                    [key]: value,
                },
            }
        })
    }

    const parseUnit = (value: string, unit: 'rem' | 'em', fallback: number) => {
        if (!value) return fallback
        const normalized = value.trim()
        const numeric = Number.parseFloat(normalized.replace(unit, ''))
        return Number.isFinite(numeric) ? numeric : fallback
    }

    const radiusValue = parseUnit(theme.light?.radius ?? mergedTheme.light.radius, 'rem', 0.25)
    const spacingValue = parseUnit(theme.light?.spacing ?? mergedTheme.light.spacing, 'rem', 0.25)
    const letterSpacingValue = parseUnit(
        theme.light?.letterSpacing ?? mergedTheme.light.letterSpacing,
        'em',
        0,
    )
    const trackingNormalValue = parseUnit(
        theme.light?.trackingNormal ?? mergedTheme.light.trackingNormal,
        'em',
        0,
    )

    const handleFontChange = (fontId: StoreFontId) => {
        setThemeDraft((prev) => {
            const current = prev ?? baseTheme

            return {
                ...current,
                fontId,
            }
        })
    }

    const handleSave = async () => {
        try {
            const currentTheme = themeDraft ?? baseTheme
            await updateSite.mutateAsync({ theme: currentTheme })
            await refetchSite()
            setThemeDraft(null)
            router.refresh()
            toast.success('Tema actualizado')
        } catch {
            toast.error('No se pudo guardar el tema')
        }
    }

    const handleImport = () => {
        try {
            const parsed = parseThemeFromJson(importText)

            setThemeDraft({
                light: { ...baseTheme.light, ...(parsed.light ?? {}) },
                dark: { ...baseTheme.dark, ...(parsed.dark ?? {}) },
                branding: { ...(baseTheme.branding ?? defaultStoreBranding), ...(parsed.branding ?? {}) },
                fontId: parsed.fontId ?? baseTheme.fontId ?? defaultStoreFontId,
            })

            toast.success('Tema importado')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'UNKNOWN'

            if (message === 'EMPTY_JSON') {
                toast.error('Pega un JSON con las variables del tema')
                return
            }

            toast.error('JSON inválido')
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
                <p className="text-muted-foreground">No se pudo cargar el tema del catalogo.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="md:pt-20 lg:pt-0">
                <div className="p-4 md:p-8 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <ThemeHeader
                            storeName={site?.name}
                            onSave={handleSave}
                            saving={updateSite.isPending}
                        />
                    </div>
                    <div className="">
                        <FontCard
                            selectedFontId={selectedFontId}
                            onChange={handleFontChange}
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Paleta principal</CardTitle>
                            <CardDescription>
                                Elige cuatro colores y generamos el resto del tema automaticamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-sm font-medium">Fondo</span>
                                <ColorField
                                    value={palette.background}
                                    onChange={(value) => handlePaletteChange('background', value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium">Primario</span>
                                <ColorField
                                    value={palette.primary}
                                    onChange={(value) => handlePaletteChange('primary', value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium">Secundario</span>
                                <ColorField
                                    value={palette.secondary}
                                    onChange={(value) => handlePaletteChange('secondary', value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium">Acento</span>
                                <ColorField
                                    value={palette.accent}
                                    onChange={(value) => handlePaletteChange('accent', value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Estilo global</CardTitle>
                            <CardDescription>
                                Ajusta detalles visuales que afectan todo el sitio (mismo valor en claro y oscuro).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-sm font-medium">Radio de bordes</span>
                                <p className="text-xs text-muted-foreground">
                                    Define cuan redondeadas son las esquinas de botones, tarjetas y campos.
                                </p>
                                <div className="space-y-2">
                                    <input
                                        type="range"
                                        min={0}
                                        max={2}
                                        step={0.05}
                                        value={radiusValue}
                                        onChange={(e) => handleGlobalStyleChange('radius', `${e.target.value}rem`)}
                                    />
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>0rem</span>
                                        <span>{radiusValue.toFixed(2)}rem</span>
                                        <span>2rem</span>
                                    </div>
                                    <input
                                        className="h-9 w-full border border-input bg-background px-3 text-sm"
                                        value={theme.light?.radius ?? mergedTheme.light.radius}
                                        onChange={(e) => handleGlobalStyleChange('radius', e.target.value)} />
                                    <ShadowField
                                        value={theme.light?.shadow ?? mergedTheme.light.shadow}
                                        onChange={(value) => handleGlobalStyleChange('shadow', value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <span className="text-sm font-medium">Espaciado base</span>
                                    <p className="text-xs text-muted-foreground">
                                        Multiplicador de espacios para paddings y margins (ej: 0.25rem).
                                    </p>
                                    <div className="space-y-2">
                                        <input
                                            type="range"
                                            min={0.125}
                                            max={1}
                                            step={0.025}
                                            value={spacingValue}
                                            onChange={(e) => handleGlobalStyleChange('spacing', `${e.target.value}rem`)}
                                        />
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>0.125rem</span>
                                            <span>{spacingValue.toFixed(3)}rem</span>
                                            <span>1rem</span>
                                        </div>
                                        <input
                                            className="h-9 w-full border border-input bg-background px-3 text-sm"
                                            value={theme.light?.spacing ?? mergedTheme.light.spacing}
                                            onChange={(e) => handleGlobalStyleChange('spacing', e.target.value)}
                                            spellCheck={false}
                                        />

                                        <div className="border bg-background p-3">
                                            <div
                                                className="border bg-card"
                                                style={{ padding: theme.light?.spacing ?? mergedTheme.light.spacing }}
                                            >
                                                <div
                                                    className="grid grid-cols-3"
                                                    style={{ gap: theme.light?.spacing ?? mergedTheme.light.spacing }}
                                                >
                                                    <div className="h-8 bg-muted" />
                                                    <div className="h-8 bg-muted" />
                                                    <div className="h-8 bg-muted" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-sm font-medium">Espaciado entre letras</span>
                                    <p className="text-xs text-muted-foreground">
                                        Ajusta la separacion general de letras (ej: 0em, 0.02em).
                                    </p>
                                    <div className="space-y-2">
                                        <input
                                            type="range"
                                            min={-0.05}
                                            max={0.2}
                                            step={0.01}
                                            value={letterSpacingValue}
                                            onChange={(e) => handleGlobalStyleChange('letterSpacing', `${e.target.value}em`)}
                                        />
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>-0.05em</span>
                                            <span>{letterSpacingValue.toFixed(2)}em</span>
                                            <span>0.20em</span>
                                        </div>
                                        <input
                                            className="h-9 w-full border border-input bg-background px-3 text-sm"
                                            value={theme.light?.letterSpacing ?? mergedTheme.light.letterSpacing}
                                            onChange={(e) => handleGlobalStyleChange('letterSpacing', e.target.value)}
                                            spellCheck={false}
                                        />

                                        <div className="border bg-background p-3">
                                            <div
                                                className="border bg-card p-3 text-sm"
                                                style={{ letterSpacing: theme.light?.letterSpacing ?? mergedTheme.light.letterSpacing }}
                                            >
                                                Texto de prueba
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-sm font-medium">Tracking normal</span>
                                    <p className="text-xs text-muted-foreground">
                                        Ajuste fino del tracking por defecto para textos largos.
                                    </p>
                                    <div className="space-y-2">
                                        <input
                                            type="range"
                                            min={-0.05}
                                            max={0.2}
                                            step={0.01}
                                            value={trackingNormalValue}
                                            onChange={(e) => handleGlobalStyleChange('trackingNormal', `${e.target.value}em`)}
                                        />
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>-0.05em</span>
                                            <span>{trackingNormalValue.toFixed(2)}em</span>
                                            <span>0.20em</span>
                                        </div>
                                        <input
                                            className="h-9 w-full border border-input bg-background px-3 text-sm"
                                            value={theme.light?.trackingNormal ?? mergedTheme.light.trackingNormal}
                                            onChange={(e) => handleGlobalStyleChange('trackingNormal', e.target.value)}
                                            spellCheck={false}
                                        />

                                        <div className="border bg-background p-3">
                                            <div
                                                className="border bg-card p-3 text-sm"
                                                style={{ letterSpacing: theme.light?.trackingNormal ?? mergedTheme.light.trackingNormal }}
                                            >
                                                Texto de prueba
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base font-semibold">Opciones avanzadas</p>
                                <p className="text-sm text-muted-foreground">
                                    Muestra todas las variables del tema, importacion y presets de sombras.
                                </p>
                            </div>
                            <CollapsibleTrigger asChild>
                                <Button type="button" variant="outline" className="gap-2">
                                    {showAdvanced ? 'Ocultar' : 'Mostrar'}
                                    <ChevronDown className={showAdvanced ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="space-y-6">
                            <ImportThemeCard
                                value={importText}
                                onChange={setImportText}
                                onImport={handleImport}
                                disabled={!importText.trim()}
                            />

                            <ShadowHelpCard />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {(['light', 'dark'] as const).map((mode) => (
                                    <ThemeModeCard
                                        key={mode}
                                        mode={mode}
                                        theme={theme}
                                        mergedTheme={mergedTheme}
                                        onChange={handleChange}
                                    />
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </main>
        </div>
    )
}
