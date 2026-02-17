"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ModuleMeta } from "@/lib/permissions/permission-keys";

interface ModuleCardProps {
  module: ModuleMeta;
}

export function ModuleCard({ module }: ModuleCardProps) {
  const Icon = module.icon;

  return (
    <Link
      href={`/dashboard/${module.key}`}
      className="group flex items-center gap-3 rounded-xl border p-4 hover:shadow-md hover:border-teal-200 transition-all duration-200"
    >
      <div className="p-2.5 rounded-lg bg-teal-50 group-hover:bg-teal-100 transition-colors shrink-0">
        <Icon className="h-5 w-5 text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium group-hover:text-teal-700 transition-colors">
          {module.displayName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {module.resourceCount} resources
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 transition-colors shrink-0" />
    </Link>
  );
}
