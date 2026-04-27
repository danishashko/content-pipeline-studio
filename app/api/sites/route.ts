import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceIpLimit } from "@/lib/rate-limit";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sites")
      .select("id, slug, name, config, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return config summary (strip sensitive fields like wpAppPassword)
    const sites = (data ?? []).map((site) => {
      const { wpAppPassword: _wp, ...configSummary } = site.config ?? {};
      return {
        id: site.id,
        slug: site.slug,
        name: site.name,
        config: configSummary,
        created_at: site.created_at,
      };
    });

    return NextResponse.json({ sites });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const limit = await enforceIpLimit(request);
    if (!limit.ok) return limit.response;

    const body = await request.json();
    const { slug, companyName } = body;

    if (!slug || !companyName) {
      return NextResponse.json(
        { error: "slug and companyName are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sites")
      .insert({ slug, name: companyName, config: body })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A site with this slug already exists" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ site: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
