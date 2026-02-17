"use client";

import { ReactNode } from "react";
import { usePermissionContext } from "@/lib/permissions/permission-context";

interface GateProps {
  resource: string;
  action: string | string[];
  any?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Gate({ resource, action, any: useAny, fallback, children }: GateProps) {
  const { can, canAny, canAll } = usePermissionContext();

  const actions = Array.isArray(action) ? action : [action];

  const allowed = actions.length === 1
    ? can(resource, actions[0])
    : useAny
      ? canAny(resource, actions)
      : canAll(resource, actions);

  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
