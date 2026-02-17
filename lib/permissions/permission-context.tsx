"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { UserPermission, FieldVisibility } from "@/lib/types/permission.types";

interface PermissionContextValue {
  permissions: UserPermission[];
  can: (resource: string, action: string) => boolean;
  canAny: (resource: string, actions: string[]) => boolean;
  canAll: (resource: string, actions: string[]) => boolean;
  getScope: (resource: string, action: string) => string | null;
  getFieldRules: (resource: string, action: string) => Record<string, FieldVisibility> | null;
  canModule: (moduleKey: string) => boolean;
  getModulePermissions: (moduleKey: string) => UserPermission[];
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

interface PermissionProviderProps {
  permissions: UserPermission[];
  children: ReactNode;
}

export function PermissionProvider({ permissions, children }: PermissionProviderProps) {
  const value = useMemo(() => {
    const permMap = new Map<string, UserPermission>();
    const moduleMap = new Map<string, UserPermission[]>();

    for (const p of permissions) {
      permMap.set(`${p.resource_key}:${p.action_key}`, p);
      const existing = moduleMap.get(p.module_key);
      if (existing) {
        existing.push(p);
      } else {
        moduleMap.set(p.module_key, [p]);
      }
    }

    const can = (resource: string, action: string): boolean => {
      return permMap.has(`${resource}:${action}`);
    };

    const canAny = (resource: string, actions: string[]): boolean => {
      return actions.some((a) => can(resource, a));
    };

    const canAll = (resource: string, actions: string[]): boolean => {
      return actions.every((a) => can(resource, a));
    };

    const getScope = (resource: string, action: string): string | null => {
      return permMap.get(`${resource}:${action}`)?.scope_key ?? null;
    };

    const getFieldRules = (resource: string, action: string): Record<string, FieldVisibility> | null => {
      return permMap.get(`${resource}:${action}`)?.field_rules ?? null;
    };

    const canModule = (moduleKey: string): boolean => {
      return moduleMap.has(moduleKey);
    };

    const getModulePermissions = (moduleKey: string): UserPermission[] => {
      return moduleMap.get(moduleKey) || [];
    };

    return { permissions, can, canAny, canAll, getScope, getFieldRules, canModule, getModulePermissions };
  }, [permissions]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error("usePermissionContext must be used within a PermissionProvider");
  }
  return ctx;
}
