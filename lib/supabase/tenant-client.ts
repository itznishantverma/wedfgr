import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function createTenantClient(
  url: string,
  anonKey: string,
  accessToken?: string
): SupabaseClient {
  const client = createClient(url, anonKey, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
  return client;
}
