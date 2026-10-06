'use client'

import { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { shadowPresets } from '../theme-constants'

interface ShadowFieldProps {
    value: string
    onChange: (value: string) => void
}

const normalizeShadow = (val: string) => val.replace(/\s+/g, ' ').trim()

export const ShadowField = ({ value, onChange }: ShadowFieldProps) => {
    const safeValue = value ?? ''

    const selectedPresetId = useMemo(() => {
        const normalized = normalizeShadow(safeValue)
        const match = shadowPresets.find((preset) => normalizeShadow(preset.value) === normalized)
        return match?.id ?? 'custom'
    }, [safeValue])

    const handlePresetChange = (presetId: string) => {
        if (presetId === 'custom') return
        const preset = shadowPresets.find((item) => item.id === presetId)
        if (preset) onChange(preset.value)
    }

    const previewShadow = safeValue.trim() || 'none'

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Select
                    value={selectedPresetId}
                    onValueChange={handlePresetChange}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="custom">Personalizada (texto)</SelectItem>
                        {shadowPresets.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                                {preset.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* <Input
                value={safeValue}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
                placeholder="0px 4px 8px -2px hsl(0 0% 0% / 0.1)"
            /> */}

            <div className="border bg-background p-3">
                <div
                    className="h-16 border bg-card flex items-center justify-center text-xs text-muted-foreground"
                    style={{ boxShadow: previewShadow }}
                >
                    Vista previa
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                Sintaxis: offsetX offsetY blur spread color. Puedes escribir tu sombra o elegir un preset (Ligera, Media, Alta).
            </p>
        </div>
    )
}
