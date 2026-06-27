import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import {
  AdminButton,
  AdminField,
  AdminHeader,
  AdminTable,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/admin-shell";
import {
  deleteAdminProduct,
  getAdminProduct,
  listAdminProducts,
  listAdminTaxonomyOptions,
  upsertAdminProduct,
  type AdminProductDetail,
  type AdminProductRow,
} from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";
import { TagInput } from "@/components/ui/tag-input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({
    meta: [{ title: `Admin Products - ${SITE.brand}` }],
  }),
  loader: async () => {
    const [products, taxonomy] = await Promise.all([
      listAdminProducts(),
      listAdminTaxonomyOptions(),
    ]);
    return { products, taxonomy };
  },
  component: AdminProductsPage,
});

const blankProduct = (): AdminProductDetail => ({
  id: "",
  slug: "",
  name: "",
  brand_id: null,
  category_id: null,
  family_id: null,
  gender: "unisex",
  tagline: "",
  description: "",
  top_notes: [],
  heart_notes: [],
  base_notes: [],
  is_featured: false,
  is_new: false,
  is_best_seller: false,
  is_active: true,
  collection_ids: [],
  variants: [
    {
      volume_ml: 30,
      price: 0,
      discount_price: null,
      stock: 0,
      low_stock_threshold: 5,
      sku: "",
      is_active: true,
    },
    { volume_ml: 30, price: 0, discount_price: null, stock: 0, low_stock_threshold: 5, sku: "", is_active: true },
  ],
  images: [],
});

function storagePathFromUrl(url: string) {
  const marker = "/storage/v1/object/public/product-images/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

async function removeStorageObject(url: string) {
  const path = storagePathFromUrl(url);
  if (!path) return;
  const { error } = await supabase.storage.from("product-images").remove([path]);
  if (error) throw new Error(error.message);
function notesToString(notes: string[]) {
  return notes.join(", ");
}

function stringToNotes(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function AdminProductsPage() {
  const router = useRouter();
  const { products, taxonomy } = Route.useLoaderData();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<AdminProductDetail>(blankProduct());
  const [status, setStatus] = useState<string | null>(null);

  async function openEditor(row?: AdminProductRow) {
    setStatus(null);
    if (!row) {
      setForm(blankProduct());
      setOpen(true);
      return;
    }
    const detail = await getAdminProduct({ data: { id: row.id } });
    setForm(detail ?? blankProduct());
    setOpen(true);
  }

  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const payload = { ...form, id: form.id || undefined };
      await upsertAdminProduct({ data: payload });
      setOpen(false);
      await router.invalidate();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    }
    setBusy(false);
  }

  async function removeProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    const detail = await getAdminProduct({ data: { id } });
    await Promise.all((detail?.images ?? []).map((image) => removeStorageObject(image.url)));
    await deleteAdminProduct({ data: { id } });
    await router.invalidate();
  }

  async function uploadImages(files: FileList) {
    const uploaded: AdminProductDetail["images"] = [];
    for (const [index, file] of Array.from(files).entries()) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
      const path = `${form.id || "new"}/${Date.now()}-${index}-${safeName}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push({
        url: data.publicUrl,
        alt: file.name,
        sort_order: form.images.length + uploaded.length,
        is_primary: form.images.length === 0 && uploaded.length === 0,
      });
    }

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...uploaded],
    }));
  }

  async function removeImage(index: number) {
    const image = form.images[index];
    if (!image) return;
    try {
      await removeStorageObject(image.url);
      setForm((prev) => {
        const images = prev.images
          .filter((_, imageIndex) => imageIndex !== index)
          .map((item, imageIndex) => ({ ...item, sort_order: imageIndex }));
        if (images.length && !images.some((item) => item.is_primary)) {
          images[0] = { ...images[0], is_primary: true };
        }
        return { ...prev, images };
      });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Image removal failed");
    }
  }

  async function uploadImage(file: File) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${form.id || "new"}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          url: data.publicUrl,
          alt: file.name,
          sort_order: prev.images.length,
          is_primary: prev.images.length === 0,
        },
      ],
    }));
  }

  return (
    <div>
      <AdminHeader
        title="Products"
        subtitle="Create and edit compositions, variants, imagery, and merchandising flags."
        action={
          <AdminButton type="button" onClick={() => void openEditor()}>
            <Plus size={14} className="mr-2 inline" /> New product
          </AdminButton>
        }
      />

      <AdminTable headers={["Product", "Brand", "Price", "Stock", "Status", ""]}>
      <AdminTable
        headers={["Product", "Brand", "Price", "Stock", "Status", ""]}
      >
        {products.map((product) => (
          <tr key={product.id} className="border-b border-border/60">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                {product.image_url && (
                  <img src={product.image_url} alt="" className="size-10 object-cover" />
                  <img
                    src={product.image_url}
                    alt=""
                    className="size-10 object-cover"
                  />
                )}
                <div>
                  <p>{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.slug}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">{product.brand_name ?? "—"}</td>
            <td className="px-4 py-3">{formatPrice(product.min_price)}</td>
            <td className="px-4 py-3">{product.total_stock}</td>
            <td className="px-4 py-3">
              <span className="eyebrow text-accent">{product.is_active ? "Active" : "Hidden"}</span>
              <span className="eyebrow text-accent">
                {product.is_active ? "Active" : "Hidden"}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void openEditor(product)}
                  className="text-muted-foreground hover:text-accent"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => void removeProduct(product.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto border-border bg-card sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="font-display italic text-3xl">
              {form.id ? "Edit product" : "New product"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={saveProduct} className="mt-8 space-y-5">
            <AdminField label="Name">
              <input
                className={adminInputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </AdminField>
            <AdminField label="Slug">
              <input
                className={adminInputClass}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </AdminField>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Brand">
                <select
                  className={adminInputClass}
                  value={form.brand_id ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      brand_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">—</option>
                  {taxonomy.brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Family">
                <select
                  className={adminInputClass}
                  value={form.family_id ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      family_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">—</option>
                  {taxonomy.families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </AdminField>
            </div>
            <AdminField label="Tagline">
              <input
                className={adminInputClass}
                value={form.tagline ?? ""}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </AdminField>
            <AdminField label="Description">
              <textarea
                className={adminTextareaClass}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </AdminField>
            <div className="grid gap-4">
              {(["top_notes", "heart_notes", "base_notes"] as const).map((key) => (
                <AdminField key={key} label={key.replace("_", " ")}>
                  <TagInput
                    value={form[key]}
                    onChange={(value) => setForm({ ...form, [key]: value })}
                <AdminField
                  key={key}
                  label={key.replace("_", " ")}
                >
                  <input
                    className={adminInputClass}
                    value={notesToString(form[key])}
                    onChange={(e) =>
                      setForm({ ...form, [key]: stringToNotes(e.target.value) })
                    }
                    placeholder="bergamot, saffron, cedar"
                  />
                </AdminField>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              {(
                [
                  ["is_featured", "Featured"],
                  ["is_new", "New"],
                  ["is_best_seller", "Best seller"],
                  ["is_active", "Active"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.checked })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            <div>
              <p className="eyebrow mb-3">Variants</p>
              <div className="space-y-3">
                {form.variants.map((variant, index) => (
                  <div
                    key={variant.id ?? index}
                    className="grid grid-cols-2 gap-2 border border-border p-3"
                  >
                    <input
                      className={adminInputClass}
                      type="number"
                      placeholder="ml"
                      value={variant.volume_ml}
                      onChange={(e) => {
                        const variants = [...form.variants];
                        variants[index] = {
                          ...variant,
                          volume_ml: Number(e.target.value),
                        };
                        setForm({ ...form, variants });
                      }}
                    />
                    <input
                      className={adminInputClass}
                      type="number"
                      placeholder="Price"
                      value={variant.price}
                      onChange={(e) => {
                        const variants = [...form.variants];
                        variants[index] = {
                          ...variant,
                          price: Number(e.target.value),
                        };
                        setForm({ ...form, variants });
                      }}
                    />
                    <input
                      className={adminInputClass}
                      type="number"
                      placeholder="Discount Price"
                      value={variant.discount_price ?? ""}
                      onChange={(e) => {
                        const variants = [...form.variants];
                        variants[index] = {
                          ...variant,
                          discount_price: e.target.value ? Number(e.target.value) : null,
                        };
                        setForm({ ...form, variants });
                      }}
                    />
                    <input
                      className={adminInputClass}
                      type="number"
                      placeholder="Stock"
                      value={variant.stock}
                      onChange={(e) => {
                        const variants = [...form.variants];
                        variants[index] = {
                          ...variant,
                          stock: Number(e.target.value),
                        };
                        setForm({ ...form, variants });
                      }}
                    />
                    <input
                      className={adminInputClass}
                      placeholder="SKU"
                      value={variant.sku ?? ""}
                      onChange={(e) => {
                        const variants = [...form.variants];
                        variants[index] = { ...variant, sku: e.target.value };
                        setForm({ ...form, variants });
                      }}
                    />
                  </div>
                ))}
                <AdminButton
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setForm({
                      ...form,
                      variants: [
                        ...form.variants,
                        {
                          volume_ml: 50,
                          price: 0,
                          discount_price: null,
                          stock: 0,
                          low_stock_threshold: 5,
                          sku: "",
                          is_active: true,
                        },
                      ],
                    })
                  }
                >
                  Add variant
                </AdminButton>
              </div>
            </div>

            <div>
              <p className="eyebrow mb-3">Images</p>
              <div className="space-y-2">
                {form.images.map((img, index) => (
                  <div key={img.id ?? index} className="flex gap-2">
                    <input
                      className={adminInputClass}
                      value={img.url}
                      onChange={(e) => {
                        const images = [...form.images];
                        images[index] = { ...img, url: e.target.value };
                        setForm({ ...form, images });
                      }}
                    />
                    <button
                      type="button"
                      className="border border-border px-3 text-muted-foreground hover:border-destructive hover:text-destructive"
                      onClick={() => void removeImage(index)}
                      aria-label="Remove image"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <label className="eyebrow mt-3 inline-flex cursor-pointer items-center gap-2 hover:text-accent">
                <Upload size={14} />
                Upload to storage
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const { files } = e.target;
                    if (files?.length) {
                      void uploadImages(files).catch((err) => setStatus(err.message));
                    }
                    e.target.value = "";
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(file).catch((err) => setStatus(err.message));
                  }}
                />
              </label>
            </div>

            <AdminField label="Collections">
              <select
                multiple
                className={`${adminTextareaClass} min-h-[88px]`}
                value={form.collection_ids}
                onChange={(e) =>
                  setForm({
                    ...form,
                    collection_ids: [...e.target.selectedOptions].map((o) => o.value),
                    collection_ids: [...e.target.selectedOptions].map(
                      (o) => o.value,
                    ),
                  })
                }
              >
                {taxonomy.collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </AdminField>

            {status && <p className="text-sm text-destructive">{status}</p>}
            <AdminButton type="submit" disabled={busy}>
              Save product
            </AdminButton>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
