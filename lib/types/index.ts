import { z } from "zod";

// ---------------------------------------------------------------------------
// VerificationEntry
// ---------------------------------------------------------------------------

export const VerificationEntrySchema = z.object({
  type: z.enum(["url_check", "stat_check"]),
  targetUrl: z.string().url(),
  status: z.enum(["verified", "failed", "skipped"]),
  details: z.string().optional(),
});

export type VerificationEntry = z.infer<typeof VerificationEntrySchema>;

// ---------------------------------------------------------------------------
// SiteConfig
// ---------------------------------------------------------------------------

export const SiteConfigSchema = z.object({
  slug: z.string().min(1),
  companyName: z.string().min(1),
  tagline: z.string().optional(),
  companyDescription: z.string().optional(),

  wpBaseUrl: z.string().url(),
  wpUsername: z.string().optional(),
  wpAppPassword: z.string().optional(),
  wpAuthorName: z.string().optional(),

  blogSitemapUrl: z.string().url().optional(),
  mainSitemapUrl: z.string().url().optional(),

  domains: z.array(z.string()),

  products: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),

  productPages: z.array(
    z.object({
      url: z.string().min(1),
      title: z.string(),
      description: z.string(),
    }),
  ),

  cta: z.object({
    url: z.string().min(1),
    defaultText: z.string(),
    fallbackSentence: z.string().optional(),
  }),

  brandColors: z
    .object({
      backgroundRgb: z.array(z.number().int().min(0).max(255)).length(3),
      accentRgb: z.array(z.number().int().min(0).max(255)).length(3),
    })
    .optional(),

  industries: z.array(z.string()),
  competitors: z.array(z.string()),
  coreValues: z.array(z.string()),
  messagingPrinciples: z.array(z.string()),
  insightGuardrails: z.array(z.string()),

  authorName: z.string().optional(),
  authorTitle: z.string().optional(),

  customerPainPoints: z.record(z.string(), z.string()),

  caseStudies: z.array(
    z.object({
      name: z.string(),
      context: z.string(),
      problem: z.string(),
      solution: z.string(),
      results: z.array(z.string()),
      quote: z.string(),
    }),
  ),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

// ---------------------------------------------------------------------------
// ContentBrief
// ---------------------------------------------------------------------------

export const ContentBriefSchema = z.object({
  targetKeyword: z.string(),
  recommendedTitle: z.string(),
  recommendedSlug: z.string(),
  seoTitle: z.string(),
  metaDescription: z.string(),

  outline: z.array(
    z.object({
      heading: z.string(),
      subheadings: z.array(z.string()),
      keyPoints: z.array(z.string()),
    }),
  ),

  internalLinks: z.array(
    z.object({
      url: z.string().min(1),
      pageTitle: z.string(),
      suggestedAnchors: z.array(z.string()),
      context: z.string(),
    }),
  ),

  competitorInsights: z.string(),

  externalSources: z.array(
    z.object({
      url: z.string().url(),
      title: z.string(),
      statOrClaim: z.string(),
    }),
  ),

  targetWordCount: z.number().int().positive(),
  toneRecommendation: z.string(),
});

export type ContentBrief = z.infer<typeof ContentBriefSchema>;

// ---------------------------------------------------------------------------
// Article
// ---------------------------------------------------------------------------

export const ArticleSchema = z.object({
  metadata: z.object({
    title: z.string(),
    slug: z.string(),
    seoTitle: z.string(),
    metaDescription: z.string(),
    excerpt: z.string(),
    targetKeyword: z.string(),
    suggestedCategory: z.string(),
  }),

  markdownContent: z.string(),

  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),

  featuredImage: z
    .object({
      url: z.string().url().optional(),
      altText: z.string(),
      filename: z.string(),
    })
    .optional(),

  validationReport: z.string().optional(),

  internalLinksUsed: z.array(
    z.object({
      url: z.string().min(1),
      anchorText: z.string(),
    }),
  ),
});

export type Article = z.infer<typeof ArticleSchema>;

// ---------------------------------------------------------------------------
// Job
// ---------------------------------------------------------------------------

export const JobStatusSchema = z.enum([
  "pending",
  "researching",
  "writing",
  "validating",
  "publishing",
  "completed",
  "failed",
]);

export const JobStageSchema = z.enum([
  "research",
  "write",
  "validate",
  "publish",
]);

export const JobSchema = z.object({
  id: z.string().uuid(),
  keywordId: z.string().uuid(),
  siteId: z.string().uuid(),
  status: JobStatusSchema,
  currentStage: JobStageSchema.optional(),
  stageProgress: z.record(z.string(), z.string()),
  researchOutput: ContentBriefSchema.optional(),
  articleOutput: ArticleSchema.optional(),
  validatedOutput: ArticleSchema.optional(),
  publishResult: z
    .object({
      wpPostId: z.number().int(),
      wpEditUrl: z.string().url(),
      wpPreviewUrl: z.string().url(),
    })
    .optional(),
  verificationLog: z.array(VerificationEntrySchema).optional(),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type JobStatus = z.infer<typeof JobStatusSchema>;
export type JobStage = z.infer<typeof JobStageSchema>;
export type Job = z.infer<typeof JobSchema>;

// ---------------------------------------------------------------------------
// Keyword
// ---------------------------------------------------------------------------

export const KeywordStatusSchema = z.enum([
  "pending",
  "researching",
  "writing",
  "validating",
  "publishing",
  "completed",
  "failed",
]);

export const KeywordSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  keyword: z.string().min(1),
  status: KeywordStatusSchema,
  priority: z.number().int().default(0),
  notes: z.string().optional(),
  targetWordCount: z.number().int().positive().default(2000),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type KeywordStatus = z.infer<typeof KeywordStatusSchema>;
export type Keyword = z.infer<typeof KeywordSchema>;

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

export const ScheduleSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  cronExpression: z.string().min(1),
  description: z.string().optional(),
  maxArticlesPerRun: z.number().int().positive().default(1),
  enabled: z.boolean().default(true),
  lastRunAt: z.string().datetime().optional(),
  nextRunAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export type Schedule = z.infer<typeof ScheduleSchema>;
