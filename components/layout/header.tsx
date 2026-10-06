"use client";

import { Search } from "lucide-react";
import { ShoppingCartSheet } from "@/components/cart/shopping-cart-sheet";
import { WishlistSheet } from "@/components/wishlist/wishlist-sheet";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/layout/logo";
import { SearchDialog } from "@/components/search/search-dialog";
import { SearchDropdown } from "@/components/search/search-dropdown";
import Link from "next/link";

export const Header = ({ storeName }: { storeName?: string }) => {
  const searchParams = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);

  const searchQuery = searchParams.get("search") || "";

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
      <div className="relative flex flex-row h-16 items-center justify-between px-4 md:px-6 py-3 md:py-0 gap-4 bg-primary/30">
        <div className="flex items-center gap-4 flex-1"> 
          <Link href="/" className="flex flex-row cursor-pointer items-center gap-2">
            <div className="h-10 w-10 shrink-0">
              <Logo
                className="h-full w-full object-contain"
                aria-label="Una Ganga logo"
                width={64}
                height={64}
              />
            </div>
            <p>{storeName}</p>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4 md:ml-auto">
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="hidden md:block w-72">
            {!desktopSearchOpen ? (
              <div
                onClick={() => setDesktopSearchOpen(true)}
                className="relative flex items-center w-72 bg-background border border-primary/30 cursor-text hover:border-primary/50 transition-colors"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <span className="pl-9 pr-4 py-2 text-sm text-muted-foreground w-full truncate">
                  {searchQuery || "Buscar..."}
                </span>
              </div>
            ) : (
              <SearchDropdown
                open={desktopSearchOpen}
                onOpenChange={setDesktopSearchOpen}
              />
            )}
          </div>

          <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

          <div className="flex items-center gap-2">
            <WishlistSheet />
            <ShoppingCartSheet />
          </div>
        </div>
      </div>
    </header>
  );
};