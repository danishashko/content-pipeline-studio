import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: job, error } = await supabase
      .from("jobs")
      .select(
        "id, keyword_id, site_id, status, current_stage, stage_progress, " +
          "research_output, article_output, validated_output, publish_result, " +
          "verification_log, error, started_at, completed_at, created_at, " +
          "keywords(keyword, notes, target_word_count)",
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch job to get keyword_id before deleting
    const { data: job, error: fetchErr } = await supabase
      .from("jobs")
      .select("id, keyword_id")
      .eq("id", id)
      .single();

    if (fetchErr || !job) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Delete the job
    const { error: deleteErr } = await supabase.from("jobs").delete().eq("id", id);
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // Reset keyword status back to pending so it can be re-run
    await supabase
      .from("keywords")
      .update({ status: "pending" })
      .eq("id", job.keyword_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
