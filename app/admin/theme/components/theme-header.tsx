'use client'

import { Loader2, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ThemeHeaderProps {
    storeName?: string
    onSave: () => void
    saving: boolean
}

export const ThemeHeader = ({ storeName, onSave, saving }: ThemeHeaderProps) => (
    <div className="flex items-center justify-between gap-4 w-full">
        <div>
            <p className="text-3xl font-bold flex items-center gap-2">
                <Palette className="h-6 w-6" />
                Tema del catalogo
            </p>
            <p className="text-sm text-muted-foreground">Ajusta los colores y tipografias usados en el catalogo.</p>
            {storeName ? (
                <p className="mt-1 text-xs text-muted-foreground">Catalogo actual: {storeName}</p>
            ) : null}
        </div>
        <div className="flex gap-3 items-center">
            <Button onClick={onSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar tema'}
            </Button>
        </div>
    </div>
)