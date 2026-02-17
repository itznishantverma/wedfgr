"use client";

import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { InstitutePublicCredentials } from "@/lib/types/institute.types";

interface InstituteBadgeProps {
  institute: InstitutePublicCredentials | null;
  isLoading: boolean;
  error: string | null;
  roleCode: string | null;
}

export function InstituteBadge({
  institute,
  isLoading,
  error,
  roleCode,
}: InstituteBadgeProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-in fade-in duration-200">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Verifying institute...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive animate-in fade-in duration-200">
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    );
  }

  if (!institute) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-200">
      <CheckCircle2 className="h-3 w-3 text-teal-600" />
      <span className="font-medium text-foreground">{institute.name}</span>
      {roleCode && (
        <>
          <span className="text-muted-foreground/50">|</span>
          <span>
            Role:{" "}
            <span className="font-medium text-foreground">{roleCode}</span>
          </span>
        </>
      )}
    </div>
  );
}
