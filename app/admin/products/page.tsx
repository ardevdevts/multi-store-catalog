"use client";

import { useState, useCallback, JSX, useEffect } from "react";
import { formatPrice as formatCurrencyPrice } from "@/lib/currency-client";
import { toNumber } from "@/lib/number";
import {
  Edit,
  Eye,
  Loader2,
  Trash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import AdminResource, {
  Column,
  FormField,
} from "@/components/admin/admin-resource";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  category?: { name: string };
  subcategoryId?: string | null;
  subcategory?: { name: string } | null;
  prices?: PriceType[];
  variants?: VariantType[];
  coverImages: Media[];
  inStock: boolean;
  isActive: boolean;
  featured: boolean;
  [key: string]: unknown;
}

type Media = {
  id: string;
  alt: string;
  url: string;
  productId?: string | null;
};
type PriceType = {
  id?: string;
  amount?: number | string;
  saleAmount?: number | string | null;
  currency?: string | null;
  isDefault?: boolean;
};
type VariantType = { id: string; isActive: boolean; prices?: PriceType[] };
type Category = {
  id: string;
  name: string;
  slug: string;
};
type Subcategory = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
};

export default function ProductsPage() {
  const storeBasePath = "/admin";
  const fetchUrl = "/api/admin/products";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteFn, setDeleteFn] = useState<
    ((id: string | number) => void) | null
  >(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [priceMinFilter, setPriceMinFilter] = useState<string>("");
  const [priceMaxFilter, setPriceMaxFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState({
    active: false,
    inactive: false,
    featured: false,
    inStock: false,
    outOfStock: false,
  });
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  const columns: Column<Product>[] = [
    {
      header: "Imagen",
      accessor: "coverImages",
      render: (p: Product) => {
        const coverImages = p.coverImages || [];
        const imageUrl = coverImages[0]?.url || "";

        return imageUrl ? (
          <div className="relative w-12 h-12 overflow-hidden">
            <Image src={imageUrl} alt={p.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 bg-muted" />
        );
      },
    },
    { header: "Nombre", accessor: "name" },
    { header: "Categoría", accessor: "category.name" },
    { header: "Subcategoría", accessor: "subcategory.name" },
    {
      header: "Precio",
      accessor: "prices",
      render: (p: Product) => {
        if (p.variants && p.variants.length > 0) {
          const variantPrices = p.variants
            .filter(
              (v: VariantType) => v.isActive && v.prices && v.prices.length > 0,
            )
            .flatMap((v: VariantType) => v.prices!)
            .map((pr: PriceType) => ({
              regular: toNumber(pr.amount),
              sale: pr.saleAmount ? toNumber(pr.saleAmount) : null,
            }))
            .filter((price) => !isNaN(price.regular));

          if (variantPrices.length > 0) {
            const minPrice = Math.min(
              ...variantPrices.map((p) => p.sale ?? p.regular)
            );
            const defaultPriceObj =
              p.prices?.find((pr) => pr.isDefault) || p.prices?.[0];
            return `Desde ${formatCurrencyPrice(minPrice, defaultPriceObj?.currency ?? null)}`;
          }
        }
        const defaultPriceObj =
          p.prices?.find((pr) => pr.isDefault) || p.prices?.[0];
        const regularPrice = toNumber(defaultPriceObj?.amount ?? 0);
        const salePrice = defaultPriceObj?.saleAmount
          ? toNumber(defaultPriceObj.saleAmount)
          : null;
        const currency = defaultPriceObj?.currency ?? null;

        if (salePrice && salePrice < regularPrice) {
          return (
            <div className="flex items-center gap-2">
              <span className="line-through text-muted-foreground text-sm">
                {formatCurrencyPrice(regularPrice, currency)}
              </span>
              <span className="font-semibold text-green-600">
                {formatCurrencyPrice(salePrice, currency)}
              </span>
            </div>
          );
        }
        return formatCurrencyPrice(regularPrice, currency);
      },
    },
    {
      header: "Estado",
      accessor: "isActive",
      render: (p: Product) => (
        <div className="flex gap-1">
          {p.isActive ? (
            <Badge variant="outline" className="bg-green-600 text-green-50">
              Activo
            </Badge>
          ) : (
            <Badge variant="secondary">Inactivo</Badge>
          )}
          {p.featured && <Badge>Destacado</Badge>}
          {!p.inStock && <Badge variant="destructive">Agotado</Badge>}
        </div>
      ),
    },
  ];

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortKey(key);
        setSortDirection("asc");
      }
    },
    [sortKey, sortDirection],
  );

  const getSortedItems = useCallback(
    (items: Product[]): Product[] => {
      if (!sortKey) return items;

      return [...items].sort((a: Product, b: Product) => {
        let aVal: string | number | boolean = "";
        let bVal: string | number | boolean = "";

        switch (sortKey) {
          case "name":
            aVal = a.name?.toLowerCase() || "";
            bVal = b.name?.toLowerCase() || "";
            break;
          case "category":
            aVal = a.category?.name?.toLowerCase() || "";
            bVal = b.category?.name?.toLowerCase() || "";
            break;
          case "subcategory":
            aVal = a.subcategory?.name?.toLowerCase() || "";
            bVal = b.subcategory?.name?.toLowerCase() || "";
            break;
          case "price":
            const aPrice = toNumber(
              (a.prices?.find((p) => p.isDefault) || a.prices?.[0])
                ?.saleAmount ??
              (a.prices?.find((p) => p.isDefault) || a.prices?.[0])?.amount ??
              0,
            );
            const bPrice = toNumber(
              (b.prices?.find((p) => p.isDefault) || b.prices?.[0])
                ?.saleAmount ??
              (b.prices?.find((p) => p.isDefault) || b.prices?.[0])?.amount ??
              0,
            );
            aVal = aPrice;
            bVal = bPrice;
            break;
          case "isActive":
            aVal = a.isActive;
            bVal = b.isActive;
            break;
          default:
            aVal = String((a as any)[sortKey] || "");
            bVal = String((b as any)[sortKey] || "");
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          const comparison = aVal.localeCompare(bVal);
          return sortDirection === "asc" ? comparison : -comparison;
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    },
    [sortKey, sortDirection],
  );

  // Fetch categories and subcategories using tRPC hooks
  const { data: categoriesData = [] } = trpc.admin.categories.list.useQuery();
  const { data: subcategoriesData = [] } = trpc.admin.subcategories.list.useQuery();

  // Use the data directly with proper typing
  const categories = categoriesData as Category[];
  const subcategories = subcategoriesData as Subcategory[];

  // Filter subcategories based on selected category
  const filteredSubcategories = categoryFilter !== "all"
    ? subcategories.filter((sub) => sub.categoryId === categoryFilter)
    : subcategories;

  // Reset subcategory filter if it's not in the filtered list
  useEffect(() => {
    if (categoryFilter !== "all" && subcategoryFilter !== "all") {
      const isValid = filteredSubcategories.some(sub => sub.id === subcategoryFilter);
      if (!isValid) {
        setSubcategoryFilter("all");
      }
    }
  }, [categoryFilter, subcategoryFilter, filteredSubcategories]);

  const formFields: FormField[] = [
    { name: "name", label: "Nombre", type: "text", required: true },
    { name: "slug", label: "Slug", type: "text" },
    { name: "shortDescription", label: "Descripción corta", type: "textarea" },
    { name: "categoryId", label: "Categoría", type: "select" },
    { name: "subcategoryId", label: "Subcategoría", type: "select" },
    { name: "isActive", label: "Activo", type: "switch" },
    { name: "inStock", label: "En stock", type: "switch" },
    { name: "featured", label: "Destacado", type: "switch" },
  ];

  const loadDependencies = useCallback(async () => {
    return {
      categoryId: [],
      subcategoryId: [],
    };
  }, []);

  const listTransform = useCallback((data: unknown) => {
    // Data from tRPC is already an array
    if (Array.isArray(data)) return data;
    // Fallback for any other format
    return (
      (data as { docs?: Product[] } | null)?.docs || (data as Product[]) || []
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 lg:pt-0">
        <AdminResource<Product>
          title="Productos"
          trpcResource="admin.products"
          fetchUrl={fetchUrl}
          listTransform={listTransform}
          columns={columns}
          formFields={formFields}
          createUrl={"/api/admin/products/"}
          updateUrl={(id: string) => `/api/admin/products/${id}`}
          deleteUrl={(id: string) => `/api/admin/products/${id}`}
          keyField={"id"}
          newButtonLabel={"Agregar Producto"}
          createPageUrl={`${storeBasePath}/products/new`}
          searchKeys={["name", "slug"]}
          loadDependencies={loadDependencies}
          renderHeaderExtra={() => (
            <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-1 gap-4 mt-6 p-4">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="category-filter">Categoría</Label>
                    <Select
                      value={categoryFilter}
                      onValueChange={(value) => {
                        setCategoryFilter(value);
                        setSubcategoryFilter("all"); // Reset subcategory when category changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subcategory Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="subcategory-filter">Subcategoría</Label>
                    <Select
                      value={subcategoryFilter}
                      onValueChange={setSubcategoryFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={categoryFilter !== "all" ? "Seleccionar subcategoría..." : "Seleccionar subcategoría..."} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las subcategorías</SelectItem>
                        {filteredSubcategories.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Filters */}
                  <div className="space-y-2">
                    <Label htmlFor="price-min">Precio mínimo</Label>
                    <Input
                      id="price-min"
                      type="number"
                      placeholder="0"
                      min="0"
                      value={priceMinFilter}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || parseFloat(value) >= 0) {
                          setPriceMinFilter(value);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price-max">Precio máximo</Label>
                    <Input
                      id="price-max"
                      type="number"
                      placeholder="Sin límite"
                      min="0"
                      value={priceMaxFilter}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || parseFloat(value) >= 0) {
                          setPriceMaxFilter(value);
                        }
                      }}
                    />
                  </div>

                  {/* Status Filters */}
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          Filtrar por estado
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Estados</DropdownMenuLabel>
                        <DropdownMenuCheckboxItem
                          checked={statusFilter.active}
                          onCheckedChange={(checked) =>
                            setStatusFilter((prev) => ({
                              ...prev,
                              active: checked as boolean,
                              inactive: checked ? false : prev.inactive, // Uncheck inactive if active is checked
                            }))
                          }
                        >
                          Activo
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={statusFilter.inactive}
                          onCheckedChange={(checked) =>
                            setStatusFilter((prev) => ({
                              ...prev,
                              inactive: checked as boolean,
                              active: checked ? false : prev.active, // Uncheck active if inactive is checked
                            }))
                          }
                        >
                          Inactivo
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={statusFilter.featured}
                          onCheckedChange={(checked) =>
                            setStatusFilter((prev) => ({
                              ...prev,
                              featured: checked as boolean,
                            }))
                          }
                        >
                          Destacado
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={statusFilter.inStock}
                          onCheckedChange={(checked) =>
                            setStatusFilter((prev) => ({
                              ...prev,
                              inStock: checked as boolean,
                              outOfStock: checked ? false : prev.outOfStock, // Uncheck outOfStock if inStock is checked
                            }))
                          }
                        >
                          En stock
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={statusFilter.outOfStock}
                          onCheckedChange={(checked) =>
                            setStatusFilter((prev) => ({
                              ...prev,
                              outOfStock: checked as boolean,
                              inStock: checked ? false : prev.inStock, // Uncheck inStock if outOfStock is checked
                            }))
                          }
                        >
                          Agotado
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setCategoryFilter("");
                        setSubcategoryFilter("");
                        setPriceMinFilter("");
                        setPriceMaxFilter("");
                        setStatusFilter({
                          active: false,
                          inactive: false,
                          featured: false,
                          inStock: false,
                          outOfStock: false,
                        });
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
          renderList={(items: Product[], loading, onEdit, onDelete) => {
            // Apply additional filters
            const filteredItems: Product[] = items.filter(
              (product: Product) => {
                // Category filter
                if (categoryFilter !== "all") {
                  if (!product.categoryId || product.categoryId !== categoryFilter) {
                    return false;
                  }
                }

                // Subcategory filter
                if (subcategoryFilter !== "all") {
                  if (!product.subcategoryId || product.subcategoryId !== subcategoryFilter) {
                    return false;
                  }
                }

                // Price range filter
                if (priceMinFilter || priceMaxFilter) {
                  const defaultPriceObj =
                    product.prices?.find((p) => p.isDefault) ||
                    product.prices?.[0];
                  const price = toNumber(
                    defaultPriceObj
                      ? (defaultPriceObj.saleAmount ?? defaultPriceObj.amount)
                      : 0,
                  );

                  const minPrice = priceMinFilter
                    ? parseFloat(priceMinFilter)
                    : 0;
                  const maxPrice = priceMaxFilter
                    ? parseFloat(priceMaxFilter)
                    : Infinity;

                  if (price < minPrice || price > maxPrice) {
                    return false;
                  }
                }

                // Status filters
                if (statusFilter.active && !product.isActive) return false;
                if (statusFilter.inactive && product.isActive) return false;
                if (statusFilter.featured && !product.featured) return false;
                if (statusFilter.inStock && !product.inStock) return false;
                if (statusFilter.outOfStock && product.inStock) return false;

                return true;
              },
            );

            const sortedProducts: Product[] = getSortedItems(filteredItems);
            return (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Imagen</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
                          onClick={() => handleSort("name")}
                        >
                          Nombre
                          {sortKey === "name" &&
                            (sortDirection === "asc" ? (
                              <ArrowUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-1 h-4 w-4" />
                            ))}
                          {sortKey !== "name" && (
                            <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
                          onClick={() => handleSort("category")}
                        >
                          Categoría
                          {sortKey === "category" &&
                            (sortDirection === "asc" ? (
                              <ArrowUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-1 h-4 w-4" />
                            ))}
                          {sortKey !== "category" && (
                            <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
                          onClick={() => handleSort("subcategory")}
                        >
                          Subcategoría
                          {sortKey === "subcategory" &&
                            (sortDirection === "asc" ? (
                              <ArrowUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-1 h-4 w-4" />
                            ))}
                          {sortKey !== "subcategory" && (
                            <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
                          onClick={() => handleSort("price")}
                        >
                          Precio
                          {sortKey === "price" &&
                            (sortDirection === "asc" ? (
                              <ArrowUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-1 h-4 w-4" />
                            ))}
                          {sortKey !== "price" && (
                            <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold hover:bg-transparent hover:text-primary"
                          onClick={() => handleSort("isActive")}
                        >
                          Estado
                          {sortKey === "isActive" &&
                            (sortDirection === "asc" ? (
                              <ArrowUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-1 h-4 w-4" />
                            ))}
                          {sortKey !== "isActive" && (
                            <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-4 w-full justify-center">
                              <Skeleton className="w-12 h-12" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                              </div>
                              <div className="hidden md:block">
                                <Skeleton className="h-4 w-24" />
                              </div>
                              <div className="hidden md:block">
                                <Skeleton className="h-4 w-20" />
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />{" "}
                              Obteniendo productos...
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : sortedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div>
                            <div className="text-lg font-medium">
                              {items.length === 0
                                ? "No se encontraron productos"
                                : "No hay productos que coincidan con los filtros"}
                            </div>
                            <div className="text-sm text-muted-foreground mt-2">
                              {items.length === 0
                                ? "Intenta limpiar la búsqueda o agrega un nuevo producto."
                                : "Intenta ajustar los filtros o limpiar la búsqueda."}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedProducts.map((product: Product) => {
                        const coverImages = product.coverImages || [];
                        const imageUrl = coverImages[0]?.url || "";

                        let priceDisplay: string | JSX.Element = "";
                        if (product.variants && product.variants.length > 0) {
                          const variantPrices = product.variants
                            .filter(
                              (v: VariantType) =>
                                v.isActive && v.prices && v.prices.length > 0,
                            )
                            .flatMap((v: VariantType) => v.prices!)
                            .map((p: PriceType) => ({
                              regular: toNumber(p.amount),
                              sale: p.saleAmount ? toNumber(p.saleAmount) : null,
                            }))
                            .filter((price) => !isNaN(price.regular));

                          if (variantPrices.length > 0) {
                            const minPrice = Math.min(
                              ...variantPrices.map((p) => p.sale ?? p.regular)
                            );
                            const defaultPriceObj =
                              product.prices?.find((p) => p.isDefault) ||
                              product.prices?.[0];
                            priceDisplay = `Desde ${formatCurrencyPrice(minPrice, defaultPriceObj?.currency ?? null)}`;
                          }
                        }

                        if (!priceDisplay) {
                          const defaultPriceObj =
                            product.prices?.find((p) => p.isDefault) ||
                            product.prices?.[0];
                          const regularPrice = toNumber(
                            defaultPriceObj?.amount ?? 0
                          );
                          const salePrice = defaultPriceObj?.saleAmount
                            ? toNumber(defaultPriceObj.saleAmount)
                            : null;
                          const currency = defaultPriceObj?.currency ?? null;

                          if (salePrice && salePrice < regularPrice) {
                            priceDisplay = (
                              <div className="flex items-center gap-2">
                                <span className="line-through text-muted-foreground text-sm">
                                  {formatCurrencyPrice(regularPrice, currency)}
                                </span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrencyPrice(salePrice, currency)}
                                </span>
                              </div>
                            );
                          } else {
                            priceDisplay = formatCurrencyPrice(
                              regularPrice,
                              currency
                            );
                          }
                        }

                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              {imageUrl ? (
                                <div className="relative w-12 h-12 overflow-hidden">
                                  <Image
                                    src={imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-muted" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              <Link
                                href={`${storeBasePath}/products/${product.id}`}
                                className="text-primary hover:underline"
                              >
                                {product.name}
                              </Link>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {product.category?.name || "N/A"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {product.subcategory?.name || "N/A"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {priceDisplay}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {product.isActive ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-700"
                                  >
                                    Activo
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Inactivo</Badge>
                                )}
                                {product.featured && <Badge>Destacado</Badge>}
                                {!product.inStock && (
                                  <Badge variant="destructive">Agotado</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={`/product/${product.slug}`}
                                  target="_blank"
                                >
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link
                                  href={`${storeBasePath}/products/${product.id}`}
                                >
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-red-600 hover:text-white text-destructive"
                                  onClick={() => {
                                    setProductToDelete(product);
                                    setDeleteFn(() => onDelete);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Eliminación</DialogTitle>
                      <DialogDescription>
                        ¿Estás seguro de que quieres eliminar &quot;
                        {productToDelete?.name}&quot;? Esta acción no se puede
                        deshacer.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          if (!productToDelete) return;
                          const deletingToastId = toast.loading(
                            "Eliminando producto...",
                          );

                          try {
                            // call AdminResource delete handler
                            if (deleteFn) await deleteFn(productToDelete.id);
                            toast.success("Producto eliminado", {
                              id: deletingToastId,
                            });
                          } catch (error) {
                            console.error(error);
                            toast.error("Error al eliminar producto", {
                              id: deletingToastId,
                            });
                          } finally {
                            setDialogOpen(false);
                            setProductToDelete(null);
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            );
          }}
        />
      </main>
    </div>
  );
}
