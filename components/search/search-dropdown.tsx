"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useDebounce } from "@/lib/hooks";

interface ProductPrice {
  id: string;
  amount: string | number;
  saleAmount?: string | number | null;
  isDefault?: boolean;
  currency?: {
    code: string;
  } | null;
}

interface ProductImage {
  url: string;
  alt?: string;
}

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  coverImages?: ProductImage[];
  prices?: ProductPrice[];
}

interface SearchDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDropdown({
  open,
  onOpenChange,
}: SearchDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setQuery(searchQuery);
    }
  }, [searchParams]);

  const { data: results, isLoading } = trpc.products.list.useQuery(
    { search: debouncedQuery, limit: "5" },
    { enabled: debouncedQuery.length > 0 && open },
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onOpenChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onOpenChange(false);
      router.push(`/?search=${encodeURIComponent(query)}`);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const handleSelectProduct = (slug: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(`/product/${slug}`);
  };

  if (!open) return null;

  return (
    <div ref={containerRef} className="relative w-72">
      <div className="relative flex items-center bg-background border border-primary/30">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className={cn(
            "pl-9 pr-10 py-2 text-sm border-none focus-visible:ring-0 focus-visible:ring-offset-0",
          )}
          placeholder="Buscar productos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {debouncedQuery && (
        <div className="absolute top-full mt-2 w-full bg-background border border-border overflow-hidden z-50">
          <div className="max-h-[400px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : results?.docs?.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No se encontraron productos.
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {results?.docs?.map((product: SearchProduct) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product.slug)}
                    className="flex items-center gap-3 p-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    <div className="relative h-10 w-10 overflow-hidden border shrink-0">
                      {product.coverImages?.[0]?.url ? (
                        <Image
                          src={product.coverImages[0].url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        $
                        {Number(
                          product.prices?.find((p) => p.isDefault)
                            ?.saleAmount ??
                          product.prices?.find((p) => p.isDefault)
                            ?.amount ??
                          0,
                        ).toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {query && !isLoading && (
              <button
                onClick={() => {
                  onOpenChange(false);
                  setQuery("");
                  router.push(`/?search=${encodeURIComponent(query)}`);
                }}
                className="mt-2 w-full bg-primary/10 p-2 text-center text-sm font-medium text-primary hover:bg-primary/20"
              >
                Ver todos los resultados para &quot;{query}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
