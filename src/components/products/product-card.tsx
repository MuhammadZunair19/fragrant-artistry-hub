import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import type { ProductSummary } from "@/lib/product-types";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/cart/cart-context";

export function ProductCard({
  product,
  variant = "rail",
}: {
  product: ProductSummary;
  variant?: "rail" | "grid";
}) {
  const { toggleWishlist, isWishlisted } = useCart();
  const wished = isWishlisted(product.slug);
  const widthClass = variant === "rail" ? "min-w-[300px] md:min-w-[380px]" : "";

  return (
    <div className={`group ${widthClass} space-y-5`}>
      <Link
        to="/fragrances/$slug"
        params={{ slug: product.slug }}
        className="block relative aspect-[3/4] overflow-hidden bg-card"
        aria-label={product.name}
      >
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.primary_alt ?? product.name}
            className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
            loading="lazy"
            width={1024}
            height={1366}
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        )}
        <motion.div
          initial={false}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-background/85 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-center px-10 text-left"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent mb-4">
            Composition
          </span>
          {product.tagline && (
            <p className="font-display italic text-2xl leading-snug text-balance">
              “{product.tagline}”
            </p>
          )}
        </motion.div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.is_new && (
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] bg-background/70 backdrop-blur px-2 py-1 text-accent">
              New
            </span>
          )}
          {product.is_best_seller && (
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] bg-background/70 backdrop-blur px-2 py-1">
              Best Seller
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.slug);
          }}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-4 right-4 z-10 size-9 grid place-items-center bg-background/60 backdrop-blur hover:bg-background hover:text-accent transition-colors"
        >
          <Heart
            size={14}
            className={wished ? "fill-accent text-accent" : ""}
          />
        </button>
      </Link>

      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5 truncate">
            {product.brand_name}
          </p>
          <h3 className="text-lg tracking-tight">
            <Link
              to="/fragrances/$slug"
              params={{ slug: product.slug }}
              className="hover:text-accent transition-colors"
            >
              {product.name}
            </Link>
          </h3>
        </div>
        <div className="text-right shrink-0">
          {product.min_discount_price ? (
            <>
              <span className="font-display italic text-base text-accent block">
                {formatPrice(product.min_discount_price)}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground line-through">
                {formatPrice(product.min_price)}
              </span>
            </>
          ) : (
            <span className="font-display italic text-base">
              {formatPrice(product.min_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
