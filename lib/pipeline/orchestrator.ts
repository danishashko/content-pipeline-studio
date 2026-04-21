/**
 * Pipeline orchestrator
 * Executes the 4-stage content pipeline for a given keyword.
 * Stages: research -> write -> validate -> publish
 * Updates Supabase job record and keyword status as it progresses.
 */
import { createClient } from "@/lib/supabase/server";
import { executeResearch } from "@/lib/pipeline/research";
import { executeWriter } from "@/lib/pipeline/writer";
import { executeValidator } from "@/lib/pipeline/validator";
import { executePublisher } from "@/lib/pipeline/publisher";
import { verifyUrls } from "@/lib/pipeline/verifiers/url-verifier";
import { verifyStats } from "@/lib/pipeline/verifiers/stat-verifier";
import type { StatClaim } from "@/lib/pipeline/verifiers/stat-verifier";
import { generateFeaturedImage } from "@/lib/gemini-image";
import { captureVendorScreenshots } from "@/lib/screenshots";
import { SiteConfigSchema } from "@/lib/types";
import type { SiteConfig, VerificationEntry } from "@/lib/types";

function extractLinksFromMarkdown(markdown: string): string[] {
  const linkRegex = /\[.*?\]\((https?:\/\/[^)]+)\)/g;
  const urls: string[] = [];
  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    urls.push(match[1]);
  }
  return [...new Set(urls)];
}

/**
 * Extracts stat claims from markdown content.
 * Looks for patterns like numbers/percentages near hyperlinks,
 * which indicate cited statistics that should be verified against the source.
 */
function extractStatClaimsFromMarkdown(markdown: string): StatClaim[] {
  const claims: StatClaim[] = [];
  // Match sentences containing a number/percentage AND a markdown link
  const sentenceRegex = /[^.!?\n]*\d[\d,.]*\s*%?[^.!?\n]*\[([^\]]+)\]\((https?:\/\/[^)]+)\)[^.!?\n]*/g;
  let match;
  while ((match = sentenceRegex.exec(markdown)) !== null) {
    const sentence = match[0].trim();
    const url = match[2];
    if (sentence && url) {
      claims.push({ url, claim: sentence });
    }
  }
  return claims;
}

export async function runPipeline(keywordId: string): Promise<void> {
  const supabase = await createClient();

  // 1. Fetch keyword record joined with site config
  const { data: keyword, error: kwError } = await supabase
    .from("keywords")
    .select("id, keyword, site_id, sites(config)")
    .eq("id", keywordId)
    .single();

  if (kwError || !keyword) {
    throw new Error(
      `Failed to fetch keyword ${keywordId}: ${kwError?.message ?? "not found"}`,
    );
  }

  // Supabase returns joined rows as array; cast to access config
  const sitesRaw = keyword.sites as unknown;
  const siteConfigRaw: unknown = Array.isArray(sitesRaw)
    ? (sitesRaw[0] as Record<string, unknown>)?.config
    : (sitesRaw as Record<string, unknown> | null)?.config;

  if (siteConfigRaw == null) {
    throw new Error(`Site config missing for keyword ${keywordId}`);
  }

  const siteConfig: SiteConfig = SiteConfigSchema.parse(siteConfigRaw);

  // 2. Update keyword status to 'researching'
  await supabase
    .from("keywords")
    .update({ status: "researching" })
    .eq("id", keywordId);

  // 3. Create job record
  const { data: jobRow, error: jobCreateError } = await supabase
    .from("jobs")
    .insert({
      keyword_id: keywordId,
      site_id: keyword.site_id,
      status: "researching",
      current_stage: "research",
      stage_progress: {},
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobCreateError || !jobRow) {
    throw new Error(
      `Failed to create job for keyword ${keywordId}: ${jobCreateError?.message ?? "unknown"}`,
    );
  }

  const jobId: string = jobRow.id;

  // Helper: update job fields
  async function updateJob(fields: Record<string, unknown>) {
    await supabase.from("jobs").update(fields).eq("id", jobId);
  }

  // Helper: set keyword status
  async function updateKeywordStatus(status: string) {
    await supabase.from("keywords").update({ status }).eq("id", keywordId);
  }

  // -------------------------------------------------------------------------
  // Stage 1: Research
  // -------------------------------------------------------------------------
  try {
    await updateJob({ current_stage: "research", status: "researching" });
    await updateKeywordStatus("researching");

    const researchOutput = await executeResearch(
      jobId,
      keyword.keyword,
      siteConfig,
    );

    await updateJob({
      research_output: researchOutput,
      stage_progress: { research: "completed" },
    });

    // -----------------------------------------------------------------------
    // Stage 2: Write
    // -----------------------------------------------------------------------
    await updateJob({ current_stage: "write", status: "writing" });
    await updateKeywordStatus("writing");

    const articleOutput = await executeWriter(jobId, researchOutput, siteConfig);

    // -----------------------------------------------------------------------
    // Stage 2.5: Generate featured image (non-fatal if it fails)
    // -----------------------------------------------------------------------
    try {
      console.log(`[${jobId}] Generating featured image via Gemini...`);
      const imageResult = await generateFeaturedImage(
        articleOutput.metadata.title,
        keyword.keyword,
        siteConfig.companyName,
      );

      // Upload base64 image to Supabase Storage
      const imageBuffer = Buffer.from(imageResult.base64, "base64");
      const filename = `${jobId}.png`;

      const { error: uploadError } = await supabase.storage
        .from("featured-images")
        .upload(filename, imageBuffer, {
          contentType: imageResult.mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.warn(
          `[${jobId}] Supabase Storage upload failed: ${uploadError.message}`,
        );
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("featured-images").getPublicUrl(filename);

        articleOutput.featuredImage = {
          url: publicUrl,
          altText: articleOutput.metadata.title,
          filename,
        };

        console.log(`[${jobId}] Featured image uploaded: ${publicUrl}`);
      }
    } catch (imgErr) {
      console.warn(
        `[${jobId}] Featured image generation failed (non-fatal): ${imgErr instanceof Error ? imgErr.message : String(imgErr)}`,
      );
    }

    // -----------------------------------------------------------------------
    // Stage 2.6: Vendor screenshots for listicle articles (non-fatal)
    // -----------------------------------------------------------------------
    try {
      const screenshots = await captureVendorScreenshots(
        articleOutput.markdownContent,
        jobId,
      );

      // Upload each screenshot to Supabase Storage and inject into markdown
      for (const ss of screenshots) {
        try {
          const slug = ss.vendorName.toLowerCase().replace(/[^a-z0-9]/g, "-");
          const filename = `${jobId}/${slug}.png`;
          const imageBuffer = Buffer.from(ss.imageBase64, "base64");

          const { error: uploadErr } = await supabase.storage
            .from("screenshots")
            .upload(filename, imageBuffer, {
              contentType: ss.mimeType,
              upsert: true,
            });

          if (uploadErr) {
            console.warn(`[${jobId}] Screenshot upload failed for ${ss.vendorName}: ${uploadErr.message}`);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from("screenshots")
            .getPublicUrl(filename);

          // Inject screenshot after the vendor's heading in the markdown
          const vendorPattern = new RegExp(
            `(###[^\\n]*${ss.vendorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\n]*\\n)`,
            "i",
          );
          const imgMarkdown = `\n![${ss.vendorName} homepage](${publicUrl})\n\n`;
          if (vendorPattern.test(articleOutput.markdownContent)) {
            articleOutput.markdownContent = articleOutput.markdownContent.replace(
              vendorPattern,
              `$1${imgMarkdown}`,
            );
            console.log(`[${jobId}] Screenshot injected for ${ss.vendorName}: ${publicUrl}`);
          }
        } catch (upErr) {
          console.warn(`[${jobId}] Screenshot processing failed for ${ss.vendorName}: ${upErr instanceof Error ? upErr.message : upErr}`);
        }
      }
    } catch (ssErr) {
      console.warn(
        `[${jobId}] Vendor screenshots failed (non-fatal): ${ssErr instanceof Error ? ssErr.message : String(ssErr)}`,
      );
    }

    await updateJob({
      article_output: articleOutput,
      stage_progress: { research: "completed", write: "completed" },
    });

    // -----------------------------------------------------------------------
    // Stage 3: Validate
    // -----------------------------------------------------------------------
    await updateJob({ current_stage: "validate", status: "validating" });
    await updateKeywordStatus("validating");

    const validatedOutput = await executeValidator(
      jobId,
      articleOutput,
      siteConfig,
    );

    // URL verification on all links in the validated article
    const links = extractLinksFromMarkdown(validatedOutput.markdownContent);
    const urlVerifications: VerificationEntry[] = links.length > 0 ? await verifyUrls(links) : [];

    // Stat verification: extract numeric claims and verify against source pages
    const statClaims = extractStatClaimsFromMarkdown(validatedOutput.markdownContent);
    console.log(`[${jobId}] Found ${statClaims.length} stat claims to verify`);
    const statVerifications: VerificationEntry[] = statClaims.length > 0 ? await verifyStats(statClaims) : [];

    const verificationLog = [...urlVerifications, ...statVerifications];

    await updateJob({
      validated_output: validatedOutput,
      verification_log: verificationLog,
      stage_progress: {
        research: "completed",
        write: "completed",
        validate: "completed",
      },
    });

    // -----------------------------------------------------------------------
    // Stage 4: Publish (optional - skipped if WP credentials are not set)
    // -----------------------------------------------------------------------
    if (siteConfig.wpUsername && siteConfig.wpAppPassword) {
      await updateJob({ current_stage: "publish", status: "publishing" });
      await updateKeywordStatus("publishing");

      const publishResult = await executePublisher(
        jobId,
        validatedOutput,
        siteConfig,
      );

      await updateJob({
        publish_result: publishResult,
        stage_progress: {
          research: "completed",
          write: "completed",
          validate: "completed",
          publish: "completed",
        },
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    } else {
      console.log(
        `[${jobId}] Skipping publish stage: WordPress credentials not configured for site "${siteConfig.slug}"`,
      );

      await updateJob({
        publish_result: null,
        stage_progress: {
          research: "completed",
          write: "completed",
          validate: "completed",
          publish: "skipped",
        },
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    }

    await updateKeywordStatus("completed");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err);

    await updateJob({ status: "failed", error: message });
    await updateKeywordStatus("failed");

    throw err;
  }
}
