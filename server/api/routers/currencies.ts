import { router, publicProcedure } from '../trpc'
import { prisma } from '@/lib/db'

export const currenciesRouter = router({
    list: publicProcedure.query(async () => {
        return prisma.currency.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' },
        })
    }),
})
