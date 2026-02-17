"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { PermissionProvider } from "@/lib/permissions/permission-context";

function PermissionBridge({ children }: { children: ReactNode }) {
  const { permissions } = useAuth();
  return (
    <PermissionProvider permissions={permissions || []}>
      {children}
    </PermissionProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PermissionBridge>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </PermissionBridge>
    </AuthProvider>
  );
}
