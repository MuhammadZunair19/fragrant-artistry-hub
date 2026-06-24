import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  AdminButton,
  AdminField,
  AdminHeader,
  AdminTable,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/admin-shell";
import {
  deleteAdminBrand,
  listAdminBrands,
  upsertAdminBrand,
} from "@/lib/admin.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/brands")({
  head: () => ({ meta: [{ title: `Admin Brands - ${SITE.brand}` }] }),
  loader: () => listAdminBrands(),
  component: AdminBrandsPage,
});

type BrandRow = Awaited<ReturnType<typeof listAdminBrands>>[number];

const blank = {
  slug: "",
  name: "",
  tagline: "",
  story: "",
  hero_image: "",
};

function AdminBrandsPage() {
  const router = useRouter();
  const brands = Route.useLoaderData();
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function openCreate() {
    setEditId(null);
    setForm(blank);
    setShowForm(true);
  }

  function openEdit(row: BrandRow) {
    setEditId(row.id);
    setForm({
      slug: row.slug,
      name: row.name,
      tagline: row.tagline ?? "",
      story: row.story ?? "",
      hero_image: row.hero_image ?? "",
    });
    setShowForm(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    await upsertAdminBrand({
      data: {
        id: editId ?? undefined,
        slug: form.slug,
        name: form.name,
        tagline: form.tagline || null,
        story: form.story || null,
        hero_image: form.hero_image || null,
      },
    });
    setShowForm(false);
    await router.invalidate();
  }

  async function remove(id: string) {
    if (!confirm("Delete brand?")) return;
    await deleteAdminBrand({ data: { id } });
    await router.invalidate();
  }

  return (
    <div>
      <AdminHeader
        title="Brands"
        subtitle="Maisons and house identities across the catalog."
        action={
          <AdminButton type="button" onClick={openCreate}>
            <Plus size={14} className="mr-2 inline" /> New brand
          </AdminButton>
        }
      />

      {showForm && (
        <form
          onSubmit={save}
          className="mb-8 grid gap-4 border border-border bg-card/40 p-5 md:grid-cols-2"
        >
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
          <AdminField label="Tagline">
            <input
              className={adminInputClass}
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </AdminField>
          <AdminField label="Hero image URL">
            <input
              className={adminInputClass}
              value={form.hero_image}
              onChange={(e) => setForm({ ...form, hero_image: e.target.value })}
            />
          </AdminField>
          <div className="md:col-span-2">
            <AdminField label="Story">
              <textarea
                className={adminTextareaClass}
                value={form.story}
                onChange={(e) => setForm({ ...form, story: e.target.value })}
              />
            </AdminField>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <AdminButton type="submit">Save</AdminButton>
            <AdminButton type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </AdminButton>
          </div>
        </form>
      )}

      <AdminTable headers={["Name", "Slug", "Tagline", ""]}>
        {brands.map((brand) => (
          <tr key={brand.id} className="border-b border-border/60">
            <td className="px-4 py-3">{brand.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{brand.slug}</td>
            <td className="px-4 py-3">{brand.tagline ?? "—"}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(brand)} className="hover:text-accent">
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => void remove(brand.id)} className="hover:text-destructive">
                  <Trash2 size={15} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
