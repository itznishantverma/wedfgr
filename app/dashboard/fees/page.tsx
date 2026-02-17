"use client";

import { ModuleStub } from "@/components/dashboard/module-stub";

const RESOURCES = [
  "fee_structure", "fee_type", "fee_collection", "fee_concession",
  "payment", "receipt", "due", "fine", "refund", "fee_report", "scholarship",
];

export default function FeesPage() {
  return <ModuleStub moduleKey="fees" resources={RESOURCES} />;
}
