import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Reveal, FadeIn } from "@/components/motion/reveal";
import { ProductCard } from "@/components/products/product-card";
import { listProducts } from "@/lib/products.functions";
import { useCart } from "@/components/cart/cart-context";
import { SITE } from "@/lib/site";
import type { ProductSummary } from "@/lib/product-types";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: `Wishlist — ${SITE.brand}` },
      {
        name: "description",
        content:
          "The compositions you've set aside. Saved locally; sign in soon to sync across devices.",
      },
      { property: "og:title", content: `Wishlist — ${SITE.brand}` },
    ],
  }),
  loader: async () => {
    // Load all products; we filter client-side from the localStorage wishlist
    const products = await listProducts({ data: { limit: 60 } });
    return { products };
  },
  component: WishlistPage,
});

function WishlistPage() {
  const { products } = Route.useLoaderData();
  const { wishlist } = useCart();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const items: ProductSummary[] = hydrated
    ? products.filter((p) => wishlist.includes(p.slug))
    : [];

  return (
    <div className="pt-32 pb-24 px-6 md:px-10">
      <FadeIn className="max-w-7xl mx-auto">
        <p className="eyebrow !text-accent mb-4">Saved</p>
        <h1 className="font-display italic text-5xl md:text-7xl mb-12">
          Wishlist
        </h1>

        {!hydrated ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto">
            <p className="font-display italic text-3xl mb-6">
              Nothing set aside yet.
            </p>
            <p className="text-muted-foreground mb-8">
              Tap the heart on any fragrance to add it here.
            </p>
            <Link
              to="/fragrances"
              className="eyebrow border-b border-foreground pb-1 hover:text-accent"
            >
              Browse Fragrances
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
            {items.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.04}>
                <ProductCard product={p} variant="grid" />
              </Reveal>
            ))}
          </div>
        )}
      </FadeIn>
    </div>
  );
}
