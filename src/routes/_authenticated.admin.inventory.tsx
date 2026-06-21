import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  AdminButton,
  AdminField,
  AdminHeader,
  AdminTable,
  adminInputClass,
} from "@/components/admin/admin-shell";
import {
  listAdminInventory,
  updateAdminVariantStock,
} from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/format";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => ({
    meta: [{ title: `Admin Inventory - ${SITE.brand}` }],
  }),
  loader: () => listAdminInventory(),
  component: AdminInventoryPage,
});

function AdminInventoryPage() {
  const router = useRouter();
  const items = Route.useLoaderData();
  const [editing, setEditing] = useState<string | null>(null);
  const [stock, setStock] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [busy, setBusy] = useState(false);

  async function save(id: string) {
    setBusy(true);
    await updateAdminVariantStock({
      data: { id, stock, low_stock_threshold: threshold },
    });
    setEditing(null);
    setBusy(false);
    await router.invalidate();
  }

  return (
    <div>
      <AdminHeader
        title="Inventory"
        subtitle="Per-variant stock levels and low-stock thresholds."
      />

      <AdminTable
        headers={["Product", "Volume", "Price", "Stock", "Threshold", ""]}
      >
        {items.map((item) => (
          <tr
            key={item.id}
            className={cn(
              "border-b border-border/60",
              item.is_low && "bg-destructive/5",
            )}
          >
            <td className="px-4 py-3">
              <p>{item.product_name}</p>
              <p className="text-xs text-muted-foreground">{item.sku ?? "—"}</p>
            </td>
            <td className="px-4 py-3">{item.volume_ml}ml</td>
            <td className="px-4 py-3">{formatPrice(item.price)}</td>
            <td className="px-4 py-3">
              {editing === item.id ? (
                <input
                  type="number"
                  className={`${adminInputClass} max-w-24`}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                />
              ) : (
                <span className={item.is_low ? "text-destructive" : ""}>
                  {item.stock}
                </span>
              )}
            </td>
            <td className="px-4 py-3">
              {editing === item.id ? (
                <input
                  type="number"
                  className={`${adminInputClass} max-w-24`}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
              ) : (
                item.low_stock_threshold
              )}
            </td>
            <td className="px-4 py-3">
              {editing === item.id ? (
                <AdminButton
                  type="button"
                  disabled={busy}
                  onClick={() => void save(item.id)}
                >
                  Save
                </AdminButton>
              ) : (
                <AdminButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(item.id);
                    setStock(item.stock);
                    setThreshold(item.low_stock_threshold);
                  }}
                >
                  Edit
                </AdminButton>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
