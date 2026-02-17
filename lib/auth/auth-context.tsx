"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AuthState, AuthStatus, LoginResponse } from "@/lib/types/auth.types";
import { UserPermission } from "@/lib/types/permission.types";
import { InstitutePublicCredentials } from "@/lib/types/institute.types";
import {
  parseUniqueId,
  loginWithTenant,
} from "@/lib/services/auth.service";
import { resolveInstitute } from "@/lib/services/institute.service";
import { createTenantClient } from "@/lib/supabase/tenant-client";

const AUTH_STORAGE_KEY = "oxedro-auth";

interface AuthContextValue extends AuthState {
  login: (uniqueId: string, password: string, preResolved?: InstitutePublicCredentials) => Promise<void>;
  logout: () => void;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildState(status: AuthStatus, partial?: Partial<AuthState>): AuthState {
  return {
    user: null,
    session: null,
    permissions: null,
    tenantUrl: null,
    tenantAnonKey: null,
    instCode: null,
    ...partial,
    authStatus: status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}

function loadFromStorage(): Partial<AuthState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveToStorage(state: Partial<AuthState>) {
  if (typeof window === "undefined") return;
  try {
    const { authStatus, isLoading, isAuthenticated, ...persistable } = state as AuthState;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persistable));
  } catch {}
}

async function setSessionCookie(accessToken: string): Promise<void> {
  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken }),
    });
  } catch {}
}

async function clearSessionCookie(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {}
}

function clearStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function fetchPermissionsFromClient(
  tenantUrl: string,
  tenantAnonKey: string,
  accessToken: string
): Promise<UserPermission[]> {
  try {
    const client = createTenantClient(tenantUrl, tenantAnonKey, accessToken);
    const { data, error } = await client.rpc("rpc_get_my_permissions");

    if (error) {
      return [];
    }

    if (Array.isArray(data)) {
      return data as UserPermission[];
    }

    if (data && typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed as UserPermission[];
      } catch {}
    }

    return [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(buildState("loading"));

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.session && stored.user) {
      const now = Math.floor(Date.now() / 1000);
      if (stored.session.expires_at && stored.session.expires_at > now) {
        const restoredState = buildState("authenticated", {
          user: stored.user as LoginResponse["user"],
          session: stored.session as LoginResponse["session"],
          permissions: (stored.permissions as LoginResponse["permissions"]) || [],
          tenantUrl: (stored.tenantUrl as string) || null,
          tenantAnonKey: (stored.tenantAnonKey as string) || null,
          instCode: (stored.instCode as string) || null,
        });
        setState(restoredState);

        setSessionCookie(restoredState.session!.access_token);

        const perms = restoredState.permissions;
        if (
          (!perms || perms.length === 0) &&
          restoredState.tenantUrl &&
          restoredState.tenantAnonKey &&
          restoredState.session?.access_token
        ) {
          fetchPermissionsFromClient(
            restoredState.tenantUrl,
            restoredState.tenantAnonKey,
            restoredState.session.access_token
          ).then((fetched) => {
            if (fetched.length > 0) {
              setState((prev) => {
                const updated = { ...prev, permissions: fetched };
                saveToStorage(updated);
                return updated;
              });
            }
          });
        }
        return;
      }
    }
    clearStorage();
    clearSessionCookie();
    setState(buildState("unauthenticated"));
  }, []);

  const login = useCallback(
    async (uniqueId: string, password: string, preResolved?: InstitutePublicCredentials) => {
      let institute = preResolved;

      if (!institute) {
        const parsed = parseUniqueId(uniqueId);
        if (!parsed) {
          throw new Error(
            "Invalid unique ID format. Expected format: INSTYYRCNNNN"
          );
        }

        const resolved = await resolveInstitute(parsed.inst_code);
        if (!resolved) {
          throw new Error(
            `Institute "${parsed.inst_code}" not found or inactive`
          );
        }
        institute = resolved;
      }

      const result = await loginWithTenant(
        institute.supabase_url,
        institute.supabase_anon_key,
        uniqueId,
        password
      );

      let permissions = result.permissions || [];

      if (permissions.length === 0 && result.session?.access_token) {
        permissions = await fetchPermissionsFromClient(
          institute.supabase_url,
          institute.supabase_anon_key,
          result.session.access_token
        );
      }

      const newState = buildState("authenticated", {
        user: result.user,
        session: result.session,
        permissions,
        tenantUrl: institute.supabase_url,
        tenantAnonKey: institute.supabase_anon_key,
        instCode: institute.inst_code,
      });

      saveToStorage(newState);
      await setSessionCookie(result.session.access_token);
      setState(newState);
    },
    []
  );

  const refreshPermissions = useCallback(async () => {
    if (!state.tenantUrl || !state.tenantAnonKey || !state.session?.access_token) return;

    const fetched = await fetchPermissionsFromClient(
      state.tenantUrl,
      state.tenantAnonKey,
      state.session.access_token
    );

    if (fetched.length > 0) {
      setState((prev) => {
        const updated = { ...prev, permissions: fetched };
        saveToStorage(updated);
        return updated;
      });
    }
  }, [state.tenantUrl, state.tenantAnonKey, state.session?.access_token]);

  const logout = useCallback(() => {
    clearStorage();
    clearSessionCookie();
    setState(buildState("unauthenticated"));
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
