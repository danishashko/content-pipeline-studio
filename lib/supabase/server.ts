import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase client for use in Server Components and API routes.
 * Uses the anon key directly (no cookie-based auth needed for this demo app).
 */
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
