import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  AdminButton,
  AdminField,
  AdminHeader,
  AdminTable,
  adminInputClass,
} from "@/components/admin/admin-shell";
import {
  deleteAdminCoupon,
  listAdminCoupons,
  upsertAdminCoupon,
} from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  head: () => ({ meta: [{ title: `Admin Coupons - ${SITE.brand}` }] }),
  loader: () => listAdminCoupons(),
  component: AdminCouponsPage,
});

type CouponRow = Awaited<ReturnType<typeof listAdminCoupons>>[number];

const blank = {
  code: "",
  type: "percent" as const,
  value: 10,
  min_order: 0,
  expires_at: "",
  usage_limit: "",
  is_active: true,
};

function AdminCouponsPage() {
  const router = useRouter();
  const coupons = Route.useLoaderData();
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    await upsertAdminCoupon({
      data: {
        id: editId ?? undefined,
        code: form.code,
        type: form.type,
        value: form.value,
        min_order: form.min_order,
        expires_at: form.expires_at || null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        is_active: form.is_active,
      },
    });
    setShowForm(false);
    await router.invalidate();
  }

  return (
    <div>
      <AdminHeader
        title="Coupons"
        subtitle="Promotional codes for checkout."
        action={
          <AdminButton
            type="button"
            onClick={() => {
              setEditId(null);
              setForm(blank);
              setShowForm(true);
            }}
          >
            <Plus size={14} className="mr-2 inline" /> New coupon
          </AdminButton>
        }
      />

      {showForm && (
        <form onSubmit={save} className="mb-8 grid gap-4 border border-border p-5 md:grid-cols-2">
          <AdminField label="Code">
            <input className={adminInputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </AdminField>
          <AdminField label="Type">
            <select className={adminInputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed</option>
            </select>
          </AdminField>
          <AdminField label="Value">
            <input type="number" className={adminInputClass} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required />
          </AdminField>
          <AdminField label="Min order">
            <input type="number" className={adminInputClass} value={form.min_order} onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })} />
          </AdminField>
          <AdminField label="Expires at">
            <input type="datetime-local" className={adminInputClass} value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </AdminField>
          <AdminField label="Usage limit">
            <input className={adminInputClass} value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" />
          </AdminField>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <div className="flex gap-2 md:col-span-2">
            <AdminButton type="submit">Save</AdminButton>
            <AdminButton type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</AdminButton>
          </div>
        </form>
      )}

      <AdminTable headers={["Code", "Type", "Value", "Used", "Active", ""]}>
        {coupons.map((coupon) => (
          <tr key={coupon.id} className="border-b border-border/60">
            <td className="px-4 py-3 font-mono">{coupon.code}</td>
            <td className="px-4 py-3 capitalize">{coupon.type}</td>
            <td className="px-4 py-3">
              {coupon.type === "percent" ? `${coupon.value}%` : formatPrice(coupon.value)}
            </td>
            <td className="px-4 py-3">
              {coupon.used_count}
              {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
            </td>
            <td className="px-4 py-3">{coupon.is_active ? "Yes" : "No"}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditId(coupon.id); setForm({ code: coupon.code, type: coupon.type, value: coupon.value, min_order: coupon.min_order, expires_at: coupon.expires_at?.slice(0, 16) ?? "", usage_limit: coupon.usage_limit?.toString() ?? "", is_active: coupon.is_active }); setShowForm(true); }} className="hover:text-accent"><Pencil size={15} /></button>
                <button type="button" onClick={() => { if (confirm("Delete?")) void deleteAdminCoupon({ data: { id: coupon.id } }).then(() => router.invalidate()); }} className="hover:text-destructive"><Trash2 size={15} /></button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
