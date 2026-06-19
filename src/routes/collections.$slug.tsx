import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Reveal, FadeIn } from "@/components/motion/reveal";
import { ProductCard } from "@/components/products/product-card";
import {
  getCollectionBySlug,
  listProducts,
} from "@/lib/products.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ params }) => {
    const collection = await getCollectionBySlug({
      data: { slug: params.slug },
    });
    if (!collection) throw notFound();
    const products = await listProducts({
      data: { collection: params.slug, limit: 24 },
    });
    return { collection, products };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.collection;
    return {
      meta: [
        { title: `${c?.name ?? "Collection"} — ${SITE.brand}` },
        {
          name: "description",
          content:
            c?.description ?? `Explore the ${c?.name} collection.`,
        },
        { property: "og:title", content: `${c?.name} — ${SITE.brand}` },
        { property: "og:description", content: c?.description ?? "" },
        {
          property: "og:image",
          content: c?.hero_image ?? "/images/hero-obscura.jpg",
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <p className="eyebrow mb-6">Not Found</p>
        <h1 className="font-display italic text-5xl mb-6">
          This collection has been retired.
        </h1>
        <Link
          to="/fragrances"
          className="eyebrow border-b border-foreground pb-1 hover:text-accent"
        >
          Browse Fragrances
        </Link>
      </div>
    </div>
  ),
  component: CollectionPage,
});

function CollectionPage() {
  const { collection, products } = Route.useLoaderData();
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[420px] flex items-end overflow-hidden">
        {collection.hero_image && (
          <img
            src={collection.hero_image}
            alt={collection.name}
            className="absolute inset-0 size-full object-cover opacity-60 animate-ink"
            width={1920}
            height={1080}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <FadeIn className="relative z-10 px-6 md:px-10 pb-16 max-w-5xl">
          <p className="eyebrow !text-accent mb-4">Collection</p>
          <h1 className="font-display italic text-5xl md:text-8xl leading-[0.95] text-balance mb-6">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
              {collection.description}
            </p>
          )}
        </FadeIn>
      </section>

      <section className="py-24 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              No fragrances in this collection yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
              {(products as import("@/lib/product-types").ProductSummary[]).map((p, i: number) => (
                <Reveal key={p.id} delay={Math.min(i * 0.05, 0.4)}>
                  <ProductCard product={p} variant="grid" />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
