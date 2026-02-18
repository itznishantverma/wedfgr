import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createTenantClient } from "@/lib/supabase/tenant-client";
import { getMasterClient } from "@/lib/supabase/master-client";
import { UserPermission } from "@/lib/types/permission.types";
import { verifyJwt } from "@/lib/auth/jwt";

function extractTenantUrl(issuer: string): string | null {
  try {
    const url = new URL(issuer.replace("/auth/v1", ""));
    return url.origin;
  } catch {
    return null;
  }
}

async function resolveAnonKey(tenantUrl: string): Promise<string | null> {
  const masterClient = getMasterClient();
  if (!masterClient) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
  }

  const { data } = await masterClient.rpc("get_institute_anon_key_by_url", {
    p_url: tenantUrl,
  });
  return data ?? null;
}

export interface ServerPermissionContext {
  userId: string;
  permissions: UserPermission[];
  can: (resource: string, action: string) => boolean;
  canAny: (resource: string, actions: string[]) => boolean;
}

export async function getServerPermissions(): Promise<ServerPermissionContext | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("oxedro-auth-token")?.value;

  if (!token) return null;

  const payload = await verifyJwt(token);
  if (!payload) return null;

  const tenantUrl = extractTenantUrl(payload.iss);
  if (!tenantUrl) return null;

  const anonKey = await resolveAnonKey(tenantUrl);
  if (!anonKey) return null;

  const client = createTenantClient(tenantUrl, anonKey, token);
  const { data, error } = await client.rpc("rpc_get_my_permissions");

  if (error || !data) return null;

  const permissions: UserPermission[] = Array.isArray(data)
    ? (data as UserPermission[])
    : [];

  const permSet = new Set(permissions.map((p) => `${p.resource_key}:${p.action_key}`));

  const can = (resource: string, action: string) =>
    permSet.has(`${resource}:${action}`);

  const canAny = (resource: string, actions: string[]) =>
    actions.some((a) => can(resource, a));

  return { userId: payload.sub, permissions, can, canAny };
}

export function permissionDenied(message = "Permission denied") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function requireAuth(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const cookieStore = cookies();
  const token = cookieStore.get("oxedro-auth-token")?.value;
  if (!token) return { response: unauthorized() };

  const payload = await verifyJwt(token);
  if (!payload) return { response: unauthorized() };

  return { userId: payload.sub };
}

export async function requirePermission(
  resource: string,
  action: string
): Promise<{ ctx: ServerPermissionContext } | { response: NextResponse }> {
  const ctx = await getServerPermissions();
  if (!ctx) return { response: unauthorized() };
  if (!ctx.can(resource, action)) return { response: permissionDenied() };
  return { ctx };
}
