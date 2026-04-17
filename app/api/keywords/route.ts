import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");

    const supabase = await createClient();

    let query = supabase
      .from("keywords")
      .select("*, sites(name)")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (siteId) {
      query = query.eq("site_id", siteId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const keywords = (data ?? []).map((row) => ({
      id: row.id,
      siteId: row.site_id,
      siteName: (row.sites as { name: string } | null)?.name ?? null,
      keyword: row.keyword,
      status: row.status,
      priority: row.priority,
      notes: row.notes,
      targetWordCount: row.target_word_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ keywords });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, keyword, priority, notes, targetWordCount } = body;

    if (!siteId || !keyword) {
      return NextResponse.json(
        { error: "siteId and keyword are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("keywords")
      .insert({
        site_id: siteId,
        keyword,
        priority: priority ?? 0,
        notes: notes ?? null,
        target_word_count: targetWordCount ?? 2000,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keyword: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
