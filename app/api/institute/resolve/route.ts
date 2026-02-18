import { NextRequest, NextResponse } from "next/server";
import { resolveInstitute } from "@/lib/services/institute.service";

const INST_CODE_PATTERN = /^[A-Z0-9]{2,20}$/;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const instCode = request.nextUrl.searchParams.get("inst_code");

  if (!instCode || instCode.trim().length < 1) {
    return NextResponse.json(
      { error: "inst_code is required" },
      { status: 400 }
    );
  }

  const normalized = instCode.trim().toUpperCase();

  if (!INST_CODE_PATTERN.test(normalized)) {
    return NextResponse.json(
      { error: "Invalid institute code format" },
      { status: 400 }
    );
  }

  const institute = await resolveInstitute(normalized);

  if (!institute) {
    return NextResponse.json(
      { error: "Institute not found or inactive" },
      { status: 404 }
    );
  }

  return NextResponse.json(institute);
}
