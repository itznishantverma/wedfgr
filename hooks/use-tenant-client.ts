"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createTenantClient } from "@/lib/supabase/tenant-client";

export function useTenantClient() {
  const { tenantUrl, tenantAnonKey, session } = useAuth();

  return useMemo(() => {
    if (!tenantUrl || !tenantAnonKey || !session?.access_token) return null;
    return createTenantClient(tenantUrl, tenantAnonKey, session.access_token);
  }, [tenantUrl, tenantAnonKey, session?.access_token]);
}
