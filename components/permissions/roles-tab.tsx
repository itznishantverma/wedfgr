"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Shield, Users, Copy, Trash2, Settings2,
  Loader2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useTenantClient } from "@/hooks/use-tenant-client";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RoleData {
  id: string;
  name: string;
  display_name: string;
  rc: string;
  is_system: boolean;
  description: string | null;
  color: string | null;
  created_at: string;
  policy_count: number;
  user_count: number;
}

interface RolesTabProps {
  onEditPolicies: (roleId: string) => void;
}

export function RolesTab({ onEditPolicies }: RolesTabProps) {
  const client = useTenantClient();
  const { logout } = useAuth();
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleData | null>(null);
  const [cloneTarget, setCloneTarget] = useState<RoleData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formRc, setFormRc] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#0d9488");

  const fetchRoles = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data, error } = await client.rpc("rpc_list_roles_with_policy_count");
    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
      toast.error("Failed to load roles");
    } else {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setRoles(Array.isArray(parsed) ? parsed : []);
    }
    setLoading(false);
  }, [client, logout]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const resetForm = () => {
    setFormName("");
    setFormDisplayName("");
    setFormRc("");
    setFormDescription("");
    setFormColor("#0d9488");
  };

  const handleCreate = async () => {
    if (!client || !formName || !formDisplayName || !formRc) return;
    setSubmitting(true);
    const { error } = await client.rpc("rpc_create_custom_role", {
      p_name: formName.toLowerCase().replace(/\s+/g, "_"),
      p_display_name: formDisplayName,
      p_rc: formRc.toUpperCase(),
      p_description: formDescription || null,
      p_color: formColor || null,
    });
    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
      toast.error("Failed to create role");
    } else {
      toast.success("Role created");
      resetForm();
      setCreateOpen(false);
      fetchRoles();
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!client || !deleteTarget) return;
    setSubmitting(true);
    const { error } = await client.rpc("rpc_delete_custom_role", {
      p_role_id: deleteTarget.id,
    });
    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
      toast.error("Failed to delete role");
    } else {
      toast.success("Role deleted");
      setDeleteTarget(null);
      fetchRoles();
    }
    setSubmitting(false);
  };

  const handleClone = async () => {
    if (!client || !cloneTarget || !formName || !formDisplayName || !formRc) return;
    setSubmitting(true);

    const { data, error: createErr } = await client.rpc("rpc_create_custom_role", {
      p_name: formName.toLowerCase().replace(/\s+/g, "_"),
      p_display_name: formDisplayName,
      p_rc: formRc.toUpperCase(),
      p_description: formDescription || null,
      p_color: formColor || null,
    });

    if (createErr) {
      if (createErr.message?.includes("UNAUTHENTICATED")) { logout(); return; }
      toast.error("Failed to create role");
      setSubmitting(false);
      return;
    }

    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    const newRoleId = parsed?.id;

    if (newRoleId) {
      const { error: cloneErr } = await client.rpc("rpc_clone_role_policies", {
        p_source_role_id: cloneTarget.id,
        p_target_role_id: newRoleId,
      });
      if (cloneErr) {
        toast.error("Role created but policy cloning failed");
      } else {
        toast.success(`Role cloned from ${cloneTarget.display_name}`);
      }
    }

    resetForm();
    setCloneTarget(null);
    fetchRoles();
    setSubmitting(false);
  };

  const openClone = (role: RoleData) => {
    resetForm();
    setFormDescription(`Cloned from ${role.display_name}`);
    setCloneTarget(role);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {roles.length} role{roles.length !== 1 ? "s" : ""} configured
        </p>
        <Button
          size="sm"
          onClick={() => { resetForm(); setCreateOpen(true); }}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-3">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ backgroundColor: role.color || "#0d9488" }}
                >
                  {role.rc}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{role.display_name}</h3>
                    {role.is_system && (
                      <Badge variant="secondary" className="text-[10px]">System</Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {role.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {role.policy_count} policies
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {role.user_count} users
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Edit policies"
                    onClick={() => onEditPolicies(role.id)}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Clone role"
                    onClick={() => openClone(role)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!role.is_system && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Delete role"
                      onClick={() => setDeleteTarget(role)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new custom role with its own set of permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={formDisplayName}
                  onChange={(e) => {
                    setFormDisplayName(e.target.value);
                    setFormName(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                  }}
                  placeholder="e.g. Lab Assistant"
                />
              </div>
              <div className="space-y-2">
                <Label>Role Code (2 chars)</Label>
                <Input
                  value={formRc}
                  onChange={(e) => setFormRc(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="e.g. LA"
                  maxLength={2}
                  className="uppercase"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this role..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Badge Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !formDisplayName || !formRc || formRc.length !== 2}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cloneTarget} onOpenChange={(o) => !o && setCloneTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Role: {cloneTarget?.display_name}</DialogTitle>
            <DialogDescription>
              Create a new role with the same policies as {cloneTarget?.display_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Display Name</Label>
                <Input
                  value={formDisplayName}
                  onChange={(e) => {
                    setFormDisplayName(e.target.value);
                    setFormName(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                  }}
                  placeholder="e.g. Senior Teacher"
                />
              </div>
              <div className="space-y-2">
                <Label>New Role Code</Label>
                <Input
                  value={formRc}
                  onChange={(e) => setFormRc(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="e.g. SR"
                  maxLength={2}
                  className="uppercase"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Badge Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleClone}
              disabled={submitting || !formDisplayName || !formRc || formRc.length !== 2}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Clone Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Role: {deleteTarget?.display_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate all policy bindings for this role.
              {deleteTarget && deleteTarget.user_count > 0 && (
                <span className="block mt-2 text-red-500 font-medium">
                  This role has {deleteTarget.user_count} active user(s).
                  Reassign them before deleting.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
