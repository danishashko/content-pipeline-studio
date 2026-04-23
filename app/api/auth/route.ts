import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { name, email } = body;

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const supabase = await createClient();

    // Upsert lead — update name if they return with a different one
    const { error: upsertError } = await supabase.from("leads").upsert(
      {
        email: normalizedEmail,
        name: normalizedName,
        source: "demo-gate",
      },
      { onConflict: "email", ignoreDuplicates: false },
    );

    if (upsertError) {
      console.error("[Auth] Lead upsert error:", upsertError.message);
      // Don't block access if DB write fails — still set cookie
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("cps_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
