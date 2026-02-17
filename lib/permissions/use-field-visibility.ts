"use client";

import { useMemo } from "react";
import { usePermissionContext } from "./permission-context";
import { FieldVisibility } from "@/lib/types/permission.types";

export function useFieldVisibility(resource: string, action: string) {
  const { getFieldRules } = usePermissionContext();

  return useMemo(() => {
    const rules = getFieldRules(resource, action);

    const getRule = (field: string): FieldVisibility => {
      if (!rules || !(field in rules)) return "visible";
      return rules[field];
    };

    return {
      isVisible: (field: string) => getRule(field) !== "hidden",
      isReadOnly: (field: string) => getRule(field) === "read_only",
      isMasked: (field: string) => getRule(field) === "masked",
      isHidden: (field: string) => getRule(field) === "hidden",
      isEditable: (field: string) => getRule(field) === "editable",
    };
  }, [resource, action, getFieldRules]);
}
