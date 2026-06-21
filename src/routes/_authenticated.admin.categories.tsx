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
  deleteAdminCategory,
  listAdminCategories,
  upsertAdminCategory,
} from "@/lib/admin.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({ meta: [{ title: `Admin Categories - ${SITE.brand}` }] }),
  loader: () => listAdminCategories(),
  component: AdminCategoriesPage,
});

const blank = { slug: "", name: "", description: "" };

function AdminCategoriesPage() {
  const router = useRouter();
  const categories = Route.useLoaderData();
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    await upsertAdminCategory({
      data: {
        id: editId ?? undefined,
        ...form,
        description: form.description || null,
      },
    });
    setShowForm(false);
    await router.invalidate();
  }

  return (
    <div>
      <AdminHeader
        title="Categories"
        subtitle="Product concentration and merchandising taxonomy."
        action={
          <AdminButton
            type="button"
            onClick={() => {
              setEditId(null);
              setForm(blank);
              setShowForm(true);
            }}
          >
            <Plus size={14} className="mr-2 inline" /> New category
          </AdminButton>
        }
      />

      {showForm && (
        <form onSubmit={save} className="mb-8 space-y-4 border border-border p-5">
          <AdminField label="Name">
            <input className={adminInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </AdminField>
          <AdminField label="Slug">
            <input className={adminInputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </AdminField>
          <AdminField label="Description">
            <textarea className={adminTextareaClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </AdminField>
          <div className="flex gap-2">
            <AdminButton type="submit">Save</AdminButton>
            <AdminButton type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</AdminButton>
          </div>
        </form>
      )}

      <AdminTable headers={["Name", "Slug", ""]}>
        {categories.map((cat) => (
          <tr key={cat.id} className="border-b border-border/60">
            <td className="px-4 py-3">{cat.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{cat.slug}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditId(cat.id); setForm({ slug: cat.slug, name: cat.name, description: cat.description ?? "" }); setShowForm(true); }} className="hover:text-accent"><Pencil size={15} /></button>
                <button type="button" onClick={() => { if (confirm("Delete?")) void deleteAdminCategory({ data: { id: cat.id } }).then(() => router.invalidate()); }} className="hover:text-destructive"><Trash2 size={15} /></button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
