import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("schedules")
      .select("*, sites(name)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const schedules = (data ?? []).map((row) => ({
      id: row.id,
      siteId: row.site_id,
      siteName: (row.sites as { name: string } | null)?.name ?? null,
      cronExpression: row.cron_expression,
      description: row.description,
      maxArticlesPerRun: row.max_articles_per_run,
      enabled: row.enabled,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ schedules });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, cronExpression, description, maxArticlesPerRun, enabled } = body;

    if (!siteId || !cronExpression) {
      return NextResponse.json(
        { error: "siteId and cronExpression are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("schedules")
      .insert({
        site_id: siteId,
        cron_expression: cronExpression,
        description: description ?? null,
        max_articles_per_run: maxArticlesPerRun ?? 1,
        enabled: enabled !== undefined ? enabled : true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ schedule: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Map camelCase body fields to snake_case DB columns
    const updates: Record<string, unknown> = {};
    if (rest.cronExpression !== undefined) updates.cron_expression = rest.cronExpression;
    if (rest.description !== undefined) updates.description = rest.description;
    if (rest.maxArticlesPerRun !== undefined) updates.max_articles_per_run = rest.maxArticlesPerRun;
    if (rest.enabled !== undefined) updates.enabled = rest.enabled;
    if (rest.nextRunAt !== undefined) updates.next_run_at = rest.nextRunAt;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("schedules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ schedule: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from("schedules").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
