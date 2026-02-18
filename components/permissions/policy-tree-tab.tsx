"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight, ChevronDown, Search, Loader2,
  Check, X, Minus,
} from "lucide-react";
import { toast } from "sonner";
import { useTenantClient } from "@/hooks/use-tenant-client";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface ActionNode {
  action_key: string;
  action_name: string;
  permission_id: string;
  granted: boolean;
  denied: boolean;
  scope_key: string | null;
  policy_id: string | null;
}

interface ResourceNode {
  resource_key: string;
  resource_name: string;
  actions: ActionNode[];
}

interface ModuleNode {
  module_key: string;
  module_name: string;
  module_icon: string | null;
  resources: ResourceNode[];
}

interface RoleOption {
  id: string;
  display_name: string;
  rc: string;
  is_system: boolean;
}

interface PolicyTreeTabProps {
  selectedRoleId: string | null;
  onSelectRole: (id: string | null) => void;
}

const SCOPE_OPTIONS = [
  { key: "self", label: "Self" },
  { key: "linked", label: "Linked" },
  { key: "assigned", label: "Assigned" },
  { key: "class", label: "Class" },
  { key: "section", label: "Section" },
  { key: "batch", label: "Batch" },
  { key: "grade_level", label: "Grade Level" },
  { key: "department", label: "Department" },
  { key: "branch", label: "Branch" },
  { key: "institute", label: "Institute" },
];

export function PolicyTreeTab({ selectedRoleId, onSelectRole }: PolicyTreeTabProps) {
  const client = useTenantClient();
  const { logout } = useAuth();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [tree, setTree] = useState<ModuleNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRoles = useCallback(async () => {
    if (!client) return;
    setRolesLoading(true);
    const { data, error } = await client.rpc("rpc_list_roles_with_policy_count");
    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
      toast.error("Failed to load roles");
    } else if (data) {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setRoles(Array.isArray(parsed) ? parsed : []);
    }
    setRolesLoading(false);
  }, [client, logout]);

  const fetchTree = useCallback(async () => {
    if (!client || !selectedRoleId) return;
    setLoading(true);
    const { data, error } = await client.rpc("rpc_get_role_policy_tree", {
      p_role_id: selectedRoleId,
    });
    if (error) {
      if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
      toast.error("Failed to load policy tree");
    } else {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setTree(Array.isArray(parsed) ? parsed : []);
    }
    setLoading(false);
  }, [client, selectedRoleId, logout]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);
  useEffect(() => { fetchTree(); }, [fetchTree]);

  const toggleModule = (key: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleResource = (key: string) => {
    setExpandedResources((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleToggleAction = async (action: ActionNode) => {
    if (!client || !selectedRoleId || !action.policy_id) return;

    if (action.granted) {
      const { error } = await client.rpc("rpc_remove_policy_from_role", {
        p_role_id: selectedRoleId,
        p_policy_id: action.policy_id,
      });
      if (error) {
        if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
        toast.error("Failed to remove policy");
        return;
      }
    } else {
      const { error } = await client.rpc("rpc_assign_policy_to_role", {
        p_role_id: selectedRoleId,
        p_policy_id: action.policy_id,
      });
      if (error) {
        if (error.message?.includes("UNAUTHENTICATED")) { logout(); return; }
        toast.error("Failed to assign policy");
        return;
      }
    }
    fetchTree();
  };

  const filteredTree = searchQuery
    ? tree
        .map((mod) => ({
          ...mod,
          resources: mod.resources
            .map((res) => ({
              ...res,
              actions: res.actions.filter(
                (a) =>
                  a.action_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  res.resource_name.toLowerCase().includes(searchQuery.toLowerCase())
              ),
            }))
            .filter((res) => res.actions.length > 0),
        }))
        .filter(
          (mod) =>
            mod.resources.length > 0 ||
            mod.module_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : tree;

  const getModuleGrantStats = (mod: ModuleNode) => {
    let total = 0;
    let granted = 0;
    for (const res of mod.resources) {
      for (const act of res.actions) {
        total++;
        if (act.granted) granted++;
      }
    }
    return { total, granted };
  };

  if (!selectedRoleId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select a Role</CardTitle>
        </CardHeader>
        <CardContent>
          {rolesLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelectRole(r.id)}
                  className="flex items-center gap-2 p-3 rounded-lg border hover:border-teal-300 hover:bg-teal-50/50 transition-all text-left"
                >
                  <Badge variant="outline" className="text-xs shrink-0">
                    {r.rc}
                  </Badge>
                  <span className="text-sm font-medium truncate">
                    {r.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectRole(null)}
        >
          Change Role
        </Button>
        {selectedRole && (
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-600">{selectedRole.rc}</Badge>
            <span className="font-medium text-sm">{selectedRole.display_name}</span>
            {selectedRole.is_system && (
              <Badge variant="secondary" className="text-[10px]">System</Badge>
            )}
          </div>
        )}
        <div className="ml-auto relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources or actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTree.map((mod) => {
            const stats = getModuleGrantStats(mod);
            const isExpanded = expandedModules.has(mod.module_key);

            return (
              <Card key={mod.module_key} className="overflow-hidden">
                <button
                  onClick={() => toggleModule(mod.module_key)}
                  className="flex items-center gap-3 w-full p-3 hover:bg-accent/30 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium text-sm flex-1">
                    {mod.module_name}
                  </span>
                  <Badge
                    variant={stats.granted === stats.total ? "default" : "outline"}
                    className={cn(
                      "text-xs",
                      stats.granted === stats.total && "bg-teal-600",
                      stats.granted === 0 && "text-muted-foreground"
                    )}
                  >
                    {stats.granted}/{stats.total}
                  </Badge>
                </button>

                {isExpanded && (
                  <div className="border-t">
                    {mod.resources.map((res) => {
                      const resKey = `${mod.module_key}.${res.resource_key}`;
                      const isResExpanded = expandedResources.has(resKey);

                      return (
                        <div key={resKey}>
                          <button
                            onClick={() => toggleResource(resKey)}
                            className="flex items-center gap-3 w-full px-6 py-2 hover:bg-accent/20 transition-colors text-left"
                          >
                            {isResExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-sm text-muted-foreground flex-1">
                              {res.resource_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {res.actions.filter((a) => a.granted).length}/{res.actions.length}
                            </span>
                          </button>

                          {isResExpanded && (
                            <div className="px-8 pb-2 space-y-1">
                              {res.actions.map((act) => (
                                <div
                                  key={`${resKey}.${act.action_key}`}
                                  className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-accent/20"
                                >
                                  <button
                                    onClick={() => handleToggleAction(act)}
                                    disabled={!act.policy_id}
                                    className={cn(
                                      "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                      act.granted && "bg-teal-600 border-teal-600 text-white",
                                      act.denied && "bg-red-100 border-red-300 text-red-600",
                                      !act.granted && !act.denied && "border-gray-300"
                                    )}
                                  >
                                    {act.granted && <Check className="h-3 w-3" />}
                                    {act.denied && <X className="h-3 w-3" />}
                                  </button>
                                  <span className="text-sm flex-1">
                                    {act.action_name}
                                  </span>
                                  {act.granted && act.scope_key && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {act.scope_key}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}

          {filteredTree.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "No matching results" : "No permission data available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
