"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap, LogOut, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { usePermissionContext } from "@/lib/permissions/permission-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MODULE_REGISTRY, PRIMARY_MODULES, SECONDARY_MODULES,
  type ModuleMeta,
} from "@/lib/permissions/permission-keys";

const SIDEBAR_COLLAPSED_KEY = "oxedro-sidebar-collapsed";

function NavItem({
  module,
  pathname,
  collapsed,
}: {
  module: ModuleMeta;
  pathname: string;
  collapsed: boolean;
}) {
  const href = `/dashboard/${module.key}`;
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const Icon = module.icon;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
        "hover:bg-accent/60",
        isActive
          ? "bg-teal-50 text-teal-700 font-medium border-l-2 border-teal-600 -ml-px"
          : "text-muted-foreground hover:text-foreground"
      )}
      title={collapsed ? module.displayName : undefined}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-teal-600")} />
      {!collapsed && <span className="truncate">{module.displayName}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, instCode, logout } = useAuth();
  const { canModule } = usePermissionContext();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
    if (next) setMoreOpen(false);
  };

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
    <div
      className={cn(
        "flex flex-col h-full bg-background border-r transition-all duration-200",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      <div className="flex items-center gap-2.5 px-4 h-14 border-b shrink-0">
        <div className="p-1.5 bg-teal-600 rounded-lg shrink-0">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold tracking-tight">OXEDRO</span>
            {instCode && (
              <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                {instCode}
              </Badge>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {primaryModules.map((m) => (
          <NavItem key={m.key} module={m} pathname={pathname} collapsed={collapsed} />
        ))}

        {secondaryModules.length > 0 && (
          <>
            {collapsed ? (
              <div className="pt-2">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="flex items-center justify-center w-full rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                  title="More modules"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="flex items-center justify-between w-full rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mt-3"
              >
                <span>More</span>
                {moreOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}

            {moreOpen &&
              secondaryModules.map((m) => (
                <NavItem key={m.key} module={m} pathname={pathname} collapsed={collapsed} />
              ))}
          </>
        )}
      </nav>

      <div className="border-t px-3 py-3 space-y-2 shrink-0">
        {!collapsed && (
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
        )}
        {collapsed && (
          <div className="flex justify-center relative">
            <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-semibold" title={displayName}>
              {initials}
            </div>
            {(user?.additional_roles?.length ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-teal-600 text-white text-[9px] flex items-center justify-center font-medium">
                {user!.additional_roles!.length}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn("text-muted-foreground hover:text-foreground", collapsed ? "w-full" : "")}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground ml-auto"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
