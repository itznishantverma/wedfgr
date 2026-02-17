"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Home } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { usePermissionContext } from "@/lib/permissions/permission-context";
import { MODULE_REGISTRY } from "@/lib/permissions/permission-keys";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { canModule } = usePermissionContext();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const accessibleModules = MODULE_REGISTRY.filter((m) => canModule(m.key));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search modules, pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => navigate("/dashboard")}>
            <Home className="h-4 w-4 mr-2" />
            Dashboard Home
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/my-permissions")}>
            <Shield className="h-4 w-4 mr-2" />
            My Permissions
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Modules">
          {accessibleModules.map((m) => {
            const Icon = m.icon;
            return (
              <CommandItem
                key={m.key}
                onSelect={() => navigate(`/dashboard/${m.key}`)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {m.displayName}
                <span className="ml-auto text-xs text-muted-foreground">
                  {m.resourceCount} resources
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
