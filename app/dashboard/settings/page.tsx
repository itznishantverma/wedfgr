"use client";

import { ModuleStub } from "@/components/dashboard/module-stub";

const RESOURCES = [
  "general", "academic_year_config", "term", "grading_system",
  "institute_profile", "backup", "restore", "integration", "theme",
];

export default function SettingsPage() {
  return <ModuleStub moduleKey="settings" resources={RESOURCES} />;
}
