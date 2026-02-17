"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap, LogOut, Menu, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { usePermissionContext } from "@/lib/permissions/permission-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MODULE_REGISTRY, PRIMARY_MODULES, SECONDARY_MODULES,
  type ModuleMeta,
} from "@/lib/permissions/permission-keys";

function MobileNavItem({
  module,
  pathname,
  onNavigate,
}: {
  module: ModuleMeta;
  pathname: string;
  onNavigate: () => void;
}) {
  const href = `/dashboard/${module.key}`;
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const Icon = module.icon;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        isActive
          ? "bg-teal-50 text-teal-700 font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-teal-600")} />
      <span>{module.displayName}</span>
    </Link>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();
  const { user, instCode, logout } = useAuth();
  const { canModule } = usePermissionContext();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryModules = MODULE_REGISTRY.filter(
    (m) => PRIMARY_MODULES.includes(m.key) && canModule(m.key)
  );
  const secondaryModules = MODULE_REGISTRY.filter(
    (m) => SECONDARY_MODULES.includes(m.key) && canModule(m.key)
  );

  const displayName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ");

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "U";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2.5 px-4 h-14 border-b">
            <div className="p-1.5 bg-teal-600 rounded-lg">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">OXEDRO</span>
            {instCode && (
              <Badge variant="outline" className="text-[10px] font-normal">
                {instCode}
              </Badge>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {primaryModules.map((m) => (
              <MobileNavItem
                key={m.key}
                module={m}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            ))}

            {secondaryModules.length > 0 && (
              <>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="flex items-center justify-between w-full rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mt-3"
                >
                  <span>More</span>
                  {moreOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {moreOpen &&
                  secondaryModules.map((m) => (
                    <MobileNavItem
                      key={m.key}
                      module={m}
                      pathname={pathname}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
              </>
            )}
          </nav>

          <div className="border-t px-3 py-3 space-y-2">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate leading-none">{displayName}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {user?.role?.display_name}
                  {(user?.additional_roles?.length ?? 0) > 0 && (
                    <span className="text-teal-600 font-medium"> +{user!.additional_roles!.length}</span>
                  )}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {user?.role?.rc}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
