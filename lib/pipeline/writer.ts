import type { Article, ContentBrief, SiteConfig } from "@/lib/types";
import { ArticleSchema } from "@/lib/types";
import { complete, resolveModel } from "@/lib/openrouter";
import { getWriterPrompt } from "@/lib/pipeline/prompts/writer";
import { parseJsonResponse } from "@/lib/pipeline/extract-json";

/**
 * Writer stage: takes a ContentBrief and writes a full Article using Claude Sonnet.
 */
export async function executeWriter(
  jobId: string,
  brief: ContentBrief,
  siteConfig: SiteConfig,
): Promise<Article> {
  const writerModel = resolveModel("writer", siteConfig.modelConfig);
  console.log(`[${jobId}] Writer stage started for keyword: "${brief.targetKeyword}" (model: ${writerModel})`);

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
  console.log(`[${jobId}] Calling OpenRouter (${writerModel}) for article writing`);
  const rawResponse = await complete(systemPrompt, userPrompt, {
    model: writerModel,
    maxTokens: 16384,
    temperature: 0.7,
    jsonMode: true,
  });

  // Step 3: Parse as Article
  const parsed = parseJsonResponse(rawResponse);
  const article = ArticleSchema.parse(parsed);

  console.log(
    `[${jobId}] Writer stage complete. Title: "${article.metadata.title}"`,
  );
  return article;
}
