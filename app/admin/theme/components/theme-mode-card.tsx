'use client'

import Color from 'color'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StoreTheme, ThemeKeys } from '@/lib/theme'
import { ColorField } from './color-field'
import { ShadowField } from './shadow-field'
import { colorKeySet, editableThemeKeys, shadowPresetKeys } from '../theme-constants'
import { getColorDescription, labelForKey } from '../theme-utils'

const colorPreviewPairs: Partial<Record<ThemeKeys, { surface: ThemeKeys; text: ThemeKeys }>> = {
    background: { surface: 'background', text: 'foreground' },
    foreground: { surface: 'background', text: 'foreground' },
    card: { surface: 'card', text: 'cardForeground' },
    cardForeground: { surface: 'card', text: 'cardForeground' },
    popover: { surface: 'popover', text: 'popoverForeground' },
    popoverForeground: { surface: 'popover', text: 'popoverForeground' },
    primary: { surface: 'primary', text: 'primaryForeground' },
    primaryForeground: { surface: 'primary', text: 'primaryForeground' },
    secondary: { surface: 'secondary', text: 'secondaryForeground' },
    secondaryForeground: { surface: 'secondary', text: 'secondaryForeground' },
    muted: { surface: 'muted', text: 'mutedForeground' },
    mutedForeground: { surface: 'muted', text: 'mutedForeground' },
    accent: { surface: 'accent', text: 'accentForeground' },
    accentForeground: { surface: 'accent', text: 'accentForeground' },
    destructive: { surface: 'destructive', text: 'destructiveForeground' },
    destructiveForeground: { surface: 'destructive', text: 'destructiveForeground' },
    sidebar: { surface: 'sidebar', text: 'sidebarForeground' },
    sidebarForeground: { surface: 'sidebar', text: 'sidebarForeground' },
    sidebarPrimary: { surface: 'sidebarPrimary', text: 'sidebarPrimaryForeground' },
    sidebarPrimaryForeground: { surface: 'sidebarPrimary', text: 'sidebarPrimaryForeground' },
    sidebarAccent: { surface: 'sidebarAccent', text: 'sidebarAccentForeground' },
    sidebarAccentForeground: { surface: 'sidebarAccent', text: 'sidebarAccentForeground' },
}

const safeNumber = (value: string, fallback: number) => {
    if (!value) return fallback
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

const shadowColorWithOpacity = (color: string, opacity: string) => {
    const alpha = Math.max(0, Math.min(1, safeNumber(opacity, 0.1)))

    if (!color) return `hsl(0 0% 0% / ${alpha})`
    const trimmed = color.trim()
    if (trimmed.includes('/')) return trimmed

    const hslMatch = trimmed.match(/^hsl\(([^)]+)\)$/)
    if (hslMatch) return `hsl(${hslMatch[1]} / ${alpha})`

    try {
        return Color(trimmed).alpha(alpha).rgb().string()
    } catch {
        return trimmed
    }
}

const ThemeKeyPreview = ({
    themeMode,
    mergedMode,
    themeKey,
    value,
}: {
    themeMode: NonNullable<StoreTheme['light']>
    mergedMode: NonNullable<StoreTheme['light']>
    themeKey: ThemeKeys
    value: string
}) => {
    if (shadowPresetKeys.has(themeKey)) return null

    if (colorKeySet.has(themeKey)) {
        const resolveModeValue = (key: ThemeKeys) => {
            const raw = key === themeKey ? value : (themeMode?.[key] ?? mergedMode?.[key] ?? '')
            return typeof raw === 'string' ? raw : ''
        }
        const pair = colorPreviewPairs[themeKey]
        const bg = (pair ? resolveModeValue(pair.surface) : resolveModeValue(themeKey)).trim() || 'transparent'
        const fg = (pair ? resolveModeValue(pair.text) : resolveModeValue('foreground')).trim() || '#111111'

        return (
            <div className="border bg-background p-3">
                <div
                    className="h-16 border flex items-center justify-center text-xs"
                    style={{ background: bg, color: fg }}
                >
                    Vista previa
                </div>
            </div>
        )
    }

    if (themeKey === 'radius') {
        return (
            <div className="border bg-background p-3">
                <div className="grid grid-cols-3 gap-2">
                    <div className="h-10 border bg-card" style={{ borderRadius: value }} />
                    <div className="h-10 border bg-card" style={{ borderRadius: value }} />
                    <div className="h-10 border bg-card" style={{ borderRadius: value }} />
                </div>
            </div>
        )
    }

    if (themeKey === 'spacing') {
        const spacing = value?.trim() ? value : '0.25rem'
        return (
            <div className="border bg-background p-3">
                <div className="border bg-card" style={{ padding: spacing }}>
                    <div className="grid grid-cols-3" style={{ gap: spacing }}>
                        <div className="h-8 bg-muted" />
                        <div className="h-8 bg-muted" />
                        <div className="h-8 bg-muted" />
                    </div>
                </div>
            </div>
        )
    }

    if (themeKey === 'letterSpacing' || themeKey === 'trackingNormal') {
        return (
            <div className="border bg-background p-3">
                <div className="border bg-card p-3 text-sm" style={{ letterSpacing: value }}>
                    Texto de prueba
                </div>
            </div>
        )
    }

    if (themeKey === 'fontMono') {
        return (
            <div className="border bg-background p-3">
                <div className="border bg-card p-3 text-sm" style={{ fontFamily: value }}>
                    {"const hello = 'world'"}
                </div>
            </div>
        )
    }

    if (themeKey === 'shadowColor' || themeKey === 'shadowOpacity' || themeKey === 'shadowBlur' || themeKey === 'shadowSpread' || themeKey === 'shadowOffsetX' || themeKey === 'shadowOffsetY') {
        const offsetX = themeMode.shadowOffsetX ?? mergedMode.shadowOffsetX ?? '0px'
        const offsetY = themeMode.shadowOffsetY ?? mergedMode.shadowOffsetY ?? '2px'
        const blur = themeMode.shadowBlur ?? mergedMode.shadowBlur ?? '10px'
        const spread = themeMode.shadowSpread ?? mergedMode.shadowSpread ?? '0px'
        const color = themeMode.shadowColor ?? mergedMode.shadowColor ?? 'hsl(0 0% 0%)'
        const opacity = themeMode.shadowOpacity ?? mergedMode.shadowOpacity ?? '0.1'
        const previewShadow = `${offsetX} ${offsetY} ${blur} ${spread} ${shadowColorWithOpacity(color, opacity)}`
        return (
            <div className="border bg-background p-3">
                <div
                    className="h-16 border bg-card flex items-center justify-center text-xs text-muted-foreground"
                    style={{ boxShadow: previewShadow }}
                >
                    Vista previa
                </div>
            </div>
        )
    }

    if (themeKey === 'fontSans' || themeKey === 'fontSerif') {
        return (
            <div className="border bg-background p-3">
                <div className="border bg-card p-3 text-sm" style={{ fontFamily: value }}>
                    Titular de prueba
                </div>
            </div>
        )
    }

    if (themeKey.startsWith('shadow')) {
        const previewShadow = value?.trim() || 'none'
        return (
            <div className="border bg-background p-3">
                <div
                    className="h-16 border bg-card flex items-center justify-center text-xs text-muted-foreground"
                    style={{ boxShadow: previewShadow }}
                >
                    Vista previa
                </div>
            </div>
        )
    }

    return null
}

interface ThemeModeCardProps {
    mode: 'light' | 'dark'
    theme: StoreTheme
    mergedTheme: StoreTheme
    onChange: (mode: 'light' | 'dark', key: ThemeKeys, value: string) => void
    keys?: ThemeKeys[]
    title?: string
    description?: string
}

export const ThemeModeCard = ({
    mode,
    theme,
    mergedTheme,
    onChange,
    keys,
    title,
    description,
}: ThemeModeCardProps) => {
    const resolvedTitle = title ?? `Modo ${mode}`
    const resolvedDescription = description ?? `Valores aplicados a ${mode === 'light' ? 'modo claro' : 'modo oscuro'}.`
    const keysToShow = keys ?? editableThemeKeys

    const themeMode = (theme[mode] ?? {}) as NonNullable<StoreTheme['light']>
    const mergedMode = (mergedTheme[mode] ?? {}) as NonNullable<StoreTheme['light']>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="capitalize">{resolvedTitle}</CardTitle>
                <CardDescription>{resolvedDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {keysToShow.map((key) => {
                    const keyDescription = getColorDescription(key)
                    const value = themeMode?.[key] ?? mergedMode?.[key] ?? ''
                    return (
                        <div key={`${mode}-${key}`} className="space-y-2">
                            <div>
                                <Label className="text-sm font-medium">{labelForKey(key)}</Label>
                                {keyDescription && (
                                    <p className="text-xs text-muted-foreground mt-1">{keyDescription}</p>
                                )}
                            </div>
                            {shadowPresetKeys.has(key) ? (
                                <ShadowField
                                    value={value}
                                    onChange={(val) => onChange(mode, key, val)}
                                />
                            ) : colorKeySet.has(key) ? (
                                <ColorField
                                    value={value}
                                    onChange={(val) => onChange(mode, key, val)}
                                />
                            ) : (
                                <Input
                                    value={value}
                                    onChange={(e) => onChange(mode, key, e.target.value)}
                                    spellCheck={false}
                                />
                            )}

                            <ThemeKeyPreview
                                themeMode={themeMode}
                                mergedMode={mergedMode}
                                themeKey={key}
                                value={value}
                            />
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
