import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  AdminButton,
  AdminField,
  AdminHeader,
  AdminTable,
  StatusBadge,
  adminInputClass,
} from "@/components/admin/admin-shell";
import { listAdminOrders } from "@/lib/admin.functions";
import type { OrderStatus } from "@/lib/account.functions";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  validateSearch: (search: Record<string, unknown>) => ({
    status:
      typeof search.status === "string"
        ? (search.status as OrderStatus)
        : undefined,
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [{ title: `Admin Orders - ${SITE.brand}` }],
  }),
  loader: ({ search }) =>
    listAdminOrders({ data: { status: search.status, q: search.q || undefined } }),
  component: AdminOrdersPage,
});

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function AdminOrdersPage() {
  const router = useRouter();
  const { status, q } = Route.useSearch();
  const orders = Route.useLoaderData();
  const [query, setQuery] = useState(q);

  return (
    <div>
      <AdminHeader
        title="Orders"
        subtitle="Filter, inspect, and update order status across the atelier."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <AdminField label="Search">
          <input
            className={`${adminInputClass} max-w-xs`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order # or email"
          />
        </AdminField>
        <AdminButton
          type="button"
          variant="ghost"
          className="self-end"
          onClick={() =>
            router.navigate({
              to: "/admin/orders",
              search: { status, q: query },
            })
          }
        >
          Search
        </AdminButton>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <AdminButton
          type="button"
          variant={!status ? "primary" : "ghost"}
          onClick={() => router.navigate({ to: "/admin/orders", search: { q } })}
        >
          All
        </AdminButton>
        {STATUSES.map((s) => (
          <AdminButton
            key={s}
            type="button"
            variant={status === s ? "primary" : "ghost"}
            onClick={() =>
              router.navigate({ to: "/admin/orders", search: { status: s, q } })
            }
          >
            {s}
          </AdminButton>
        ))}
      </div>

      <AdminTable headers={["Order", "Email", "Status", "Total", "Date"]}>
        {orders.map((order) => (
          <tr key={order.id} className="border-b border-border/60">
            <td className="px-4 py-3">
              <Link
                to="/admin/orders/$id"
                params={{ id: order.id }}
                className="hover:text-accent"
              >
                {order.order_number}
              </Link>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {order.customer_email ?? "—"}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={order.status} />
            </td>
            <td className="px-4 py-3">{formatPrice(order.total)}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {new Date(order.created_at).toLocaleString()}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
