'use client'

import { SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createContext, useContext, ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface FilterSheetContextType {
  openFilterSheet: () => void
}

const FilterSheetContext = createContext<FilterSheetContextType | null>(null)

export const FilterSheetProvider = ({
  children,
  onOpenFilters,
}: {
  children: ReactNode
  onOpenFilters: () => void
}) => {
  return (
    <FilterSheetContext.Provider value={{ openFilterSheet: onOpenFilters }}>
      {children}
    </FilterSheetContext.Provider>
  )
}

export const useFilterSheetContext = () => {
  const context = useContext(FilterSheetContext)
  if (!context) {
    throw new Error('useFilterSheetContext must be used within FilterSheetProvider')
  }
  return context
}

export const MobileToolbar = () => {
  const { openFilterSheet } = useFilterSheetContext()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || '-createdAt'

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '-createdAt') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="md:hidden flex items-center gap-2 mb-4">
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[140px]">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="-createdAt">Más recientes</SelectItem>
          <SelectItem value="createdAt">Más antiguos</SelectItem>
          <SelectItem value="name">Nombre (A-Z)</SelectItem>
          <SelectItem value="-name">Nombre (Z-A)</SelectItem>
          <SelectItem value="price">Precio ↑</SelectItem>
          <SelectItem value="-price">Precio ↓</SelectItem>
          <SelectItem value="-featured">Destacados</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={openFilterSheet}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
      </Button>
    </div>
  )
}
