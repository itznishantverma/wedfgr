"use client";

import { useState, useMemo } from "react";
import { Shield, Search, ChevronDown, ChevronRight } from "lucide-react";
import { usePermissionContext } from "@/lib/permissions/permission-context";
import { getModuleMeta } from "@/lib/permissions/permission-keys";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MyPermissionsPage() {
  const { permissions } = usePermissionContext();
  const [search, setSearch] = useState("");
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<string, typeof permissions>();
    for (const p of permissions) {
      const existing = map.get(p.module_key);
      if (existing) {
        existing.push(p);
      } else {
        map.set(p.module_key, [p]);
      }
    }
    return map;
  }, [permissions]);

  const filteredModules = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    const result: { key: string; perms: typeof permissions }[] = [];

    grouped.forEach((perms, key) => {
      if (!search) {
        result.push({ key, perms });
        return;
      }
      const filtered = perms.filter(
        (p) =>
          p.resource_key.includes(lowerSearch) ||
          p.action_key.includes(lowerSearch) ||
          p.scope_key.includes(lowerSearch) ||
          key.includes(lowerSearch)
      );
      if (filtered.length > 0) {
        result.push({ key, perms: filtered });
      }
    });

    return result.sort((a, b) => a.key.localeCompare(b.key));
  }, [grouped, search]);

  const toggleModule = (key: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-teal-50">
          <Shield className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My Permissions</h1>
          <p className="text-sm text-muted-foreground">
            {permissions.length} permissions across {grouped.size} modules
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by resource, action, or scope..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filteredModules.map(({ key, perms }) => {
          const meta = getModuleMeta(key);
          const isOpen = openModules.has(key);
          const Icon = meta?.icon;

          return (
            <Collapsible key={key} open={isOpen} onOpenChange={() => toggleModule(key)}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors rounded-lg">
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      {Icon && <Icon className="h-4 w-4 text-teal-600 shrink-0" />}
                      <span className="text-sm font-medium capitalize">
                        {meta?.displayName || key}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {perms.length} permissions
                    </Badge>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-3 px-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Resource</TableHead>
                          <TableHead className="text-xs">Action</TableHead>
                          <TableHead className="text-xs">Scope</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {perms.map((p) => (
                          <TableRow key={`${p.resource_key}:${p.action_key}`}>
                            <TableCell className="text-sm capitalize py-2">
                              {p.resource_key.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {p.action_key}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {p.scope_key}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {filteredModules.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {search ? "No permissions match your search" : "No permissions assigned"}
          </div>
        )}
      </div>
    </div>
  );
}
