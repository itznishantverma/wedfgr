"use client";

import { ModuleStub } from "@/components/dashboard/module-stub";

const RESOURCES = [
  "schedule", "period", "period_config",
  "substitution", "break_time", "special_class",
];

export default function TimetablePage() {
  return <ModuleStub moduleKey="timetable" resources={RESOURCES} />;
}
