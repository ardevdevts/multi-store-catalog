'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { storeFontOptions, StoreFontId } from '@/lib/store-fonts'

interface FontCardProps {
    selectedFontId: StoreFontId
    onChange: (fontId: StoreFontId) => void
}

export const FontCard = ({ selectedFontId, onChange }: FontCardProps) => (
    <Card>
        <CardHeader>
            <CardTitle>Tipografía</CardTitle>
            <CardDescription>Selecciona la fuente principal de la tienda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 w-full">
            <div className="space-y-2">
                <Label htmlFor="font-id">Fuente</Label>
                <Select
                    value={selectedFontId}
                    onValueChange={onChange}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>

                        {storeFontOptions.map((font) => (
                            <SelectItem key={font.id} value={font.id}>
                                {font.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Se aplica a los textos principales y titulos.</p>
            </div>
        </CardContent>
    </Card>
)

