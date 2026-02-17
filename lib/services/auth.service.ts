import { ParsedUniqueId, LoginResponse } from "@/lib/types/auth.types";

const ROLE_CODE_MAP: Record<string, string> = {
  SA: "01",
  TE: "02",
  AD: "03",
  ST: "04",
  PA: "05",
};

const NUMERIC_TO_ROLE: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_CODE_MAP).map(([k, v]) => [v, k])
);

export function parseUniqueId(uniqueId: string): ParsedUniqueId | null {
  const trimmed = uniqueId.trim().toUpperCase();

  if (trimmed.length < 8) return null;

  const sequence = trimmed.slice(-4);
  const roleCode = trimmed.slice(-6, -4);
  const year = trimmed.slice(-8, -6);
  const instCode = trimmed.slice(0, -8);

  if (!instCode || instCode.length < 1) return null;
  if (!/^\d{2}$/.test(year)) return null;
  if (!/^\d{4}$/.test(sequence)) return null;

  const isAlphaRole = Object.keys(ROLE_CODE_MAP).includes(roleCode);
  const isNumericRole = Object.keys(NUMERIC_TO_ROLE).includes(roleCode);

  if (!isAlphaRole && !isNumericRole) return null;

  return {
    inst_code: instCode,
    year,
    role_code: isAlphaRole ? roleCode : NUMERIC_TO_ROLE[roleCode],
    sequence,
  };
}

export async function loginWithTenant(
  tenantUrl: string,
  tenantAnonKey: string,
  uniqueId: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${tenantUrl}/functions/v1/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tenantAnonKey}`,
    },
    body: JSON.stringify({ unique_id: uniqueId.trim().toUpperCase(), password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data as LoginResponse;
}
