"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { SADashboard } from "@/components/dashboard/views/sa-dashboard";
import { ADDashboard } from "@/components/dashboard/views/ad-dashboard";
import { TEDashboard } from "@/components/dashboard/views/te-dashboard";
import { STDashboard } from "@/components/dashboard/views/st-dashboard";
import { PADashboard } from "@/components/dashboard/views/pa-dashboard";
import { DynamicDashboard } from "@/components/dashboard/views/dynamic-dashboard";

const SYSTEM_ROLE_DASHBOARDS: Record<string, React.ComponentType> = {
  SA: SADashboard,
  AD: ADDashboard,
  TE: TEDashboard,
  ST: STDashboard,
  PA: PADashboard,
};

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const rc = user.role?.rc || "";
  const DashboardView = SYSTEM_ROLE_DASHBOARDS[rc] || DynamicDashboard;

  return <DashboardView />;
}
