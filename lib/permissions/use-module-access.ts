"use client";

import { useMemo } from "react";
import { usePermissionContext } from "./permission-context";

export function useModuleAccess(moduleKey: string) {
  const { permissions } = usePermissionContext();

  return useMemo(() => {
    const modulePerms = permissions.filter((p) => p.module_key === moduleKey);
    return {
      hasAccess: modulePerms.length > 0,
      permissionCount: modulePerms.length,
    };
  }, [permissions, moduleKey]);
}
