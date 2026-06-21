import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  Package,
  Percent,
  ShoppingBag,
  Store,
  Tag,
  Users,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/format";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/brands", label: "Brands", icon: Store },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/collections", label: "Collections", icon: Boxes },
  { to: "/admin/coupons", label: "Coupons", icon: Percent },
] as const;

export function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto flex max-w-[1600px] gap-10 px-6 md:px-10">
        <aside className="hidden w-56 shrink-0 lg:block">
          <p className="eyebrow !text-accent mb-6">Admin Atelier</p>
          <nav className="space-y-1 border-l border-border pl-4">
            {NAV.map(({ to, label, icon: Icon, ...rest }) => {
              const end = "end" in rest && rest.end;
              const active = end
                ? pathname === to || pathname === `${to}/`
                : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 py-2.5 text-sm transition-colors",
                    active
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <Link
            to="/account"
            className="eyebrow mt-10 inline-block text-muted-foreground hover:text-accent"
          >
            ← Back to account
          </Link>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function AdminHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        <p className="eyebrow !text-accent mb-3">Administration</p>
        <h1 className="font-display italic text-4xl md:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function AdminStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="border border-border bg-card/50 p-5">
      <p className="eyebrow mb-3">{label}</p>
      <p className="font-display text-4xl italic">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AdminTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-card/60">
            {headers.map((h) => (
              <th key={h} className="eyebrow px-4 py-3 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "delivered" || status === "confirmed"
      ? "text-accent"
      : status === "cancelled"
        ? "text-destructive"
        : "text-muted-foreground";
  return <span className={cn("eyebrow capitalize", tone)}>{status}</span>;
}

export function AdminButton({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  return (
    <button
      {...props}
      className={cn(
        "eyebrow px-4 py-2.5 transition-colors disabled:opacity-50",
        variant === "primary" && "bg-foreground text-background hover:bg-accent",
        variant === "ghost" && "border border-border hover:border-accent hover:text-accent",
        variant === "danger" && "border border-destructive/40 text-destructive hover:bg-destructive/10",
        props.className,
      )}
    />
  );
}

export function AdminField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}

export const adminInputClass =
  "h-11 w-full border border-input bg-transparent px-3 text-sm outline-none focus:border-accent";

export const adminTextareaClass =
  "min-h-[96px] w-full border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";
