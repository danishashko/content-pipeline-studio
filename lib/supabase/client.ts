import { createBrowserClient } from "@supabase/ssr";

/**
 * Returns a Supabase client for use in browser (Client Components).
 * Reads credentials from public environment variables.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
