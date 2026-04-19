import { NextRequest, NextResponse } from "next/server";

const PASSWORD = "BrD@t4-BrSEO2026!";

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get("cps_auth");
  if (authCookie?.value === "authenticated") {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || password !== PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set("cps_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
