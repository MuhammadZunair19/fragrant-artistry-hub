import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Reveal, FadeIn } from "@/components/motion/reveal";
import { ProductCard } from "@/components/products/product-card";
import { getBrandBySlug, listProducts } from "@/lib/products.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/maisons/$slug")({
  loader: async ({ params }) => {
    const brand = await getBrandBySlug({ data: { slug: params.slug } });
    if (!brand) throw notFound();
    const products = await listProducts({
      data: { brand: params.slug, limit: 24 },
    });
    return { brand, products };
  },
  head: ({ loaderData }) => {
    const b = loaderData?.brand;
    return {
      meta: [
        { title: `${b?.name ?? "Maison"} — ${SITE.brand}` },
        {
          name: "description",
          content: b?.tagline ?? b?.story?.slice(0, 160) ?? "",
        },
        { property: "og:title", content: `${b?.name} — ${SITE.brand}` },
        {
          property: "og:description",
          content: b?.tagline ?? b?.story?.slice(0, 160) ?? "",
        },
        {
          property: "og:image",
          content: b?.hero_image ?? "/images/philosophy.jpg",
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <p className="eyebrow mb-6">Not Found</p>
        <h1 className="font-display italic text-5xl mb-6">
          This maison is unknown to us.
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
  component: BrandPage,
});

function BrandPage() {
  const { brand, products } = Route.useLoaderData();
  return (
    <div className="pt-20">
      <section className="relative h-[60vh] min-h-[420px] flex items-end overflow-hidden">
        {brand.hero_image && (
          <img
            src={brand.hero_image}
            alt={brand.name}
            className="absolute inset-0 size-full object-cover opacity-50 animate-ink"
            width={1920}
            height={1080}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <FadeIn className="relative z-10 px-6 md:px-10 pb-16 max-w-5xl">
          <p className="eyebrow !text-accent mb-4">Maison</p>
          <h1 className="font-display italic text-5xl md:text-9xl leading-[0.85] text-balance mb-6">
            {brand.name}
          </h1>
          {brand.tagline && (
            <p className="font-display italic text-2xl text-muted-foreground">
              {brand.tagline}
            </p>
          )}
        </FadeIn>
      </section>

      {brand.story && (
        <section className="py-24 px-6 md:px-10 border-b border-border">
          <Reveal className="max-w-3xl mx-auto text-center">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {brand.story}
            </p>
          </Reveal>
        </section>
      )}

      <section className="py-24 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <Reveal className="mb-16">
            <h2 className="font-display italic text-3xl md:text-5xl">
              The Collection
            </h2>
          </Reveal>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              No fragrances yet from this maison.
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
