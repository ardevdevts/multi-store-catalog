'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Color from 'color'
import { Input } from '@/components/ui/input'
import { normalizeColor } from '../theme-utils'

interface SimpleColorPickerProps {
    value: string
    onChange: (value: string) => void
}

export const SimpleColorPicker = ({ value, onChange }: SimpleColorPickerProps) => {
    const parsed = useMemo(() => normalizeColor(value), [value])
    const [hex, setHex] = useState(parsed.hex)
    const [alpha, setAlpha] = useState(parsed.alpha)

    useEffect(() => {
        setHex(parsed.hex)
        setAlpha(parsed.alpha)
    }, [parsed.hex, parsed.alpha])

    const emit = useCallback((nextHex: string, nextAlpha: number) => {
        try {
            const color = Color(nextHex).alpha(nextAlpha)
            onChange(color.rgb().string())
        } catch {
            // ignore invalid input until it becomes a valid color
        }
    }, [onChange])

    const handleHexChange = (nextHex: string) => {
        setHex(nextHex)
        emit(nextHex, alpha)
    }

    const handleAlphaChange = (nextAlpha: number) => {
        setAlpha(nextAlpha)
        emit(hex, nextAlpha)
    }

    const preview = useMemo(() => {
        try {
            return Color(hex).alpha(alpha).string()
        } catch {
            return value
        }
    }, [alpha, hex, value])

    return (
        <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
                <input
                    aria-label="Seleccionar color"
                    className="h-10 w-12 cursor-pointer border border-input bg-background"
                    type="color"
                    value={hex}
                    onChange={(e) => handleHexChange(e.target.value)}
                />
                <Input
                    value={hex}
                    onChange={(e) => handleHexChange(e.target.value)}
                    spellCheck={false}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Opacidad</span>
                    <span>{Math.round(alpha * 100)}%</span>
                </div>
                <input
                    className="h-2 w-full cursor-pointer accent-primary"
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(alpha * 100)}
                    onChange={(e) => handleAlphaChange(Number(e.target.value) / 100)}
                />
            </div>

            <div className="border bg-secondary/50 px-2 py-1 text-xs font-mono text-muted-foreground">
                {preview}
            </div>
        </div>
    )
}
