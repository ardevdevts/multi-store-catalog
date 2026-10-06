import { router } from './trpc'
import { categoriesRouter } from './routers/categories'
import { subcategoriesRouter } from './routers/subcategories'
import { productsRouter } from './routers/products'
import { currenciesRouter } from './routers/currencies'
import { adminCategoriesRouter } from './routers/admin/categories'
import { adminSubcategoriesRouter } from './routers/admin/subcategories'
import { adminCurrenciesRouter } from './routers/admin/currencies'
import { adminProductsRouter } from './routers/admin/products'
import { adminMediaRouter } from './routers/admin/media'
import { adminUsersRouter } from './routers/admin/users'
import { adminSiteRouter } from './routers/admin/site'

export const appRouter = router({
    categories: categoriesRouter,
    subcategories: subcategoriesRouter,
    products: productsRouter,
    currencies: currenciesRouter,
    admin: router({
        categories: adminCategoriesRouter,
        subcategories: adminSubcategoriesRouter,
        currencies: adminCurrenciesRouter,
        products: adminProductsRouter,
        media: adminMediaRouter,
        users: adminUsersRouter,
        site: adminSiteRouter,
    }),
})

export type AppRouter = typeof appRouter
