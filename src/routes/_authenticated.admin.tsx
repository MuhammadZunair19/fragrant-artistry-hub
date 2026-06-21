import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { checkAdminAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    try {
      await checkAdminAccess();
    } catch {
      throw redirect({ to: "/account" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <AdminShell />;
}
