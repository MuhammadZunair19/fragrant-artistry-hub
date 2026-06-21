import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAdmin } from "@/integrations/supabase/admin-middleware";
import type { OrderStatus } from "@/lib/account.functions";

const admin = [requireSupabaseAdmin] as const;

const Gender = z.enum(["feminine", "masculine", "unisex"]);
const OrderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
const CouponType = z.enum(["percent", "fixed"]);

const VariantInput = z.object({
  id: z.string().uuid().optional(),
  volume_ml: z.number().int().positive(),
  price: z.number().nonnegative(),
  discount_price: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative().default(0),
  low_stock_threshold: z.number().int().nonnegative().default(5),
  sku: z.string().max(80).nullable().optional(),
  is_active: z.boolean().default(true),
});

const ImageInput = z.object({
  id: z.string().uuid().optional(),
  url: z.string().min(1),
  alt: z.string().max(200).nullable().optional(),
  sort_order: z.number().int().default(0),
  is_primary: z.boolean().default(false),
});

const ProductInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  brand_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  family_id: z.string().uuid().nullable().optional(),
  gender: Gender.default("unisex"),
  tagline: z.string().max(300).nullable().optional(),
  description: z.string().nullable().optional(),
  top_notes: z.array(z.string()).default([]),
  heart_notes: z.array(z.string()).default([]),
  base_notes: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_active: z.boolean().default(true),
  collection_ids: z.array(z.string().uuid()).default([]),
  variants: z.array(VariantInput).min(1),
  images: z.array(ImageInput).default([]),
});

const BrandInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  tagline: z.string().max(300).nullable().optional(),
  story: z.string().nullable().optional(),
  hero_image: z.string().nullable().optional(),
});

const CategoryInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

const CollectionInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  hero_image: z.string().nullable().optional(),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

const CouponInput = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(2).max(40),
  type: CouponType,
  value: z.number().positive(),
  min_order: z.number().nonnegative().default(0),
  expires_at: z.string().nullable().optional(),
  usage_limit: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type AdminDashboard = {
  revenue: number;
  orderCount: number;
  productCount: number;
  customerCount: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    status: OrderStatus;
    total: number;
    created_at: string;
    customer_email: string | null;
  }>;
  topSellers: Array<{
    name: string;
    qty: number;
    revenue: number;
  }>;
  lowStock: Array<{
    id: string;
    product_name: string;
    volume_ml: number;
    stock: number;
    low_stock_threshold: number;
    sku: string | null;
  }>;
  salesByDay: Array<{ date: string; revenue: number; orders: number }>;
};

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  brand_name: string | null;
  is_active: boolean;
  is_featured: boolean;
  total_stock: number;
  min_price: number;
  variant_count: number;
  image_url: string | null;
};

export type AdminProductDetail = z.infer<typeof ProductInput> & { id: string };

function num(v: number | string | null | undefined) {
  return v == null ? 0 : Number(v);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const checkAdminAccess = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async () => ({ ok: true as const }));

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async ({ context }): Promise<AdminDashboard> => {
    const sb = context.supabase;

    const [ordersRes, productsRes, customersRes, recentRes, itemsRes, variantsRes] =
      await Promise.all([
        sb.from("orders").select("total, status, created_at"),
        sb.from("products").select("id", { count: "exact", head: true }),
        sb.from("profiles").select("id", { count: "exact", head: true }),
        sb
          .from("orders")
          .select("id, order_number, status, total, created_at, customer_email")
          .order("created_at", { ascending: false })
          .limit(8),
        sb.from("order_items").select("name_snapshot, qty, price_snapshot"),
        sb
          .from("product_variants")
          .select(
            "id, volume_ml, stock, low_stock_threshold, sku, product:products(name)",
          )
          .order("stock", { ascending: true }),
      ]);

    if (ordersRes.error) throw new Error(ordersRes.error.message);
    if (productsRes.error) throw new Error(productsRes.error.message);
    if (customersRes.error) throw new Error(customersRes.error.message);
    if (recentRes.error) throw new Error(recentRes.error.message);
    if (itemsRes.error) throw new Error(itemsRes.error.message);
    if (variantsRes.error) throw new Error(variantsRes.error.message);

    const orders = ordersRes.data ?? [];
    const activeOrders = orders.filter((o) => o.status !== "cancelled");
    const revenue = activeOrders.reduce((sum, o) => sum + num(o.total), 0);

    const sellerMap = new Map<string, { qty: number; revenue: number }>();
    for (const item of itemsRes.data ?? []) {
      const key = item.name_snapshot;
      const existing = sellerMap.get(key) ?? { qty: 0, revenue: 0 };
      existing.qty += item.qty;
      existing.revenue += num(item.price_snapshot) * item.qty;
      sellerMap.set(key, existing);
    }
    const topSellers = [...sellerMap.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const dayMap = new Map<string, { revenue: number; orders: number }>();
    for (const order of activeOrders) {
      const date = order.created_at.slice(0, 10);
      const bucket = dayMap.get(date) ?? { revenue: 0, orders: 0 };
      bucket.revenue += num(order.total);
      bucket.orders += 1;
      dayMap.set(date, bucket);
    }
    const salesByDay = [...dayMap.entries()]
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    type VariantRow = {
      id: string;
      volume_ml: number;
      stock: number;
      low_stock_threshold: number;
      sku: string | null;
      product: { name: string } | null;
    };

    const lowStock = ((variantsRes.data ?? []) as unknown as VariantRow[])
      .filter((v) => v.stock <= v.low_stock_threshold)
      .slice(0, 12)
      .map((v) => ({
        id: v.id,
        product_name: v.product?.name ?? "Unknown",
        volume_ml: v.volume_ml,
        stock: v.stock,
        low_stock_threshold: v.low_stock_threshold,
        sku: v.sku,
      }));

    return {
      revenue,
      orderCount: orders.length,
      productCount: productsRes.count ?? 0,
      customerCount: customersRes.count ?? 0,
      recentOrders: (recentRes.data ?? []).map((o) => ({
        ...o,
        total: num(o.total),
        status: o.status as OrderStatus,
      })),
      topSellers,
      lowStock,
      salesByDay,
    };
  });

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async ({ context }): Promise<AdminProductRow[]> => {
    const { data, error } = await context.supabase
      .from("products")
      .select(
        `id, slug, name, is_active, is_featured,
         brand:brands(name),
         product_variants(id, price, stock),
         product_images(url, is_primary, sort_order)`,
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    type Row = {
      id: string;
      slug: string;
      name: string;
      is_active: boolean;
      is_featured: boolean;
      brand: { name: string } | null;
      product_variants: Array<{ id: string; price: number | string; stock: number }>;
      product_images: Array<{ url: string; is_primary: boolean; sort_order: number }>;
    };

    return ((data ?? []) as unknown as Row[]).map((p) => {
      const variants = p.product_variants ?? [];
      const images = [...(p.product_images ?? [])].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      );
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand_name: p.brand?.name ?? null,
        is_active: p.is_active,
        is_featured: p.is_featured,
        total_stock: variants.reduce((s, v) => s + v.stock, 0),
        min_price: variants.length
          ? Math.min(...variants.map((v) => num(v.price)))
          : 0,
        variant_count: variants.length,
        image_url: images[0]?.url ?? null,
      };
    });
  });

export const getAdminProduct = createServerFn({ method: "GET" })
  .middleware(admin)
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }): Promise<AdminProductDetail | null> => {
    const { data: row, error } = await context.supabase
      .from("products")
      .select(
        `*, product_variants(*), product_images(*), product_collections(collection_id)`,
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    type Row = typeof row & {
      product_variants: Array<z.infer<typeof VariantInput> & { id: string }>;
      product_images: Array<z.infer<typeof ImageInput> & { id: string }>;
      product_collections: Array<{ collection_id: string }>;
    };
    const r = row as Row;

    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      brand_id: r.brand_id,
      category_id: r.category_id,
      family_id: r.family_id,
      gender: r.gender,
      tagline: r.tagline,
      description: r.description,
      top_notes: r.top_notes ?? [],
      heart_notes: r.heart_notes ?? [],
      base_notes: r.base_notes ?? [],
      is_featured: r.is_featured,
      is_new: r.is_new,
      is_best_seller: r.is_best_seller,
      is_active: r.is_active,
      collection_ids: (r.product_collections ?? []).map((pc) => pc.collection_id),
      variants: (r.product_variants ?? []).map((v) => ({
        id: v.id,
        volume_ml: v.volume_ml,
        price: num(v.price),
        discount_price: v.discount_price != null ? num(v.discount_price) : null,
        stock: v.stock,
        low_stock_threshold: v.low_stock_threshold,
        sku: v.sku,
        is_active: v.is_active,
      })),
      images: (r.product_images ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          sort_order: img.sort_order,
          is_primary: img.is_primary,
        })),
    };
  });

export const upsertAdminProduct = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) => ProductInput.parse(input))
  .handler(async ({ context, data }) => {
    const sb = context.supabase;
    const payload = {
      slug: slugify(data.slug),
      name: data.name,
      brand_id: data.brand_id ?? null,
      category_id: data.category_id ?? null,
      family_id: data.family_id ?? null,
      gender: data.gender,
      tagline: data.tagline ?? null,
      description: data.description ?? null,
      top_notes: data.top_notes,
      heart_notes: data.heart_notes,
      base_notes: data.base_notes,
      is_featured: data.is_featured,
      is_new: data.is_new,
      is_best_seller: data.is_best_seller,
      is_active: data.is_active,
    };

    let productId = data.id;
    if (productId) {
      const { error } = await sb.from("products").update(payload).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await sb
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      productId = created.id;
    }

    const existingVariants = await sb
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);
    const keepVariantIds = data.variants
      .map((v) => v.id)
      .filter((id): id is string => Boolean(id));
    const toDelete = (existingVariants.data ?? [])
      .map((v) => v.id)
      .filter((id) => !keepVariantIds.includes(id));
    if (toDelete.length) {
      const { error } = await sb.from("product_variants").delete().in("id", toDelete);
      if (error) throw new Error(error.message);
    }

    for (const variant of data.variants) {
      const vPayload = {
        product_id: productId,
        volume_ml: variant.volume_ml,
        price: variant.price,
        discount_price: variant.discount_price ?? null,
        stock: variant.stock,
        low_stock_threshold: variant.low_stock_threshold,
        sku: variant.sku ?? null,
        is_active: variant.is_active,
      };
      if (variant.id) {
        const { error } = await sb
          .from("product_variants")
          .update(vPayload)
          .eq("id", variant.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await sb.from("product_variants").insert(vPayload);
        if (error) throw new Error(error.message);
      }
    }

    const existingImages = await sb
      .from("product_images")
      .select("id")
      .eq("product_id", productId);
    const keepImageIds = data.images
      .map((i) => i.id)
      .filter((id): id is string => Boolean(id));
    const imagesToDelete = (existingImages.data ?? [])
      .map((i) => i.id)
      .filter((id) => !keepImageIds.includes(id));
    if (imagesToDelete.length) {
      const { error } = await sb.from("product_images").delete().in("id", imagesToDelete);
      if (error) throw new Error(error.message);
    }

    for (const [index, image] of data.images.entries()) {
      const imgPayload = {
        product_id: productId,
        url: image.url,
        alt: image.alt ?? null,
        sort_order: image.sort_order ?? index,
        is_primary: image.is_primary,
      };
      if (image.id) {
        const { error } = await sb
          .from("product_images")
          .update(imgPayload)
          .eq("id", image.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await sb.from("product_images").insert(imgPayload);
        if (error) throw new Error(error.message);
      }
    }

    await sb.from("product_collections").delete().eq("product_id", productId);
    if (data.collection_ids.length) {
      const { error } = await sb.from("product_collections").insert(
        data.collection_ids.map((collection_id) => ({
          product_id: productId!,
          collection_id,
        })),
      );
      if (error) throw new Error(error.message);
    }

    return { ok: true, id: productId };
  });

export const deleteAdminProduct = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAdminInventory = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("product_variants")
      .select(
        `id, volume_ml, price, stock, low_stock_threshold, sku, is_active,
         product:products(id, name, slug)`,
      )
      .order("stock", { ascending: true });
    if (error) throw new Error(error.message);

    type Row = {
      id: string;
      volume_ml: number;
      price: number | string;
      stock: number;
      low_stock_threshold: number;
      sku: string | null;
      is_active: boolean;
      product: { id: string; name: string; slug: string } | null;
    };

    return ((data ?? []) as unknown as Row[]).map((v) => ({
      ...v,
      price: num(v.price),
      product_name: v.product?.name ?? "Unknown",
      product_slug: v.product?.slug ?? "",
      is_low: v.stock <= v.low_stock_threshold,
    }));
  });

export const updateAdminVariantStock = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        stock: z.number().int().nonnegative(),
        low_stock_threshold: z.number().int().nonnegative().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("product_variants")
      .update({
        stock: data.stock,
        ...(data.low_stock_threshold != null
          ? { low_stock_threshold: data.low_stock_threshold }
          : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAdminBrands = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("brands")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertAdminBrand = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) => BrandInput.parse(input))
  .handler(async ({ context, data }) => {
    const payload = { ...data, slug: slugify(data.slug), id: undefined };
    if (data.id) {
      const { error } = await context.supabase
        .from("brands")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("brands")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteAdminBrand = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("brands").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAdminCategories = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertAdminCategory = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) => CategoryInput.parse(input))
  .handler(async ({ context, data }) => {
    const payload = { ...data, slug: slugify(data.slug), id: undefined };
    if (data.id) {
      const { error } = await context.supabase
        .from("categories")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("categories")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteAdminCategory = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAdminCollections = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("collections")
      .select("*")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertAdminCollection = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) => CollectionInput.parse(input))
  .handler(async ({ context, data }) => {
    const payload = { ...data, slug: slugify(data.slug), id: undefined };
    if (data.id) {
      const { error } = await context.supabase
        .from("collections")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("collections")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteAdminCollection = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("collections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAdminFamilies = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("fragrance_families")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware(admin)
  .validator((input: unknown) =>
    z
      .object({
        status: OrderStatusSchema.optional(),
        q: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("orders")
      .select(
        "id, order_number, status, total, created_at, customer_email, user_id",
      )
      .order("created_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    let result = (rows ?? []).map((o) => ({ ...o, total: num(o.total) }));
    if (data.q?.trim()) {
      const needle = data.q.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(needle) ||
          (o.customer_email ?? "").toLowerCase().includes(needle),
      );
    }
    return result;
  });

export const getAdminOrder = createServerFn({ method: "GET" })
  .middleware(admin)
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*), order_status_history(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", order.user_id)
      .maybeSingle();

    return {
      ...order,
      subtotal: num(order.subtotal),
      discount: num(order.discount),
      shipping: num(order.shipping),
      tax: num(order.tax),
      total: num(order.total),
      profile,
      order_items: (order.order_items ?? []).map(
        (item: { price_snapshot: number | string; [k: string]: unknown }) => ({
          ...item,
          price_snapshot: num(item.price_snapshot),
        }),
      ),
      order_status_history: order.order_status_history ?? [],
    };
  });

export const updateAdminOrderStatus = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: OrderStatusSchema,
        note: z.string().max(500).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (data.note) {
      await context.supabase.from("order_status_history").insert({
        order_id: data.id,
        status: data.status,
        note: data.note,
      });
    }
    return { ok: true };
  });

export const listAdminCustomers = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, phone, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const customers = data ?? [];
    const { data: orderCounts } = await context.supabase
      .from("orders")
      .select("user_id, total");

    const stats = new Map<string, { orders: number; spent: number }>();
    for (const order of orderCounts ?? []) {
      const bucket = stats.get(order.user_id) ?? { orders: 0, spent: 0 };
      bucket.orders += 1;
      bucket.spent += num(order.total);
      stats.set(order.user_id, bucket);
    }

    return customers.map((c) => ({
      ...c,
      order_count: stats.get(c.id)?.orders ?? 0,
      total_spent: stats.get(c.id)?.spent ?? 0,
    }));
  });

export const getAdminCustomer = createServerFn({ method: "GET" })
  .middleware(admin)
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const [profileRes, ordersRes, addressesRes] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      context.supabase
        .from("orders")
        .select("id, order_number, status, total, created_at")
        .eq("user_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("addresses")
        .select("*")
        .eq("user_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (profileRes.error) throw new Error(profileRes.error.message);
    if (ordersRes.error) throw new Error(ordersRes.error.message);
    if (addressesRes.error) throw new Error(addressesRes.error.message);
    if (!profileRes.data) return null;

    return {
      profile: profileRes.data,
      orders: (ordersRes.data ?? []).map((o) => ({ ...o, total: num(o.total) })),
      addresses: addressesRes.data ?? [],
    };
  });

export const listAdminCoupons = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((c) => ({
      ...c,
      value: num(c.value),
      min_order: num(c.min_order),
    }));
  });

export const upsertAdminCoupon = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) => CouponInput.parse(input))
  .handler(async ({ context, data }) => {
    const payload = {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      min_order: data.min_order,
      expires_at: data.expires_at ?? null,
      usage_limit: data.usage_limit ?? null,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("coupons")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("coupons")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteAdminCoupon = createServerFn({ method: "POST" })
  .middleware(admin)
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAdminTaxonomyOptions = createServerFn({ method: "GET" })
  .middleware(admin)
  .handler(async ({ context }) => {
    const [brands, categories, collections, families] = await Promise.all([
      context.supabase.from("brands").select("id, name").order("name"),
      context.supabase.from("categories").select("id, name").order("name"),
      context.supabase.from("collections").select("id, name").order("name"),
      context.supabase.from("fragrance_families").select("id, name").order("name"),
    ]);
    if (brands.error) throw new Error(brands.error.message);
    if (categories.error) throw new Error(categories.error.message);
    if (collections.error) throw new Error(collections.error.message);
    if (families.error) throw new Error(families.error.message);
    return {
      brands: brands.data ?? [],
      categories: categories.data ?? [],
      collections: collections.data ?? [],
      families: families.data ?? [],
    };
  });
