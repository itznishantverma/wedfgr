"use client";

import { useState, useCallback } from "react";
import {
  Search, Loader2, UserCircle, Plus, Shield, X, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useTenantClient } from "@/hooks/use-tenant-client";
import { useAuth } from "@/lib/auth/auth-context";
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

interface UserResult {
  id: string;
  unique_id: string;
  first_name: string;
  last_name: string | null;
  role_name: string;
  role_rc: string;
}

interface PolicyResult {
  policy_id: string;
  module_name: string;
  module_key: string;
  resource_name: string;
  resource_key: string;
  action_name: string;
  action_key: string;
  scope_name: string;
  effect: string;
}

interface UserOverride {
  id: string;
  policy_id: string;
  override_effect: string;
  override_priority: number;
  reason: string | null;
  expires_at: string | null;
  granted_at: string;
  module_name: string;
  resource_name: string;
  action_name: string;
  scope_name: string;
}

export function UserOverridesTab() {
  const client = useTenantClient();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [overrideEffect, setOverrideEffect] = useState<"allow" | "deny">("allow");
  const [overridePriority, setOverridePriority] = useState("100");
  const [overrideReason, setOverrideReason] = useState("");

  const [policySearchQuery, setPolicySearchQuery] = useState("");
  const [policyResults, setPolicyResults] = useState<PolicyResult[]>([]);
  const [policySearching, setPolicySearching] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyResult | null>(null);

  const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!client || searchQuery.trim().length < 2) return;
    setSearching(true);
    const { data, error } = await client.rpc("rpc_search_users_for_override", {
      p_query: searchQuery.trim(),
    });
    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
      toast.error("Search failed");
    } else {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setUsers(Array.isArray(parsed) ? parsed : []);
    }
    setSearching(false);
  }, [client, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const fetchUserOverrides = useCallback(async (userId: string) => {
    if (!client) return;
    setOverridesLoading(true);
    const { data, error } = await client.rpc("rpc_list_user_overrides", {
      p_user_id: userId,
    });
    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
    } else if (data) {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setUserOverrides(Array.isArray(parsed) ? parsed : []);
    }
    setOverridesLoading(false);
  }, [client, logout]);

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user);
    fetchUserOverrides(user.id);
  };

  const openOverrideDialog = () => {
    setOverrideEffect("allow");
    setOverridePriority("100");
    setOverrideReason("");
    setPolicySearchQuery("");
    setPolicyResults([]);
    setSelectedPolicy(null);
    setOverrideOpen(true);
  };

  const handlePolicySearch = useCallback(async () => {
    if (!client || policySearchQuery.trim().length < 2) return;
    setPolicySearching(true);
    const { data, error } = await client.rpc("rpc_search_policies", {
      p_query: policySearchQuery.trim(),
    });
    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
    } else if (data) {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setPolicyResults(Array.isArray(parsed) ? parsed : []);
    }
    setPolicySearching(false);
  }, [client, policySearchQuery, logout]);

  const handlePolicyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handlePolicySearch();
  };

  const handleSubmit = async () => {
    if (!client || !selectedUser || !selectedPolicy) return;

    const priority = parseInt(overridePriority, 10);
    if (isNaN(priority) || priority < 0 || priority > 1000) {
      toast.error("Priority must be between 0 and 1000");
      return;
    }

    setSubmitting(true);
    const { error } = await client.rpc("rpc_create_user_override", {
      p_user_id: selectedUser.id,
      p_policy_id: selectedPolicy.policy_id,
      p_effect: overrideEffect,
      p_priority: priority,
      p_reason: overrideReason.trim() || null,
      p_expires_at: null,
    });

    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
      toast.error("Failed to create override");
    } else {
      toast.success("Override created");
      setOverrideOpen(false);
      fetchUserOverrides(selectedUser.id);
    }
    setSubmitting(false);
  };

  const handleDeactivateOverride = async (overrideId: string) => {
    if (!client || !selectedUser) return;
    const { error } = await client.rpc("rpc_deactivate_user_override", {
      p_override_id: overrideId,
    });
    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
      toast.error("Failed to deactivate override");
    } else {
      toast.success("Override deactivated");
      fetchUserOverrides(selectedUser.id);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Find User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by unique ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching || searchQuery.trim().length < 2}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {users.length > 0 && (
            <div className="mt-4 space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`flex items-center gap-3 p-3 rounded-lg border w-full text-left transition-colors ${
                    selectedUser?.id === user.id
                      ? "border-teal-400 bg-teal-50/50"
                      : "hover:border-teal-200"
                  }`}
                >
                  <UserCircle className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {user.first_name} {user.last_name || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.unique_id}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {user.role_rc} - {user.role_name}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {users.length === 0 && searchQuery.length >= 2 && !searching && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              No users found matching your search.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              Overrides for {selectedUser.first_name} {selectedUser.last_name || ""}
            </CardTitle>
            <Button
              size="sm"
              onClick={openOverrideDialog}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Override
            </Button>
          </CardHeader>
          <CardContent>
            {overridesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : userOverrides.length > 0 ? (
              <div className="space-y-2">
                {userOverrides.map((ov) => (
                  <div
                    key={ov.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {ov.module_name} / {ov.resource_name} / {ov.action_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={ov.override_effect === "allow" ? "default" : "destructive"}
                          className={`text-[10px] ${
                            ov.override_effect === "allow" ? "bg-emerald-600" : ""
                          }`}
                        >
                          {ov.override_effect}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Priority: {ov.override_priority}
                        </span>
                        {ov.reason && (
                          <span className="text-xs text-muted-foreground truncate">
                            {ov.reason}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                      onClick={() => handleDeactivateOverride(ov.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground py-4">
                <Shield className="h-6 w-6" />
                <p className="text-sm">No active overrides for this user.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedUser && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Shield className="h-8 w-8" />
              <div>
                <p className="font-medium text-foreground text-sm">
                  User Policy Overrides
                </p>
                <p className="text-sm">
                  Search for a user above, then add specific allow or deny overrides
                  to fine-tune their access beyond what their role provides.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add Override for {selectedUser?.first_name} {selectedUser?.last_name || ""}
            </DialogTitle>
            <DialogDescription>
              Override a specific policy for this user. This takes precedence over
              their role-level permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p>
                <span className="font-medium">User:</span>{" "}
                {selectedUser?.unique_id}
              </p>
              <p>
                <span className="font-medium">Current Role:</span>{" "}
                {selectedUser?.role_name} ({selectedUser?.role_rc})
              </p>
            </div>

            <div className="space-y-2">
              <Label>Policy</Label>
              {selectedPolicy ? (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-teal-300 bg-teal-50/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {selectedPolicy.module_name} / {selectedPolicy.resource_name} / {selectedPolicy.action_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Scope: {selectedPolicy.scope_name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedPolicy(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search policies by module, resource, or action..."
                        value={policySearchQuery}
                        onChange={(e) => setPolicySearchQuery(e.target.value)}
                        onKeyDown={handlePolicyKeyDown}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePolicySearch}
                      disabled={policySearching || policySearchQuery.trim().length < 2}
                    >
                      {policySearching ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Search"
                      )}
                    </Button>
                  </div>
                  {policyResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                      {policyResults.map((pol) => (
                        <button
                          key={pol.policy_id}
                          onClick={() => {
                            setSelectedPolicy(pol);
                            setPolicyResults([]);
                          }}
                          className="flex items-center gap-2 w-full p-2 text-left hover:bg-accent/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {pol.module_name} / {pol.resource_name} / {pol.action_name}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {pol.scope_name}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effect</Label>
                <Select
                  value={overrideEffect}
                  onValueChange={(v) => setOverrideEffect(v as "allow" | "deny")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="deny">Deny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value)}
                  min={0}
                  max={1000}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Why is this override needed?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedPolicy}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
