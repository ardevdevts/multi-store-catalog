"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useDebounce } from "@/lib/hooks";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({
  open,
  onOpenChange,
}: SearchDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <SearchDialogContent open={open} onOpenChange={onOpenChange} />
  );
}

function SearchDialogContent({
  open,
  onOpenChange,
}: SearchDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setQuery(searchQuery);
    }
  }, [searchParams]);

  const { data: results, isLoading } = trpc.products.list.useQuery(
    { search: debouncedQuery, limit: "5" },
    { enabled: open && debouncedQuery.length > 0 },
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onOpenChange(false);
      router.push(`/?search=${encodeURIComponent(query)}`);
    }
  };

  const handleSelectProduct = (slug: string) => {
    onOpenChange(false);
    router.push(`/product/${slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[550px] p-0 gap-0 overflow-hidden top-[5%]! translate-y-0!"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Buscar productos</DialogTitle>
        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            className={cn(
              "flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus-visible:ring-0",
            )}
            placeholder="Buscar productos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="ml-2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {debouncedQuery && (
          <div className="max-h-[300px] overflow-y-auto p-2">
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
                {results?.docs?.map((product: any) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product.slug)}
                    className="flex items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded-md border">
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
                          product.prices?.find((p: any) => p.isDefault)
                            ?.saleAmount ??
                          product.prices?.find((p: any) => p.isDefault)
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
                  router.push(`/?search=${encodeURIComponent(query)}`);
                }}
                className="mt-2 w-full rounded-md bg-primary/10 p-2 text-center text-sm font-medium text-primary hover:bg-primary/20"
              >
                Ver todos los resultados para &quot;{query}&quot;
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
