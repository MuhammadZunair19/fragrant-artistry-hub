import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type {
  Brand,
  Collection,
  FragranceFamily,
  ProductDetail,
  ProductImage,
  ProductSummary,
  Variant,
} from "./product-types";

const CATALOG_FETCH_TIMEOUT_MS = 2500;

function getPublicClient() {
  const url =
    process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient<Database>(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: async (input, init) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CATALOG_FETCH_TIMEOUT_MS);
        try {
          return await fetch(input, { ...init, signal: controller.signal });
        } finally {
          clearTimeout(timeoutId);
        }
      },
    },
  });
}

// ---------- Shared SELECT shape ----------
const PRODUCT_SELECT = `
  id, slug, name, tagline, gender,
  is_featured, is_new, is_best_seller,
  brand:brands ( slug, name ),
  family:fragrance_families ( slug, name ),
  product_images ( url, alt, sort_order, is_primary ),
  product_variants ( id, volume_ml, price, discount_price, stock )
`;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  gender: "feminine" | "masculine" | "unisex";
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  brand: { slug: string; name: string } | null;
  family: { slug: string; name: string } | null;
  product_images: Array<{
    url: string;
    alt: string | null;
    sort_order: number;
    is_primary: boolean;
  }>;
  product_variants: Array<{
    id: string;
    volume_ml: number;
    price: number | string;
    discount_price: number | string | null;
    stock: number;
  }>;
};

type FallbackProduct = ProductRow & {
  description: string | null;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  collection_slugs: string[];
};

type ProductListInput = {
  brand?: string;
  family?: string;
  gender?: "feminine" | "masculine" | "unisex";
  collection?: string;
  featured?: boolean;
  newArrivals?: boolean;
  bestSellers?: boolean;
  inStock?: boolean;
  sort: "newest" | "price_asc" | "price_desc" | "name_asc";
  limit: number;
};

const FALLBACK_BRANDS: Brand[] = [
  {
    id: "brand-venere",
    slug: "venere",
    name: "VENERE",
    tagline: "Parisian extrait, cut in shadow.",
    story:
      "The house signature: theatrical silhouettes, tactile resins, and a disciplined Parisian finish.",
    hero_image: "/images/hero-obscura.jpg",
  },
  {
    id: "brand-atelier-noir",
    slug: "atelier-noir",
    name: "Atelier Noir",
    tagline: "Smoke, skin, velvet.",
    story:
      "A nocturnal atelier devoted to intimate woods and restrained animalic warmth.",
    hero_image: "/images/philosophy.jpg",
  },
  {
    id: "brand-maison-obscura",
    slug: "maison-obscura",
    name: "Maison Obscura",
    tagline: "Florals after midnight.",
    story: "A maison of dark petals, polished musks, and rain-lit glass.",
    hero_image: "/images/journal-1.jpg",
  },
];

const FALLBACK_FAMILIES: FragranceFamily[] = [
  { id: "family-amber", slug: "amber", name: "Amber", description: "Resins, smoke, vanilla, and warm mineral glow." },
  { id: "family-floral", slug: "floral", name: "Floral", description: "Petals, powder, silk, and luminous musks." },
  { id: "family-woody", slug: "woody", name: "Woody", description: "Vetiver, cedar, sandalwood, incense, and polished darkness." },
  { id: "family-aquatic", slug: "aquatic", name: "Aquatic", description: "Rain, vapor, mineral air, and translucent woods." },
];

const FALLBACK_COLLECTIONS: Collection[] = [
  {
    id: "collection-noir-series",
    slug: "noir-series",
    name: "Noir Series",
    description: "Black-tie signatures built around smoke, amber, and lacquered woods.",
    hero_image: "/images/hero-obscura.jpg",
    is_featured: true,
  },
  {
    id: "collection-rose-after-dark",
    slug: "rose-after-dark",
    name: "Rose After Dark",
    description: "Petals, ink, powder, and the slow warmth of skin.",
    hero_image: "/images/bottle-rose.jpg",
    is_featured: true,
  },
  {
    id: "collection-mineral-light",
    slug: "mineral-light",
    name: "Mineral Light",
    description: "Rain-washed woods and transparent musks for daylight restraint.",
    hero_image: "/images/bottle-humid.jpg",
    is_featured: false,
  },
  {
    id: "collection-resin-library",
    slug: "resin-library",
    name: "Resin Library",
    description: "Amber, labdanum, benzoin, and incense in collectible concentration.",
    hero_image: "/images/bottle-resin.jpg",
    is_featured: true,
  },
];

const FALLBACK_PRODUCTS: FallbackProduct[] = [
  fallbackProduct("01", "obsidian-veil", "Obsidian Veil", "venere", "amber", "unisex", "A black amber suspended in silk smoke.", "Bergamot sparks through saffron before labdanum, smoked vanilla, and sandalwood pull the composition into a cinematic close.", ["bergamot", "saffron", "black pepper"], ["labdanum", "orris", "smoked tea"], ["vanilla resin", "sandalwood", "ambergris"], true, true, true, "/images/hero-obscura.jpg", "Obsidian Veil bottle in noir light", [[30, 145, null, 18], [50, 210, 189, 12], [100, 360, null, 6]], ["noir-series", "resin-library"]),
  fallbackProduct("02", "rose-cendre", "Rose Cendre", "maison-obscura", "floral", "unisex", "Damask rose beneath a trace of ash.", "A nocturnal rose polished with pink pepper, incense, suede, and soft musk.", ["pink pepper", "raspberry leaf", "bergamot"], ["damask rose", "incense", "iris"], ["suede", "musk", "cedar"], true, false, true, "/images/bottle-rose.jpg", "Rose Cendre perfume bottle", [[30, 125, null, 20], [50, 185, null, 11], [100, 320, 288, 4]], ["rose-after-dark"]),
  fallbackProduct("03", "vetiver-minuit", "Vetiver Minuit", "atelier-noir", "woody", "masculine", "Cold vetiver, tailored smoke.", "Grapefruit and juniper cut through Haitian vetiver, cedar, birch smoke, and mineral musk.", ["grapefruit", "juniper", "angelica"], ["haitian vetiver", "cedar", "violet leaf"], ["birch smoke", "mineral musk", "patchouli"], true, false, false, "/images/bottle-vetiver.jpg", "Vetiver Minuit perfume bottle", [[30, 135, null, 15], [50, 198, null, 9], [100, 340, null, 5]], ["noir-series"]),
  fallbackProduct("04", "amber-apparition", "Amber Apparition", "venere", "amber", "unisex", "Benzoin and gold through black glass.", "A resinous amber edit with mandarin peel, benzoin, tonka, and polished woods.", ["mandarin peel", "cardamom", "cinnamon"], ["benzoin", "labdanum", "tonka"], ["amberwood", "vanilla", "patchouli"], false, true, false, "/images/bottle-amber.jpg", "Amber Apparition perfume bottle", [[30, 138, null, 16], [50, 205, null, 10], [100, 355, null, 5]], ["resin-library"]),
  fallbackProduct("05", "humid-orchid", "Humid Orchid", "maison-obscura", "aquatic", "feminine", "Rain on white petals.", "An airy floral aquatic with pear, wet orchid, tea, transparent woods, and musk.", ["pear skin", "rain accord", "green tea"], ["white orchid", "jasmine mist", "iris water"], ["clear musk", "driftwood", "ambrette"], false, true, false, "/images/bottle-humid.jpg", "Humid Orchid perfume bottle", [[30, 118, null, 22], [50, 172, null, 14], [100, 298, null, 7]], ["mineral-light"]),
  fallbackProduct("06", "resin-archive", "Resin Archive", "atelier-noir", "amber", "unisex", "An old library of warm resins.", "Myrrh, olibanum, benzoin, and dark woods arranged with archival restraint.", ["clove", "orange wax", "black tea"], ["myrrh", "olibanum", "benzoin"], ["guaiac wood", "amber", "leather"], false, false, true, "/images/bottle-resin.jpg", "Resin Archive perfume bottle", [[30, 148, null, 12], [50, 218, null, 8], [100, 372, null, 3]], ["resin-library"]),
  fallbackProduct("07", "sintered-musk", "Sintered Musk", "venere", "woody", "unisex", "Clean metal, soft skin.", "A minimal skin scent of aldehydes, iris, clean musks, cedar, and cashmere wood.", ["aldehydes", "bergamot", "cold air"], ["iris", "violet", "rice powder"], ["white musk", "cedar", "cashmere wood"], false, false, false, "/images/bottle-sintered.jpg", "Sintered Musk perfume bottle", [[30, 112, null, 20], [50, 165, null, 15], [100, 285, null, 9]], ["mineral-light"]),
  fallbackProduct("08", "noir-bottle", "Noir Bottle", "atelier-noir", "woody", "unisex", "Ink, cedar, and candle smoke.", "A stark composition of black pepper, ink accord, cedar, incense, and dry amber.", ["black pepper", "elemi", "ink accord"], ["cedar", "incense", "cypress"], ["dry amber", "vetiver", "musk"], true, false, true, "/images/bottle-noir.jpg", "Noir Bottle perfume bottle", [[30, 140, null, 14], [50, 208, 188, 8], [100, 350, null, 4]], ["noir-series"]),
];

function fallbackProduct(
  idSuffix: string,
  slug: string,
  name: string,
  brandSlug: string,
  familySlug: string,
  gender: ProductRow["gender"],
  tagline: string,
  description: string,
  top_notes: string[],
  heart_notes: string[],
  base_notes: string[],
  is_featured: boolean,
  is_new: boolean,
  is_best_seller: boolean,
  image: string,
  imageAlt: string,
  variants: Array<[number, number, number | null, number]>,
  collection_slugs: string[],
): FallbackProduct {
  const brand = FALLBACK_BRANDS.find((item) => item.slug === brandSlug) ?? null;
  const family = FALLBACK_FAMILIES.find((item) => item.slug === familySlug) ?? null;
  const id = `00000000-0000-4000-8000-0000000000${idSuffix}`;
  return {
    id,
    slug,
    name,
    tagline,
    description,
    top_notes,
    heart_notes,
    base_notes,
    gender,
    is_featured,
    is_new,
    is_best_seller,
    brand: brand ? { slug: brand.slug, name: brand.name } : null,
    family: family ? { slug: family.slug, name: family.name } : null,
    product_images: [{ url: image, alt: imageAlt, sort_order: 0, is_primary: true }],
    product_variants: variants.map(([volume_ml, price, discount_price, stock], index) => ({
      id: `10000000-0000-4000-8000-${idSuffix.padStart(2, "0")}000000000${index + 1}`,
      volume_ml,
      price,
      discount_price,
      stock,
    })),
    collection_slugs,
  };
}

function warnCatalogFallback(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[catalog] using bundled seed data: ${message}`);
}

async function withCatalogTimeout<T>(query: PromiseLike<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Catalog request timed out")),
      CATALOG_FETCH_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([Promise.resolve(query), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function toSummary(p: ProductRow): ProductSummary {
  const primary =
    [...p.product_images].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        a.sort_order - b.sort_order,
    )[0] ?? null;
  const cheapestVariant = p.product_variants
    .map((variant) => {
      const price = Number(variant.price);
      const discount =
        variant.discount_price != null ? Number(variant.discount_price) : null;
      return {
        price,
        discount,
        effectivePrice: discount != null && discount < price ? discount : price,
      };
    })
    .sort((a, b) => a.effectivePrice - b.effectivePrice)[0];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    brand_name: p.brand?.name ?? null,
    brand_slug: p.brand?.slug ?? null,
    family_name: p.family?.name ?? null,
    family_slug: p.family?.slug ?? null,
    gender: p.gender,
    is_featured: p.is_featured,
    is_new: p.is_new,
    is_best_seller: p.is_best_seller,
    primary_image: primary?.url ?? null,
    primary_alt: primary?.alt ?? p.name,
    min_price: cheapestVariant?.price ?? 0,
    min_discount_price:
      cheapestVariant?.discount != null &&
      cheapestVariant.discount < cheapestVariant.price
        ? cheapestVariant.discount
        : null,
    total_stock: p.product_variants.reduce((s, v) => s + v.stock, 0),
  };
}

function toDetail(p: FallbackProduct): ProductDetail {
  const summary = toSummary(p);
  return {
    ...summary,
    description: p.description,
    top_notes: p.top_notes,
    heart_notes: p.heart_notes,
    base_notes: p.base_notes,
    images: p.product_images.map((img, i) => ({
      id: `${p.id}-${i}`,
      url: img.url,
      alt: img.alt,
      sort_order: img.sort_order,
      is_primary: img.is_primary,
    })),
    variants: p.product_variants.map((variant) => ({
      id: variant.id,
      volume_ml: variant.volume_ml,
      price: Number(variant.price),
      discount_price:
        variant.discount_price != null ? Number(variant.discount_price) : null,
      stock: variant.stock,
      sku: null,
    })),
  };
}

function listFallbackProducts(data: ProductListInput): ProductSummary[] {
  let products = [...FALLBACK_PRODUCTS];
  if (data.brand) products = products.filter((p) => p.brand?.slug === data.brand);
  if (data.family) products = products.filter((p) => p.family?.slug === data.family);
  if (data.gender) products = products.filter((p) => p.gender === data.gender);
  if (data.featured) products = products.filter((p) => p.is_featured);
  if (data.newArrivals) products = products.filter((p) => p.is_new);
  if (data.bestSellers) products = products.filter((p) => p.is_best_seller);
  if (data.collection) {
    products = products.filter((p) => p.collection_slugs.includes(data.collection as string));
  }

  const summaries = products.map(toSummary);
  if (data.inStock) {
    return summaries.filter((s) => s.total_stock > 0).slice(0, data.limit);
  }
  if (data.sort === "name_asc") summaries.sort((a, b) => a.name.localeCompare(b.name));
  if (data.sort === "price_asc") summaries.sort((a, b) => a.min_price - b.min_price);
  if (data.sort === "price_desc") summaries.sort((a, b) => b.min_price - a.min_price);
  return summaries.slice(0, data.limit);
}

// ---------- listProducts (with filters) ----------
const ListInput = z.object({
  brand: z.string().optional(),
  family: z.string().optional(),
  gender: z.enum(["feminine", "masculine", "unisex"]).optional(),
  collection: z.string().optional(),
  featured: z.boolean().optional(),
  newArrivals: z.boolean().optional(),
  bestSellers: z.boolean().optional(),
  inStock: z.boolean().optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "name_asc"])
    .optional()
    .default("newest"),
  limit: z.number().int().min(1).max(60).optional().default(24),
});

export const listProducts = createServerFn({ method: "GET" })
  .validator((input: unknown) => ListInput.parse(input ?? {}))
  .handler(async ({ data }): Promise<ProductSummary[]> => {
    try {
      const sb = getPublicClient();
      let q = sb.from("products").select(PRODUCT_SELECT).eq("is_active", true);
      if (data.brand) {
        const { data: b } = await withCatalogTimeout(
          sb.from("brands").select("id").eq("slug", data.brand).maybeSingle(),
        );
        if (b) q = q.eq("brand_id", b.id);
      }
      if (data.family) {
        const { data: f } = await withCatalogTimeout(
          sb
            .from("fragrance_families")
            .select("id")
            .eq("slug", data.family)
            .maybeSingle(),
        );
        if (f) q = q.eq("family_id", f.id);
      }
      if (data.gender) q = q.eq("gender", data.gender);
      if (data.featured) q = q.eq("is_featured", true);
      if (data.newArrivals) q = q.eq("is_new", true);
      if (data.bestSellers) q = q.eq("is_best_seller", true);
      if (data.collection) {
        const { data: ids } = await withCatalogTimeout(
          sb
            .from("product_collections")
            .select("product_id, collections!inner(slug)")
            .eq("collections.slug", data.collection),
        );
        const list = (ids ?? []).map((r) => r.product_id);
        if (list.length === 0) return [];
        q = q.in("id", list);
      }
      switch (data.sort) {
        case "name_asc":
          q = q.order("name", { ascending: true });
          break;
        default:
          q = q.order("created_at", { ascending: false });
      }
      q = q.limit(data.limit);
      const { data: rows, error } = await withCatalogTimeout(q);
      if (error) throw new Error(error.message);
      const summaries = (rows as unknown as ProductRow[]).map(toSummary);
      if (data.inStock) {
        return summaries.filter((s) => s.total_stock > 0);
      }
      if (data.sort === "price_asc")
        summaries.sort((a, b) => a.min_price - b.min_price);
      if (data.sort === "price_desc")
        summaries.sort((a, b) => b.min_price - a.min_price);
      return summaries;
    } catch (error) {
      warnCatalogFallback(error);
      return listFallbackProducts(data);
    }
  });

// ---------- getProductBySlug ----------
export const getProductBySlug = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ slug: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<ProductDetail | null> => {
    try {
      const sb = getPublicClient();
      const { data: row, error } = await withCatalogTimeout(
        sb
          .from("products")
          .select(`${PRODUCT_SELECT}, description, top_notes, heart_notes, base_notes`)
          .eq("slug", data.slug)
          .eq("is_active", true)
          .maybeSingle(),
      );
      if (error) throw new Error(error.message);
      if (!row) return null;
      const r = row as unknown as ProductRow & {
        description: string | null;
        top_notes: string[];
        heart_notes: string[];
        base_notes: string[];
      };
      const summary = toSummary(r);
      const images: ProductImage[] = [...r.product_images]
        .sort(
          (a, b) =>
            Number(b.is_primary) - Number(a.is_primary) ||
            a.sort_order - b.sort_order,
        )
        .map((img, i) => ({
          id: `${r.id}-${i}`,
          url: img.url,
          alt: img.alt,
          sort_order: img.sort_order,
          is_primary: img.is_primary,
        }));
      const variants: Variant[] = [...r.product_variants]
        .sort((a, b) => a.volume_ml - b.volume_ml)
        .map((v) => ({
          id: v.id,
          volume_ml: v.volume_ml,
          price: Number(v.price),
          discount_price:
            v.discount_price != null ? Number(v.discount_price) : null,
          stock: v.stock,
          sku: null,
        }));
      return {
        ...summary,
        description: r.description,
        top_notes: r.top_notes ?? [],
        heart_notes: r.heart_notes ?? [],
        base_notes: r.base_notes ?? [],
        images,
        variants,
      };
    } catch (error) {
      warnCatalogFallback(error);
      const product = FALLBACK_PRODUCTS.find((p) => p.slug === data.slug);
      return product ? toDetail(product) : null;
    }
  });

// ---------- listBrands / listCollections / listFamilies ----------
export const listBrands = createServerFn({ method: "GET" }).handler(
  async (): Promise<Brand[]> => {
    try {
      const sb = getPublicClient();
      const { data, error } = await withCatalogTimeout(
        sb.from("brands").select("id, slug, name, tagline, story, hero_image").order("name"),
      );
      if (error) throw new Error(error.message);
      return (data ?? []) as Brand[];
    } catch (error) {
      warnCatalogFallback(error);
      return FALLBACK_BRANDS;
    }
  },
);

export const getBrandBySlug = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ slug: z.string() }).parse(input),
  )
  .handler(async ({ data }): Promise<Brand | null> => {
    try {
      const sb = getPublicClient();
      const { data: row, error } = await withCatalogTimeout(
        sb
          .from("brands")
          .select("id, slug, name, tagline, story, hero_image")
          .eq("slug", data.slug)
          .maybeSingle(),
      );
      if (error) throw new Error(error.message);
      return (row as Brand) ?? null;
    } catch (error) {
      warnCatalogFallback(error);
      return FALLBACK_BRANDS.find((brand) => brand.slug === data.slug) ?? null;
    }
  });

export const listCollections = createServerFn({ method: "GET" }).handler(
  async (): Promise<Collection[]> => {
    try {
      const sb = getPublicClient();
      const { data, error } = await withCatalogTimeout(
        sb
          .from("collections")
          .select("id, slug, name, description, hero_image, is_featured")
          .order("sort_order"),
      );
      if (error) throw new Error(error.message);
      return (data ?? []) as Collection[];
    } catch (error) {
      warnCatalogFallback(error);
      return FALLBACK_COLLECTIONS;
    }
  },
);

export const getCollectionBySlug = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ slug: z.string() }).parse(input),
  )
  .handler(async ({ data }): Promise<Collection | null> => {
    try {
      const sb = getPublicClient();
      const { data: row, error } = await withCatalogTimeout(
        sb
          .from("collections")
          .select("id, slug, name, description, hero_image, is_featured")
          .eq("slug", data.slug)
          .maybeSingle(),
      );
      if (error) throw new Error(error.message);
      return (row as Collection) ?? null;
    } catch (error) {
      warnCatalogFallback(error);
      return FALLBACK_COLLECTIONS.find((collection) => collection.slug === data.slug) ?? null;
    }
  });

export const listFamilies = createServerFn({ method: "GET" }).handler(
  async (): Promise<FragranceFamily[]> => {
    try {
      const sb = getPublicClient();
      const { data, error } = await withCatalogTimeout(
        sb.from("fragrance_families").select("id, slug, name, description").order("name"),
      );
      if (error) throw new Error(error.message);
      return (data ?? []) as FragranceFamily[];
    } catch (error) {
      warnCatalogFallback(error);
      return FALLBACK_FAMILIES;
    }
  },
);
