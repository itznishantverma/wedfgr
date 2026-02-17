"use client";

import { Layers, ShieldCheck, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { usePermissionContext } from "@/lib/permissions/permission-context";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { ModuleCard } from "@/components/dashboard/module-card";
import {
  MODULE_REGISTRY,
  PRIMARY_MODULES,
  SECONDARY_MODULES,
} from "@/lib/permissions/permission-keys";
import { Card, CardContent } from "@/components/ui/card";

export function DynamicDashboard() {
  const { user } = useAuth();
  const { permissions, canModule } = usePermissionContext();

  const accessibleModules = MODULE_REGISTRY.filter((m) => canModule(m.key));
  const primaryAccessible = accessibleModules.filter((m) =>
    PRIMARY_MODULES.includes(m.key)
  );
  const secondaryAccessible = accessibleModules.filter((m) =>
    SECONDARY_MODULES.includes(m.key)
  );

  const uniqueActions = new Set(permissions.map((p) => p.action_key));
  const uniqueScopes = new Set(permissions.map((p) => p.scope_key));

  const roleName = user?.role?.display_name || "User";
  const additionalCount = user?.additional_roles?.length ?? 0;
  const subtitle = additionalCount > 0
    ? `${roleName} + ${additionalCount} more role${additionalCount > 1 ? "s" : ""}`
    : `${roleName} Dashboard`;

  return (
    <div className="space-y-6 max-w-7xl">
      <WelcomeBanner
        firstName={user?.first_name || "User"}
        subtitle={subtitle}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Accessible Modules"
          value={accessibleModules.length}
          icon={Layers}
        />
        <StatCard
          label="Permissions"
          value={permissions.length}
          icon={ShieldCheck}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Available Actions"
          value={uniqueActions.size}
          icon={KeyRound}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {primaryAccessible.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Core Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {primaryAccessible.map((m) => (
              <ModuleCard key={m.key} module={m} />
            ))}
          </div>
        </div>
      )}

      {secondaryAccessible.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Additional Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {secondaryAccessible.map((m) => (
              <ModuleCard key={m.key} module={m} />
            ))}
          </div>
        </div>
      )}

      {accessibleModules.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-lg">No Modules Assigned</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your role does not have access to any modules yet. Contact your
              administrator to get permissions assigned.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
