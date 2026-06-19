import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/products/product-card";
import {
  listBrands,
  listFamilies,
  listProducts,
} from "@/lib/products.functions";
import { SITE } from "@/lib/site";

const SearchSchema = z.object({
  brand: z.string().optional(),
  family: z.string().optional(),
  gender: z.enum(["feminine", "masculine", "unisex"]).optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "name_asc"])
    .optional(),
  newArrivals: z.boolean().optional(),
  bestSellers: z.boolean().optional(),
});

export const Route = createFileRoute("/fragrances")({
  validateSearch: (s) => SearchSchema.parse(s ?? {}),
  loaderDeps: ({ search }) => search,
  head: () => ({
    meta: [
      { title: `Fragrances — ${SITE.brand}` },
      {
        name: "description",
        content:
          "Browse the complete VÉNÉRÉ catalog of extrait and eau de parfum, with curated filters by maison, family, and gender.",
      },
      { property: "og:title", content: `Fragrances — ${SITE.brand}` },
      {
        property: "og:description",
        content:
          "The complete VÉNÉRÉ catalog — extrait and eau de parfum, curated.",
      },
    ],
  }),
  loader: async ({ deps }) => {
    const [products, brands, families] = await Promise.all([
      listProducts({ data: deps }),
      listBrands(),
      listFamilies(),
    ]);
    return { products, brands, families };
  },
  component: FragrancesPage,
});

function FragrancesPage() {
  const { products, brands, families } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  function setFilter(patch: Partial<typeof search>) {
    navigate({
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    });
  }

  const activeCount = useMemo(
    () =>
      Object.entries(search).filter(
        ([k, v]) => v != null && v !== "" && k !== "sort",
      ).length,
    [search],
  );

  return (
    <div className="pt-32 pb-24 px-6 md:px-10">
      <div className="max-w-[2000px] mx-auto">
        <Reveal className="mb-12">
          <p className="eyebrow !text-accent mb-4">The Catalog</p>
          <h1 className="font-display italic text-5xl md:text-7xl mb-4">
            Fragrances
          </h1>
          <p className="text-muted-foreground max-w-md">
            {products.length} compositions across three maisons.
          </p>
        </Reveal>

        {/* Filter bar */}
        <div className="border-y border-border py-6 mb-12 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Filter
            label="Maison"
            value={search.brand}
            options={brands.map((b) => ({ value: b.slug, label: b.name }))}
            onChange={(v) => setFilter({ brand: v })}
          />
          <Filter
            label="Family"
            value={search.family}
            options={families.map((f) => ({ value: f.slug, label: f.name }))}
            onChange={(v) => setFilter({ family: v })}
          />
          <Filter
            label="For"
            value={search.gender}
            options={[
              { value: "feminine", label: "Her" },
              { value: "masculine", label: "Him" },
              { value: "unisex", label: "Both" },
            ]}
            onChange={(v) =>
              setFilter({
                gender: v as "feminine" | "masculine" | "unisex" | undefined,
              })
            }
          />
          <Toggle
            label="New Arrivals"
            active={!!search.newArrivals}
            onChange={(b) => setFilter({ newArrivals: b || undefined })}
          />
          <Toggle
            label="Best Sellers"
            active={!!search.bestSellers}
            onChange={(b) => setFilter({ bestSellers: b || undefined })}
          />

          <div className="ml-auto flex items-center gap-6">
            {activeCount > 0 && (
              <button
                onClick={() =>
                  navigate({
                    search: { sort: search.sort },
                    replace: true,
                  })
                }
                className="eyebrow hover:text-accent"
              >
                Clear ({activeCount})
              </button>
            )}
            <Filter
              label="Sort"
              value={search.sort ?? "newest"}
              options={[
                { value: "newest", label: "Newest" },
                { value: "price_asc", label: "Price ↑" },
                { value: "price_desc", label: "Price ↓" },
                { value: "name_asc", label: "Name A–Z" },
              ]}
              onChange={(v) =>
                setFilter({
                  sort: v as
                    | "newest"
                    | "price_asc"
                    | "price_desc"
                    | "name_asc"
                    | undefined,
                })
              }
            />
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-32 text-center">
            <p className="eyebrow mb-6">No matches</p>
            <p className="font-display italic text-3xl mb-8">
              Nothing in this combination.
            </p>
            <Link
              to="/fragrances"
              className="eyebrow border-b border-foreground pb-1 hover:text-accent"
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 0.04, 0.4)}>
                <ProductCard product={p} variant="grid" />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 eyebrow hover:text-accent transition-colors"
      >
        <span className="text-muted-foreground">{label}:</span>
        <span className={current ? "text-accent" : ""}>
          {current?.label ?? "All"}
        </span>
        <span className="text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10"
            aria-hidden="true"
          />
          <div className="absolute z-20 top-full mt-3 left-0 bg-card border border-border min-w-[200px] py-2">
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-secondary"
            >
              All
            </button>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-secondary ${o.value === value ? "text-accent" : ""}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({
  label,
  active,
  onChange,
}: {
  label: string;
  active: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`eyebrow transition-colors ${active ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
    >
      {active ? "✓ " : ""}
      {label}
    </button>
  );
}
