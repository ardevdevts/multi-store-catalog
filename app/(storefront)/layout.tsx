import React from "react";
import "@/app/globals.css";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { Toaster } from "@/components/ui/sonner";
import { Outfit, Lobster } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { StoreThemeProvider } from "@/components/theme/store-theme-provider";
import { getSiteSettings, readSiteTheme } from "@/lib/site";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const lobster = Lobster({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lobster",
});

export const metadata = {
  description: "Catalogo de Productos",
  title: "Una Ganga",
};

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSiteSettings();
  const storeTheme = readSiteTheme(site.theme);

  return (
    <StoreThemeProvider theme={storeTheme}>
      <div
        className={`${outfit.variable} ${lobster.variable} h-full flex flex-col w-full`}
      >
        <CartProvider>
          <WishlistProvider>
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
          </WishlistProvider>
        </CartProvider>
      </div>
    </StoreThemeProvider>
  );
}