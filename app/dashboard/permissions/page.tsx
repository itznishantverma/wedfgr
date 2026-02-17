"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RolesTab } from "@/components/permissions/roles-tab";
import { PolicyTreeTab } from "@/components/permissions/policy-tree-tab";
import { UserOverridesTab } from "@/components/permissions/user-overrides-tab";
import { ModuleGate } from "@/components/permissions/module-gate";

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState("roles");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const handleEditPolicies = (roleId: string) => {
    setSelectedRoleId(roleId);
    setActiveTab("policies");
  };

  return (
    <ModuleGate moduleKey="permissions">
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-50">
            <Shield className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Permissions Manager
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage roles, policies, and user-level access overrides
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="overrides">User Overrides</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-6">
            <RolesTab onEditPolicies={handleEditPolicies} />
          </TabsContent>

          <TabsContent value="policies" className="mt-6">
            <PolicyTreeTab
              selectedRoleId={selectedRoleId}
              onSelectRole={setSelectedRoleId}
            />
          </TabsContent>

          <TabsContent value="overrides" className="mt-6">
            <UserOverridesTab />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleGate>
  );
}
