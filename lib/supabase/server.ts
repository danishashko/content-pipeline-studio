import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client. Uses the service role key, which bypasses RLS.
 * RLS stays enabled on the tables so the public anon key cannot mutate data
 * directly from the browser — this client is the only sanctioned write path.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
