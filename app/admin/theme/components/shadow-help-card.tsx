'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const ShadowHelpCard = () => (
    <Card>
        <CardHeader>
            <CardTitle>Sintaxis de sombras CSS (box-shadow)</CardTitle>
            <CardDescription>Como funcionan los valores de sombra en CSS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="bg-muted/50 p-3 font-mono text-sm space-y-2">
                <p><span className="text-primary font-bold">Sintaxis:</span> offsetX offsetY blur spread color</p>
                <p className="text-xs text-muted-foreground">El orden importa: primero se desplaza la sombra (X y Y), luego se difumina (blur), despues se expande o contrae (spread) y por ultimo se pinta el color.</p>
                <p className="text-xs text-muted-foreground">Puedes encadenar varias sombras separadas por comas; cada conjunto sigue la misma distribucion.</p>
                <p className="text-xs text-muted-foreground">Esta secuencia controla direccion, profundidad, suavidad, tamano y transparencia en una sola linea.</p>
            </div>

            <div className="space-y-3">
                <div>
                    <p className="font-semibold text-sm mb-2">Ejemplo de tu sombra:</p>
                    <div className="bg-muted/50 p-3 font-mono text-xs space-y-1">
                        <p><span className="text-blue-600">0px</span> <span className="text-green-600">4px</span> <span className="text-purple-600">8px</span> <span className="text-orange-600">-1px</span> <span className="text-red-600">hsl(0 0% 0% / 0.08)</span>,</p>
                        <p><span className="text-blue-600">0px</span> <span className="text-green-600">4px</span> <span className="text-purple-600">6px</span> <span className="text-orange-600">-2px</span> <span className="text-red-600">hsl(0 0% 0% / 0.08)</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="border-l-4 border-blue-500 pl-3">
                        <p className="font-semibold text-blue-600">offsetX (0px)</p>
                        <p className="text-xs text-muted-foreground">Desplazamiento horizontal. 0px = centrado. Positivo = derecha, negativo = izquierda.</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-3">
                        <p className="font-semibold text-green-600">offsetY (4px)</p>
                        <p className="text-xs text-muted-foreground">Desplazamiento vertical. Positivo = abajo, negativo = arriba. 4px = sombra debajo.</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-3">
                        <p className="font-semibold text-purple-600">blur (8px, 6px)</p>
                        <p className="text-xs text-muted-foreground">Desenfoque en pixeles. Mayor valor = sombra mas suave y difusa. 0px = bordes nitidos.</p>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-3">
                        <p className="font-semibold text-orange-600">spread (-1px, -2px)</p>
                        <p className="text-xs text-muted-foreground">Expansion de la sombra. Valores negativos contraen (sombra adentro). Positivos expanden.</p>
                    </div>
                    <div className="border-l-4 border-red-500 pl-3 md:col-span-2">
                        <p className="font-semibold text-red-600">color (hsl(0 0% 0% / 0.08))</p>
                        <p className="text-xs text-muted-foreground">Color de la sombra en cualquier formato CSS. hsl(...) es mas flexible. 0.08 = 8% opacidad.</p>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
                    <p className="text-xs font-semibold mb-1">Como funciona tu ejemplo:</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>- <span className="font-mono">0px 4px 8px -1px</span>: Sombra suave abajo, ligeramente contraida</li>
                        <li>- <span className="font-mono">0px 4px 6px -2px</span>: Segunda sombra mas cercana al elemento (mas contraida)</li>
                        <li>- Juntas crean profundidad con dos capas de sombra</li>
                        <li>- <span className="font-mono">0.08</span> opacidad = muy sutil, no domina el diseno</li>
                    </ul>
                </div>
            </div>
        </CardContent>
    </Card>
)
