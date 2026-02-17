import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();

    if (!access_token || typeof access_token !== "string") {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const parts = access_token.split(".");
    if (parts.length !== 3) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    let payload;
    try {
      payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (!payload.exp || !payload.sub) {
      return NextResponse.json(
        { error: "Invalid token claims" },
        { status: 400 }
      );
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
