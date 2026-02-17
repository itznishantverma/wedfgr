import { Role } from "./user.types";
import { UserPermission } from "./permission.types";

export interface ParsedUniqueId {
  inst_code: string;
  year: string;
  role_code: string;
  sequence: string;
}

export interface LoginRequest {
  unique_id: string;
  password: string;
}

export interface LoginResponse {
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  user: {
    id: string;
    unique_id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string | null;
    role: Role;
    additional_roles?: Role[];
  };
  permissions: UserPermission[];
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  user: LoginResponse["user"] | null;
  session: LoginResponse["session"] | null;
  permissions: UserPermission[] | null;
  tenantUrl: string | null;
  tenantAnonKey: string | null;
  instCode: string | null;
  authStatus: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
}
