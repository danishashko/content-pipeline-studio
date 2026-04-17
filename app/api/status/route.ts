import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    brightData: Boolean(process.env.BRIGHT_DATA_API_KEY),
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    gemini: Boolean(process.env.GEMINI_API_KEY),
  });
}
