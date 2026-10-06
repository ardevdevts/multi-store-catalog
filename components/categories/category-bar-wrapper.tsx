import { CategoryBar } from "@/components/categories/category-bar"

interface CategoryBarWrapperProps {
  selectedCategorySlug?: string
}

export const CategoryBarWrapper = ({ selectedCategorySlug }: CategoryBarWrapperProps) => {
  return <CategoryBar selectedCategorySlug={selectedCategorySlug} />
}