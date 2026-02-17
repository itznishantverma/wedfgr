"use client";

import { ModuleStub } from "@/components/dashboard/module-stub";

const RESOURCES = [
  "exam", "exam_type", "question_paper", "question_bank", "question",
  "result", "mark", "grade", "grade_scale", "report_card",
  "exam_schedule", "hall_ticket", "evaluation",
];

export default function ExamsPage() {
  return <ModuleStub moduleKey="exams" resources={RESOURCES} />;
}
