import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import type { CartLine } from "@/components/cart/cart-context";

const AddressInput = z.object({
  id: z.string().uuid().optional(),
  label: z.string().max(80).optional().nullable(),
  full_name: z.string().min(2).max(120),
  line1: z.string().min(3).max(180),
  line2: z.string().max(180).optional().nullable(),
  city: z.string().min(2).max(120),
  region: z.string().max(120).optional().nullable(),
  postal_code: z.string().min(2).max(32),
  country: z.string().min(2).max(80),
  phone: z.string().max(40).optional().nullable(),
  is_default: z.boolean().optional().default(false),
});

const ProfileInput = z.object({
  full_name: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
});

const CheckoutAddressInput = AddressInput.omit({ id: true, is_default: true });

const CartLineInput = z.object({
  variantId: z.string().uuid(),
  productSlug: z.string(),
  productName: z.string(),
  brandName: z.string().nullable(),
  volumeMl: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  image: z.string().nullable(),
  qty: z.number().int().positive().max(20),
});

const CreateOrderInput = z.object({
  lines: z.array(CartLineInput).min(1),
  shipping: CheckoutAddressInput,
  billing: CheckoutAddressInput,
  couponCode: z.string().max(40).optional().nullable(),
  customerEmail: z.string().email().optional().nullable(),
});

export type AccountProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

export type Address = z.infer<typeof AddressInput> & {
  id: string;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderSummary = {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  coupon_code: string | null;
  created_at: string;
  items: Array<{
    id: string;
    variant_id: string | null;
    name_snapshot: string;
    brand_snapshot: string | null;
    volume_snapshot: number | null;
    image_snapshot: string | null;
    price_snapshot: number;
    qty: number;
  }>;
  history: Array<{
    id: string;
    status: OrderStatus;
    note: string | null;
    created_at: string;
  }>;
};

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function discountForCoupon(
  coupon: {
    type: "percent" | "fixed";
    value: number | string;
    min_order: number | string;
  } | null,
  subtotal: number,
) {
  if (!coupon) return 0;
  if (subtotal < Number(coupon.min_order)) return 0;
  if (coupon.type === "percent") {
    return money(subtotal * (Number(coupon.value) / 100));
  }
  return money(Math.min(subtotal, Number(coupon.value)));
}

export const getAccountSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: userData } = await supabase.auth.getUser();

    const [{ data: profile, error: profileError }, { data: addresses, error: addressError }] =
      await Promise.all([
        supabase.from("profiles").select("id, full_name, phone").eq("id", userId).maybeSingle(),
        supabase
          .from("addresses")
          .select("*")
          .eq("user_id", userId)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

    if (profileError) throw new Error(profileError.message);
    if (addressError) throw new Error(addressError.message);

    if (!profile) {
      const { data: inserted, error } = await supabase
        .from("profiles")
        .insert({ id: userId })
        .select("id, full_name, phone")
        .single();
      if (error) throw new Error(error.message);
      return {
        profile: {
          ...inserted,
          email: userData.user?.email ?? null,
        } satisfies AccountProfile,
        addresses: (addresses ?? []) as Address[],
      };
    }

    return {
      profile: {
        ...profile,
        email: userData.user?.email ?? null,
      } satisfies AccountProfile,
      addresses: (addresses ?? []) as Address[],
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => AddressInput.parse(input))
  .handler(async ({ context, data }) => {
    const payload = { ...data, user_id: context.userId };
    const result = data.id
      ? await context.supabase
          .from("addresses")
          .update(payload)
          .eq("id", data.id)
          .eq("user_id", context.userId)
          .select("id")
          .single()
      : await context.supabase.from("addresses").insert(payload).select("id").single();
    const { data: saved, error } = result;
    if (error) throw new Error(error.message);

    if (data.is_default) {
      const { error: resetError } = await context.supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", context.userId)
        .neq("id", saved.id);
      if (resetError) throw new Error(resetError.message);
    }

    return { ok: true };
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("addresses")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => CreateOrderInput.parse(input))
  .handler(async ({ context, data }) => {
    const variantIds = data.lines.map((line) => line.variantId);
    const { data: variants, error: variantError } = await context.supabase
      .from("product_variants")
      .select(
        "id, price, discount_price, stock, volume_ml, product:products(id, name, slug, brand:brands(name), product_images(url, sort_order, is_primary))",
      )
      .in("id", variantIds);
    if (variantError) throw new Error(variantError.message);

    type CheckoutVariant = {
      id: string;
      price: number | string;
      discount_price: number | string | null;
      stock: number;
      volume_ml: number;
      product:
        | {
            id: string;
            name: string;
            slug: string;
            brand: { name: string } | { name: string }[] | null;
            product_images: Array<{
              url: string;
              sort_order: number;
              is_primary: boolean;
            }>;
          }
        | Array<{
            id: string;
            name: string;
            slug: string;
            brand: { name: string } | { name: string }[] | null;
            product_images: Array<{
              url: string;
              sort_order: number;
              is_primary: boolean;
            }>;
          }>
        | null;
    };

    const variantMap = new Map(
      ((variants ?? []) as unknown as CheckoutVariant[]).map((variant) => [variant.id, variant]),
    );

    const items = data.lines.map((line) => {
      const variant = variantMap.get(line.variantId);
      if (!variant) throw new Error(`${line.productName} is no longer available.`);
      if (variant.stock < line.qty) {
        throw new Error(`${line.productName} has only ${variant.stock} left.`);
      }
      const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
      const brand = Array.isArray(product?.brand) ? product?.brand[0] : product?.brand;
      const images = product?.product_images ?? [];
      const primary = [...images].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      )[0];
      const unitPrice = Number(variant.discount_price ?? variant.price);
      return {
        product_id: product?.id ?? null,
        variant_id: variant.id,
        name_snapshot: product?.name ?? line.productName,
        volume_snapshot: variant.volume_ml,
        brand_snapshot: brand?.name ?? line.brandName,
        image_snapshot: primary?.url ?? line.image,
        price_snapshot: unitPrice,
        qty: line.qty,
      };
    });

    const subtotal = money(
      items.reduce((sum, item) => sum + Number(item.price_snapshot) * item.qty, 0),
    );

    let coupon: {
      id: string;
      code: string;
      type: "percent" | "fixed";
      value: number | string;
      min_order: number | string;
      expires_at: string | null;
      usage_limit: number | null;
      used_count: number;
    } | null = null;
    if (data.couponCode) {
      const { data: row } = await context.supabase
        .from("coupons")
        .select("id, code, type, value, min_order, expires_at, usage_limit, used_count")
        .eq("code", data.couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      coupon = row;
      if (coupon?.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) {
        throw new Error("This coupon is expired");
      }
      if (coupon?.usage_limit != null && Number(coupon.used_count) >= coupon.usage_limit) {
        throw new Error("This coupon has reached its usage limit");
      }
    }

    const discount = discountForCoupon(coupon, subtotal);
    const shipping = subtotal - discount >= 250 ? 0 : 18;
    const tax = money((subtotal - discount) * 0.0825);
    const total = money(subtotal - discount + shipping + tax);

    const { data: order, error: orderError } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        status: "confirmed",
        subtotal,
        discount,
        shipping,
        tax,
        total,
        coupon_code: coupon?.code ?? null,
        shipping_address: data.shipping as unknown as Json,
        billing_address: data.billing as unknown as Json,
        customer_email: data.customerEmail ?? null,
      })
      .select("id, order_number")
      .single();
    if (orderError) throw new Error(orderError.message);

    const { error: itemError } = await context.supabase.from("order_items").insert(
      items.map((item) => ({
        ...item,
        order_id: order.id,
      })),
    );
    if (itemError) throw new Error(itemError.message);

    await Promise.all(
      items.map((item) => {
        const variant = variantMap.get(item.variant_id);
        const nextStock = Math.max(0, Number(variant?.stock ?? 0) - item.qty);
        return context.supabase
          .from("product_variants")
          .update({ stock: nextStock })
          .eq("id", item.variant_id);
      }),
    );

    if (coupon) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: couponError } = await supabaseAdmin
        .from("coupons")
        .update({ used_count: Number(coupon.used_count) + 1 })
        .eq("id", coupon.id);
      if (couponError) throw new Error(couponError.message);
    }

    return { id: order.id, order_number: order.order_number, total };
  });

function normalizeOrder(row: Record<string, unknown>): OrderSummary {
  return {
    id: row.id as string,
    order_number: row.order_number as string,
    status: row.status as OrderStatus,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    shipping: Number(row.shipping),
    tax: Number(row.tax),
    total: Number(row.total),
    coupon_code: (row.coupon_code as string | null) ?? null,
    created_at: row.created_at as string,
    items: ((row.order_items as Array<Record<string, unknown>> | null) ?? []).map((item) => ({
      id: item.id as string,
      variant_id: (item.variant_id as string | null) ?? null,
      name_snapshot: item.name_snapshot as string,
      brand_snapshot: (item.brand_snapshot as string | null) ?? null,
      volume_snapshot: item.volume_snapshot == null ? null : Number(item.volume_snapshot),
      image_snapshot: (item.image_snapshot as string | null) ?? null,
      price_snapshot: Number(item.price_snapshot),
      qty: Number(item.qty),
    })),
    history: ((row.order_status_history as Array<Record<string, unknown>> | null) ?? []).map(
      (event) => ({
        id: event.id as string,
        status: event.status as OrderStatus,
        note: (event.note as string | null) ?? null,
        created_at: event.created_at as string,
    items: ((row.order_items as Array<Record<string, unknown>> | null) ?? []).map(
      (item) => ({
        id: item.id as string,
        variant_id: (item.variant_id as string | null) ?? null,
        name_snapshot: item.name_snapshot as string,
        brand_snapshot: (item.brand_snapshot as string | null) ?? null,
        volume_snapshot:
          item.volume_snapshot == null ? null : Number(item.volume_snapshot),
        image_snapshot: (item.image_snapshot as string | null) ?? null,
        price_snapshot: Number(item.price_snapshot),
        qty: Number(item.qty),
      }),
    ),
  };
}

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrderSummary[]> => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, order_number, status, subtotal, discount, shipping, tax, total, coupon_code, created_at, order_items(id, variant_id, name_snapshot, brand_snapshot, volume_snapshot, image_snapshot, price_snapshot, qty), order_status_history(id, status, note, created_at)",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Record<string, unknown>[]).map(normalizeOrder);
  });

export const getOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }): Promise<OrderSummary | null> => {
    const { data: row, error } = await context.supabase
      .from("orders")
      .select(
        "id, order_number, status, subtotal, discount, shipping, tax, total, coupon_code, created_at, order_items(id, variant_id, name_snapshot, brand_snapshot, volume_snapshot, image_snapshot, price_snapshot, qty), order_status_history(id, status, note, created_at)",
      )
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? normalizeOrder(row as unknown as Record<string, unknown>) : null;
  });

export function orderItemsToCartLines(order: OrderSummary): CartLine[] {
  return order.items
    .filter((item) => item.variant_id)
    .map((item) => ({
      variantId: item.variant_id as string,
      productSlug: item.name_snapshot.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      productName: item.name_snapshot,
      brandName: item.brand_snapshot,
      volumeMl: item.volume_snapshot ?? 50,
      unitPrice: item.price_snapshot,
      image: item.image_snapshot,
      qty: item.qty,
    }));
}
