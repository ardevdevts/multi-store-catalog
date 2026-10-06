'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ImportThemeCardProps {
    value: string
    onChange: (value: string) => void
    onImport: () => void
    disabled?: boolean
}

export const ImportThemeCard = ({ value, onChange, onImport, disabled }: ImportThemeCardProps) => (
    <Card>
        <CardHeader>
            <CardTitle>Importar variables</CardTitle>
            <CardDescription>Pega un JSON con las claves light/dark y sus colores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
                placeholder='{"light": {"primary": "#000"}, "dark": {"primary": "#fff"}}'
                className="font-mono text-sm"
            />
            <div className="flex justify-end">
                <Button variant="outline" onClick={onImport} disabled={disabled}>
                    Importar JSON
                </Button>
            </div>
        </CardContent>
    </Card>
)
