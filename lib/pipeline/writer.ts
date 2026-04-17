import type { Article, ContentBrief, SiteConfig } from "@/lib/types";
import { ArticleSchema } from "@/lib/types";
import { complete, WRITER_MODEL } from "@/lib/openrouter";
import { getWriterPrompt } from "@/lib/pipeline/prompts/writer";

/**
 * Extracts JSON from a model response that may contain markdown fences.
 */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }
  return text.trim();
}

/**
 * Writer stage: takes a ContentBrief and writes a full Article using Claude Sonnet.
 */
export async function executeWriter(
  jobId: string,
  brief: ContentBrief,
  siteConfig: SiteConfig,
): Promise<Article> {
  console.log(`[${jobId}] Writer stage started for keyword: "${brief.targetKeyword}"`);

  // Step 1: Build prompts
  const systemPrompt = getWriterPrompt(siteConfig);

  const userPrompt = `Write a full blog article based on the following content brief.

## Content Brief

**Target Keyword:** ${brief.targetKeyword}
**Recommended Title:** ${brief.recommendedTitle}
**Slug:** ${brief.recommendedSlug}
**SEO Title:** ${brief.seoTitle}
**Meta Description:** ${brief.metaDescription}
**Target Word Count:** ${brief.targetWordCount} words
**Tone Recommendation:** ${brief.toneRecommendation}

## Article Outline
${brief.outline
  .map(
    (section, idx) => `
### H2 ${idx + 1}: ${section.heading}
${section.subheadings.map((s) => `  - H3: ${s}`).join("\n")}
Key points to cover:
${section.keyPoints.map((p) => `  - ${p}`).join("\n")}`,
  )
  .join("\n")}

## Internal Links to Use
${brief.internalLinks
  .map(
    (link) =>
      `- URL: ${link.url}\n  Title: ${link.pageTitle}\n  Suggested anchors: ${link.suggestedAnchors.join(", ")}\n  Context: ${link.context}`,
  )
  .join("\n\n")}

## External Data Sources (cite these with hyperlinks)
${brief.externalSources
  .map(
    (src) =>
      `- [${src.title}](${src.url}): ${src.statOrClaim}`,
  )
  .join("\n")}

## Competitor Insights (use to differentiate, do NOT copy)
${brief.competitorInsights}

Write the complete article now. Return only the JSON object.`;

  // Step 2: Call OpenRouter
  console.log(`[${jobId}] Calling OpenRouter (${WRITER_MODEL}) for article writing`);
  const rawResponse = await complete(systemPrompt, userPrompt, {
    model: WRITER_MODEL,
    maxTokens: 8192,
    temperature: 0.7,
  });

  // Step 3: Parse as Article
  const jsonString = extractJson(rawResponse);
  const parsed = JSON.parse(jsonString) as unknown;
  const article = ArticleSchema.parse(parsed);

  console.log(
    `[${jobId}] Writer stage complete. Title: "${article.metadata.title}"`,
  );
  return article;
}
