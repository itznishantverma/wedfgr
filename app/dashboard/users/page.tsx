"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Lock, ArrowLeft, Construction } from "lucide-react";
import { usePermissionContext } from "@/lib/permissions/permission-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gate } from "@/components/permissions/gate";
import { UserSearch, type UserResult } from "@/components/users/user-search";
import { AdditionalRolesCard } from "@/components/users/additional-roles-card";

const PLANNED_RESOURCES = [
  "profile", "teacher_profile", "student_profile",
  "parent_profile", "staff_profile", "bulk_import",
];

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

export default function UsersPage() {
  const { canModule, can } = usePermissionContext();
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  if (!canModule("users")) {
    return <AccessDenied />;
  }

  const canReadUserRole = can("user_role", "read");

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-teal-50">
          <Users className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">User and profile management</p>
        </div>
      </div>

      <Gate resource="user_role" action={["read", "create"]} any>
        <UserSearch
          selectedUserId={selectedUser?.id ?? null}
          onSelectUser={setSelectedUser}
        />

        {selectedUser && canReadUserRole && (
          <AdditionalRolesCard user={selectedUser} />
        )}
      </Gate>

      <Card>
        <CardContent className="flex flex-col items-center py-10 space-y-4">
          <div className="p-3 rounded-full bg-amber-50">
            <Construction className="h-6 w-6 text-amber-500" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-medium">More Features Coming</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              The following resources are planned for this module:
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-lg">
            {PLANNED_RESOURCES.map((r) => (
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
