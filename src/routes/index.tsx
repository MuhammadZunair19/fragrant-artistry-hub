import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import {
  listProducts,
  listCollections,
} from "@/lib/products.functions";
import { ProductCard } from "@/components/products/product-card";
import { Reveal, FadeIn } from "@/components/motion/reveal";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.brand} — Cinematic compositions in extrait` },
      { name: "description", content: SITE.description },
      {
        property: "og:title",
        content: `${SITE.brand} — Cinematic compositions in extrait`,
      },
      { property: "og:description", content: SITE.description },
      { property: "og:image", content: "/images/hero-obscura.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: SITE.brand },
      { name: "twitter:description", content: SITE.description },
      { name: "twitter:image", content: "/images/hero-obscura.jpg" },
    ],
    links: [
      {
        rel: "preload",
        as: "image",
        href: "/images/hero-obscura.jpg",
        fetchPriority: "high",
      },
    ],
  }),
  loader: async () => {
    const [featured, bestSellers, collections] = await Promise.all([
      listProducts({ data: { featured: true, limit: 6 } }),
      listProducts({ data: { bestSellers: true, limit: 4 } }),
      listCollections(),
    ]);
    return { featured, bestSellers, collections };
  },
  component: HomePage,
});

function HomePage() {
  const { featured, bestSellers, collections } = Route.useLoaderData();
  const featuredCollections = (collections as import("@/lib/product-types").Collection[]).filter((c) => c.is_featured);

  return (
    <div className="bg-background text-foreground">
      {/* HERO */}
      <section className="relative h-screen min-h-[680px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-obscura.jpg"
            alt="Obscura No. IV"
            className="size-full object-cover opacity-50 animate-ink"
            fetchPriority="high"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
        </div>

        <FadeIn className="relative z-10 text-center px-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="eyebrow mb-8"
          >
            Extrait · No. IV
          </motion.p>
          <h1 className="font-display italic text-[18vw] md:text-[14vw] lg:text-[12vw] leading-[0.85] tracking-tight animate-reveal">
            Obscura
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-10 flex justify-center gap-4 md:gap-12"
          >
            <Link
              to="/fragrances/$slug"
              params={{ slug: "obscura-iv" }}
              className="px-8 md:px-10 py-3 border border-foreground/30 hover:border-foreground hover:bg-foreground hover:text-background eyebrow !tracking-[0.3em] transition-all"
            >
              Shop Fragrance
            </Link>
            <Link
              to="/fragrances"
              className="px-8 md:px-10 py-3 eyebrow !tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Discover Collection
            </Link>
          </motion.div>
        </FadeIn>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="hidden md:block absolute bottom-12 left-12 z-10"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground max-w-xs leading-relaxed">
            Top: Smoked Cardamom · Bergamot
            <br />
            Heart: Black Orchid · Cedar
            <br />
            Base: Raw Vetiver · Frankincense
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          className="hidden md:block absolute bottom-12 right-12 z-10 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
        >
          01 — Signature
        </motion.div>
      </section>

      {/* SIGNATURE EDITS — horizontal rail */}
      <section className="py-32 px-6 md:px-10 overflow-hidden">
        <div className="max-w-[2000px] mx-auto">
          <Reveal className="flex justify-between items-baseline mb-16 border-b border-border pb-8">
            <h2 className="font-display italic text-4xl md:text-6xl">
              The Signature Edits
            </h2>
            <Link
              to="/fragrances"
              className="hidden md:inline-flex items-center gap-3 eyebrow border-b border-foreground pb-1 hover:text-accent group"
            >
              View All
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </Reveal>

          <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar pb-8 snap-x snap-mandatory">
            {(featured as import("@/lib/product-types").ProductSummary[]).map((p, i: number) => (
              <Reveal key={p.id} delay={i * 0.08} className="snap-start">
                <ProductCard product={p} variant="rail" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="py-32 border-y border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <Reveal>
            <p className="eyebrow !text-accent mb-6">Curation</p>
            <h2 className="font-display italic text-4xl md:text-6xl mb-16">
              Maisons & Collections
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {featuredCollections.map((c, i: number) => (
              <Reveal key={c.id} delay={i * 0.1}>
                <Link
                  to="/collections/$slug"
                  params={{ slug: c.slug }}
                  className="group block relative aspect-[3/4] overflow-hidden bg-secondary"
                >
                  {c.hero_image && (
                    <img
                      src={c.hero_image}
                      alt={c.name}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <p className="eyebrow !text-accent mb-3">Collection</p>
                    <h3 className="font-display italic text-3xl mb-2 group-hover:text-accent transition-colors">
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed line-clamp-2">
                        {c.description}
                      </p>
                    )}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="grid grid-cols-1 md:grid-cols-12 border-b border-border">
        <Reveal className="md:col-span-7 p-10 md:p-24 md:border-r border-border">
          <p className="eyebrow !text-accent mb-12">Our Philosophy</p>
          <h2 className="font-display italic text-4xl md:text-6xl leading-[1.05] mb-12 text-balance">
            We do not create scents for others. We create atmospheres for the
            self.
          </h2>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            Our process is reductive. We strip away the commercial noise of the
            industry to find the single, violent truth of a raw ingredient.
          </p>
          <div className="mt-16 flex items-center gap-6">
            <div className="size-12 rounded-full border border-accent/30 grid place-items-center">
              <div className="size-1.5 bg-accent rounded-full animate-slow-pulse" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
              {SITE.established}
            </span>
          </div>
        </Reveal>
        <div className="md:col-span-5 min-h-[400px] md:min-h-0 grayscale hover:grayscale-0 transition-all duration-[1500ms]">
          <img
            src="/images/philosophy.jpg"
            alt="The perfumer at work"
            loading="lazy"
            width={1024}
            height={1280}
            className="size-full object-cover"
          />
        </div>
      </section>

      {/* BEST SELLERS — clean grid */}
      <section className="py-32 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-20">
            <p className="eyebrow !text-accent mb-6">Curated Favorites</p>
            <h2 className="font-display italic text-4xl md:text-6xl">
              Beloved Formulations
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {(bestSellers as import("@/lib/product-types").ProductSummary[]).map((p, i: number) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <ProductCard product={p} variant="grid" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNAL */}
      <section className="py-32 px-6 md:px-10 border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-24">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] mb-6">
              The Olfactory Record
            </p>
            <h2 className="font-display italic text-5xl md:text-7xl">
              Journal
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {JOURNAL_TEASERS.map((j, i) => (
              <Reveal key={j.title} delay={i * 0.1}>
                <Link to="/journal" className="group block cursor-pointer">
                  <div className="aspect-video overflow-hidden mb-6">
                    <img
                      src={j.image}
                      alt={j.title}
                      loading="lazy"
                      width={1024}
                      height={640}
                      className="size-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground mb-2 block uppercase tracking-[0.25em]">
                    {j.issue}
                  </span>
                  <h4 className="font-display italic text-2xl mb-3 group-hover:text-accent transition-colors">
                    {j.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {j.excerpt}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const JOURNAL_TEASERS = [
  {
    image: "/images/journal-1.jpg",
    issue: "Issue 012 — Space",
    title: "The Geometry of Stillness",
    excerpt:
      "Exploring the relationship between brutalist architecture and the scent of cold concrete.",
  },
  {
    image: "/images/journal-2.jpg",
    issue: "Issue 011 — Decay",
    title: "Ephemeral Beauty",
    excerpt:
      "A deep dive into the chemical elegance of floral rot and the perfumer's obsession with transition.",
  },
  {
    image: "/images/journal-3.jpg",
    issue: "Issue 010 — Night",
    title: "Chasing the Void",
    excerpt:
      "The challenge of capturing darkness in a bottle using rare resins and synthetic musks.",
  },
];
