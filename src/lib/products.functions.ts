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

function toSummary(p: ProductRow): ProductSummary {
  const primary =
    [...p.product_images].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        a.sort_order - b.sort_order,
    )[0] ?? null;
  const prices = p.product_variants.map((v) => Number(v.price));
  const discounts = p.product_variants
    .map((v) => (v.discount_price != null ? Number(v.discount_price) : null))
    .filter((v): v is number => v != null);
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
    min_price: prices.length ? Math.min(...prices) : 0,
    min_discount_price: discounts.length ? Math.min(...discounts) : null,
    total_stock: p.product_variants.reduce((s, v) => s + v.stock, 0),
  };
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
  .inputValidator((input: unknown) => ListInput.parse(input ?? {}))
  .handler(async ({ data }): Promise<ProductSummary[]> => {
    const sb = getPublicClient();
    let q = sb.from("products").select(PRODUCT_SELECT).eq("is_active", true);
    if (data.brand) {
      const { data: b } = await sb
        .from("brands")
        .select("id")
        .eq("slug", data.brand)
        .maybeSingle();
      if (b) q = q.eq("brand_id", b.id);
    }
    if (data.family) {
      const { data: f } = await sb
        .from("fragrance_families")
        .select("id")
        .eq("slug", data.family)
        .maybeSingle();
      if (f) q = q.eq("family_id", f.id);
    }
    if (data.gender) q = q.eq("gender", data.gender);
    if (data.featured) q = q.eq("is_featured", true);
    if (data.newArrivals) q = q.eq("is_new", true);
    if (data.bestSellers) q = q.eq("is_best_seller", true);
    if (data.collection) {
      const { data: ids } = await sb
        .from("product_collections")
        .select("product_id, collections!inner(slug)")
        .eq("collections.slug", data.collection);
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
    const { data: rows, error } = await q;
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
  });

// ---------- getProductBySlug ----------
export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<ProductDetail | null> => {
    const sb = getPublicClient();
    const { data: row, error } = await sb
      .from("products")
      .select(`${PRODUCT_SELECT}, description, top_notes, heart_notes, base_notes`)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
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
  });

// ---------- listBrands / listCollections / listFamilies ----------
export const listBrands = createServerFn({ method: "GET" }).handler(
  async (): Promise<Brand[]> => {
    const sb = getPublicClient();
    const { data, error } = await sb
      .from("brands")
      .select("id, slug, name, tagline, story, hero_image")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Brand[];
  },
);

export const getBrandBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string() }).parse(input),
  )
  .handler(async ({ data }): Promise<Brand | null> => {
    const sb = getPublicClient();
    const { data: row, error } = await sb
      .from("brands")
      .select("id, slug, name, tagline, story, hero_image")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as Brand) ?? null;
  });

export const listCollections = createServerFn({ method: "GET" }).handler(
  async (): Promise<Collection[]> => {
    const sb = getPublicClient();
    const { data, error } = await sb
      .from("collections")
      .select("id, slug, name, description, hero_image, is_featured")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as Collection[];
  },
);

export const getCollectionBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string() }).parse(input),
  )
  .handler(async ({ data }): Promise<Collection | null> => {
    const sb = getPublicClient();
    const { data: row, error } = await sb
      .from("collections")
      .select("id, slug, name, description, hero_image, is_featured")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as Collection) ?? null;
  });

export const listFamilies = createServerFn({ method: "GET" }).handler(
  async (): Promise<FragranceFamily[]> => {
    const sb = getPublicClient();
    const { data, error } = await sb
      .from("fragrance_families")
      .select("id, slug, name, description")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as FragranceFamily[];
  },
);
