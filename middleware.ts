import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

interface JwtPayload {
  sub?: string;
  exp?: number;
  iss?: string;
  role?: string;
  aud?: string;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload: JwtPayload = JSON.parse(atob(base64));
    return payload;
  } catch {
    return null;
  }
}

function validateToken(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  if (!payload.sub || typeof payload.sub !== "string") return false;

  if (!payload.exp || typeof payload.exp !== "number") return false;
  if (payload.exp < Math.floor(Date.now() / 1000)) return false;

  if (payload.role !== "authenticated") return false;

  if (payload.iss && typeof payload.iss === "string") {
    if (!payload.iss.includes("supabase")) return false;
  }

  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const tokenValue = request.cookies.get("oxedro-auth-token")?.value;
  const hasValidToken = tokenValue ? validateToken(tokenValue) : false;

  if (!isPublicPath && !hasValidToken) {
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
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://images.pexels.com https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
