"use client";

import { ModuleStub } from "@/components/dashboard/module-stub";

const RESOURCES = ["student", "parent", "student_parent", "enrollment"];

export default function AdmissionsPage() {
  return <ModuleStub moduleKey="admissions" resources={RESOURCES} />;
}
