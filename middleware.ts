import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, decodeJwt, createRemoteJWKSet } from "jose";

const PUBLIC_PATHS = ["/login"];

const PUBLIC_API_PATHS = [
  "/api/institute/resolve",
  "/api/auth/session",
];

const CACHE_TTL_MS = 60 * 60 * 1000;
const jwksCache = new Map<string, { resolver: ReturnType<typeof createRemoteJWKSet>; createdAt: number }>();

function getJWKSForMiddleware(tenantUrl: string) {
  const now = Date.now();
  const cached = jwksCache.get(tenantUrl);

  if (cached && now - cached.createdAt < CACHE_TTL_MS) {
    return cached.resolver;
  }

  const jwksUrl = new URL(`${tenantUrl.replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json`);
  const resolver = createRemoteJWKSet(jwksUrl);

  jwksCache.set(tenantUrl, { resolver, createdAt: now });

  return resolver;
}

async function validateToken(token: string): Promise<boolean> {
  try {
    const unverified = decodeJwt(token);

    if (
      !unverified.iss ||
      typeof unverified.iss !== "string" ||
      !unverified.iss.includes("supabase")
    ) {
      return false;
    }

    let tenantUrl: string;
    try {
      const cleaned = unverified.iss.replace(/\/auth\/v1\/?$/, "");
      tenantUrl = new URL(cleaned).origin;
    } catch {
      return false;
    }

    const jwks = getJWKSForMiddleware(tenantUrl);

    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ["ES256"],
    });

    if (!payload.sub || typeof payload.sub !== "string") return false;
    if (!payload.exp || typeof payload.exp !== "number") return false;
    if (!payload.iat || typeof payload.iat !== "number") return false;

    const now = Math.floor(Date.now() / 1000);
    if (payload.iat > now + 60) return false;
    if ((payload as Record<string, unknown>).role !== "authenticated")
      return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isPublicApiPath = PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?"));
  const isApiPath = pathname.startsWith("/api/");
  const tokenValue = request.cookies.get("oxedro-auth-token")?.value;
  const hasValidToken = tokenValue ? await validateToken(tokenValue) : false;

  if (isApiPath && !isPublicApiPath && !hasValidToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isApiPath && !isPublicPath && !hasValidToken) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (tokenValue) {
      response.cookies.delete("oxedro-auth-token");
    }
    return response;
  }

  if (isPublicPath && hasValidToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://images.pexels.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "font-src 'self' data:",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
