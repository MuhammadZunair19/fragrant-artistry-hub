import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  AdminButton,
  AdminField,
  AdminHeader,
  AdminTable,
  StatusBadge,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/admin-shell";
import {
  getAdminOrder,
  updateAdminOrderStatus,
} from "@/lib/admin.functions";
import type { OrderStatus } from "@/lib/account.functions";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  head: () => ({
    meta: [{ title: `Admin Order - ${SITE.brand}` }],
  }),
  loader: ({ params }) => getAdminOrder({ data: { id: params.id } }),
  component: AdminOrderDetailPage,
});

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function AdminOrderDetailPage() {
  const router = useRouter();
  const order = Route.useLoaderData();
  const [status, setStatus] = useState<OrderStatus>(
    order?.status ?? "pending",
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!order) {
    return (
      <div>
        <AdminHeader title="Order not found" />
        <Link to="/admin/orders" className="eyebrow text-accent">
          ← Back to orders
        </Link>
      </div>
    );
  }

  async function saveStatus() {
    setBusy(true);
    await updateAdminOrderStatus({
      data: { id: order.id, status, note: note || null },
    });
    setBusy(false);
    setNote("");
    await router.invalidate();
  }

  return (
    <div>
      <AdminHeader
        title={order.order_number}
        subtitle={`Placed ${new Date(order.created_at).toLocaleString()}`}
        action={
          <Link to="/admin/orders" className="eyebrow text-accent hover:underline">
            ← All orders
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        {(
          [
            ["Subtotal", order.subtotal],
            ["Discount", order.discount],
            ["Shipping", order.shipping],
            ["Total", order.total],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="border border-border p-4">
            <p className="eyebrow mb-2">{label}</p>
            <p className="font-display text-2xl italic">{formatPrice(value)}</p>
          </div>
        ))}
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <section className="border border-border p-5">
          <p className="eyebrow mb-4">Customer</p>
          <p>{order.profile?.full_name ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{order.customer_email}</p>
          <p className="text-sm text-muted-foreground">{order.profile?.phone}</p>
          <Link
            to="/admin/customers/$id"
            params={{ id: order.user_id }}
            className="eyebrow mt-4 inline-block text-accent hover:underline"
          >
            View customer
          </Link>
        </section>

        <section className="border border-border p-5">
          <p className="eyebrow mb-4">Update status</p>
          <div className="mb-2">
            <StatusBadge status={order.status} />
          </div>
          <AdminField label="New status">
            <select
              className={adminInputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Note (optional)">
            <textarea
              className={adminTextareaClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </AdminField>
          <AdminButton type="button" disabled={busy} onClick={() => void saveStatus()}>
            Update status
          </AdminButton>
        </section>
      </div>

      <p className="eyebrow mb-4">Line items</p>
      <AdminTable headers={["Item", "Qty", "Price", "Line total"]}>
        {order.order_items.map(
          (item: {
            id: string;
            name_snapshot: string;
            brand_snapshot: string | null;
            volume_snapshot: number | null;
            qty: number;
            price_snapshot: number;
          }) => (
            <tr key={item.id} className="border-b border-border/60">
              <td className="px-4 py-3">
                <p>{item.name_snapshot}</p>
                <p className="text-xs text-muted-foreground">
                  {item.brand_snapshot}
                  {item.volume_snapshot ? ` · ${item.volume_snapshot}ml` : ""}
                </p>
              </td>
              <td className="px-4 py-3">{item.qty}</td>
              <td className="px-4 py-3">{formatPrice(item.price_snapshot)}</td>
              <td className="px-4 py-3">
                {formatPrice(item.price_snapshot * item.qty)}
              </td>
            </tr>
          ),
        )}
      </AdminTable>

      <p className="eyebrow mb-4 mt-10">Status history</p>
      <div className="space-y-3 border border-border p-4">
        {(order.order_status_history as Array<{
          id: string;
          status: OrderStatus;
          note: string | null;
          created_at: string;
        }>).map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-4">
            <StatusBadge status={entry.status} />
            <span className="text-sm text-muted-foreground">
              {entry.note ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(entry.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
