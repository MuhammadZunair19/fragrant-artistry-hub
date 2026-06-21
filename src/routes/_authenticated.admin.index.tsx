import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  AdminHeader,
  AdminStat,
  AdminTable,
  StatusBadge,
} from "@/components/admin/admin-shell";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getAdminDashboard } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [{ title: `Admin Overview - ${SITE.brand}` }],
  }),
  loader: () => getAdminDashboard(),
  component: AdminOverviewPage,
});

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(45 20% 70%)" },
};

function AdminOverviewPage() {
  const data = Route.useLoaderData();

  return (
    <div>
      <AdminHeader
        title="Overview"
        subtitle="Revenue, orders, inventory signals, and recent activity across the house."
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Revenue" value={formatPrice(data.revenue)} />
        <AdminStat label="Orders" value={data.orderCount} />
        <AdminStat label="Products" value={data.productCount} />
        <AdminStat
          label="Customers"
          value={data.customerCount}
          hint={`${data.lowStock.length} low-stock variants`}
        />
      </div>

      <div className="mb-10 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="border border-border bg-card/40 p-5">
          <p className="eyebrow mb-6">Sales · 14 days</p>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={data.salesByDay}>
              <CartesianGrid vertical={false} stroke="hsl(0 0% 96% / 0.08)" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => v.slice(5)}
                stroke="hsl(0 0% 96% / 0.35)"
                fontSize={11}
              />
              <YAxis stroke="hsl(0 0% 96% / 0.35)" fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={0} />
            </BarChart>
          </ChartContainer>
        </section>

        <section>
          <p className="eyebrow mb-4">Top sellers</p>
          <div className="space-y-3 border border-border bg-card/40 p-4">
            {data.topSellers.length === 0 && (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            )}
            {data.topSellers.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-sm">{item.name}</span>
                <span className="eyebrow text-accent">
                  {item.qty} · {formatPrice(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow">Recent orders</p>
            <Link to="/admin/orders" className="eyebrow text-accent hover:underline">
              View all
            </Link>
          </div>
          <AdminTable headers={["Order", "Status", "Total", "Date"]}>
            {data.recentOrders.map((order) => (
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
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">{formatPrice(order.total)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </AdminTable>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow">Low stock</p>
            <Link
              to="/admin/inventory"
              className="eyebrow text-accent hover:underline"
            >
              Manage
            </Link>
          </div>
          <AdminTable headers={["Product", "Size", "Stock", "SKU"]}>
            {data.lowStock.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="px-4 py-3">{item.product_name}</td>
                <td className="px-4 py-3">{item.volume_ml}ml</td>
                <td className="px-4 py-3 text-destructive">{item.stock}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.sku ?? "—"}
                </td>
              </tr>
            ))}
          </AdminTable>
        </section>
      </div>
    </div>
  );
}
