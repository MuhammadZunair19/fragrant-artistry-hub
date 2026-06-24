import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { checkAdminAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    try {
      await checkAdminAccess();
    } catch {
      throw redirect({ to: "/account" });
    }
  },
  component: AdminLayout,
  pendingComponent: AdminPending,
});

function AdminPending() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center pt-24">
      <p className="eyebrow text-muted-foreground">Loading admin…</p>
    </div>
  );
}

function AdminLayout() {
  return <AdminShell />;
}
