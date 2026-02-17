import { createClient, SupabaseClient } from "@supabase/supabase-js";

let masterClient: SupabaseClient | null = null;

export function getMasterClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_MASTER_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_MASTER_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  if (!masterClient) {
    masterClient = createClient(url, anonKey);
  }

  return masterClient;
}
