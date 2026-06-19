import { createFileRoute } from "@tanstack/react-router";
import { Reveal, FadeIn } from "@/components/motion/reveal";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: `Journal — ${SITE.brand}` },
      {
        name: "description",
        content:
          "The Olfactory Record. Essays on raw materials, atmospheres, and the architecture of scent.",
      },
      { property: "og:title", content: `Journal — ${SITE.brand}` },
      {
        property: "og:description",
        content:
          "The Olfactory Record. Essays on raw materials, atmospheres, and the architecture of scent.",
      },
      { property: "og:image", content: "/images/journal-1.jpg" },
    ],
  }),
  component: JournalPage,
});

const ENTRIES = [
  {
    image: "/images/journal-1.jpg",
    issue: "Issue 012 — Space",
    title: "The Geometry of Stillness",
    excerpt:
      "On the relationship between brutalist architecture and the scent of cold concrete. A long-form meditation on absence.",
  },
  {
    image: "/images/journal-2.jpg",
    issue: "Issue 011 — Decay",
    title: "Ephemeral Beauty",
    excerpt:
      "The chemical elegance of floral rot and the perfumer's obsession with the moment between bloom and ruin.",
  },
  {
    image: "/images/journal-3.jpg",
    issue: "Issue 010 — Night",
    title: "Chasing the Void",
    excerpt:
      "The challenge of capturing darkness in a bottle using rare resins, animalic accords, and synthetic musks.",
  },
];

function JournalPage() {
  return (
    <div className="pt-32 pb-24 px-6 md:px-10">
      <FadeIn className="max-w-7xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] mb-6">
          The Olfactory Record
        </p>
        <h1 className="font-display italic text-6xl md:text-8xl mb-20">
          Journal
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {ENTRIES.map((j, i) => (
            <Reveal key={j.title} delay={i * 0.1}>
              <article className="group cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden mb-6">
                  <img
                    src={j.image}
                    alt={j.title}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="size-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                  />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground mb-2 block uppercase tracking-[0.25em]">
                  {j.issue}
                </span>
                <h2 className="font-display italic text-3xl mb-4 group-hover:text-accent transition-colors">
                  {j.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {j.excerpt}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}
