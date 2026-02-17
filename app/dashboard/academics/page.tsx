"use client";

import { ModuleStub } from "@/components/dashboard/module-stub";

const RESOURCES = [
  "class", "section", "subject", "chapter", "topic",
  "syllabus", "assignment", "homework", "lesson_plan", "academic_year",
];

export default function AcademicsPage() {
  return <ModuleStub moduleKey="academics" resources={RESOURCES} />;
}
