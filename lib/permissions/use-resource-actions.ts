"use client";

import { useMemo } from "react";
import { usePermissionContext } from "./permission-context";

export function useResourceActions(resourceKey: string) {
  const { permissions } = usePermissionContext();

  return useMemo(() => {
    return permissions
      .filter((p) => p.resource_key === resourceKey)
      .map((p) => p.action_key);
  }, [permissions, resourceKey]);
}
