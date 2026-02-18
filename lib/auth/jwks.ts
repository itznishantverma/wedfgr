import { createRemoteJWKSet } from "jose";
import type { FlattenedJWSInput, JWSHeaderParameters } from "jose";

type KeyResolver = (
  protectedHeader?: JWSHeaderParameters,
  token?: FlattenedJWSInput
) => ReturnType<ReturnType<typeof createRemoteJWKSet>>;

interface CachedJWKS {
  resolver: KeyResolver;
  createdAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const jwksCache = new Map<string, CachedJWKS>();

function buildJwksUrl(tenantUrl: string): string {
  const base = tenantUrl.replace(/\/+$/, "");
  return `${base}/auth/v1/.well-known/jwks.json`;
}

export function getJWKS(tenantUrl: string): KeyResolver {
  const now = Date.now();
  const cached = jwksCache.get(tenantUrl);

  if (cached && now - cached.createdAt < CACHE_TTL_MS) {
    return cached.resolver;
  }

  const jwksUrl = new URL(buildJwksUrl(tenantUrl));
  const resolver = createRemoteJWKSet(jwksUrl) as unknown as KeyResolver;

  jwksCache.set(tenantUrl, { resolver, createdAt: now });

  return resolver;
}

export function extractTenantUrlFromIssuer(issuer: string): string | null {
  try {
    const cleaned = issuer.replace(/\/auth\/v1\/?$/, "");
    const url = new URL(cleaned);
    return url.origin;
  } catch {
    return null;
  }
}
