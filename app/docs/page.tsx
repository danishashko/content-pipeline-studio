export default function DocsPage() {
  return (
    <div
      style={{
        maxWidth: "860px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
      }}
    >
      <style>{`
        .pipeline-stages-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 767px) {
          .pipeline-stages-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (min-width: 480px) and (max-width: 767px) {
          .pipeline-stages-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .field-table-row {
          display: grid;
          grid-template-columns: 180px 1fr;
        }
        @media (max-width: 767px) {
          .field-table-row {
            grid-template-columns: 1fr;
          }
          .field-table-row .field-name-cell {
            border-right: none !important;
            border-bottom: 1px solid var(--th-border);
          }
        }
      `}</style>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--th-text)",
            margin: "0 0 8px",
          }}
        >
          Documentation
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "var(--th-text-secondary)",
            margin: 0,
          }}
        >
          How Content Pipeline Studio works — from site setup to published
          articles.
        </p>
      </div>

      {/* How the pipeline works */}
      <Section title="How the Pipeline Works">
        <p
          style={{
            fontSize: "14px",
            color: "var(--th-text-secondary)",
            margin: "0 0 20px",
            lineHeight: 1.6,
          }}
        >
          Every article goes through four automated stages. Each stage is
          powered by a different part of the Bright Data + AI stack.
        </p>
        <div className="pipeline-stages-grid">
          {[
            {
              num: "1",
              label: "Research",
              color: "#76A5FF",
              desc: "Bright Data Discover API fetches SERP results and scrapes competitor content. Statistics sources are found and scraped. The site sitemap is crawled for internal context. Claude Sonnet synthesises everything into a structured content brief.",
            },
            {
              num: "2",
              label: "Write",
              color: "#34d399",
              desc: "Claude Sonnet writes a full article (2,000–4,500 words) based on the brief, in the site's brand voice. Internal links, vendor screenshots, and featured images are injected automatically.",
            },
            {
              num: "3",
              label: "Validate",
              color: "#f59e0b",
              desc: "A second Claude Sonnet pass fact-checks claims, verifies internal links exist, checks word count, and normalises formatting. The validated output is what gets published.",
            },
            {
              num: "4",
              label: "Publish",
              color: "#a78bfa",
              desc: "If WordPress credentials are configured, the article is posted as a draft via the WP REST API with SEO metadata, categories, and featured image. Otherwise the stage is skipped and the article is marked complete.",
            },
          ].map((s) => (
            <div
              key={s.num}
              className="card"
              style={{
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: s.color + "22",
                    color: s.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {s.num}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--th-text)",
                  }}
                >
                  {s.label}
                </span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--th-text-secondary)",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Tech stack */}
      <Section title="Powered by Bright Data">
        <p
          style={{
            fontSize: "14px",
            color: "var(--th-text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.6,
          }}
        >
          The pipeline uses Bright Data end-to-end — from research to
          screenshots — so every article is grounded in real web data, not
          hallucinated context.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            {
              product: "Discover API",
              use: "Primary research — finds top SERP results for a keyword with relevance scores and scraped content included in a single call. Also runs a statistics-focused query to find data sources.",
            },
            {
              product: "SERP API",
              use: "Fallback when Discover is unavailable — returns organic Google results with titles, URLs, and snippets.",
            },
            {
              product: "Web Unlocker",
              use: "Scrapes competitor pages and sitemap XML — handles JavaScript rendering, CAPTCHAs, and bot protection automatically.",
            },
            {
              product: "Browser API",
              use: "Takes full-resolution 1440×900 screenshots of vendor tools mentioned in listicle articles. Uses a real cloud Chromium instance with cookie banner dismissal.",
            },
          ].map((r) => (
            <div
              key={r.product}
              style={{
                display: "flex",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                background: "var(--th-inset)",
                border: "1px solid var(--th-border)",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--th-text-accent)",
                  whiteSpace: "nowrap",
                  paddingTop: "1px",
                  minWidth: "120px",
                }}
              >
                {r.product}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--th-text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {r.use}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Sites tab */}
      <Section title="Sites">
        <p
          style={{
            fontSize: "14px",
            color: "var(--th-text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.6,
          }}
        >
          A Site is a brand configuration. Every article is written in that
          brand&apos;s voice, links to its product pages, and follows its
          messaging rules. You can run the pipeline for multiple sites
          independently.
        </p>
        <FieldTable
          rows={[
            {
              field: "Slug",
              required: true,
              desc: "Unique identifier used internally. Lowercase, hyphens only. Cannot be changed after creation.",
            },
            {
              field: "Company Name",
              required: true,
              desc: "Used throughout article copy as the brand name.",
            },
            {
              field: "Tagline",
              required: false,
              desc: "Short brand positioning line. Gives the AI tonal context.",
            },
            {
              field: "Company Description",
              required: false,
              desc: "2–4 sentence overview. The AI uses this to understand what the company does and who it serves.",
            },
            {
              field: "WordPress Base URL",
              required: true,
              desc: "Root URL of the WordPress site (e.g. https://acme.com). Used for the publish stage and to extract the domain for internal links.",
            },
            {
              field: "WP Username / App Password",
              required: false,
              desc: "WordPress REST API credentials. If omitted, the publish stage is skipped and articles stay as drafts in the platform.",
            },
            {
              field: "Main Sitemap URL",
              required: false,
              desc: "Scraped during research to discover existing content. Helps the AI recommend internal links to real pages.",
            },
            {
              field: "Blog Sitemap URL",
              required: false,
              desc: "Same as above but targeting the blog post sitemap specifically.",
            },
            {
              field: "Industries",
              required: false,
              desc: "Tags for the industries the company serves (e.g. E-commerce, FinTech). Shapes SERP research intent.",
            },
            {
              field: "Competitors",
              required: false,
              desc: "Competitor domains (e.g. competitor.com). Used in research to find comparison angles.",
            },
            {
              field: "CTA URL + Text",
              required: false,
              desc: "Every article ends with a CTA sentence linking to this URL. Should be a high-intent page like /pricing or /get-started.",
            },
            {
              field: "Product Pages",
              required: false,
              desc: "Key pages the AI should link to internally. Add 8–12 pages with titles and descriptions. The more context you provide, the better the internal linking.",
            },
            {
              field: "Messaging Principles",
              required: false,
              desc: "Brand voice rules. One per line. Examples: 'Lead with data, not claims' or 'Never use the word synergy'.",
            },
            {
              field: "Insight Guardrails",
              required: false,
              desc: "Things the AI must never say. One per line. Examples: 'Do not claim 100% uptime' or 'Never disparage competitors by name'.",
            },
            {
              field: "Customer Pain Points",
              required: false,
              desc: "Category → description pairs. The AI frames articles around these problems. Add 4–8 for best results.",
            },
            {
              field: "Case Studies",
              required: false,
              desc: "Real customer stories the AI can reference as proof points. Include the problem, solution, result, and a quote.",
            },
          ]}
        />
      </Section>

      {/* Queue tab */}
      <Section title="Queue">
        <p
          style={{
            fontSize: "14px",
            color: "var(--th-text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.6,
          }}
        >
          The Queue is where you add keywords and trigger pipeline runs. Each
          keyword produces one article.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Step
            n="1"
            text="Select a site from the dropdown — keywords are always tied to a site config."
          />
          <Step
            n="2"
            text='Type a target keyword (e.g. "best web scraping tools 2026"). Think of this as the article topic, not just an SEO keyword.'
          />
          <Step
            n="3"
            text="Set target word count (default 2,000). The AI treats this as a soft target — complex topics usually run 10–20% longer."
          />
          <Step
            n="4"
            text="Set priority (0–10). Higher priority keywords sort to the top of the queue."
          />
          <Step
            n="5"
            text="Hit Run. The pipeline starts immediately and runs in the background — you can navigate away. Monitor progress on the Pipeline tab."
          />
        </div>
        <Callout>
          Keywords in <Badge color="#f59e0b">failed</Badge> status can be
          re-run. Keywords in <Badge color="#34d399">completed</Badge> status
          must be reset manually if you want to regenerate.
        </Callout>
      </Section>

      {/* Pipeline tab */}
      <Section title="Pipeline">
        <p
          style={{
            fontSize: "14px",
            color: "var(--th-text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.6,
          }}
        >
          The Pipeline tab shows real-time job status for all running and
          completed pipeline runs.
        </p>
        <FieldTable
          rows={[
            {
              field: "researching",
              required: false,
              desc: "Stage 1 active — fetching SERP, scraping competitors, building content brief. Takes 30–90 seconds.",
            },
            {
              field: "writing",
              required: false,
              desc: "Stage 2 active — Claude Sonnet is generating the article. Takes 1–3 minutes depending on length.",
            },
            {
              field: "validating",
              required: false,
              desc: "Stage 3 active — second AI pass checking facts, links, and formatting. Takes 30–60 seconds.",
            },
            {
              field: "publishing",
              required: false,
              desc: "Stage 4 active — posting to WordPress. Takes 5–15 seconds.",
            },
            {
              field: "completed",
              required: false,
              desc: "All stages done. Article is available in the Articles tab.",
            },
            {
              field: "failed",
              required: false,
              desc: "One stage threw an error. Check the error field for details. The keyword is reset to pending so you can re-run.",
            },
          ]}
        />
        <Callout>
          Screenshot capture (vendor tool images in listicle articles) runs
          between Stage 2 and Stage 3. It is non-fatal — if screenshots fail,
          the article still completes.
        </Callout>
      </Section>

      {/* Articles tab */}
      <Section title="Articles">
        <p
          style={{
            fontSize: "14px",
            color: "var(--th-text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.6,
          }}
        >
          The Articles tab lists all completed articles. Click any article to
          read the full content, see the research brief, internal links used,
          and FAQs.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Step
            n="1"
            text="The article card shows keyword, word count, and completion date."
          />
          <Step
            n="2"
            text="Open an article to read the full markdown-rendered content including tables, images, and vendor screenshots."
          />
          <Step
            n="3"
            text='Switch to the "Research Brief" tab to see what the AI found — SERP results, competitor analysis, recommended keywords, and the outline it planned before writing.'
          />
          <Step
            n="4"
            text='The "Internal Links" tab shows every internal link the AI used, with anchor text and destination URL.'
          />
          <Step
            n="5"
            text="FAQs are generated automatically and can be used as schema markup for rich snippets."
          />
        </div>
      </Section>

      {/* Schedules tab */}
      <Section title="Schedules">
        <p
          style={{
            fontSize: "14px",
            color: "var(--th-text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.6,
          }}
        >
          Schedules let you run the pipeline automatically on a cron schedule —
          useful for publishing a consistent cadence of articles without manual
          triggers.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Step
            n="1"
            text="Create a schedule linked to a site and a list of keywords."
          />
          <Step
            n="2"
            text='Set a cron expression (e.g. "0 9 * * 1" = every Monday at 9am).'
          />
          <Step
            n="3"
            text="The scheduler picks the next pending keyword from the list and fires the pipeline."
          />
          <Step
            n="4"
            text="Once all keywords in the schedule are exhausted, the schedule pauses until you add more."
          />
        </div>
        <Callout>
          Schedules require the{" "}
          <code
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              background: "var(--th-inset)",
              padding: "1px 5px",
              borderRadius: "4px",
            }}
          >
            CRON_SECRET
          </code>{" "}
          environment variable to be set in Vercel. The cron endpoint is
          authenticated so it cannot be triggered by external parties.
        </Callout>
      </Section>

      {/* Settings tab */}
      <Section title="Settings">
        <p
          style={{
            fontSize: "14px",
            color: "var(--th-text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.6,
          }}
        >
          Global settings for the pipeline. These apply across all sites unless
          overridden at the site level.
        </p>
        <FieldTable
          rows={[
            {
              field: "Research Model",
              required: false,
              desc: "LLM used for Stage 1 content brief synthesis. Default: Claude Sonnet 4.6. Changing to a faster/cheaper model reduces quality of the brief.",
            },
            {
              field: "Writer Model",
              required: false,
              desc: "LLM used for Stage 2 article generation. Default: Claude Sonnet 4.6. This is the most important model — do not downgrade for production content.",
            },
            {
              field: "Validator Model",
              required: false,
              desc: "LLM used for Stage 3 fact-checking. Default: Claude Sonnet 4.6.",
            },
            {
              field: "Publisher Model",
              required: false,
              desc: "LLM used for any metadata formatting in Stage 4. Default: GPT-4o Mini (cheap, fast, formatting only).",
            },
          ]}
        />
        <Callout>
          Per-site model overrides can be set in the site config&apos;s{" "}
          <code
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              background: "var(--th-inset)",
              padding: "1px 5px",
              borderRadius: "4px",
            }}
          >
            modelConfig
          </code>{" "}
          field. This lets you use a faster model for lower-priority sites and
          Claude Sonnet for flagship content.
        </Callout>
      </Section>

      {/* Lead collection */}
      <Section title="Lead Collection">
        <p
          style={{
            fontSize: "14px",
            color: "var(--th-text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.6,
          }}
        >
          When a visitor submits their email to run the pipeline, they become a
          lead. Leads are stored in Supabase and have a per-article generation
          limit.
        </p>
        <FieldTable
          rows={[
            {
              field: "Email Gate",
              required: false,
              desc: "Shown when a visitor tries to run the pipeline. Collects name and email before allowing generation.",
            },
            {
              field: "max_articles",
              required: false,
              desc: "How many articles a lead can generate. Default: 2. Increase this in Supabase for VIP leads or partners.",
            },
            {
              field: "articles_generated",
              required: false,
              desc: "Counter that increments each time a lead triggers a pipeline run.",
            },
            {
              field: "Upgrade CTA",
              required: false,
              desc: "When a lead hits their limit, they see an upgrade CTA linking to brightdata.com.",
            },
          ]}
        />
      </Section>

      {/* Tips */}
      <Section title="Tips for Better Articles">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            "Add 10+ product pages to the site config. The AI cannot link to pages it does not know about.",
            "Include customer pain points. Articles that open by addressing a real problem convert better than generic guides.",
            "Use sitemaps. The research stage reads your existing content to avoid duplicate topics and suggest complementary internal links.",
            "Target long-tail keywords (4+ words). Broad keywords produce generic articles. Specific keywords produce focused, rankable content.",
            "Set a realistic target word count. 2,000 words for comparison posts. 2,500–3,500 for how-to guides. 3,500+ for ultimate guides.",
            "Add case studies to your site config. Articles with real proof points (names, results, quotes) outperform generic claims significantly.",
            "Listicle keywords get vendor screenshots automatically. For comparison articles, the pipeline detects tool names in headings and captures their homepages via Bright Data Browser API.",
          ].map((tip, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                background: "var(--th-inset)",
                border: "1px solid var(--th-border)",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--th-text-accent)",
                  flexShrink: 0,
                  paddingTop: "1px",
                }}
              >
                #{i + 1}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--th-text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {tip}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "0",
      }}
    >
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--th-text)",
          margin: "0 0 16px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--th-border)",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function FieldTable({
  rows,
}: {
  rows: { field: string; required: boolean; desc: string }[];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1px",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--th-border)",
      }}
    >
      {rows.map((row, i) => (
        <div
          key={i}
          className="field-table-row"
          style={{
            background: i % 2 === 0 ? "var(--th-bg)" : "var(--th-inset)",
          }}
        >
          <div
            className="field-name-cell"
            style={{
              padding: "10px 14px",
              borderRight: "1px solid var(--th-border)",
              display: "flex",
              alignItems: "flex-start",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--th-text)",
                fontFamily: "monospace",
              }}
            >
              {row.field}
            </span>
            {row.required && (
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#ef4444",
                  background: "#ef444420",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  marginTop: "2px",
                  flexShrink: 0,
                }}
              >
                REQ
              </span>
            )}
          </div>
          <div style={{ padding: "10px 14px" }}>
            <span
              style={{
                fontSize: "12px",
                color: "var(--th-text-secondary)",
                lineHeight: 1.55,
              }}
            >
              {row.desc}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <span
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "var(--th-accent-soft)",
          color: "var(--th-text-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 700,
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontSize: "13px",
          color: "var(--th-text-secondary)",
          lineHeight: 1.6,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: "16px",
        padding: "12px 16px",
        borderRadius: "8px",
        background: "var(--th-accent-soft)",
        borderLeft: "3px solid var(--th-accent)",
        fontSize: "13px",
        color: "var(--th-text-secondary)",
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "1px 8px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: color + "22",
        color: color,
      }}
    >
      {children}
    </span>
  );
}
