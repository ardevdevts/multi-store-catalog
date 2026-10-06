import { SlidersHorizontal } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getCurrencies } from '@/lib/currency'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { FilterSidebarClient } from './filter-sidebar-client'
import type { Filter } from './filter-sidebar-client'
import type { Category, Subcategory } from '@/generated/prisma/client'
import type { ReactElement } from 'react'

interface FilterSidebarProps {
  categorySlug?: string
  subcategorySlug?: string
}

export const getFilterContent = async (
  categorySlug?: string,
  subcategorySlug?: string,
): Promise<ReactElement> => {
  const currencies = await getCurrencies()

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  let selectedCategory: Category | null = null
  if (categorySlug) {
    selectedCategory = await prisma.category.findFirst({
      where: {
        slug: categorySlug,
      },
    })
  }

  let subcategoriesForCategory: Subcategory[] = []
  if (selectedCategory) {
    subcategoriesForCategory = await prisma.subcategory.findMany({
      where: {
        categoryId: selectedCategory.id,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
  }

  const categoryCounts = await Promise.all(
    categories.map(async (category) => {
      const count = await prisma.product.count({
        where: {
          categoryId: category.id,
          isActive: true,
        },
      })
      return { id: category.id, count }
    }),
  )

  const categoryCountMap = Object.fromEntries(categoryCounts.map(({ id, count }) => [id, count]))

  const subcategoryCountMap: Record<string | number, number> = {}
  if (selectedCategory && subcategoriesForCategory.length > 0) {
    const subcategoryCounts = await Promise.all(
      subcategoriesForCategory.map(async (subcategory) => {
        const count = await prisma.product.count({
          where: {
            categoryId: selectedCategory.id,
            subcategoryId: subcategory.id,
            isActive: true,
          },
        })
        return { id: subcategory.id, count }
      }),
    )
    subcategoryCounts.forEach(({ id, count }) => {
      subcategoryCountMap[id] = count
    })
  }

  const activeFilters = new Map<
    string,
    {
      name: string
      slug: string
      type: string
      options?: Array<{ label: string; value: string }>
      unit?: string
    }
  >()

  if (selectedCategory && selectedCategory.filters && Array.isArray(selectedCategory.filters)) {
    const categoryFilters = Array.isArray(selectedCategory.filters)
      ? (selectedCategory.filters as unknown as Filter[])
      : []

    categoryFilters.forEach((filter: Filter) => {
      if (!activeFilters.has(filter.slug)) {
        activeFilters.set(filter.slug, {
          name: filter.name,
          slug: filter.slug,
          type: filter.type,
          options: filter.options,
          unit: filter.unit,
        })
      }
    })
  }

  if (subcategorySlug && selectedCategory) {
    const selectedSubcat = await prisma.subcategory.findFirst({
      where: {
        slug: subcategorySlug,
        categoryId: selectedCategory.id,
      },
    })

    if (selectedSubcat && selectedSubcat.filters && Array.isArray(selectedSubcat.filters)) {
      const subcatFilters = selectedSubcat.filters as unknown as Filter[]

      subcatFilters.forEach((filter: Filter) => {
        if (!activeFilters.has(filter.slug)) {
          activeFilters.set(filter.slug, {
            name: filter.name,
            slug: filter.slug,
            type: filter.type,
            options: filter.options,
            unit: filter.unit,
          })
        }
      })
    }
  }

  const filterContent = (
    <div className="p-4 pb-12 space-y-6">
      {!categorySlug && categories.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-foreground uppercase tracking-wide">Categorías</p>
          <div className="space-y-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/?category=${category.slug}`}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span className="text-sm">{category.name}</span>
                <span className="text-xs text-muted-foreground">
                  {categoryCountMap[category.id] || 0}
                </span>
              </Link>
            ))}
          </div>
          <Separator />
        </div>
      )}

      {selectedCategory && subcategoriesForCategory.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-foreground uppercase tracking-wide">
            Subcategorías
          </p>
          <div className="space-y-1">
            <Link
              href={`/?category=${categorySlug}`}
              className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${!subcategorySlug ? 'bg-accent text-accent-foreground' : ''
                }`}
            >
              <span className="text-sm">Todas</span>
              <span className="text-xs text-muted-foreground">
                {categoryCountMap[selectedCategory.id] || 0}
              </span>
            </Link>
            {subcategoriesForCategory.map((subcategory) => (
              <Link
                key={subcategory.id}
                href={`/?category=${categorySlug}&subcategory=${subcategory.slug}`}
                className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${subcategorySlug === subcategory.slug ? 'bg-accent text-accent-foreground' : ''
                  }`}
              >
                <span className="text-sm">{subcategory.name}</span>
                <span className="text-xs text-muted-foreground">
                  {subcategoryCountMap[subcategory.id] || 0}
                </span>
              </Link>
            ))}
          </div>
          <Separator />
        </div>
      )}

      <FilterSidebarClient
        activeFilters={Array.from(activeFilters.values())}
        categorySlug={categorySlug}
        subcategorySlug={subcategorySlug}
        currencies={currencies}
      />
    </div>
  )

  return filterContent
}

export const FilterSidebar = async ({ categorySlug, subcategorySlug }: FilterSidebarProps) => {
  const filterContent = await getFilterContent(categorySlug, subcategorySlug)

  return (
    <>
      <aside className="hidden md:flex sticky top-0 w-64 min-w-64 bg-primary/10 border-r border-border h-full flex-col">
        <div className="shrink-0 bg-sidebar border-b border-border p-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-foreground" />
            <p className="text-lg font-semibold text-foreground">Filtros</p>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">{filterContent}</ScrollArea>
        </div>
      </aside>
    </>
  )
}
