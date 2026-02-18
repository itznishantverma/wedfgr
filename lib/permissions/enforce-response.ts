/**
 * Server-side permission enforcement seatbelt.
 *
 * IMPORTANT — security model:
 *   DB RPCs (rpc_get_*) = the LOCK. They call evaluate_access + filter_jsonb_fields
 *   inside Postgres and will never leak a field regardless of what happens here.
 *
 *   This file = the SEATBELT. Use it for:
 *     - Non-tabular / aggregated responses
 *     - Third-party API responses that need field stripping
 *     - Server actions that produce data outside of rpc_get_* calls
 *     - Early-exit guards before expensive operations
 *
 *   NEVER rely on this file as the sole enforcement layer for DB-sourced data.
 */

import { UserPermission, FieldVisibility } from "@/lib/types/permission.types";

export type FieldRules = Record<string, FieldVisibility>;

export type ConditionContext = Record<string, unknown>;

export class PermissionDeniedError extends Error {
  readonly code = "PERMISSION_DENIED" as const;
  constructor(resource: string, action: string) {
    super(`Access denied: ${resource}.${action}`);
    this.name = "PermissionDeniedError";
  }
}

export class ConditionNotMetError extends Error {
  readonly code = "CONDITION_NOT_MET" as const;
  constructor() {
    super("Condition not satisfied for this access");
    this.name = "ConditionNotMetError";
  }
}

export function findPermission(
  permissions: UserPermission[],
  resource: string,
  action: string
): UserPermission | undefined {
  return permissions.find(
    (p) => p.resource_key === resource && p.action_key === action
  );
}

/**
 * Throws PermissionDeniedError if the user does not have the given permission.
 * Returns the matching UserPermission (including field_rules and conditions).
 */
export function enforceAccess(
  permissions: UserPermission[],
  resource: string,
  action: string
): UserPermission {
  const perm = findPermission(permissions, resource, action);
  if (!perm) {
    throw new PermissionDeniedError(resource, action);
  }
  return perm;
}

/**
 * Mirrors filter_jsonb_fields from the DB.
 * Applies field_rules to a single data object.
 *
 *   hidden → field is deleted from the object
 *   masked → string value is partially obscured (first + last char kept)
 *
 * Returns a new object; does not mutate the input.
 */
export function applyFieldRules<T extends Record<string, unknown>>(
  data: T,
  fieldRules: FieldRules | null | undefined
): Partial<T> {
  if (!fieldRules) return { ...data };

  const result: Record<string, unknown> = { ...data };

  for (const [key, rule] of Object.entries(fieldRules)) {
    if (!(key in result)) continue;

    if (rule === "hidden") {
      delete result[key];
    } else if (rule === "masked") {
      const value = result[key];
      if (typeof value === "string" && value.length > 2) {
        result[key] =
          value[0] + "*".repeat(Math.max(value.length - 2, 1)) + value[value.length - 1];
      }
    }
  }

  return result as Partial<T>;
}

/**
 * Applies field_rules to an array of objects.
 */
export function applyFieldRulesToList<T extends Record<string, unknown>>(
  list: T[],
  fieldRules: FieldRules | null | undefined
): Partial<T>[] {
  if (!fieldRules) return list;
  return list.map((item) => applyFieldRules(item, fieldRules));
}

type ConditionOperator = "==" | "!=" | "<" | ">" | "<=" | ">=";

function resolveValue(
  token: string,
  context: ConditionContext
): string {
  if (token === "now") {
    return String(Math.floor(Date.now() / 1000));
  }
  if (token.includes(".")) {
    const parts = token.split(".");
    let cur: unknown = context;
    for (const part of parts) {
      if (cur == null || typeof cur !== "object") return "";
      cur = (cur as Record<string, unknown>)[part];
    }
    return cur == null ? "" : String(cur);
  }
  return token;
}

function evaluateSingle(
  condition: Record<string, unknown>,
  context: ConditionContext
): boolean {
  for (const [op, operands] of Object.entries(condition)) {
    if (!Array.isArray(operands) || operands.length !== 2) continue;
    const left = resolveValue(String(operands[0]), context);
    const right = resolveValue(String(operands[1]), context);

    const opKey = op as ConditionOperator;
    switch (opKey) {
      case "==": if (left !== right) return false; break;
      case "!=": if (left === right) return false; break;
      case "<":  if (left >= right)  return false; break;
      case ">":  if (left <= right)  return false; break;
      case "<=": if (left > right)   return false; break;
      case ">=": if (left < right)   return false; break;
    }
  }
  return true;
}

/**
 * Mirrors evaluate_condition_v1 from the DB.
 * Returns true when the condition passes (or when conditions is null/undefined).
 */
export function evaluateConditions(
  conditions: Record<string, unknown> | null | undefined,
  context: ConditionContext
): boolean {
  if (!conditions) return true;

  if ("and" in conditions && Array.isArray(conditions.and)) {
    return conditions.and.every((sub) =>
      evaluateConditions(sub as Record<string, unknown>, context)
    );
  }

  return evaluateSingle(conditions, context);
}

/**
 * Combined helper: checks permission, evaluates conditions, applies field rules.
 * Use for non-DB data sources (aggregates, third-party APIs, etc.).
 *
 * Throws PermissionDeniedError or ConditionNotMetError on failure.
 * Returns field-filtered data on success.
 */
export function enforceAndFilter<T extends Record<string, unknown>>(
  permissions: UserPermission[],
  resource: string,
  action: string,
  data: T,
  conditionContext: ConditionContext = {}
): Partial<T> {
  const perm = enforceAccess(permissions, resource, action);

  if (perm.conditions) {
    if (!evaluateConditions(perm.conditions, conditionContext)) {
      throw new ConditionNotMetError();
    }
  }

  return applyFieldRules(data, perm.field_rules as FieldRules | null);
}
