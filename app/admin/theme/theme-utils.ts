import Color from 'color'
import { StoreTheme, ThemeKeys, ThemeModeOverrides } from '@/lib/theme'
import { StoreFontId } from '@/lib/store-fonts'
import { fontIdSet, themeKeySet } from './theme-constants'

export interface ThemePalette {
    background: string
    primary: string
    secondary: string
    accent: string
}

export const parseThemeFromJson = (value: string): StoreTheme => {
    const trimmed = value.trim()
    if (!trimmed) {
        throw new Error('EMPTY_JSON')
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(trimmed)
    } catch {
        throw new Error('INVALID_JSON')
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new Error('INVALID_JSON')
    }

    const normalizeMode = (mode: unknown): ThemeModeOverrides => {
        if (!mode || typeof mode !== 'object') return {}

        return Object.entries(mode as Record<string, unknown>).reduce<ThemeModeOverrides>((acc, [key, val]) => {
            if (themeKeySet.has(key as ThemeKeys) && typeof val === 'string') {
                acc[key as ThemeKeys] = val
            }
            return acc
        }, {})
    }

    const normalizeBranding = (branding: unknown): StoreTheme['branding'] => {
        if (!branding || typeof branding !== 'object') return {}

        const source = branding as Record<string, unknown>
        const toNumber = (value: unknown) => {
            if (typeof value === 'number') return value
            if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
            return undefined
        }

        return {
            logoUrl: typeof source.logoUrl === 'string' ? source.logoUrl : undefined,
            logoAlt: typeof source.logoAlt === 'string' ? source.logoAlt : undefined,
            logoWidth: toNumber(source.logoWidth),
            logoHeight: toNumber(source.logoHeight),
        }
    }

    const normalizeFontId = (fontId: unknown): StoreTheme['fontId'] => {
        if (typeof fontId !== 'string') return undefined
        return fontIdSet.has(fontId as StoreFontId) ? (fontId as StoreFontId) : undefined
    }

    const hasLightOrDark = 'light' in (parsed as object) || 'dark' in (parsed as object)

    return {
        light: hasLightOrDark ? normalizeMode((parsed as { light?: unknown }).light) : normalizeMode(parsed),
        dark: normalizeMode((parsed as { dark?: unknown }).dark),
        branding: normalizeBranding((parsed as { branding?: unknown }).branding),
        fontId: normalizeFontId((parsed as { fontId?: unknown }).fontId),
    }
}

export const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
})

export const getColorDescription = (key: ThemeKeys): string | undefined => {
    const descriptionMap: Partial<Record<ThemeKeys, string>> = {
        // Colores basicos
        background: 'Color de fondo principal de toda la tienda. Debe contrastar bien con los textos.',
        foreground: 'Color del texto principal. Debe tener alto contraste con el fondo.',
        card: 'Fondo de las tarjetas y componentes. Generalmente un poco mas claro/oscuro que el fondo principal.',
        cardForeground: 'Color del texto dentro de las tarjetas.',
        popover: 'Fondo de los menus emergentes y tooltips.',
        popoverForeground: 'Color del texto en los menus emergentes.',

        // Colores primarios y secundarios
        primary: 'Color primario para botones, enlaces y acciones principales. Define la identidad de marca.',
        primaryForeground: 'Color del texto sobre elementos primarios. Debe contrastar con primary.',
        secondary: 'Color secundario para elementos menos prominentes.',
        secondaryForeground: 'Color del texto sobre elementos secundarios.',

        // Estados y enfasis
        muted: 'Color para elementos deshabilitados o menos enfatizados.',
        mutedForeground: 'Color del texto en elementos mutados.',
        accent: 'Color de acento para destacar elementos. Generalmente diferente de primary.',
        accentForeground: 'Color del texto sobre elementos de acento.',
        destructive: 'Color para acciones destructivas (borrar, eliminar). Tipicamente rojo.',
        destructiveForeground: 'Color del texto sobre acciones destructivas.',

        // Elementos de interfaz
        border: 'Color de bordes y separadores de componentes.',
        input: 'Color de fondo de campos de entrada de texto.',
        ring: 'Color del anillo de enfoque para accesibilidad y navegacion con teclado.',

        // Graficos
        chart1: 'Color 1 para graficos y datos. Use colores distintivos para cada serie.',
        chart2: 'Color 2 para graficos y datos.',
        chart3: 'Color 3 para graficos y datos.',
        chart4: 'Color 4 para graficos y datos.',
        chart5: 'Color 5 para graficos y datos.',

        // Barra lateral
        sidebar: 'Color de fondo de la barra lateral. Generalmente contrasta con el fondo principal.',
        sidebarForeground: 'Color del texto en la barra lateral.',
        sidebarPrimary: 'Color primario usado en la barra lateral (enlaces activos).',
        sidebarPrimaryForeground: 'Color del texto sobre elementos primarios en la barra lateral.',
        sidebarAccent: 'Color de acento en la barra lateral (items seleccionados).',
        sidebarAccentForeground: 'Color del texto sobre acentos en la barra lateral.',
        sidebarBorder: 'Color de bordes y separadores en la barra lateral.',
        sidebarRing: 'Color del anillo de enfoque en elementos de la barra lateral.',

        // Sombras
        shadowColor: 'Color base para las sombras. Generalmente negro o gris oscuro. Se aplica a todas las sombras (2xs, xs, sm, etc).',
        shadowOpacity: 'Transparencia de las sombras (0-1). 0 = invisible, 1 = opaco. Tipicamente 0.1 a 0.25.',
        shadowBlur: 'Desenfoque de la sombra en pixeles. Mayor valor = sombra mas suave. Rango tipico: 4-40px.',
        shadowSpread: 'Extension de la sombra en pixeles. Valores positivos expanden la sombra, negativos la contraen.',
        shadowOffsetX: 'Desplazamiento horizontal de la sombra en pixeles. Negativo = izquierda, positivo = derecha.',
        shadowOffsetY: 'Desplazamiento vertical de la sombra en pixeles. Negativo = arriba, positivo = abajo.',

        // Sombras predefinidas - Sintaxis: offsetX offsetY blur spread color
        shadow2xs: 'Sombra muy sutil. Sintaxis: "0px 1px 2px -1px color, 0px 1px 2px -1px color". Dos capas para profundidad.',
        shadowXs: 'Sombra extra pequena. Sintaxis: "0px 1px 2px -1px color, 0px 1px 3px -1px color". Elevacion leve.',
        shadowSm: 'Sombra pequena. Sintaxis: "0px 1px 2px -1px color, 0px 2px 4px -2px color". Para componentes ligeros.',
        shadow: 'Sombra estandar. Sintaxis: "0px 1px 3px -1px color, 0px 1px 2px -1px color". Elevacion normal.',
        shadowMd: 'Sombra mediana. Sintaxis: "0px 4px 6px -1px color, 0px 2px 4px -2px color". Componentes prominentes.',
        shadowLg: 'Sombra grande. Sintaxis: "0px 10px 15px -3px color, 0px 4px 6px -2px color". Dropdowns y popups.',
        shadowXl: 'Sombra extra grande. Sintaxis: "0px 20px 25px -5px color, 0px 10px 10px -5px color". Elementos destacados.',
        shadow2xl: 'Sombra muy grande. Sintaxis: "0px 25px 50px -12px color". Para modales importantes.',

        // Tipografia y espaciado
        fontSans: 'Fuente sans-serif principal para textos y cuerpo.',
        fontSerif: 'Fuente serif para titulos elegantes (opcional).',
        fontMono: 'Fuente monoespaciada para codigo y texto tecnico.',
        letterSpacing: 'Espaciado entre letras en pixeles o em. Valores negativos aprietan el texto, positivos lo expanden.',
        spacing: 'Unidad de espaciado base. El resto de espacios (padding, margin) se calculan multiplicando este valor.',
        radius: 'Radio de bordes redondeados en pixeles. Define cuan redondeadas son las esquinas de componentes.',
        trackingNormal: 'Rastreo normal de letras. Espaciado estandar entre caracteres.',
    }
    return descriptionMap[key]
}

export const labelForKey = (key: ThemeKeys) => {
    const labelMap: Partial<Record<ThemeKeys, string>> = {
        background: 'Fondo',
        foreground: 'Texto principal',
        card: 'Tarjeta',
        cardForeground: 'Texto de tarjeta',
        popover: 'Popover',
        popoverForeground: 'Texto popover',
        primary: 'Primario',
        primaryForeground: 'Texto primario',
        secondary: 'Secundario',
        secondaryForeground: 'Texto secundario',
        muted: 'Muted',
        mutedForeground: 'Texto muted',
        accent: 'Acento',
        accentForeground: 'Texto acento',
        destructive: 'Destructivo',
        destructiveForeground: 'Texto destructivo',
        border: 'Borde',
        input: 'Input',
        ring: 'Anillo de enfoque',
        chart1: 'Grafico color 1',
        chart2: 'Grafico color 2',
        chart3: 'Grafico color 3',
        chart4: 'Grafico color 4',
        chart5: 'Grafico color 5',
        sidebar: 'Sidebar fondo',
        sidebarForeground: 'Sidebar texto',
        sidebarPrimary: 'Sidebar primario',
        sidebarPrimaryForeground: 'Sidebar texto primario',
        sidebarAccent: 'Sidebar acento',
        sidebarAccentForeground: 'Sidebar texto acento',
        sidebarBorder: 'Sidebar borde',
        sidebarRing: 'Sidebar anillo',
        fontSans: 'Fuente sans',
        fontSerif: 'Fuente serif',
        fontMono: 'Fuente monoespaciada',
        radius: 'Radio de bordes',
        shadowColor: 'Color sombra',
        shadowOpacity: 'Opacidad sombra',
        shadowBlur: 'Desenfoque sombra',
        shadowSpread: 'Extension sombra',
        shadowOffsetX: 'Sombra desplazamiento X',
        shadowOffsetY: 'Sombra desplazamiento Y',
        letterSpacing: 'Espaciado de letras',
        spacing: 'Espaciado base',
        shadow2xs: 'Sombra 2xs',
        shadowXs: 'Sombra xs',
        shadowSm: 'Sombra sm',
        shadow: 'Sombra normal',
        shadowMd: 'Sombra md',
        shadowLg: 'Sombra lg',
        shadowXl: 'Sombra xl',
        shadow2xl: 'Sombra 2xl',
        trackingNormal: 'Tracking normal',
    }
    return labelMap[key] ?? key
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const toHex = (value: number) => value.toString(16).padStart(2, '0')

const resolveBrowserColor = (value: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null
    const trimmed = value.trim()
    if (!trimmed) return null

    const probe = document.createElement('span')
    probe.style.color = ''
    probe.style.color = trimmed
    if (!probe.style.color) return null

    probe.style.display = 'none'
    document.body.appendChild(probe)
    const resolved = window.getComputedStyle(probe).color
    probe.remove()

    return resolved || null
}

const resolveColorChannels = (value: string) => {
    const resolved = resolveBrowserColor(value)
    if (!resolved) return null

    try {
        const color = Color(resolved)
        return {
            r: color.red(),
            g: color.green(),
            b: color.blue(),
            a: clamp(color.alpha(), 0, 1),
        }
    } catch {
        if (typeof document === 'undefined') return null

        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return null

        const marker = 'rgba(1, 2, 3, 0.25)'
        context.fillStyle = marker
        context.fillStyle = resolved
        const markerNormalized = marker.replace(/\s+/g, '').toLowerCase()
        const currentNormalized = context.fillStyle.replace(/\s+/g, '').toLowerCase()
        const resolvedNormalized = resolved.replace(/\s+/g, '').toLowerCase()
        if (currentNormalized === markerNormalized && resolvedNormalized !== markerNormalized) {
            return null
        }

        context.clearRect(0, 0, 1, 1)
        context.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data

        return {
            r,
            g,
            b,
            a: clamp(a / 255, 0, 1),
        }
    }
}

export const toSafeColor = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return '#000000'

    try {
        return Color(trimmed).rgb().string()
    } catch {
        const resolved = resolveBrowserColor(trimmed)
        if (resolved) return resolved
        return '#000000'
    }
}

export const normalizeColor = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return { hex: '#000000', alpha: 1 }

    try {
        const color = Color(trimmed)
        return { hex: color.hex(), alpha: color.alpha() }
    } catch {
        const parsed = resolveColorChannels(trimmed)
        if (parsed) {
            return {
                hex: `#${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`,
                alpha: parsed.a,
            }
        }
        return { hex: '#000000', alpha: 1 }
    }
}

const safeColor = (value: string, fallback: string) => {
    try {
        return Color(value).hex()
    } catch {
        return Color(fallback).hex()
    }
}

const readableText = (background: string) => (Color(background).isLight() ? '#111111' : '#f8f8f8')

const mix = (base: string, other: string, amount: number) => Color(base).mix(Color(other), amount).hex()

const ensureDark = (value: string) => {
    const color = Color(safeColor(value, '#111111'))
    if (!color.isLight()) return color.hex()
    return color.darken(0.6).hex()
}

const ensureReadableOnDark = (value: string) => {
    const color = Color(safeColor(value, '#f8f8f8'))
    if (color.isLight()) return color.hex()
    return color.lighten(0.4).hex()
}

const buildModeFromPalette = (palette: ThemePalette, background: string) => {
    const primary = safeColor(palette.primary, '#111111')
    const secondary = safeColor(palette.secondary, '#666666')
    const accent = safeColor(palette.accent, '#888888')
    const bg = safeColor(background, '#ffffff')
    const fg = readableText(bg)
    const card = mix(bg, fg, 0.04)
    const popover = mix(bg, fg, 0.06)
    const muted = mix(bg, fg, 0.08)
    const mutedForeground = mix(fg, bg, 0.35)
    const border = mix(bg, fg, 0.16)
    const input = mix(bg, fg, 0.1)
    const ring = mix(primary, bg, 0.2)

    const primaryForeground = readableText(primary)
    const secondaryForeground = readableText(secondary)
    const accentForeground = readableText(accent)

    const destructive = '#ef4444'
    const destructiveForeground = readableText(destructive)

    const chart4 = mix(primary, accent, 0.5)
    const chart5 = mix(secondary, accent, 0.5)

    return {
        background: bg,
        foreground: fg,
        card,
        cardForeground: readableText(card),
        popover,
        popoverForeground: readableText(popover),
        primary,
        primaryForeground,
        secondary,
        secondaryForeground,
        muted,
        mutedForeground,
        accent,
        accentForeground,
        destructive,
        destructiveForeground,
        border,
        input,
        ring,
        chart1: primary,
        chart2: secondary,
        chart3: accent,
        chart4,
        chart5,
        sidebar: mix(bg, fg, 0.06),
        sidebarForeground: fg,
        sidebarPrimary: primary,
        sidebarPrimaryForeground: primaryForeground,
        sidebarAccent: accent,
        sidebarAccentForeground: accentForeground,
        sidebarBorder: border,
        sidebarRing: ring,
    } satisfies ThemeModeOverrides
}

export const buildThemeFromPalette = (palette: ThemePalette) => {
    const lightBackground = safeColor(palette.background, '#ffffff')
    const darkBackground = ensureDark(lightBackground)

    const darkPalette: ThemePalette = {
        background: darkBackground,
        primary: ensureReadableOnDark(palette.primary),
        secondary: ensureReadableOnDark(palette.secondary),
        accent: ensureReadableOnDark(palette.accent),
    }

    return {
        light: buildModeFromPalette(palette, lightBackground),
        dark: buildModeFromPalette(darkPalette, darkBackground),
    }
}
