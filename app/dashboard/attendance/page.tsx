"use client";

import { ModuleStub } from "@/components/dashboard/module-stub";

const RESOURCES = [
  "daily_attendance", "period_attendance", "leave_request",
  "leave_type", "leave_balance", "attendance_report", "biometric_log",
];

export default function AttendancePage() {
  return <ModuleStub moduleKey="attendance" resources={RESOURCES} />;
}
