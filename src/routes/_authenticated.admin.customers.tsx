import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminHeader, AdminTable } from "@/components/admin/admin-shell";
import { listAdminCustomers } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({
    meta: [{ title: `Admin Customers - ${SITE.brand}` }],
  }),
  loader: () => listAdminCustomers(),
  component: AdminCustomersPage,
});

function AdminCustomersPage() {
  const customers = Route.useLoaderData();

  return (
    <div>
      <AdminHeader
        title="Customers"
        subtitle="Registered clients, lifetime value, and order frequency."
      />

      <AdminTable headers={["Name", "Phone", "Orders", "Spent", "Joined"]}>
        {customers.map((customer) => (
          <tr key={customer.id} className="border-b border-border/60">
            <td className="px-4 py-3">
              <Link
                to="/admin/customers/$id"
                params={{ id: customer.id }}
                className="hover:text-accent"
              >
                {customer.full_name ?? "Unnamed"}
              </Link>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {customer.phone ?? "—"}
            </td>
            <td className="px-4 py-3">{customer.order_count}</td>
            <td className="px-4 py-3">{formatPrice(customer.total_spent)}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {new Date(customer.created_at).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
