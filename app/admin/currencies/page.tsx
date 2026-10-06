"use client"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { trpc } from '@/trpc/client'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-messages'

type Currency = {
    id: string
    name: string
    code: string
    symbol: string
    symbolPosition: string
    decimalSeparator: string
    thousandsSeparator: string
    decimalPlaces: number
    isActive: boolean
}

export default function CurrenciesPage() {
    const [isInactiveOpen, setIsInactiveOpen] = useState(false)
    const [search, setSearch] = useState("")

    const { data: currencies, isLoading, refetch } = trpc.admin.currencies.list.useQuery()

    const updateMutation = trpc.admin.currencies.update.useMutation({
        onSuccess: () => {
            refetch()
            toast.success('Moneda actualizada exitosamente')
        },
        onError: (error) => {
            toast.error(getErrorMessage(error))
        }
    })

    const normalizeString = (str: string): string => {
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }

    const filteredCurrencies = useMemo(() => {
        if (!currencies) return { active: [], inactive: [] }
        
        const filtered = currencies.filter((currency) => {
            if (!search) return true
            const q = normalizeString(search)
            return (
                normalizeString(currency.name).includes(q) ||
                normalizeString(currency.code).includes(q) ||
                normalizeString(currency.symbol).includes(q)
            )
        })

        return {
            active: filtered.filter((c) => c.isActive),
            inactive: filtered.filter((c) => !c.isActive),
        }
    }, [currencies, search])

    const formatCurrency = (currency: Currency) => {
        const example = `1${currency.decimalSeparator}${'0'.repeat(currency.decimalPlaces)}`
        return currency.symbolPosition === 'before'
            ? `${currency.symbol} ${example}`
            : `${example} ${currency.symbol}`
    }

    const handleToggle = async (currency: Currency, newValue: boolean) => {
        await updateMutation.mutateAsync({
            id: currency.id,
            data: {
                name: currency.name,
                code: currency.code,
                symbol: currency.symbol,
                symbolPosition: currency.symbolPosition,
                decimalSeparator: currency.decimalSeparator,
                thousandsSeparator: currency.thousandsSeparator,
                decimalPlaces: currency.decimalPlaces,
                isActive: newValue,
            }
        })
    }

    const renderTable = (items: Currency[]) => (
        <div className="bg-card border border-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Símbolo</TableHead>
                        <TableHead>Formato</TableHead>
                        <TableHead className="text-right">Activo</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                                <div className="flex items-center gap-2 justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando…
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                                Sin resultados
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((currency) => (
                            <TableRow key={currency.id}>
                                <TableCell>{currency.name}</TableCell>
                                <TableCell>{currency.code}</TableCell>
                                <TableCell>{currency.symbol}</TableCell>
                                <TableCell>{formatCurrency(currency)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end">
                                        <Switch
                                            checked={currency.isActive}
                                            onCheckedChange={(value) => handleToggle(currency, value)}
                                            disabled={updateMutation.isPending}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )

    return (
        <div className="min-h-screen bg-background">
            <main>
                <div className="p-4 sm:p-6 md:p-8 w-full mx-auto flex-col md:pt-20 lg:pt-0 mt-14">
                    {/* Active Currencies */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold mb-6">Monedas Activas</h1>
                        
                        <div className="mb-6">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar monedas..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Usa la búsqueda para filtrar resultados.
                            </p>
                        </div>

                        {renderTable(filteredCurrencies.active)}
                    </div>

                    {/* Inactive Currencies */}
                    <Collapsible open={isInactiveOpen} onOpenChange={setIsInactiveOpen}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between pb-4 hover:opacity-70 transition-opacity">
                            <h2 className="text-3xl font-bold">Monedas Inactivas</h2>
                            <ChevronDown 
                                className={`h-5 w-5 transition-transform ${isInactiveOpen ? 'rotate-180' : ''}`}
                            />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="mb-6">
                                {renderTable(filteredCurrencies.inactive)}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </main>
        </div>
    )
}
