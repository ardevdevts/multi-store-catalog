'use client'

import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { composePhoneNumber, PHONE_COUNTRY_OPTIONS, splitPhoneNumber } from '@/lib/phone'
import { StoreTheme } from '@/lib/theme'

interface BrandingCardProps {
    branding: NonNullable<StoreTheme['branding']>
    onBrandingChange: (key: keyof NonNullable<StoreTheme['branding']>, value: string | number | undefined) => void
    onLogoFile: (file: File) => void
    uploading: boolean
}

export const BrandingCard = ({ branding, onBrandingChange, onLogoFile, uploading }: BrandingCardProps) => {
    const parsedPhone = splitPhoneNumber(branding.contactPhone)

    const handlePhoneCountryChange = (countryCode: string) => {
        onBrandingChange('contactPhone', composePhoneNumber(countryCode, parsedPhone.nationalNumber))
    }

    const handlePhoneNumberChange = (value: string) => {
        onBrandingChange('contactPhone', composePhoneNumber(parsedPhone.countryCode, value))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Identidad de la tienda</CardTitle>
                <CardDescription>Configura el logo que se mostrara en el storefront.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                <div className="space-y-2">
                    <Label htmlFor="logo-alt">Texto alternativo</Label>
                    <Input
                        id="logo-alt"
                        value={branding.logoAlt ?? ''}
                        onChange={(e) => onBrandingChange('logoAlt', e.target.value)}
                        placeholder="Nombre de la tienda"
                    />
                </div>

                {/* <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="logo-width">Ancho (px)</Label>
                        <Input
                            id="logo-width"
                            type="number"
                            min={16}
                            value={branding.logoWidth ?? ''}
                            onChange={(e) => onBrandingChange('logoWidth', e.target.value ? Number(e.target.value) : undefined)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="logo-height">Alto (px)</Label>
                        <Input
                            id="logo-height"
                            type="number"
                            min={16}
                            value={branding.logoHeight ?? ''}
                            onChange={(e) => onBrandingChange('logoHeight', e.target.value ? Number(e.target.value) : undefined)}
                        />
                    </div>
                </div> */}

                <div className="space-y-2">
                    <Label>Vista previa</Label>
                    <div className="flex h-32 items-center justify-center border border-dashed border-border bg-muted/30">
                        {branding.logoUrl ? (
                            <Image
                                src={branding.logoUrl}
                                alt={branding.logoAlt ?? 'Logo de la tienda'}
                                width={branding.logoWidth ?? 100}
                                height={branding.logoHeight ?? 100}
                                className="h-9 w-9 border border-border shadow-sm"
                            />
                        ) : (
                            <span className="text-sm text-muted-foreground">Anade la URL de tu logo.</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) onLogoFile(file)
                            }}
                            disabled={uploading}
                        />
                        {uploading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Subiendo...
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium text-sm">Información de contacto</h4>

                    <div className="space-y-2">
                        <Label htmlFor="contact-email">Email</Label>
                        <Input
                            id="contact-email"
                            type="email"
                            value={branding.contactEmail ?? ''}
                            onChange={(e) => onBrandingChange('contactEmail', e.target.value)}
                            placeholder="info@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact-phone">Teléfono</Label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[14rem_1fr]">
                            <Select value={parsedPhone.countryCode} onValueChange={handlePhoneCountryChange}>
                                <SelectTrigger id="contact-phone-country" className="w-full">
                                    <SelectValue placeholder="País" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PHONE_COUNTRY_OPTIONS.map((country) => (
                                        <SelectItem key={country.code} value={country.code}>
                                            {country.flag} {country.name} ({country.dialCode})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                id="contact-phone"
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={parsedPhone.nationalNumber}
                                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                                placeholder="5551234567"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact-address">Dirección</Label>
                        <Input
                            id="contact-address"
                            value={branding.contactAddress ?? ''}
                            onChange={(e) => onBrandingChange('contactAddress', e.target.value)}
                            placeholder="Calle, Ciudad, País"
                        />
                    </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium text-sm">Redes sociales</h4>

                    <div className="space-y-2">
                        <Label htmlFor="social-facebook">Facebook</Label>
                        <Input
                            id="social-facebook"
                            type="url"
                            value={branding.socialFacebook ?? ''}
                            onChange={(e) => onBrandingChange('socialFacebook', e.target.value)}
                            placeholder="https://facebook.com/..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="social-instagram">Instagram</Label>
                        <Input
                            id="social-instagram"
                            type="url"
                            value={branding.socialInstagram ?? ''}
                            onChange={(e) => onBrandingChange('socialInstagram', e.target.value)}
                            placeholder="https://instagram.com/..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="social-twitter">Twitter / X</Label>
                        <Input
                            id="social-twitter"
                            type="url"
                            value={branding.socialTwitter ?? ''}
                            onChange={(e) => onBrandingChange('socialTwitter', e.target.value)}
                            placeholder="https://twitter.com/..."
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
