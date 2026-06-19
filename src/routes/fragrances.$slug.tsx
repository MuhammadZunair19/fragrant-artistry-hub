import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Heart, Check } from "lucide-react";
import { getProductBySlug, listProducts } from "@/lib/products.functions";
import { NotePyramid } from "@/components/products/note-pyramid";
import { ProductCard } from "@/components/products/product-card";
import { Reveal, FadeIn } from "@/components/motion/reveal";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/fragrances/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    const related = await listProducts({
      data: { family: product.family_slug ?? undefined, limit: 8 },
    });
    return {
      product,
      related: related.filter((r) => r.slug !== product.slug).slice(0, 4),
    };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const name = p ? `${p.name} — ${p.brand_name}` : "Fragrance";
    const desc = p?.tagline ?? p?.description?.slice(0, 160) ?? SITE.description;
    return {
      meta: [
        { title: `${name} | ${SITE.brand}` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} | ${SITE.brand}` },
        { property: "og:description", content: desc },
        {
          property: "og:image",
          content: p?.primary_image ?? "/images/hero-obscura.jpg",
        },
        { property: "og:type", content: "product" },
        { name: "twitter:title", content: name },
        { name: "twitter:description", content: desc },
        {
          name: "twitter:image",
          content: p?.primary_image ?? "/images/hero-obscura.jpg",
        },
      ],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                name: p.name,
                description: p.description,
                image: p.primary_image,
                brand: { "@type": "Brand", name: p.brand_name },
                offers: p.variants.map((v) => ({
                  "@type": "Offer",
                  price: v.discount_price ?? v.price,
                  priceCurrency: "USD",
                  availability:
                    v.stock > 0
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                })),
              }),
            },
          ]
        : [],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <p className="eyebrow mb-6">Not Found</p>
        <h1 className="font-display italic text-5xl mb-6">
          This fragrance no longer lives here.
        </h1>
        <Link
          to="/fragrances"
          className="eyebrow border-b border-foreground pb-1 hover:text-accent"
        >
          Browse All Fragrances
        </Link>
      </div>
    </div>
  );
}

function ProductPage() {
  const { product, related } = Route.useLoaderData();
  const router = useRouter();
  const { addLine, toggleWishlist, isWishlisted } = useCart();
  const wished = isWishlisted(product.slug);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[1]?.id ?? product.variants[0]?.id ?? "",
  );

  // Reset selection when the route changes
  useEffect(() => {
    setSelectedVariantId(
      product.variants[1]?.id ?? product.variants[0]?.id ?? "",
    );
  }, [product.id, product.variants]);

  const selected =
    product.variants.find((v: import("@/lib/product-types").Variant) => v.id === selectedVariantId) ??
    product.variants[0];

  const [justAdded, setJustAdded] = useState(false);
  function handleAdd() {
    if (!selected) return;
    addLine({
      variantId: selected.id,
      productSlug: product.slug,
      productName: product.name,
      brandName: product.brand_name,
      volumeMl: selected.volume_ml,
      unitPrice: selected.discount_price ?? selected.price,
      image: product.primary_image,
      qty: 1,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <div className="pt-32 pb-24 px-6 md:px-10">
      <FadeIn className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-12 eyebrow flex items-center gap-3 flex-wrap">
          <Link to="/fragrances" className="hover:text-accent">
            Fragrances
          </Link>
          <span className="text-muted-foreground">/</span>
          {product.brand_slug && (
            <>
              <Link
                to="/maisons/$slug"
                params={{ slug: product.brand_slug }}
                className="hover:text-accent"
              >
                {product.brand_name}
              </Link>
              <span className="text-muted-foreground">/</span>
            </>
          )}
          <span className="text-accent">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Imagery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-card overflow-hidden">
              {product.primary_image && (
                <img
                  src={product.primary_image}
                  alt={product.primary_alt ?? product.name}
                  width={1024}
                  height={1366}
                  className="size-full object-cover animate-ink"
                />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="lg:py-12">
            <p className="eyebrow !text-accent mb-4">{product.brand_name}</p>
            <h1 className="font-display italic text-5xl md:text-7xl leading-[0.95] mb-4 text-balance">
              {product.name}
            </h1>
            {product.tagline && (
              <p className="font-display italic text-2xl text-muted-foreground mb-10">
                {product.tagline}
              </p>
            )}

            <div className="flex flex-wrap items-baseline gap-4 mb-10">
              {selected?.discount_price ? (
                <>
                  <span className="font-display italic text-3xl text-accent">
                    {formatPrice(selected.discount_price)}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground line-through">
                    {formatPrice(selected.price)}
                  </span>
                </>
              ) : (
                <span className="font-display italic text-3xl">
                  {formatPrice(selected?.price ?? product.min_price)}
                </span>
              )}
              <span className="eyebrow ml-auto">
                {selected?.stock && selected.stock > 0
                  ? `In Stock · ${selected.stock} remaining`
                  : "Sold Out"}
              </span>
            </div>

            <div className="mb-10">
              <p className="eyebrow mb-4">Volume</p>
              <div className="flex gap-3 flex-wrap">
                {(product.variants as import("@/lib/product-types").Variant[]).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={v.stock === 0}
                    className={`px-6 py-3 border text-sm font-mono uppercase tracking-widest transition-all
                      ${
                        v.id === selectedVariantId
                          ? "border-accent text-accent"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }
                      ${v.stock === 0 ? "opacity-40 cursor-not-allowed line-through" : ""}
                    `}
                  >
                    {v.volume_ml}ml
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mb-10">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selected || selected.stock === 0}
                className="flex-1 bg-foreground text-background py-5 eyebrow !text-background !tracking-[0.3em] hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {justAdded ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={16} /> Added
                  </motion.span>
                ) : (
                  <>Add to Cart</>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.slug)}
                aria-label="Toggle wishlist"
                className="size-[60px] border border-border grid place-items-center hover:border-accent hover:text-accent transition-colors"
              >
                <Heart
                  size={18}
                  className={wished ? "fill-accent text-accent" : ""}
                />
              </button>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-12 text-lg max-w-md">
                {product.description}
              </p>
            )}

            <NotePyramid
              top={product.top_notes}
              heart={product.heart_notes}
              base={product.base_notes}
            />
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-32 pt-16 border-t border-border">
            <Reveal className="flex justify-between items-baseline mb-12">
              <h2 className="font-display italic text-3xl md:text-4xl">
                In the same family
              </h2>
              <Link
                to="/fragrances"
                className="eyebrow border-b border-foreground pb-1 hover:text-accent"
              >
                View All
              </Link>
            </Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {(related as import("@/lib/product-types").ProductSummary[]).map((r, i: number) => (
                <Reveal key={r.id} delay={i * 0.06}>
                  <ProductCard product={r} variant="grid" />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </FadeIn>
    </div>
  );
}
