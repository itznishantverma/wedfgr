type ConditionContext = Record<string, unknown>;

type ConditionNode =
  | { and: ConditionNode[] }
  | { or: ConditionNode[] }
  | { "==": [string, string] }
  | { "!=": [string, string] }
  | { "<": [string, string] }
  | { ">": [string, string] }
  | { "<=": [string, string] }
  | { ">=": [string, string] };

function resolvePath(ctx: ConditionContext, path: string): string | undefined {
  if (path === "now") {
    return String(Math.floor(Date.now() / 1000));
  }
  const parts = path.split(".");
  let current: unknown = ctx;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current != null ? String(current) : undefined;
}

function resolveOperand(ctx: ConditionContext, operand: string): string | undefined {
  if (operand.includes(".") || operand === "now") {
    return resolvePath(ctx, operand);
  }
  return operand;
}

export function evaluateConditions(
  conditions: Record<string, unknown> | null,
  ctx: ConditionContext = {}
): boolean {
  if (!conditions) return true;

  const node = conditions as Record<string, unknown>;

  if ("and" in node && Array.isArray(node.and)) {
    return (node.and as Record<string, unknown>[]).every((child) =>
      evaluateConditions(child, ctx)
    );
  }

  if ("or" in node && Array.isArray(node.or)) {
    return (node.or as Record<string, unknown>[]).some((child) =>
      evaluateConditions(child, ctx)
    );
  }

  for (const op of Object.keys(node)) {
    const operands = node[op];
    if (!Array.isArray(operands) || operands.length !== 2) continue;

    const left = resolveOperand(ctx, String(operands[0]));
    const right = resolveOperand(ctx, String(operands[1]));

    if (left === undefined || right === undefined) {
      return false;
    }

    const leftNum = Number(left);
    const rightNum = Number(right);
    const numericComparison = !isNaN(leftNum) && !isNaN(rightNum);

    switch (op) {
      case "==":
        if (left !== right) return false;
        break;
      case "!=":
        if (left === right) return false;
        break;
      case "<":
        if (numericComparison ? leftNum >= rightNum : left >= right) return false;
        break;
      case ">":
        if (numericComparison ? leftNum <= rightNum : left <= right) return false;
        break;
      case "<=":
        if (numericComparison ? leftNum > rightNum : left > right) return false;
        break;
      case ">=":
        if (numericComparison ? leftNum < rightNum : left < right) return false;
        break;
    }
  }

  return true;
}
