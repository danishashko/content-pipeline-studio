import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 200) : 50;

    const supabase = await createClient();

    let query = supabase
      .from("jobs")
      .select("id, site_id, keyword_id, status, completed_at, validated_output")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(limit);

    if (siteId) {
      query = query.eq("site_id", siteId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as any[];

    const articles = rows.map((row) => {
      const validatedOutput = row.validated_output as {
        metadata?: { title?: string };
      } | null;

      return {
        id: row.id,
        keyword: null as string | null,
        siteName: null as string | null,
        title: validatedOutput?.metadata?.title ?? null,
        status: row.status,
        completedAt: row.completed_at,
      };
    });

    return NextResponse.json({ articles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
