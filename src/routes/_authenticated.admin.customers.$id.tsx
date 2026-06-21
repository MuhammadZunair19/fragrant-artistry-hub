import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AdminHeader,
  AdminTable,
  StatusBadge,
} from "@/components/admin/admin-shell";
import { getAdminCustomer } from "@/lib/admin.functions";
import type { OrderStatus } from "@/lib/account.functions";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/customers/$id")({
  head: () => ({
    meta: [{ title: `Admin Customer - ${SITE.brand}` }],
  }),
  loader: ({ params }) => getAdminCustomer({ data: { id: params.id } }),
  component: AdminCustomerDetailPage,
});

function AdminCustomerDetailPage() {
  const data = Route.useLoaderData();

  if (!data) {
    return (
      <div>
        <AdminHeader title="Customer not found" />
        <Link to="/admin/customers" className="eyebrow text-accent">
          ← Back
        </Link>
      </div>
    );
  }

  const { profile, orders, addresses } = data;

  return (
    <div>
      <AdminHeader
        title={profile.full_name ?? "Customer"}
        subtitle={`Member since ${new Date(profile.created_at).toLocaleDateString()}`}
        action={
          <Link
            to="/admin/customers"
            className="eyebrow text-accent hover:underline"
          >
            ← All customers
          </Link>
        }
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="border border-border p-5">
          <p className="eyebrow mb-2">Phone</p>
          <p>{profile.phone ?? "—"}</p>
        </div>
        <div className="border border-border p-5">
          <p className="eyebrow mb-2">Orders</p>
          <p className="font-display text-3xl italic">{orders.length}</p>
        </div>
      </div>

      <p className="eyebrow mb-4">Order history</p>
      <AdminTable headers={["Order", "Status", "Total", "Date"]}>
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
            <td className="px-4 py-3">
              <StatusBadge status={order.status as OrderStatus} />
            </td>
            <td className="px-4 py-3">{formatPrice(order.total)}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </AdminTable>

      <p className="eyebrow mb-4 mt-10">Saved addresses</p>
      <div className="grid gap-4 md:grid-cols-2">
        {addresses.length === 0 && (
          <p className="text-sm text-muted-foreground">No addresses saved.</p>
        )}
        {addresses.map(
          (addr: {
            id: string;
            label: string | null;
            full_name: string;
            line1: string;
            line2: string | null;
            city: string;
            region: string | null;
            postal_code: string;
            country: string;
          }) => (
            <div key={addr.id} className="border border-border p-4 text-sm">
              <p className="eyebrow mb-2">{addr.label ?? "Address"}</p>
              <p>{addr.full_name}</p>
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>
                {addr.city}
                {addr.region ? `, ${addr.region}` : ""} {addr.postal_code}
              </p>
              <p>{addr.country}</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
