"use client";

import { ReactNode } from "react";
import { usePermissionContext } from "@/lib/permissions/permission-context";

type ConditionContext = Record<string, unknown>;

interface GateProps {
  resource: string;
  action: string | string[];
  any?: boolean;
  conditionCtx?: ConditionContext;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Gate({ resource, action, any: useAny, conditionCtx, fallback, children }: GateProps) {
  const { can, canAny, canAll } = usePermissionContext();

  const actions = Array.isArray(action) ? action : [action];

  const allowed = actions.length === 1
    ? can(resource, actions[0], conditionCtx)
    : useAny
      ? canAny(resource, actions, conditionCtx)
      : canAll(resource, actions, conditionCtx);

  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
