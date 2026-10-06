"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "@/components/utils/image-gallery";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { formatPrice as formatCurrencyPrice } from "@/lib/currency-client";
import { toNumber } from "@/lib/number";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { ShoppingCart, Trash2 } from "lucide-react";

interface Variant {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  isActive: boolean;
  image?: string;
  images?: ImageData[];
  prices: Price[];
}

interface Price {
  amount: number | string;
  saleAmount?: number | string;
  currency: string | null;
  isDefault?: boolean;
  taxIncluded?: boolean;
}

interface Specifications {
  sku?: string;
  unit?: string;
  weight?: string | number;
  weightUnit?: string;
  volume?: string | number;
  volumeUnit?: string;
  dimensions?: {
    length: string | number;
    width: string | number;
    height: string | number;
    unit?: string;
  };
  sizes?: Array<{
    size: string;
    inStock: boolean;
  }>;
}

interface ImageData {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  featured?: boolean;
  inStock: boolean;
  coverImages?: ImageData[];
  variants?: Variant[];
  prices: Price[];
  specifications?: Specifications;
}

interface ProductDetailClientProps {
  product: Product;
}

// Helper to get default variant ID
function getDefaultVariantId(variants?: Variant[]): string | null {
  if (!variants || variants.length === 0) return null;

  const inStockVariant = variants.find((v) => v.stock > 0 && v.isActive);
  return inStockVariant ? inStockVariant.id : variants[0].id;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem, removeItem, updateQuantity, getItemQuantity, isInCart } = useCart();

  // Initialize with default variant using lazy initialization
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() =>
    getDefaultVariantId(product.variants)
  );

  const selectedVariant = selectedVariantId
    ? product.variants?.find((v) => v.id === selectedVariantId)
    : null;

  // Determine display values based on selection or default product data
  const currentData = selectedVariant || product;

  // Helper to parse prices
  const parseNumeric = (raw: number | string) => toNumber(raw);

  // Get price for the current selection
  // If variant selected, use its price. If not, use product default price.
  const getPriceData = () => {
    const prices = currentData.prices || [];
    const defaultPriceObj = prices.find((p) => p.isDefault) || prices[0];

    if (!defaultPriceObj)
      return {
        price: 0,
        regularPrice: undefined,
        currency: null,
        taxIncluded: true,
      };

    const price = parseNumeric(
      defaultPriceObj.saleAmount ?? defaultPriceObj.amount,
    );
    const regularPrice = defaultPriceObj.saleAmount
      ? parseNumeric(defaultPriceObj.amount)
      : undefined;

    return {
      price,
      regularPrice,
      currency: defaultPriceObj.currency,
      taxIncluded: defaultPriceObj.taxIncluded ?? true,
    };
  };

  const { price, regularPrice, currency } = getPriceData();
  const hasDiscount = regularPrice !== undefined && regularPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((regularPrice! - price) / regularPrice!) * 100)
    : 0;

  // Images
  // Priority: variant images array > variant single image > product images
  const productImages = product.coverImages || [];

  let allImages = productImages;
  if (selectedVariant) {
    const variantImages = selectedVariant.images || [];
    if (variantImages.length > 0) {
      allImages = variantImages;
    } else if (selectedVariant.image) {
      allImages = [
        {
          url: selectedVariant.image,
          alt: selectedVariant.name,
          isPrimary: true,
        },
        ...productImages,
      ];
    }
  }

  const primaryImageUrl = allImages[0]?.url || "";
  const primaryImageAlt = allImages[0]?.alt || product.name;

  // Stock
  const inStock = selectedVariant
    ? selectedVariant.stock > 0 && selectedVariant.isActive
    : product.inStock;

  // Specifications
  const specifications = product.specifications;

  // Handle variant selection
  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
  };

  // Cart integration
  const currentProductId = selectedVariant ? selectedVariant.id : product.id;
  const quantityInCart = getItemQuantity(currentProductId);
  const productInCart = isInCart(currentProductId);

  const handleAddToCart = () => {
    addItem({
      id: currentProductId,
      name: product.name,
      price,
      image: primaryImageUrl,
      slug: product.slug,
      variantName: selectedVariant?.name,
      currency,
    });
  };

  const handleRemoveFromCart = () => {
    removeItem(currentProductId);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(currentProductId);
    } else {
      updateQuantity(currentProductId, newQuantity);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 mb-16">
      {/* Image Gallery */}
      <ImageGallery
        images={allImages}
        productName={product.name}
        primaryImageUrl={primaryImageUrl}
        primaryImageAlt={primaryImageAlt}
      />

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <p className="text-3xl font-bold text-foreground mb-2">
            {product.name}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {selectedVariant?.sku ? (
              <span>SKU: {selectedVariant.sku}</span>
            ) : specifications?.sku ? (
              <span>SKU: {specifications.sku}</span>
            ) : null}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {product.featured && (
            <Badge className="bg-accent text-accent-foreground">
              Destacado
            </Badge>
          )}
          {hasDiscount && discountPercentage > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              -{discountPercentage}% descuento
            </Badge>
          )}
          {inStock ? (
            <Badge
              variant="outline"
              className="border-secondary text-secondary-foreground"
            >
              En stock
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground"
            >
              Agotado
            </Badge>
          )}
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-primary">
              {formatCurrencyPrice(price, currency)}
            </span>
            {hasDiscount && (
              <span className="text-xl text-muted-foreground line-through">
                {formatCurrencyPrice(regularPrice!, currency)}
              </span>
            )}
          </div>
          {(specifications?.unit ||
            specifications?.weight ||
            specifications?.volume) && (
              <div className="text-base text-muted-foreground flex flex-col gap-0.5 leading-none">
                {specifications?.unit && (
                  <span>
                    {specifications.unit.replace(/^(\d+).*$/, "$1")} unidades
                  </span>
                )}
                {(specifications?.weight || specifications?.volume) && (
                  <span>
                    {specifications.weight
                      ? `${specifications.weight} ${specifications.weightUnit || "g"}`
                      : `${specifications.volume} ${specifications.volumeUnit || "ml"}`}
                  </span>
                )}
              </div>
            )}
          {/* {taxIncluded && (
                        <p className="text-sm text-muted-foreground">Impuestos incluidos</p>
                    )} */}
        </div>

        {/* Variants Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Opciones:</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantChange(variant.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm border transition-all hover:border-primary",
                    selectedVariantId === variant.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                      : "border-input bg-background",
                    (!variant.isActive || variant.stock <= 0) &&
                    "opacity-50 cursor-not-allowed bg-muted",
                  )}
                  disabled={!variant.isActive || variant.stock <= 0}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-muted-foreground leading-relaxed">
            {product.shortDescription}
          </p>
        )}

        {/* Sizes (Legacy from specifications) - Only show if no variants */}
        {(!product.variants || product.variants.length === 0) &&
          specifications?.sizes &&
          specifications.sizes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Tallas disponibles:
              </p>
              <div className="flex flex-wrap gap-2">
                {specifications.sizes.map((sizeObj, idx: number) => (
                  <Badge
                    key={idx}
                    variant={sizeObj.inStock ? "outline" : "secondary"}
                    className={!sizeObj.inStock ? "opacity-50" : ""}
                  >
                    {sizeObj.size}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {/* Dimensions */}
        {specifications?.dimensions?.length && (
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-1 text-foreground">Dimensiones:</p>
            <p>
              {specifications.dimensions.length} x{" "}
              {specifications.dimensions.width} x{" "}
              {specifications.dimensions.height}{" "}
              {specifications.dimensions.unit || "cm"}
            </p>
          </div>
        )}

        {/* Weight */}
        {specifications?.weight && (
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-1 text-foreground">Peso:</p>
            <p>
              {specifications.weight} {specifications.weightUnit || "g"}
            </p>
          </div>
        )}

        {/* Add to Cart / Quantity Controls */}
        <div className="space-y-3">
          {productInCart ? (
            <>
              <div className="flex items-center gap-2">
                <QuantityPicker
                  value={quantityInCart}
                  onChange={handleQuantityChange}
                  min={1}
                  max={100}
                  className="flex-1"
                  disabled={!inStock}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleRemoveFromCart}
                  className="h-10 w-10 shrink-0"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {quantityInCart} {quantityInCart === 1 ? 'unidad' : 'unidades'} en el carrito
              </p>
            </>
          ) : (
            <Button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {inStock ? 'Agregar al carrito' : 'Agotado'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
