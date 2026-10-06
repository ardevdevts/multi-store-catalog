"use client";
import { Heart, ChevronLeft, ChevronRight, ShoppingCart, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  formatPrice as formatCurrencyPrice,
  type Currency,
} from "@/lib/currency-client";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { openWhatsApp, type WhatsAppItem } from "@/lib/whatsapp";
import { useStoreBranding } from "@/components/theme/store-theme-provider";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: number | string;
  name: string;
  description: string;
  price: number;
  regularPrice?: number;
  currency?: Currency | string | null;
  image: string;
  imageAlt?: string;
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  slug: string;
  featured?: boolean;
  inStock?: boolean;
  unit?: string;
  weight?: number;
  weightUnit?: string;
  volume?: number;
  volumeUnit?: string;
  pricePrefix?: string;
}

export const ProductCard = ({
  id,
  name,
  description,
  price,
  regularPrice,
  currency,
  image,
  imageAlt,
  images,
  slug,
  featured = false,
  inStock = true,
  unit,
  weight,
  weightUnit,
  volume,
  volumeUnit,
  pricePrefix,
}: ProductCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addItem, updateQuantity, items } = useCart();
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlist();
  const branding = useStoreBranding();
  const isMobile = useIsMobile();

  const imageList =
    images && images.length > 0
      ? images
      : [{ url: image, alt: imageAlt || name }];

  const hasMultipleImages = imageList.length > 1;

  // Obtener la cantidad actual del producto en el carrito
  const cartItem = items.find((item) => item.id === id);
  const quantityInCart = cartItem?.quantity || 0;

  const hasDiscount = regularPrice && regularPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((regularPrice - price) / regularPrice) * 100)
    : 0;
  const displayDiscount = discountPercentage >= 1;
  const normalizedCurrency = currency ?? null;
  const currencyCode =
    typeof normalizedCurrency === "string"
      ? /^[A-Za-z]{3}$/.test(normalizedCurrency)
        ? normalizedCurrency.toUpperCase()
        : null
      : normalizedCurrency?.code ?? null;

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      image,
      slug,
    });
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddToCart();
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? imageList.length - 1 : prevIndex - 1,
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === imageList.length - 1 ? 0 : prevIndex + 1,
    );
  };

  const handleDotClick = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(id)) {
      removeFromWishlist(id);
    } else {
      addToWishlist({
        id,
        name,
        price,
        image,
        slug,
      });
    }
  };

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const whatsappItem: WhatsAppItem = {
      name,
      quantity: 1,
      price,
      currency,
    };
    openWhatsApp([whatsappItem], price, currency, branding);
  };

  const handleRemoveFromCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(id, 0);
  }

  const currentImage = imageList[currentImageIndex];

  return (
    <Link
      href={`/product/${slug}`}
      className="block h-full"
    >
      <Card className={`group overflow-hidden border-border py-0 h-full flex flex-col ${isMobile ? "bg-card transition-all duration-200 gap-0" : "bg-card transition-all duration-300 hover:-translate-y-1"}`}>
        <div className={isMobile ? "relative w-full aspect-4/3" : "relative aspect-square"}>
          <div className={`relative overflow-hidden bg-secondary ${isMobile ? "w-full h-full" : "w-full h-full"}`}>
            {currentImage?.url ? (
              <Image
                src={currentImage.url}
                alt={currentImage.alt || name}
                className={`${isMobile ? "object-cover" : "object-contain transition-opacity duration-300"}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <span className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}>
                  Sin imagen
                </span>
              </div>
            )}
          </div>

          {/* Navigation Arrows - Only show on desktop if multiple images */}
          {!isMobile && hasMultipleImages && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-card/90 backdrop-blur-sm hover:bg-card opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-4 w-4 text-card-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-card/90 backdrop-blur-sm hover:bg-card opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-4 w-4 text-card-foreground" />
              </Button>
            </>
          )}

          {/* Image Indicators */}
          {hasMultipleImages && (
            <div className={`absolute left-1/2 -translate-x-1/2 flex z-10 ${isMobile ? "bottom-4 gap-1" : "bottom-5 gap-1.5"}`}>
              {imageList.map((_, index) => (
                isMobile ? (
                  <div
                    key={index}
                    className={`transition-all ${index === currentImageIndex
                      ? "bg-white w-3 h-1.5"
                      : "bg-white/50 w-1.5 h-1.5"
                      }`}
                  />
                ) : (
                  <button
                    key={index}
                    onClick={handleDotClick(index)}
                    className={`transition-all ${index === currentImageIndex
                      ? "bg-card w-6 h-2"
                      : "bg-card/50 hover:bg-card/75 w-2 h-2"
                      }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  />
                )
              ))}
            </div>
          )}

          {/* Badges - Desktop only shows on top-left */}
          {!isMobile && (
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
              {featured && (
                <Badge className="bg-accent text-accent-foreground">
                  Destacado
                </Badge>
              )}
              {displayDiscount && (
                <Badge className="bg-destructive/70 text-destructive-foreground">
                  -{discountPercentage}%
                </Badge>
              )}
              {!inStock && (
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground"
                >
                  Agotado
                </Badge>
              )}
            </div>
          )}

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-3 right-3 bg-transparent hover:bg-card/60 transition-all ${isMobile ? "h-7 w-7 transition-colors" : "opacity-0 group-hover:opacity-100 h-8 w-8"} ${isInWishlist(id)
              ? "text-destructive"
              : "text-muted-foreground hover:text-destructive"
              }`}
            onClick={handleToggleWishlist}
          >
            <Heart
              className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} ${isInWishlist(id) ? "fill-current" : "stroke-2"}`}
            />
          </Button>
        </div>

        <CardContent className={isMobile ? "p-3 flex flex-col gap-2" : "p-0 flex-1 flex flex-col"}>
          <div className={isMobile ? "flex flex-col gap-1.5" : "px-4 flex flex-col flex-1 space-y-1.5"}>
            {/* Badges - Mobile only shows in content */}
            {isMobile && (
              <div className="h-5">
                {(featured || hasDiscount || !inStock) && (
                  <div className="flex flex-wrap gap-1.5">
                    {featured && (
                      <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5 h-5">
                        Destacado
                      </Badge>
                    )}
                    {displayDiscount && (
                      <Badge className="bg-destructive/70 text-destructive-foreground text-[10px] px-2 py-0.5 h-5">
                        -{discountPercentage}%
                      </Badge>
                    )}
                    {!inStock && (
                      <Badge
                        variant="secondary"
                        className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 h-5"
                      >
                        Agotado
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className={isMobile ? "" : "space-y-1"}>
              <p className={`font-bold text-card-foreground leading-tight ${isMobile ? "text-base line-clamp-2" : "text-xl line-clamp-1 group-hover:text-primary transition-colors"}`}>
                {name}
              </p>
              {!isMobile && description && (
                <p className="text-md text-muted-foreground line-clamp-1 leading-tight">
                  {description}
                </p>
              )}
            </div>

            <div className={isMobile ? "flex flex-col" : "flex flex-col gap-1.5 mt-auto"}>
              <div className="flex flex-col">
                {(unit || weight || volume) && (
                  <div className="text-xs text-muted-foreground flex flex-row items-center gap-1 line-clamp-1 leading-relaxed">
                    {unit && (
                      <span>
                        {unit.replace(/^(\d+)(\w)$/, "$1 $2")} unidades{(weight || volume) && " de"}
                      </span>
                    )}
                    {(weight || volume) && (
                      <span>
                        {weight
                          ? `${weight} ${weightUnit || "g"}`
                          : `${volume} ${volumeUnit || "ml"}`}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-baseline gap-4">
                  <span className={`font-bold text-primary ${isMobile ? "text-lg" : "text-xl"}`}>
                    {pricePrefix && (
                      <span className="text-xs font-normal text-muted-foreground mr-1">
                        {pricePrefix}
                      </span>
                    )}
                    {formatCurrencyPrice(price, normalizedCurrency)}
                    {currencyCode && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        {currencyCode}
                      </span>
                    )}
                    {hasDiscount && regularPrice && (
                      <span className="text-xs text-muted-foreground line-through ml-2">
                        {formatCurrencyPrice(regularPrice, normalizedCurrency)}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(isMobile ? "pt-2" : "px-4 pb-4", "w-full")}>
            {quantityInCart > 0 && inStock ? (
              isMobile ? (
                <div className="flex flex-row w-full">
                  <QuantityPicker
                  value={quantityInCart}
                  onChange={(val) => updateQuantity(id, val)}
                  min={0}
                  size="sm"
                  className="w-full" />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveFromCart}
                    className="h-8 w-8 shrink-0 ml-2"
                  >
                    <Trash2 className="h-8 w-8" />
                  </Button>
                  </div>
              ) : (
                <div className="flex flex-row w-full">
                  <QuantityPicker
                    value={quantityInCart}
                    onChange={(val) => updateQuantity(id, val)}
                    min={0}
                    size="default"
                    className="w-full"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleRemoveFromCart}
                    className="h-10 w-10 shrink-0 ml-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              )
            ) : inStock ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className={`bg-accent hover:bg-accent/80 text-primary font-bold flex items-center justify-center active:bg-accent/70 transition-all duration-200 h-10 ${isMobile ? "px-2 py-3 text-sm" : "px-3 py-3 text-sm hover:shadow-md active:scale-95 shadow-sm"}`}
                  onClick={handleAddToCartClick}
                >
                  <ShoppingCart className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
                  {isMobile && ""}
                  {!isMobile && "Agregar"}
                </Button>
                <Button
                  className={`bg-primary hover:bg-primary/80 text-primary-foreground font-bold flex items-center justify-center active:bg-primary/90 transition-all duration-200 h-10 ${isMobile ? "px-2 py-3 text-sm" : "px-3 py-3 text-sm hover:shadow-md active:scale-95 shadow-sm"}`}
                  onClick={handleWhatsAppOrder}
                >
                  <MessageCircle className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
                  {isMobile && ""}
                  {!isMobile && "Ordenar"}
                </Button>
              </div>
            ) : (
              <Button
                className={`w-full bg-muted text-muted-foreground font-medium h-10 ${isMobile ? "px-3 py-3 text-sm" : "px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100"}`}
                disabled
              >
                Agotado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
