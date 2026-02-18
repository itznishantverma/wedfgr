import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token } = body;

    if (!access_token || typeof access_token !== "string" || access_token.length > 2048) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const payload = await verifyJwt(access_token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const maxAge = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));

    const response = NextResponse.json({ ok: true });
    response.cookies.set("oxedro-auth-token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("oxedro-auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
