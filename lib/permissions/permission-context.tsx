"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { UserPermission, FieldVisibility } from "@/lib/types/permission.types";
import { evaluateConditions } from "./conditions-evaluator";

type ConditionContext = Record<string, unknown>;

interface PermissionContextValue {
  permissions: UserPermission[];
  can: (resource: string, action: string, conditionCtx?: ConditionContext) => boolean;
  canAny: (resource: string, actions: string[], conditionCtx?: ConditionContext) => boolean;
  canAll: (resource: string, actions: string[], conditionCtx?: ConditionContext) => boolean;
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

    const can = (resource: string, action: string, conditionCtx?: ConditionContext): boolean => {
      const perm = permMap.get(`${resource}:${action}`);
      if (!perm) return false;
      if (perm.conditions) {
        return evaluateConditions(perm.conditions, conditionCtx ?? {});
      }
      return true;
    };

    const canAny = (resource: string, actions: string[], conditionCtx?: ConditionContext): boolean => {
      return actions.some((a) => can(resource, a, conditionCtx));
    };

    const canAll = (resource: string, actions: string[], conditionCtx?: ConditionContext): boolean => {
      return actions.every((a) => can(resource, a, conditionCtx));
    };

    const getScope = (resource: string, action: string): string | null => {
      return permMap.get(`${resource}:${action}`)?.scope_key ?? null;
    };

    const getFieldRules = (resource: string, action: string): Record<string, FieldVisibility> | null => {
      return permMap.get(`${resource}:${action}`)?.field_rules ?? null;
    };

    const canModule = (moduleKey: string): boolean => {
      const modulePerms = moduleMap.get(moduleKey);
      if (!modulePerms || modulePerms.length === 0) return false;
      return modulePerms.some((p) => evaluateConditions(p.conditions, {}));
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
