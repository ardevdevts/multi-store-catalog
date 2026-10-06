import { router, protectedProcedure } from '../../trpc'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { currencySchema, currencyUpdateSchema } from '@/lib/api-validators'
import { TRPCError } from '@trpc/server'
import { ErrorCode, mapPrismaError, createErrorWithCode } from '@/lib/error-codes'

export const adminCurrenciesRouter = router({
    list: protectedProcedure
        .query(async () => {
            return prisma.currency.findMany({ orderBy: { code: 'asc' } })
        }),

    create: protectedProcedure.input(currencySchema).mutation(async ({ input }) => {
        const currency = await prisma.currency.upsert({
            where: { code: input.code.toUpperCase() },
            create: {
                name: input.name,
                code: input.code.toUpperCase(),
                symbol: input.symbol,
                symbolPosition: input.symbolPosition || 'before',
                decimalSeparator: input.decimalSeparator || '.',
                thousandsSeparator: input.thousandsSeparator || ',',
                decimalPlaces: input.decimalPlaces ?? 2,
                isActive: input.isActive ?? true,
            },
            update: {
                name: input.name,
                symbol: input.symbol,
                symbolPosition: input.symbolPosition || 'before',
                decimalSeparator: input.decimalSeparator || '.',
                thousandsSeparator: input.thousandsSeparator || ',',
                decimalPlaces: input.decimalPlaces ?? 2,
            },
        })

        return currency
    }),

    update: protectedProcedure
        .input(z.object({ id: z.string(), data: currencyUpdateSchema }))
        .mutation(async ({ input }) => {
            const { id, data } = input
            const existing = await prisma.currency.findUnique({ where: { id } })
            if (!existing) {
                throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, { message: 'Currency not found' })
            }

            // Check if currency is being disabled and has related prices
            if (data.isActive === false) {
                const pricesCount = await prisma.price.count({
                    where: {
                        currencyId: id,
                        OR: [
                            { productId: { not: null } },
                            { productVariantId: { not: null } }
                        ]
                    }
                })

                if (pricesCount > 0) {
                    throw createErrorWithCode(ErrorCode.RESOURCE_IN_USE, {
                        message: 'No se puede desactivar la moneda porque tiene productos asociados'
                    })
                }
            }

            const currency = await prisma.currency.update({
                where: { id },
                data: {
                    name: data.name,
                    code: data.code.toUpperCase(),
                    symbol: data.symbol,
                    symbolPosition: data.symbolPosition || 'before',
                    decimalSeparator: data.decimalSeparator || '.',
                    thousandsSeparator: data.thousandsSeparator || ',',
                    decimalPlaces: data.decimalPlaces ?? 2,
                    isActive: data.isActive ?? existing.isActive,
                }
            })

            return currency
        }),

    delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
        try {
            const existing = await prisma.currency.findUnique({ where: { id: input.id } })
            if (!existing) {
                throw createErrorWithCode(ErrorCode.ITEM_NOT_FOUND, { message: 'Currency not found' })
            }

            // Check if currency has related prices
            const pricesCount = await prisma.price.count({
                where: {
                    currencyId: input.id,
                    OR: [
                        { productId: { not: null } },
                        { productVariantId: { not: null } }
                    ]
                }
            })

            if (pricesCount > 0) {
                throw createErrorWithCode(ErrorCode.RESOURCE_IN_USE, {
                    message: 'No se puede desactivar la moneda porque tiene productos asociados'
                })
            }

            await prisma.currency.update({
                where: { id: input.id },
                data: { isActive: false },
            })
            return { success: true }
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
            console.error('Unexpected error in currencies.delete:', error)
            throw createErrorWithCode(ErrorCode.SERVER_ERROR)
        }
    }),
})