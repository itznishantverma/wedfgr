"use client";

import { usePermissionContext } from "./permission-context";

export function usePermissions() {
  const { can, canAny, canAll, getScope, getFieldRules } = usePermissionContext();
  return { can, canAny, canAll, getScope, getFieldRules };
}
