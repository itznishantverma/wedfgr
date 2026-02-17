"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus, Loader2, Shield, X, Calendar, User2,
} from "lucide-react";
import { toast } from "sonner";
import { useTenantClient } from "@/hooks/use-tenant-client";
import { usePermissionContext } from "@/lib/permissions/permission-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { UserRoleAssignment, AvailableRole } from "@/lib/types/user.types";
import type { UserResult } from "./user-search";

interface AdditionalRolesCardProps {
  user: UserResult;
}

export function AdditionalRolesCard({ user }: AdditionalRolesCardProps) {
  const client = useTenantClient();
  const { can } = usePermissionContext();
  const canCreate = can("user_role", "create");
  const canDelete = can("user_role", "delete");

  const [roles, setRoles] = useState<UserRoleAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const fetchRoles = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data, error } = await client.rpc("rpc_list_user_additional_roles", {
      p_user_id: user.id,
    });
    if (!error && data) {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setRoles(Array.isArray(parsed) ? parsed : []);
    }
    setLoading(false);
  }, [client, user.id]);

  const fetchAvailableRoles = useCallback(async () => {
    if (!client) return;
    setLoadingAvailable(true);
    const { data, error } = await client.rpc("rpc_get_available_roles_for_user", {
      p_user_id: user.id,
    });
    if (!error && data) {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setAvailableRoles(Array.isArray(parsed) ? parsed : []);
    }
    setLoadingAvailable(false);
  }, [client, user.id]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const openAssignDialog = () => {
    setSelectedRoleId("");
    setReason("");
    setExpiresAt("");
    fetchAvailableRoles();
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!client || !selectedRoleId) return;
    setSubmitting(true);

    const { error } = await client.rpc("rpc_assign_additional_role", {
      p_user_id: user.id,
      p_role_id: selectedRoleId,
      p_reason: reason.trim() || null,
      p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    });

    if (error) {
      const msg = error.message?.includes("primary role")
        ? "This is already the user's primary role"
        : "Failed to assign role";
      toast.error(msg);
    } else {
      toast.success("Role assigned successfully");
      setAssignOpen(false);
      fetchRoles();
    }
    setSubmitting(false);
  };

  const handleRemove = async (assignmentId: string, roleName: string) => {
    if (!client) return;
    const { error } = await client.rpc("rpc_remove_additional_role", {
      p_user_role_id: assignmentId,
    });
    if (error) {
      toast.error("Failed to remove role");
    } else {
      toast.success(`Removed ${roleName}`);
      fetchRoles();
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Additional Roles</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Primary: <span className="font-medium text-foreground">{user.role_name}</span> ({user.role_rc})
            </p>
          </div>
          {canCreate && (
            <Button
              size="sm"
              onClick={openAssignDialog}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Assign Role
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : roles.length > 0 ? (
            <div className="space-y-2">
              {roles.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div className="p-1.5 rounded-md bg-teal-50 mt-0.5">
                    <Shield className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{assignment.role_name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {assignment.role_rc}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {assignment.assigned_by_name && (
                        <span className="flex items-center gap-1">
                          <User2 className="h-3 w-3" />
                          {assignment.assigned_by_name}
                        </span>
                      )}
                      {assignment.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires {formatDate(assignment.expires_at)}
                        </span>
                      )}
                      {assignment.reason && (
                        <span className="truncate max-w-[200px]" title={assignment.reason}>
                          {assignment.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 h-8 w-8 p-0"
                      onClick={() => handleRemove(assignment.id, assignment.role_name)}
                      title="Remove role"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground py-4">
              <Shield className="h-6 w-6" />
              <p className="text-sm">No additional roles assigned to this user.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Additional Role</DialogTitle>
            <DialogDescription>
              Grant an additional role to {user.first_name} {user.last_name || ""}.
              This extends their permissions beyond their primary role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p>
                <span className="font-medium">User:</span> {user.unique_id}
              </p>
              <p>
                <span className="font-medium">Primary Role:</span> {user.role_name} ({user.role_rc})
              </p>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              {loadingAvailable ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available roles...
                </div>
              ) : (
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.display_name} ({role.rc})
                      </SelectItem>
                    ))}
                    {availableRoles.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No roles available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this additional role needed?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Expires At (optional)</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for a permanent assignment.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={submitting || !selectedRoleId}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
