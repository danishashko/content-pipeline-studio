import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { complete, WRITER_MODEL } from "@/lib/openrouter";
import { enforceIpLimit } from "@/lib/rate-limit";
import {
  getRelatedKeywords,
  getKeywordSuggestions,
  getDomainKeywords,
  type SemrushKeyword,
} from "@/lib/semrush";

export interface Suggestion {
  keyword: string;
  searchVolume: number;
  competition: number;
  cpc: number;
  difficulty: "low" | "medium" | "high";
  rationale: string;
  contentAngle: string;
}

// Map competition score (0–1) to difficulty label
function difficultyLabel(competition: number): "low" | "medium" | "high" {
  if (competition < 0.33) return "low";
  if (competition < 0.66) return "medium";
  return "high";
}

export async function POST(request: NextRequest) {
  try {
    const limit = await enforceIpLimit(request);
    if (!limit.ok) return limit.response;

    const body = await request.json();
    const { siteId, seedKeyword } = body as {
      siteId?: string;
      seedKeyword?: string;
    };

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 },
      );
    }

    // Load site config from Supabase
    const supabase = await createClient();
    const { data: siteRow, error: siteErr } = await supabase
      .from("sites")
      .select("id, slug, name, config")
      .eq("id", siteId)
      .single();

    if (siteErr || !siteRow) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const cfg = (siteRow.config ?? {}) as Record<string, unknown>;
    const domain: string =
      (cfg.wpBaseUrl as string | undefined)?.replace(/^https?:\/\//, "").replace(/\/+$/, "") ??
      (cfg.domain as string | undefined) ??
      siteRow.slug;

    const industries: string[] = Array.isArray(cfg.industries)
      ? (cfg.industries as string[])
      : [];
    const competitors: string[] = Array.isArray(cfg.competitors)
      ? (cfg.competitors as string[])
      : [];
    const companyName: string =
      (cfg.companyName as string | undefined) ?? siteRow.name;

    // Fetch keywords from SEMrush
    let rawKeywords: SemrushKeyword[] = [];

    if (seedKeyword) {
      // Run related + suggestions in parallel, then deduplicate
      const [related, suggestions] = await Promise.allSettled([
        getRelatedKeywords(seedKeyword, "us", 20),
        getKeywordSuggestions(seedKeyword, "us", 20),
      ]);
      const relatedKws =
        related.status === "fulfilled" ? related.value : [];
      const suggestionKws =
        suggestions.status === "fulfilled" ? suggestions.value : [];

      // Deduplicate by keyword string
      const seen = new Set<string>();
      for (const kw of [...relatedKws, ...suggestionKws]) {
        if (!seen.has(kw.keyword.toLowerCase())) {
          seen.add(kw.keyword.toLowerCase());
          rawKeywords.push(kw);
        }
      }
    } else {
      // No seed — use domain organic keywords
      rawKeywords = await getDomainKeywords(domain, "us", 30);
    }

    if (rawKeywords.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Build context for AI ranking
    const keywordList = rawKeywords
      .map(
        (kw) =>
          `- "${kw.keyword}" | vol: ${kw.searchVolume} | comp: ${kw.competition.toFixed(2)} | cpc: $${kw.cpc.toFixed(2)}`,
      )
      .join("\n");

    const systemPrompt = `You are a content strategy expert specializing in SEO for B2B SaaS and tech companies.
Your task is to analyze keyword data and select the best content opportunities for a specific site.
You return ONLY valid JSON — no markdown, no explanation outside the JSON.`;

    const userPrompt = `Site: ${companyName}
Industries: ${industries.join(", ") || "not specified"}
Competitors: ${competitors.join(", ") || "none listed"}
${seedKeyword ? `Seed keyword: "${seedKeyword}"` : `Domain: ${domain}`}

Keyword candidates (format: keyword | monthly volume | competition 0-1 | CPC USD):
${keywordList}

Select the top 10 keywords with the best content opportunity (high volume + low-medium competition + aligned with site's niche).
For each, provide a rationale and a specific content angle.

Return a JSON array exactly like this:
[
  {
    "keyword": "...",
    "searchVolume": 1200,
    "competition": 0.35,
    "cpc": 2.30,
    "rationale": "...",
    "contentAngle": "..."
  }
]`;

    const aiResponse = await complete(systemPrompt, userPrompt, {
      model: WRITER_MODEL,
      maxTokens: 2000,
      temperature: 0.2,
    });

    // Parse AI response — strip markdown code fences if present
    let parsed: Array<{
      keyword: string;
      searchVolume: number;
      competition: number;
      cpc: number;
      rationale: string;
      contentAngle: string;
    }> = [];

    try {
      const cleaned = aiResponse
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) parsed = [];
    } catch {
      // Fallback: return top raw keywords without AI enrichment
      parsed = rawKeywords.slice(0, 10).map((kw) => ({
        keyword: kw.keyword,
        searchVolume: kw.searchVolume,
        competition: kw.competition,
        cpc: kw.cpc,
        rationale: "Keyword from SEMrush data",
        contentAngle: "Informational guide",
      }));
    }

    const suggestions: Suggestion[] = parsed.map((item) => ({
      keyword: item.keyword,
      searchVolume: item.searchVolume,
      competition: item.competition,
      cpc: item.cpc,
      difficulty: difficultyLabel(item.competition),
      rationale: item.rationale,
      contentAngle: item.contentAngle,
    }));

    return NextResponse.json({ suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
