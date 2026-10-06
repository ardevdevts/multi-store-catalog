import { router, protectedProcedure } from '../../trpc'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { categorySchema, categoryUpdateSchema } from '@/lib/api-validators'
import { TRPCError } from '@trpc/server'
import { ErrorCode, mapPrismaError, createErrorWithCode } from '@/lib/error-codes'

export const adminCategoriesRouter = router({
    list: protectedProcedure
        .query(async () => {
            const categories = await prisma.category.findMany({
                include: { _count: { select: { products: true } } },
                orderBy: { name: 'asc' },
            })
            return categories
        }),

    create: protectedProcedure.input(categorySchema).mutation(async ({ input }) => {
        try {
            const category = await prisma.category.create({
                data: {
                    name: input.name,
                    slug: input.slug,
                    description: input.description,
                    icon: input.icon,
                    isActive: input.isActive ?? true,
                    filters: input.filters || [],
                }
            })
            return category
        } catch (error: any) {
            // Check for Prisma errors and map to standardized codes
            const prismaErrorCode = mapPrismaError(error)
            if (prismaErrorCode) {
                throw createErrorWithCode(prismaErrorCode)
            }

            // If already a TRPCError (one we created), rethrow
            if (error instanceof TRPCError) {
                throw error
            }

            // Handle unexpected errors
            console.error('Unexpected error in categories.create:', error)
            throw createErrorWithCode(ErrorCode.SERVER_ERROR)
        }
    }),

    update: protectedProcedure
        .input(z.object({ id: z.string(), data: categoryUpdateSchema }))
        .mutation(async ({ input }) => {
            const { id, data } = input
            try {
                const existing = await prisma.category.findUnique({ where: { id } })
                if (!existing) {
                    throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, { message: 'Category not found' })
                }

                const category = await prisma.category.update({
                    where: { id }, data: {
                        name: data.name,
                        slug: data.slug,
                        description: data.description,
                        icon: data.icon,
                        isActive: data.isActive,
                        filters: data.filters,
                    }
                })
                return category
            } catch (error: any) {
                const prismaErrorCode = mapPrismaError(error)
                if (prismaErrorCode) {
                    throw createErrorWithCode(prismaErrorCode)
                }

                if (error instanceof TRPCError) {
                    throw error
                }

                console.error('Unexpected error in categories.update:', error)
                throw createErrorWithCode(ErrorCode.SERVER_ERROR)
            }
        }),

    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
        try {
            const existing = await prisma.category.findUnique({ where: { id: input.id } })
            if (!existing) {
                throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, { message: 'Category not found' })
            }

            await prisma.category.delete({ where: { id: input.id } })
            return { success: true }
        } catch (error: any) {
            const prismaErrorCode = mapPrismaError(error)
            if (prismaErrorCode) {
                throw createErrorWithCode(prismaErrorCode)
            }

            if (error instanceof TRPCError) {
                throw error
            }

            console.error('Unexpected error in categories.delete:', error)
            throw createErrorWithCode(ErrorCode.SERVER_ERROR)
        }
    }),
})