import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const byKeyword = searchParams.get("by") === "keyword";
    const supabase = await createClient();

    const selectFields =
      "id, keyword_id, site_id, status, current_stage, stage_progress, " +
      "research_output, article_output, validated_output, publish_result, " +
      "verification_log, error, started_at, completed_at, created_at";

    let query;
    if (byKeyword) {
      // Look up the most recent job for the given keyword_id
      query = supabase
        .from("jobs")
        .select(selectFields)
        .eq("keyword_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
    } else {
      query = supabase
        .from("jobs")
        .select(selectFields)
        .eq("id", id)
        .single();
    }

    const { data: job, error } = await query;

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
