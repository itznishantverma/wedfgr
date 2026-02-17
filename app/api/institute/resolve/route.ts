import { NextRequest, NextResponse } from "next/server";
import { resolveInstitute } from "@/lib/services/institute.service";

const INST_CODE_PATTERN = /^[A-Z0-9]{2,20}$/;

export async function GET(request: NextRequest) {
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
