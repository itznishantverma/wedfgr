"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gate } from "@/components/permissions/gate";

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
  resource: string;
  action: string;
  iconColor?: string;
  iconBg?: string;
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
}

export function QuickActions({ title = "Quick Actions", actions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Gate key={action.label} resource={action.resource} action={action.action}>
                <Link
                  href={action.href}
                  className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm hover:bg-accent/60 transition-colors"
                >
                  <div className={cn("p-1.5 rounded-md", action.iconBg || "bg-teal-50")}>
                    <Icon className={cn("h-3.5 w-3.5", action.iconColor || "text-teal-600")} />
                  </div>
                  <span className="truncate">{action.label}</span>
                </Link>
              </Gate>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
