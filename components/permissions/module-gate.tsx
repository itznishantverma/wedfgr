"use client";

import { ReactNode } from "react";
import { usePermissionContext } from "@/lib/permissions/permission-context";

interface ModuleGateProps {
  moduleKey: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function ModuleGate({ moduleKey, fallback, children }: ModuleGateProps) {
  const { canModule } = usePermissionContext();

  if (!canModule(moduleKey)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
