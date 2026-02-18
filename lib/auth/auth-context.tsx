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
  refreshPermissions: () => Promise<{ success: boolean; error?: string }>;
  permissionError: string | null;
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

interface StoredSession {
  user: LoginResponse["user"] | null;
  session: { access_token: string; expires_at: number } | null;
  tenantUrl: string | null;
  tenantAnonKey: string | null;
  instCode: string | null;
}

function loadFromStorage(): StoredSession {
  if (typeof window === "undefined") return { user: null, session: null, tenantUrl: null, tenantAnonKey: null, instCode: null };
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { user: null, session: null, tenantUrl: null, tenantAnonKey: null, instCode: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, session: null, tenantUrl: null, tenantAnonKey: null, instCode: null };
  }
}

function saveToStorage(state: Partial<AuthState>) {
  if (typeof window === "undefined") return;
  try {
    const s = state as AuthState;
    const minimal: StoredSession = {
      user: s.user,
      session: s.session
        ? { access_token: s.session.access_token, expires_at: s.session.expires_at }
        : null,
      tenantUrl: s.tenantUrl,
      tenantAnonKey: s.tenantAnonKey,
      instCode: s.instCode,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(minimal));
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
): Promise<{ permissions: UserPermission[]; error?: string; unauthenticated?: boolean }> {
  try {
    const client = createTenantClient(tenantUrl, tenantAnonKey, accessToken);
    const { data, error } = await client.rpc("rpc_get_my_permissions");

    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) {
        return { permissions: [], unauthenticated: true };
      }
      return { permissions: [], error: "Failed to load permissions" };
    }

    if (Array.isArray(data)) {
      return { permissions: data as UserPermission[] };
    }

    if (data && typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return { permissions: parsed as UserPermission[] };
      } catch {}
    }

    return { permissions: [] };
  } catch {
    return { permissions: [], error: "Permission fetch failed" };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(buildState("loading"));
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.session && stored.user) {
      const now = Math.floor(Date.now() / 1000);
      if (stored.session.expires_at && stored.session.expires_at > now) {
        const restoredState = buildState("authenticated", {
          user: stored.user,
          session: stored.session as LoginResponse["session"],
          permissions: [],
          tenantUrl: stored.tenantUrl,
          tenantAnonKey: stored.tenantAnonKey,
          instCode: stored.instCode,
        });
        setState(restoredState);
        setSessionCookie(restoredState.session!.access_token);

        if (stored.tenantUrl && stored.tenantAnonKey && stored.session?.access_token) {
          fetchPermissionsFromClient(
            stored.tenantUrl,
            stored.tenantAnonKey,
            stored.session.access_token
          ).then(({ permissions, error, unauthenticated }) => {
            if (unauthenticated) {
              clearStorage();
              clearSessionCookie();
              setState(buildState("unauthenticated"));
              window.location.href = "/login";
              return;
            }
            if (error) {
              setPermissionError(error);
            }
            setState((prev) => ({ ...prev, permissions }));
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

      let permissions: UserPermission[] = result.permissions || [];

      if (permissions.length === 0 && result.session?.access_token) {
        const { permissions: fetched, error } = await fetchPermissionsFromClient(
          institute.supabase_url,
          institute.supabase_anon_key,
          result.session.access_token
        );
        if (error) setPermissionError(error);
        permissions = fetched;
      }

      setPermissionError(null);

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
    if (!state.tenantUrl || !state.tenantAnonKey || !state.session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    const { permissions, error, unauthenticated } = await fetchPermissionsFromClient(
      state.tenantUrl,
      state.tenantAnonKey,
      state.session.access_token
    );

    if (unauthenticated) {
      clearStorage();
      clearSessionCookie();
      setPermissionError(null);
      setState(buildState("unauthenticated"));
      window.location.href = "/login";
      return { success: false, error: "UNAUTHENTICATED" };
    }

    if (error) {
      setPermissionError(error);
      return { success: false, error };
    }

    setPermissionError(null);
    setState((prev) => ({ ...prev, permissions }));
    return { success: true };
  }, [state.tenantUrl, state.tenantAnonKey, state.session?.access_token]);

  const logout = useCallback(() => {
    clearStorage();
    clearSessionCookie();
    setPermissionError(null);
    setState(buildState("unauthenticated"));
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshPermissions, permissionError }}>
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
