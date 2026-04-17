import type { Article, SiteConfig } from "@/lib/types";
import { ArticleSchema } from "@/lib/types";
import { complete, VALIDATOR_MODEL } from "@/lib/openrouter";
import { getValidatorPrompt } from "@/lib/pipeline/prompts/validator";

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
 * Validator stage: runs all 27 quality checks on an Article via Claude Sonnet
 * and returns a lightly-edited, validated Article with a validation report.
 */
export async function executeValidator(
  jobId: string,
  article: Article,
  siteConfig: SiteConfig,
): Promise<Article> {
  console.log(
    `[${jobId}] Validator stage started for: "${article.metadata.title}"`,
  );

  // Step 1: Build validator prompt with site context
  const systemPrompt = getValidatorPrompt(siteConfig);

  // Step 2: Build user prompt with the full article
  const userPrompt = `Please validate and lightly edit the following article. Apply the 27 checks and return the corrected JSON.

## Article to Validate

### Metadata
\`\`\`json
${JSON.stringify(article.metadata, null, 2)}
\`\`\`

### Body Markdown
\`\`\`markdown
${article.markdownContent}
\`\`\`

### FAQs
\`\`\`json
${JSON.stringify(article.faqs, null, 2)}
\`\`\`

### Internal Links Used
\`\`\`json
${JSON.stringify(article.internalLinksUsed, null, 2)}
\`\`\`

Run all 27 checks. Fix violations. Return the corrected article JSON with a validation_report.`;

  // Step 3: Call OpenRouter
  console.log(
    `[${jobId}] Calling OpenRouter (${VALIDATOR_MODEL}) for validation`,
  );
  const rawResponse = await complete(systemPrompt, userPrompt, {
    model: VALIDATOR_MODEL,
    maxTokens: 8192,
    temperature: 0.2,
  });

  // Step 4: Parse as validated Article
  const jsonString = extractJson(rawResponse);
  const parsed = JSON.parse(jsonString) as unknown;

  // The validator may return validationReport (camelCase) or validation_report (snake_case)
  // Normalize before parsing
  const normalized = JSON.parse(jsonString) as Record<string, unknown>;
  if (!normalized.validationReport && normalized.validation_report) {
    normalized.validationReport = normalized.validation_report;
    delete normalized.validation_report;
  }

  const validatedArticle = ArticleSchema.parse(parsed);

  console.log(
    `[${jobId}] Validator stage complete. Report: ${validatedArticle.validationReport?.slice(0, 100) ?? "(none)"}...`,
  );
  return validatedArticle;
}
