"use client";

import {
  Layers, Database, Zap, Target, UserPlus,
  Shield, Settings, Activity, FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { usePermissionContext } from "@/lib/permissions/permission-context";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { ModuleCard } from "@/components/dashboard/module-card";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { MODULE_REGISTRY } from "@/lib/permissions/permission-keys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const recentActivity: ActivityItem[] = [
  { id: "1", icon: Shield, iconColor: "text-teal-600", description: "Permission policy updated for Teacher role", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: "2", icon: UserPlus, iconColor: "text-blue-600", description: "3 new users imported via bulk upload", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: "3", icon: Settings, iconColor: "text-gray-600", description: "Grading system configuration updated", timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
  { id: "4", icon: Activity, iconColor: "text-emerald-600", description: "System health check completed", timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) },
  { id: "5", icon: FileText, iconColor: "text-orange-600", description: "Annual report template generated", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
];

const quickActions: QuickAction[] = [
  { label: "Manage Permissions", icon: Shield, href: "/dashboard/permissions", resource: "perm_module", action: "read", iconBg: "bg-teal-50", iconColor: "text-teal-600" },
  { label: "Add User", icon: UserPlus, href: "/dashboard/users", resource: "user", action: "create", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { label: "Configure Settings", icon: Settings, href: "/dashboard/settings", resource: "general", action: "configure", iconBg: "bg-gray-100", iconColor: "text-gray-600" },
  { label: "View Reports", icon: FileText, href: "/dashboard/reports", resource: "academic_report", action: "read", iconBg: "bg-orange-50", iconColor: "text-orange-600" },
];

export function SADashboard() {
  const { user } = useAuth();
  const { permissions } = usePermissionContext();

  const accessibleModules = MODULE_REGISTRY.filter((m) =>
    permissions.some((p) => p.module_key === m.key)
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <WelcomeBanner
        firstName={user?.first_name || "Admin"}
        subtitle="System Overview -- Full platform control"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Modules" value={16} icon={Layers} trend={{ value: 0, label: "stable" }} />
        <StatCard label="Total Resources" value={143} icon={Database} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard label="Total Actions" value={45} icon={Zap} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard label="Total Scopes" value={10} icon={Target} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">All Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {accessibleModules.map((m) => (
            <ModuleCard key={m.key} module={m} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed title="Recent System Activity" items={recentActivity} />
        <QuickActions actions={quickActions} />
      </div>
    </div>
  );
}
