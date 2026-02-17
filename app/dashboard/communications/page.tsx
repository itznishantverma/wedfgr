"use client";

import { ModuleStub } from "@/components/dashboard/module-stub";

const RESOURCES = [
  "announcement", "message", "conversation", "notification",
  "template", "sms", "email_template", "circular", "notice_board",
];

export default function CommunicationsPage() {
  return <ModuleStub moduleKey="communications" resources={RESOURCES} />;
}
