"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { useTenantClient } from "@/hooks/use-tenant-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserResult {
  id: string;
  unique_id: string;
  first_name: string;
  last_name: string | null;
  role_name: string;
  role_rc: string;
}

interface UserSearchProps {
  selectedUserId: string | null;
  onSelectUser: (user: UserResult) => void;
}

export function UserSearch({ selectedUserId, onSelectUser }: UserSearchProps) {
  const client = useTenantClient();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!client || query.trim().length < 2) return;
    setSearching(true);
    const { data, error } = await client.rpc("rpc_search_users_for_override", {
      p_query: query.trim(),
    });
    if (error) {
      toast.error("Search failed");
    } else {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      setUsers(Array.isArray(parsed) ? parsed : []);
    }
    setSearching(false);
  }, [client, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Find User</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by unique ID or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searching || query.trim().length < 2}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {users.length > 0 && (
          <div className="mt-4 space-y-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user)}
                className={`flex items-center gap-3 p-3 rounded-lg border w-full text-left transition-colors ${
                  selectedUserId === user.id
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

        {users.length === 0 && query.length >= 2 && !searching && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            No users found matching your search.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export type { UserResult };
