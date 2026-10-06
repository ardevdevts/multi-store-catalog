import { defaultLightTheme, ThemeKeys } from '@/lib/theme'
import { storeFontOptions, StoreFontId } from '@/lib/store-fonts'

export const themeKeys = Object.keys(defaultLightTheme) as ThemeKeys[]
export const editableThemeKeys = themeKeys.filter((key) => key !== 'fontSans' && key !== 'fontSerif')
export const colorThemeKeys: ThemeKeys[] = [
    'background', 'foreground', 'card', 'cardForeground', 'popover', 'popoverForeground',
    'primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'muted', 'mutedForeground',
    'accent', 'accentForeground', 'destructive', 'destructiveForeground', 'border', 'input', 'ring',
    'chart1', 'chart2', 'chart3', 'chart4', 'chart5', 'sidebar', 'sidebarForeground', 'sidebarPrimary',
    'sidebarPrimaryForeground', 'sidebarAccent', 'sidebarAccentForeground', 'sidebarBorder', 'sidebarRing',
]

export const colorKeySet = new Set<ThemeKeys>(colorThemeKeys)
export const themeKeySet = new Set<ThemeKeys>(themeKeys)
export const fontIdSet = new Set<StoreFontId>(storeFontOptions.map((font) => font.id))
export const shadowPresetKeys = new Set<ThemeKeys>([
    'shadow2xs',
    'shadowXs',
    'shadowSm',
    'shadow',
    'shadowMd',
    'shadowLg',
    'shadowXl',
    'shadow2xl',
])

export const basicThemeKeys: ThemeKeys[] = [
    'background',
    'primary',
    'secondary',
    'accent',
    'border',
    'shadowSm',
    'shadow',
    'shadowLg',
]

export const shadowPresets = [
    { id: 'light', label: 'Ligera', value: '0px 2px 6px -2px hsl(0 0% 0% / 0.10)' },
    { id: 'medium', label: 'Media', value: '0px 6px 12px -3px hsl(0 0% 0% / 0.14)' },
    { id: 'high', label: 'Alta', value: '0px 12px 24px -6px hsl(0 0% 0% / 0.18)' },
]
