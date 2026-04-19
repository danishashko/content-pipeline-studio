import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPipeline } from "@/lib/pipeline/orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywordId, email } = body;

    if (!keywordId) {
      return NextResponse.json(
        { error: "keywordId is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // 1. Verify keyword exists and is in a runnable state
    const { data: keyword, error: kwError } = await supabase
      .from("keywords")
      .select("id, status, site_id")
      .eq("id", keywordId)
      .single();

    if (kwError || !keyword) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    if (keyword.status !== "pending" && keyword.status !== "failed") {
      return NextResponse.json(
        {
          error: `Keyword is not in a runnable state (current status: ${keyword.status})`,
        },
        { status: 409 },
      );
    }

    // 2. Email gate: check lead's article limit if email provided
    if (email && typeof email === "string" && email.includes("@")) {
      const normalizedEmail = email.toLowerCase().trim();
      const { data: lead } = await supabase
        .from("leads")
        .select("articles_generated, max_articles")
        .eq("email", normalizedEmail)
        .single();

      if (lead && lead.articles_generated >= lead.max_articles) {
        return NextResponse.json(
          {
            error:
              "Article limit reached. Upgrade with Bright Data to generate more.",
            upgrade_url:
              "https://brightdata.com/cp/start?utm_source=content-pipeline-studio&utm_medium=demo&utm_campaign=content-system-bd",
          },
          { status: 403 },
        );
      }
    }

    // 3. Create a job record so the UI can start polling immediately
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        keyword_id: keywordId,
        site_id: keyword.site_id,
        status: "pending",
        stage_progress: {},
      })
      .select("id")
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: jobError?.message ?? "Failed to create job" },
        { status: 500 },
      );
    }

    // 4. Increment articles_generated for the email lead if provided
    if (email && typeof email === "string" && email.includes("@")) {
      const normalizedEmail = email.toLowerCase().trim();
      // Read current count then increment (Supabase JS v2 doesn't support SQL increment natively)
      const { data: leadData } = await supabase
        .from("leads")
        .select("articles_generated")
        .eq("email", normalizedEmail)
        .single();
      if (leadData) {
        await supabase
          .from("leads")
          .update({ articles_generated: leadData.articles_generated + 1 })
          .eq("email", normalizedEmail);
      }
    }

    // 5. Fire-and-forget: pipeline updates Supabase as it progresses
    runPipeline(keywordId).catch(console.error);

    return NextResponse.json(
      { jobId: job.id, status: "started" },
      { status: 202 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
