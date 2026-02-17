"use client";

import { ModuleStub } from "@/components/dashboard/module-stub";

const RESOURCES = [
  "academic_report", "attendance_report", "fee_report",
  "custom_report", "analytics", "dashboard_widget",
];

export default function ReportsPage() {
  return <ModuleStub moduleKey="reports" resources={RESOURCES} />;
}
