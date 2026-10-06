import { router, publicProcedure } from '../trpc'
import { z } from 'zod'
import { prisma } from '@/lib/db'

export const subcategoriesRouter = router({
    list: publicProcedure
        .input(
            z.object({ slug: z.string().optional(), categoryId: z.string().optional() }).optional()
        )
        .query(async ({ input }) => {
            const where: { isActive: boolean; slug?: string; categoryId?: string } = {
                isActive: true,
            }

            if (input?.slug) where.slug = input.slug
            if (input?.categoryId) where.categoryId = input.categoryId

            if (input?.slug) {
                const subcategory = await prisma.subcategory.findFirst({ where, include: { category: true } })
                return {
                    docs: subcategory ? [subcategory] : [],
                    totalDocs: subcategory ? 1 : 0,
                }
            }

            const subcategories = await prisma.subcategory.findMany({ where, orderBy: { name: 'asc' }, include: { category: true } })

            return {
                docs: subcategories,
                totalDocs: subcategories.length,
            }
        }),
})
