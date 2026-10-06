import { prisma } from './db'
import type { Currency } from './currency-client'
export type { Currency } from './currency-client'

const CACHE_DURATION = 60000 // 1 minute
let currencyCache: { currencies: Currency[]; cacheTime: number } | null = null

export async function getCurrencies(): Promise<Currency[]> {
    const now = Date.now()
    if (currencyCache && now - currencyCache.cacheTime < CACHE_DURATION) {
        return currencyCache.currencies
    }

    const currencies = await prisma.currency.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
    })

    currencyCache = { currencies, cacheTime: now }
    return currencies
}

export async function getCurrencyById(id: string): Promise<Currency | null> {
    return await prisma.currency.findUnique({
        where: { id },
    })
}

export async function getDefaultCurrency(): Promise<Currency | null> {
    const currencies = await getCurrencies()
    return currencies[0] || null
}

// Re-export formatPrice from client-safe module
export { formatPrice } from './currency-client'