import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("leads")
      .upsert({ email: email.toLowerCase().trim() }, { onConflict: "email" })
      .select("id, email, articles_generated, max_articles, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "email query param is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("leads")
      .select("id, email, articles_generated, max_articles, created_at")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
