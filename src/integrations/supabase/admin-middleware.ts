import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "./auth-middleware";

export const requireSupabaseAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });

    if (error || !isAdmin) {
      throw new Error("Forbidden: Admin access required");
    }

    return next({ context: { ...context, isAdmin: true as const } });
  });
