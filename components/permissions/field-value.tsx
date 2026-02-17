"use client";

import { useFieldVisibility } from "@/lib/permissions/use-field-visibility";
import { maskFieldValue } from "@/lib/permissions/field-utils";

interface FieldValueProps {
  resource: string;
  action?: string;
  field: string;
  value: string | null | undefined;
  fallback?: string;
}

export function FieldValue({
  resource,
  action = "read",
  field,
  value,
  fallback = "",
}: FieldValueProps) {
  const { isHidden, isMasked, isVisible } = useFieldVisibility(resource, action);

  if (!value) return <>{fallback}</>;
  if (isHidden(field)) return null;
  if (isMasked(field)) return <>{maskFieldValue(value)}</>;

  return <>{value}</>;
}
