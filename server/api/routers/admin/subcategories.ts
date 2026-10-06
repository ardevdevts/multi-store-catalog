import { router, protectedProcedure } from '../../trpc'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { subcategorySchema, subcategoryUpdateSchema } from '@/lib/api-validators'
import { TRPCError } from '@trpc/server'
import { ErrorCode, mapPrismaError, createErrorWithCode } from '@/lib/error-codes'

const ensureCategoryExists = async (categoryId: string) => {
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) {
        throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, { message: 'Category not found' })
    }
    return category
}

export const adminSubcategoriesRouter = router({
    list: protectedProcedure
        .input(z.object({ categoryId: z.string().optional() }).optional())
        .query(async ({ input }) => {
            const where: { categoryId?: string } = {}
            if (input?.categoryId) {
                where.categoryId = input.categoryId
            }
            const subcategories = await prisma.subcategory.findMany({
                where,
                include: { category: true, _count: { select: { products: true } } },
                orderBy: { name: 'asc' },
            })
            return subcategories
        }),

    create: protectedProcedure.input(subcategorySchema).mutation(async ({ input }) => {
        try {
            await ensureCategoryExists(input.categoryId)
            const subcategory = await prisma.subcategory.create({
                data: {
                    name: input.name,
                    slug: input.slug,
                    description: input.description,
                    categoryId: input.categoryId,
                    isActive: input.isActive ?? true,
                    filters: input.filters || [],
                }
            })
            return subcategory
        } catch (error: any) {
            const prismaErrorCode = mapPrismaError(error)
            if (prismaErrorCode) {
                throw createErrorWithCode(prismaErrorCode)
            }

            if (error instanceof TRPCError) {
                throw error
            }

            console.error('Unexpected error in subcategories.create:', error)
            throw createErrorWithCode(ErrorCode.SERVER_ERROR)
        }
    }),

    update: protectedProcedure
        .input(z.object({ id: z.string(), data: subcategoryUpdateSchema }))
        .mutation(async ({ input }) => {
            const { id, data } = input
            try {
                const existing = await prisma.subcategory.findUnique({ where: { id } })
                if (!existing) {
                    throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, { message: 'Subcategory not found' })
                }

                if (data.categoryId) {
                    await ensureCategoryExists(data.categoryId)
                }

                const subcategory = await prisma.subcategory.update({
                    where: { id }, data: {
                        name: data.name,
                        slug: data.slug,
                        description: data.description,
                        categoryId: data.categoryId,
                        isActive: data.isActive,
                        filters: data.filters,
                    }
                })
                return subcategory
            } catch (error: any) {
                const prismaErrorCode = mapPrismaError(error)
                if (prismaErrorCode) {
                    throw createErrorWithCode(prismaErrorCode)
                }

                if (error instanceof TRPCError) {
                    throw error
                }

                console.error('Unexpected error in subcategories.update:', error)
                throw createErrorWithCode(ErrorCode.SERVER_ERROR)
            }
        }),

    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
        try {
            const existing = await prisma.subcategory.findUnique({ where: { id: input.id } })
            if (!existing) {
                throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, { message: 'Subcategory not found' })
            }

            await prisma.subcategory.delete({ where: { id: input.id } })
            return { success: true }
        } catch (error: any) {
            const prismaErrorCode = mapPrismaError(error)
            if (prismaErrorCode) {
                throw createErrorWithCode(prismaErrorCode)
            }

            if (error instanceof TRPCError) {
                throw error
            }

            console.error('Unexpected error in subcategories.delete:', error)
            throw createErrorWithCode(ErrorCode.SERVER_ERROR)
        }
    }),
})