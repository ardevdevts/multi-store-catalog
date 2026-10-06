'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { trpc } from '@/trpc/client'
import { CategoryIcon } from '@/components/categories/category-icon'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
}

interface CategoryBarProps {
  selectedCategorySlug?: string
}

export const CategoryBar = ({ selectedCategorySlug }: CategoryBarProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const { data: categoriesData } = trpc.categories.list.useQuery()

  const categories = (categoriesData?.docs || []) as Category[]

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = 200
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className="bg-primary/10 md:border md:border-border">
      <div className="container py-4">
        <div className="relative flex items-center">
          {/* Left Scroll Button */}
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ease-in-out ${canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
          >
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 shadow-md bg-background/80 backdrop-blur-sm"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-center gap-4 overflow-x-auto scrollbar-hide w-full transition-all duration-300 ease-in-out px-4 md:px-12"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* All Products Button */}
            <Button
              onClick={() => (window.location.href = `/`)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${!selectedCategorySlug
                ? 'bg-primary text-primary-foreground backdrop-blur-md'
                : 'hover:bg-primary/5 text-foreground bg-transparent'
                }`}
            >
              <Package className="h-4 w-4" />
              <span>Todos</span>
            </Button>

            {/* Category Buttons */}
            {categories.map((category) => {
              const isSelected = selectedCategorySlug === category.slug

              return (
                <Button
                  key={category.id}
                  onClick={() => (window.location.href = `/?category=${category.slug}`)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${isSelected
                    ? 'bg-primary text-primary-foreground backdrop-blur-md'
                    : 'hover:bg-primary/5 text-foreground bg-transparent'
                    }`}
                >
                  <CategoryIcon icon={category.icon} className="h-4 w-4" />
                  <span>{category.name}</span>
                </Button>
              )
            })}
          </div>

          {/* Right Scroll Button */}
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ease-in-out ${canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
          >
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 shadow-md bg-background/80 backdrop-blur-sm"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}