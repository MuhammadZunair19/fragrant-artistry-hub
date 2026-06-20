import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const EmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(254),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator((input: unknown) => EmailSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const url =
      process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
    const key =
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { ok: false, error: "Backend unavailable" };
    const sb = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const { error } = await sb
      .from("newsletter_subscribers")
      .insert({ email: data.email });
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        // already subscribed — treat as success
        return { ok: true };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true };
  });
