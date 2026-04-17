import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, keywords, priority, targetWordCount } = body;

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "keywords must be a non-empty array of strings" },
        { status: 400 },
      );
    }

    // Deduplicate and validate each entry is a non-empty string
    const uniqueKeywords = [
      ...new Set(
        keywords
          .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
          .map((k) => k.trim()),
      ),
    ];

    if (uniqueKeywords.length === 0) {
      return NextResponse.json(
        { error: "No valid keyword strings found in the array" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const rows = uniqueKeywords.map((kw) => ({
      site_id: siteId,
      keyword: kw,
      priority: priority ?? 0,
      target_word_count: targetWordCount ?? 2000,
      status: "pending" as const,
    }));

    const { data, error } = await supabase
      .from("keywords")
      .insert(rows)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { inserted: data?.length ?? 0 },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
