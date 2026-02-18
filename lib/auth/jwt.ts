import { jwtVerify, decodeJwt, JWTPayload } from "jose";
import { getJWKS, extractTenantUrlFromIssuer } from "./jwks";

export interface VerifiedJwtPayload extends JWTPayload {
  sub: string;
  exp: number;
  iat: number;
  iss: string;
  role: string;
  aud: string | string[];
}

export async function verifyJwt(
  token: string
): Promise<VerifiedJwtPayload | null> {
  try {
    const unverified = decodeJwt(token);

    if (
      !unverified.iss ||
      typeof unverified.iss !== "string" ||
      !unverified.iss.includes("supabase")
    ) {
      return null;
    }

    const tenantUrl = extractTenantUrlFromIssuer(unverified.iss);
    if (!tenantUrl) return null;

    const jwks = getJWKS(tenantUrl);

    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ["ES256"],
    });

    if (!payload.sub || typeof payload.sub !== "string") return null;
    if (!payload.exp || typeof payload.exp !== "number") return null;
    if (!payload.iat || typeof payload.iat !== "number") return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.iat > now + 60) return null;
    if ((payload as Record<string, unknown>).role !== "authenticated")
      return null;

    return payload as unknown as VerifiedJwtPayload;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(`[jwt] verification failed: ${message}`);
    return null;
  }
}
