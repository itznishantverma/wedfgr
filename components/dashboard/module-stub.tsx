"use client";

import Link from "next/link";
import { Construction, Lock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissionContext } from "@/lib/permissions/permission-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getModuleMeta, type ModuleKey } from "@/lib/permissions/permission-keys";

interface ModuleStubProps {
  moduleKey: ModuleKey;
  resources: string[];
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="p-4 rounded-full bg-red-50">
        <Lock className="h-8 w-8 text-red-400" />
      </div>
      <div className="text-center space-y-1.5">
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          You do not have permission to access this module. Contact your administrator if you need access.
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}

export function ModuleStub({ moduleKey, resources }: ModuleStubProps) {
  const { canModule } = usePermissionContext();
  const meta = getModuleMeta(moduleKey);

  if (!canModule(moduleKey)) {
    return <AccessDenied />;
  }

  if (!meta) return null;

  const Icon = meta.icon;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-teal-50">
          <Icon className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{meta.displayName}</h1>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center py-12 space-y-4">
          <div className="p-3 rounded-full bg-amber-50">
            <Construction className="h-6 w-6 text-amber-500" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-medium">Under Development</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              This module is being built. The following resources are planned:
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-lg">
            {resources.map((r) => (
              <Badge key={r} variant="secondary" className="text-xs capitalize">
                {r.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
