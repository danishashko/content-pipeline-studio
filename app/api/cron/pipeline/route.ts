import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPipeline } from "@/lib/pipeline/orchestrator";

/**
 * Vercel Cron endpoint -- Vercel calls GET with Authorization: Bearer <CRON_SECRET>
 * Configure in vercel.json: { "crons": [{ "path": "/api/cron/pipeline", "schedule": "..." }] }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // 2. Find enabled schedules where next_run_at <= now
    const { data: dueSchedules, error: schedError } = await supabase
      .from("schedules")
      .select("id, site_id, max_articles_per_run, cron_expression")
      .eq("enabled", true)
      .lte("next_run_at", now);

    if (schedError) {
      return NextResponse.json({ error: schedError.message }, { status: 500 });
    }

    if (!dueSchedules || dueSchedules.length === 0) {
      return NextResponse.json({ triggered: 0 });
    }

    let triggered = 0;

    for (const schedule of dueSchedules) {
      const maxRuns = schedule.max_articles_per_run ?? 1;

      // 3. Find pending keywords for this site (up to maxArticlesPerRun)
      const { data: pendingKeywords } = await supabase
        .from("keywords")
        .select("id")
        .eq("site_id", schedule.site_id)
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(maxRuns);

      if (pendingKeywords && pendingKeywords.length > 0) {
        for (const kw of pendingKeywords) {
          // Fire-and-forget -- pipeline writes back to Supabase
          runPipeline(kw.id).catch(console.error);
          triggered++;
        }
      }

      // 4. Update schedule: set last_run_at, clear next_run_at
      //    A simple approach: set next_run_at = null so it won't re-fire until
      //    something (dashboard or a separate setter) populates it again.
      //    Full cron parsing can be added with a library (e.g. cron-parser) in task #6.
      await supabase
        .from("schedules")
        .update({
          last_run_at: now,
          next_run_at: computeNextRunAt(schedule.cron_expression),
        })
        .eq("id", schedule.id);
    }

    return NextResponse.json({ triggered });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Minimal next-run-at calculator.
 * Handles the common Vercel cron patterns: daily (@daily / 0 0 * * *) and hourly.
 * Full cron-parser library integration deferred to task #6.
 */
function computeNextRunAt(cronExpression: string): string {
  const now = new Date();

  const normalized = cronExpression.trim().toLowerCase();

  // @hourly or "0 * * * *"
  if (normalized === "@hourly" || normalized === "0 * * * *") {
    const next = new Date(now);
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next.toISOString();
  }

  // @daily or "0 0 * * *"
  if (normalized === "@daily" || normalized === "0 0 * * *") {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next.toISOString();
  }

  // @weekly or "0 0 * * 0"
  if (normalized === "@weekly" || normalized === "0 0 * * 0") {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    next.setHours(0, 0, 0, 0);
    return next.toISOString();
  }

  // Default fallback: 24 hours from now
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  return next.toISOString();
}
