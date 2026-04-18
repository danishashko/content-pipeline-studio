import type { Article, SiteConfig } from "@/lib/types";
import { ArticleSchema } from "@/lib/types";
import { complete, resolveModel } from "@/lib/openrouter";
import { getValidatorPrompt } from "@/lib/pipeline/prompts/validator";
import { parseJsonResponse } from "@/lib/pipeline/extract-json";

/**
 * Validator stage: runs all 27 quality checks on an Article via Claude Sonnet
 * and returns a lightly-edited, validated Article with a validation report.
 */
export async function executeValidator(
  jobId: string,
  article: Article,
  siteConfig: SiteConfig,
): Promise<Article> {
  const validatorModel = resolveModel("validator", siteConfig.modelConfig);
  console.log(
    `[${jobId}] Validator stage started for: "${article.metadata.title}" (model: ${validatorModel})`,
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
    `[${jobId}] Calling OpenRouter (${validatorModel}) for validation`,
  );
  const rawResponse = await complete(systemPrompt, userPrompt, {
    model: validatorModel,
    maxTokens: 16384,
    temperature: 0.2,
    jsonMode: true,
  });

  // Step 4: Parse as validated Article
  const normalized = parseJsonResponse<Record<string, unknown>>(rawResponse);

  // The validator may return validationReport (camelCase) or validation_report (snake_case)
  if (!normalized.validationReport && normalized.validation_report) {
    normalized.validationReport = normalized.validation_report;
    delete normalized.validation_report;
  }

  const validatedArticle = ArticleSchema.parse(normalized);

  console.log(
    `[${jobId}] Validator stage complete. Report: ${validatedArticle.validationReport?.slice(0, 100) ?? "(none)"}...`,
  );
  return validatedArticle;
}
