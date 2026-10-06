import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { prisma } from '@/lib/db'

export const categoriesRouter = router({
    list: publicProcedure
        .input(
            z.object({ slug: z.string().optional() }).optional()
        )
        .query(async ({ input }) => {
            if (input?.slug) {
                const category = await prisma.category.findFirst({
                    where: { slug: input.slug, isActive: true },
                })
                return {
                    docs: category ? [category] : [],
                    totalDocs: category ? 1 : 0,
                }
            }

            const categories = await prisma.category.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            })

            return {
                docs: categories,
                totalDocs: categories.length,
            }
        }),
})
