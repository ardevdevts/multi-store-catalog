import { initTRPC, TRPCError } from '@trpc/server'
import { ZodError } from 'zod'
import { getApiSession } from '@/lib/session'
import { Role } from '../../generated/prisma/enums'

type Context = {
    session: Awaited<ReturnType<typeof getApiSession>>
}

const t = initTRPC.context<Context>().create({
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
                        ? error.cause.flatten()
                        : null,
            },
        }
    },
})

export const router = t.router
export const publicProcedure = t.procedure

const ensureAuth = t.middleware(async ({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({
        ctx: {
            session: {
                ...ctx.session,
                user: ctx.session.user,
            },
        },
    })
})

export const protectedProcedure = t.procedure.use(ensureAuth)

const ensureAdmin = t.middleware(async ({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user || ctx.session.user.role !== Role.ADMIN) {
        throw new TRPCError({ code: 'FORBIDDEN' })
    }
    return next({
        ctx: {
            session: {
                ...ctx.session,
                user: ctx.session.user,
            },
        },
    })
})

export const adminProcedure = t.procedure.use(ensureAdmin)
