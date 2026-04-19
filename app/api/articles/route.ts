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
      .select(
        "id, site_id, keyword_id, status, completed_at, validated_output, " +
          "keywords(keyword, sites(config))",
      )
      .or("status.eq.completed,validated_output.not.is.null")
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
        markdownContent?: string;
      } | null;

      // Extract keyword name from joined keywords table
      const keywordsRaw = row.keywords;
      const keywordRecord = Array.isArray(keywordsRaw) ? keywordsRaw[0] : keywordsRaw;
      const keywordName: string | null = keywordRecord?.keyword ?? null;

      // Extract site name from nested sites config
      const sitesRaw = keywordRecord?.sites;
      const siteRecord = Array.isArray(sitesRaw) ? sitesRaw[0] : sitesRaw;
      const siteConfig = siteRecord?.config as { companyName?: string } | null;
      const siteName: string | null = siteConfig?.companyName ?? null;

      // Count words in markdown content
      const markdownContent = validatedOutput?.markdownContent ?? "";
      const wordCount = markdownContent
        ? markdownContent.trim().split(/\s+/).filter(Boolean).length
        : 0;

      return {
        id: row.id,
        keyword: keywordName,
        siteName,
        siteId: row.site_id,
        title: validatedOutput?.metadata?.title ?? null,
        status: row.status,
        completedAt: row.completed_at,
        wordCount,
      };
    });

    return NextResponse.json({ articles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
