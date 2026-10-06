"use client";

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

type ContactSettings = {
    email: string
    phoneNumber: string
    address: string
}

type SiteData = {
    name: string
    description: string | null
    settings: unknown
}

const readContact = (settings: unknown): ContactSettings => {
    const parsed = (settings ?? {}) as { contact?: Partial<ContactSettings> }

    return {
        email: parsed.contact?.email ?? '',
        phoneNumber: parsed.contact?.phoneNumber ?? '',
        address: parsed.contact?.address ?? '',
    }
}

function SiteSettingsForms({ site, onSaved }: { site: SiteData; onSaved: () => void }) {
    const updateSite = trpc.admin.site.update.useMutation({
        onSuccess: () => {
            toast.success('Configuracion actualizada correctamente')
            onSaved()
        },
        onError: (err) => {
            toast.error('Error al actualizar la configuracion', { description: err.message })
        },
    })

    const [identity, setIdentity] = useState({
        name: site.name,
        description: site.description ?? '',
    })
    const [contact, setContact] = useState<ContactSettings>(() => readContact(site.settings))

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateSite.mutate({
            name: identity.name,
            description: identity.description,
        })
    }

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateSite.mutate({ contact })
    }

    return (
        <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Informacion del catalogo</CardTitle>
                        <CardDescription>
                            Nombre y descripcion que se muestran en el sitio y en los metadatos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="site-name">Nombre</Label>
                            <Input
                                id="site-name"
                                value={identity.name}
                                onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                                placeholder="Mi catalogo"
                                required
                                minLength={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="site-description">Descripcion</Label>
                            <Textarea
                                id="site-description"
                                value={identity.description}
                                onChange={(e) => setIdentity({ ...identity, description: e.target.value })}
                                placeholder="Describe tu catalogo"
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={updateSite.isPending}>
                                {updateSite.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            <form onSubmit={handleContactSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Información de Contacto</CardTitle>
                        <CardDescription>
                            Administra la información de contacto que se mostrará en el sitio web
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                value={contact.email}
                                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                                placeholder="contacto@ejemplo.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Número de Teléfono</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                value={contact.phoneNumber}
                                onChange={(e) => setContact({ ...contact, phoneNumber: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Textarea
                                id="address"
                                value={contact.address}
                                onChange={(e) => setContact({ ...contact, address: e.target.value })}
                                placeholder="Calle Principal #123, Ciudad, País"
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={updateSite.isPending}>
                                {updateSite.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}

export default function SettingsPage() {
    const { data: site, isLoading, refetch } = trpc.admin.site.get.useQuery()

    return (
        <div className="min-h-screen bg-background">
            <main className="md:pt-20 lg:pt-0">
                <div className="p-8">
                    <p className="text-3xl font-bold mb-6">Configuracion General</p>

                    {isLoading || !site ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <SiteSettingsForms
                            key={site.id}
                            onSaved={() => refetch()}
                            site={{
                                name: site.name,
                                description: site.description,
                                settings: site.settings,
                            }}
                        />
                    )}
                </div>
            </main>
        </div>
    )
}