import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/api/root'
import { getApiSession } from '@/lib/session'

const handler = (req: Request) => {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext: async ({ req }) => {
            const session = await getApiSession(req)

            return {
                session,
            }
        },
    })
}

export { handler as GET, handler as POST }
