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
  deleteAdminCollection,
  listAdminCollections,
  upsertAdminCollection,
} from "@/lib/admin.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/collections")({
  head: () => ({ meta: [{ title: `Admin Collections - ${SITE.brand}` }] }),
  loader: () => listAdminCollections(),
  component: AdminCollectionsPage,
});

type CollectionRow = Awaited<ReturnType<typeof listAdminCollections>>[number];

const blank = {
  slug: "",
  name: "",
  description: "",
  hero_image: "",
  is_featured: false,
  sort_order: 0,
};

function AdminCollectionsPage() {
  const router = useRouter();
  const collections = Route.useLoaderData();
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    await upsertAdminCollection({
      data: {
        id: editId ?? undefined,
        slug: form.slug,
        name: form.name,
        description: form.description || null,
        hero_image: form.hero_image || null,
        is_featured: form.is_featured,
        sort_order: form.sort_order,
      },
    });
    setShowForm(false);
    await router.invalidate();
  }

  return (
    <div>
      <AdminHeader
        title="Collections"
        subtitle="Curated edits and seasonal groupings."
        action={
          <AdminButton
            type="button"
            onClick={() => {
              setEditId(null);
              setForm(blank);
              setShowForm(true);
            }}
          >
            <Plus size={14} className="mr-2 inline" /> New collection
          </AdminButton>
        }
      />

      {showForm && (
        <form onSubmit={save} className="mb-8 grid gap-4 border border-border p-5 md:grid-cols-2">
          <AdminField label="Name">
            <input className={adminInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </AdminField>
          <AdminField label="Slug">
            <input className={adminInputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </AdminField>
          <AdminField label="Hero image">
            <input className={adminInputClass} value={form.hero_image} onChange={(e) => setForm({ ...form, hero_image: e.target.value })} />
          </AdminField>
          <AdminField label="Sort order">
            <input type="number" className={adminInputClass} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </AdminField>
          <div className="md:col-span-2">
            <AdminField label="Description">
              <textarea className={adminTextareaClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </AdminField>
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            Featured on storefront
          </label>
          <div className="flex gap-2 md:col-span-2">
            <AdminButton type="submit">Save</AdminButton>
            <AdminButton type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</AdminButton>
          </div>
        </form>
      )}

      <AdminTable headers={["Name", "Slug", "Featured", "Order", ""]}>
        {collections.map((col) => (
          <tr key={col.id} className="border-b border-border/60">
            <td className="px-4 py-3">{col.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{col.slug}</td>
            <td className="px-4 py-3">{col.is_featured ? "Yes" : "—"}</td>
            <td className="px-4 py-3">{col.sort_order}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditId(col.id); setForm({ slug: col.slug, name: col.name, description: col.description ?? "", hero_image: col.hero_image ?? "", is_featured: col.is_featured, sort_order: col.sort_order }); setShowForm(true); }} className="hover:text-accent"><Pencil size={15} /></button>
                <button type="button" onClick={() => { if (confirm("Delete?")) void deleteAdminCollection({ data: { id: col.id } }).then(() => router.invalidate()); }} className="hover:text-destructive"><Trash2 size={15} /></button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
