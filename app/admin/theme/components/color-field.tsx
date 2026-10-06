'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { toSafeColor } from '../theme-utils'
import { SimpleColorPicker } from './simple-color-picker'

interface ColorFieldProps {
    value: string
    onChange: (value: string) => void
}

export const ColorField = ({ value, onChange }: ColorFieldProps) => {
    const safeValue = value ?? ''
    const preview = toSafeColor(safeValue)

    return (
        <div className="flex items-center gap-2">
            <Input
                value={safeValue}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
            />
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="h-9 w-9 border border-border shadow-sm"
                        style={{ background: preview }}
                        aria-label="Seleccionar color"
                    />
                </PopoverTrigger>
                <PopoverContent className="w-72" align="start">
                    <SimpleColorPicker value={safeValue} onChange={onChange} />
                </PopoverContent>
            </Popover>
        </div>
    )
}
