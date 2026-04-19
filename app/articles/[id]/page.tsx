"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkItem {
  url: string;
  text?: string;
  type?: "internal" | "external";
  verified?: boolean;
  status?: number | null;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface OutlineItem {
  heading?: string;
  subheadings?: string[];
  keyPoints?: string[];
}

interface ResearchBrief {
  outline?: OutlineItem[] | string[];
  competitorInsights?: string[] | string;
  externalSources?: { url: string; title?: string; statOrClaim?: string }[];
  targetKeyword?: string;
  recommendedTitle?: string;
  targetWordCount?: number;
}

interface ArticleMetadata {
  title?: string;
  seoTitle?: string;
  metaDescription?: string;
  slug?: string;
  targetKeyword?: string;
  category?: string;
  tags?: string[];
}

interface PublishResult {
  postId?: number | string;
  editUrl?: string;
  previewUrl?: string;
  publishedAt?: string;
}

interface ArticleData {
  id: string;
  keyword?: string;
  status: string;
  createdAt?: string;
  completedAt?: string;
  // Research stage
  researchOutput?: ResearchBrief;
  // Article stage
  articleOutput?: {
    metadata?: ArticleMetadata;
    markdownContent?: string;
    wordCount?: number;
    faqs?: FaqItem[];
    links?: LinkItem[];
  };
  // Validated stage
  validatedOutput?: {
    metadata?: ArticleMetadata;
    markdownContent?: string;
    wordCount?: number;
    faqs?: FaqItem[];
    links?: LinkItem[];
    verificationScore?: number;
  };
  verificationLog?: {
    links?: LinkItem[];
    score?: number;
    totalLinks?: number;
    verifiedLinks?: number;
    internalLinks?: number;
    externalLinks?: number;
  };
  publishResult?: PublishResult;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Basic markdown renderer: handles ##/### headings, **bold**, *italic*, [links], and - lists
function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let keyCounter = 0;

  function nextKey() {
    return ++keyCounter;
  }

  function flushList() {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={nextKey()} style={{ margin: "0 0 16px", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {listItems.map((item, i) => (
          <li key={i} style={{ fontSize: "15px", color: "var(--th-text)", lineHeight: 1.7 }}>
            {inlineRender(item)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  function inlineRender(text: string): React.ReactNode {
    // Split into segments by **bold**, *italic*, [link](url)
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let idx = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/);
      // Italic
      const italicMatch = remaining.match(/^(.*?)\*(.+?)\*/);
      // Link
      const linkMatch = remaining.match(/^(.*?)\[(.+?)\]\((.+?)\)/);

      const candidates = [
        boldMatch ? boldMatch[1].length : Infinity,
        italicMatch ? italicMatch[1].length : Infinity,
        linkMatch ? linkMatch[1].length : Infinity,
      ];
      const minIdx = candidates.indexOf(Math.min(...candidates));

      if (Math.min(...candidates) === Infinity) {
        parts.push(<span key={idx++}>{remaining}</span>);
        break;
      }

      if (minIdx === 0 && boldMatch) {
        if (boldMatch[1]) parts.push(<span key={idx++}>{boldMatch[1]}</span>);
        parts.push(<strong key={idx++} style={{ fontWeight: 700, color: "var(--th-text)" }}>{boldMatch[2]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
      } else if (minIdx === 1 && italicMatch) {
        if (italicMatch[1]) parts.push(<span key={idx++}>{italicMatch[1]}</span>);
        parts.push(<em key={idx++}>{italicMatch[2]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
      } else if (minIdx === 2 && linkMatch) {
        if (linkMatch[1]) parts.push(<span key={idx++}>{linkMatch[1]}</span>);
        parts.push(
          <a key={idx++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--th-text-accent)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
            {linkMatch[2]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
      } else {
        parts.push(<span key={idx++}>{remaining}</span>);
        break;
      }
    }
    return parts;
  }

  for (const line of lines) {
    // h2
    if (line.startsWith("## ")) {
      flushList();
      nodes.push(
        <h2 key={nextKey()} style={{ fontSize: "20px", fontWeight: 700, color: "var(--th-text)", margin: "28px 0 12px", lineHeight: 1.3, borderBottom: "1px solid var(--th-border)", paddingBottom: "8px" }}>
          {inlineRender(line.slice(3))}
        </h2>
      );
      continue;
    }
    // h3
    if (line.startsWith("### ")) {
      flushList();
      nodes.push(
        <h3 key={nextKey()} style={{ fontSize: "16px", fontWeight: 700, color: "var(--th-text)", margin: "20px 0 8px", lineHeight: 1.4 }}>
          {inlineRender(line.slice(4))}
        </h3>
      );
      continue;
    }
    // h4
    if (line.startsWith("#### ")) {
      flushList();
      nodes.push(
        <h4 key={nextKey()} style={{ fontSize: "14px", fontWeight: 700, color: "var(--th-text)", margin: "16px 0 6px" }}>
          {inlineRender(line.slice(5))}
        </h4>
      );
      continue;
    }
    // list item
    if (line.match(/^[-*] /)) {
      listItems.push(line.slice(2));
      continue;
    }
    // numbered list
    if (line.match(/^\d+\. /)) {
      listItems.push(line.replace(/^\d+\. /, ""));
      continue;
    }
    // blank line
    if (line.trim() === "") {
      flushList();
      continue;
    }
    // paragraph
    flushList();
    nodes.push(
      <p key={nextKey()} style={{ fontSize: "15px", color: "var(--th-text)", lineHeight: 1.75, margin: "0 0 14px" }}>
        {inlineRender(line)}
      </p>
    );
  }
  flushList();
  return nodes;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaTag({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "var(--th-text-secondary)", lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function LinkStatusIcon({ verified, status }: { verified?: boolean; status?: number | null }) {
  if (verified === true || (status && status >= 200 && status < 300)) {
    return (
      <span title="Verified" style={{ color: "var(--th-success)", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (verified === false || (status && (status >= 400 || status === 0))) {
    return (
      <span title={`Failed (${status ?? "error"})`} style={{ color: "var(--th-danger)", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    );
  }
  return (
    <span title="Unknown" style={{ color: "var(--th-text-muted)", flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </span>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "16px 20px",
          background: open ? "var(--th-inset)" : "var(--th-card)",
          border: "none",
          cursor: "pointer",
          color: "var(--th-text)",
          textAlign: "left",
          transition: "background 0.15s ease",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 700 }}>{title}</span>
        <span style={{ color: "var(--th-text-muted)", transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "none", display: "flex" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: "20px", borderTop: "1px solid var(--th-border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/articles/${id}`)
      .then((r) => r.json())
      .then((d) => {
        // API returns { job: {...} } with snake_case fields
        const job = d.job ?? d;
        if (!job || d.error) {
          setError(d.error ?? "Article not found");
          return;
        }
        // Normalize snake_case -> camelCase
        setArticle({
          id: job.id,
          keyword: job.keywords?.keyword ?? null,
          status: job.status,
          createdAt: job.created_at,
          completedAt: job.completed_at,
          researchOutput: job.research_output,
          articleOutput: job.article_output,
          validatedOutput: job.validated_output,
          verificationLog: job.verification_log,
          publishResult: job.publish_result,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCopy() {
    const content = article?.validatedOutput?.markdownContent
      ?? article?.articleOutput?.markdownContent
      ?? "";
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  // Prefer validated output over article output
  const output = article?.validatedOutput ?? article?.articleOutput;
  const metadata = output?.metadata;
  const markdownContent = output?.markdownContent ?? "";
  const faqs = output?.faqs ?? [];
  const research = article?.researchOutput;
  const publish = article?.publishResult;

  // Links: prefer verificationLog.links, else output.links
  const allLinks: LinkItem[] = article?.verificationLog?.links ?? output?.links ?? [];
  const internalLinks = allLinks.filter((l) => l.type === "internal" || l.url?.startsWith("/"));
  const externalLinks = allLinks.filter((l) => l.type !== "internal" && !l.url?.startsWith("/"));
  const verifiedCount = allLinks.filter((l) => l.verified === true || (l.status && l.status >= 200 && l.status < 300)).length;
  const passRate = allLinks.length > 0 ? Math.round((verifiedCount / allLinks.length) * 100) : null;
  const wordCount = output?.wordCount ?? (markdownContent ? countWords(markdownContent) : 0);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="skeleton" style={{ width: "80px", height: "20px", borderRadius: "6px" }} />
        </div>
        <div className="skeleton" style={{ height: "36px", width: "70%", borderRadius: "8px" }} />
        <div className="skeleton" style={{ height: "80px", borderRadius: "12px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }}>
          <div className="skeleton" style={{ height: "500px", borderRadius: "12px" }} />
          <div className="skeleton" style={{ height: "500px", borderRadius: "12px" }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <Link href="/articles" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--th-text-muted)", textDecoration: "none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Articles
        </Link>
        <div className="card" style={{ padding: "60px 40px", textAlign: "center", color: "var(--th-danger)" }}>
          <p style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px" }}>Failed to load article</p>
          <p style={{ fontSize: "14px", color: "var(--th-text-muted)", margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!article || !output) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <Link href="/articles" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--th-text-muted)", textDecoration: "none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Articles
        </Link>
        <div className="card" style={{ padding: "60px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--th-text)", margin: "0 0 8px" }}>Article output not available</p>
          <p style={{ fontSize: "14px", color: "var(--th-text-muted)", margin: 0 }}>This job may still be in progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Back link */}
      <Link
        href="/articles"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          color: "var(--th-text-muted)",
          textDecoration: "none",
          width: "fit-content",
          transition: "color 0.15s ease",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--th-text-accent)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--th-text-muted)")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Articles
      </Link>

      {/* Article header */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", marginBottom: "16px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--th-text)", margin: 0, lineHeight: 1.25, flex: 1 }}>
            {metadata?.title ?? article.keyword ?? "Untitled"}
          </h1>
          <button
            onClick={handleCopy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 16px",
              borderRadius: "8px",
              border: "1px solid var(--th-border)",
              background: copied ? "var(--th-success-soft)" : "var(--th-card)",
              color: copied ? "var(--th-success)" : "var(--th-text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Copied
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Markdown
              </>
            )}
          </button>
        </div>

        {/* Metadata bar */}
        <div className="card" style={{ padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
            <MetaTag label="Keyword" value={article.keyword} />
            <MetaTag label="SEO Title" value={metadata?.seoTitle ?? metadata?.title} />
            <MetaTag label="Slug" value={metadata?.slug} />
            <MetaTag label="Category" value={metadata?.category} />
            <MetaTag label="Meta Description" value={metadata?.metaDescription} />
            {wordCount > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Word Count</span>
                <span style={{ fontSize: "13px", color: "var(--th-text-secondary)" }}>{wordCount.toLocaleString()} words</span>
              </div>
            )}
            {article.completedAt && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Completed</span>
                <span style={{ fontSize: "13px", color: "var(--th-text-secondary)" }}>{formatDate(article.completedAt)}</span>
              </div>
            )}
          </div>
          {metadata?.tags && metadata.tags.length > 0 && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--th-border)", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {metadata.tags.map((tag, i) => (
                <span key={i} style={{ padding: "3px 10px", borderRadius: "20px", background: "var(--th-inset)", border: "1px solid var(--th-border)", fontSize: "11px", color: "var(--th-text-secondary)", fontWeight: 500 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two-column: content + source verification */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>
        {/* Left: Article content */}
        <div className="card" style={{ padding: "32px 36px" }}>
          <div style={{ borderBottom: "1px solid var(--th-border)", marginBottom: "24px", paddingBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Article Content
            </h2>
            {article.validatedOutput && (
              <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "var(--th-success-soft)", color: "var(--th-success)", fontWeight: 600 }}>
                Validated
              </span>
            )}
          </div>
          <div style={{ lineHeight: 1.75 }}>
            {markdownContent ? renderMarkdown(markdownContent) : (
              <p style={{ color: "var(--th-text-muted)", fontStyle: "italic" }}>No content available.</p>
            )}
          </div>
        </div>

        {/* Right: Source verification */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "24px" }}>
          <div className="card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
              Source Verification
            </h2>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Total Links", value: allLinks.length || "—" },
                { label: "Pass Rate", value: passRate !== null ? `${passRate}%` : "—" },
                { label: "Internal", value: internalLinks.length || "—" },
                { label: "External", value: externalLinks.length || "—" },
              ].map((stat) => (
                <div key={stat.label} style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--th-inset)", border: "1px solid var(--th-border)" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--th-text)", lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--th-text-muted)", marginTop: "3px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Pass rate bar */}
            {passRate !== null && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--th-text-muted)" }}>Verification pass rate</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: passRate >= 80 ? "var(--th-success)" : passRate >= 50 ? "var(--th-warning)" : "var(--th-danger)" }}>
                    {passRate}%
                  </span>
                </div>
                <div style={{ height: "6px", borderRadius: "3px", background: "var(--th-inset)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${passRate}%`,
                    borderRadius: "3px",
                    background: passRate >= 80 ? "var(--th-success)" : passRate >= 50 ? "var(--th-warning)" : "var(--th-danger)",
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            )}

            {allLinks.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--th-text-muted)", textAlign: "center", padding: "16px 0" }}>
                No links found in this article.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Internal links */}
                {internalLinks.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "11px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                      Internal Links ({internalLinks.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {internalLinks.map((link, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "7px 10px", borderRadius: "6px", background: "var(--th-inset)" }}>
                          <LinkStatusIcon verified={link.verified} status={link.status} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "12px", color: "var(--th-text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {link.text ?? link.url}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--th-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "1px" }}>
                              {link.url}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* External links */}
                {externalLinks.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "11px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                      External Links ({externalLinks.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {externalLinks.map((link, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "7px 10px", borderRadius: "6px", background: "var(--th-inset)" }}>
                          <LinkStatusIcon verified={link.verified} status={link.status} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "12px", color: "var(--th-text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {link.text ?? link.url}
                            </div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: "10px", color: "var(--th-text-accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", marginTop: "1px", textDecoration: "none" }}
                            >
                              {link.url}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQs */}
      {faqs.length > 0 && (
        <div>
          <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
            FAQs ({faqs.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {faqs.map((faq, i) => (
              <div key={i} className="card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--th-text)", marginBottom: "8px", lineHeight: 1.4 }}>
                  {faq.question}
                </div>
                <div style={{ fontSize: "14px", color: "var(--th-text-secondary)", lineHeight: 1.65 }}>
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Research Brief (collapsible) */}
      {research && (
        <CollapsibleSection title="Research Brief">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {research.recommendedTitle && (
              <div>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Recommended Title
                </h4>
                <p style={{ fontSize: "14px", color: "var(--th-text)", margin: 0, fontWeight: 500 }}>{research.recommendedTitle}</p>
              </div>
            )}

            {research.outline && research.outline.length > 0 && (
              <div>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Content Outline
                </h4>
                <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {research.outline.map((item, i) => {
                    if (typeof item === "string") {
                      return <li key={i} style={{ fontSize: "13px", color: "var(--th-text-secondary)", lineHeight: 1.5 }}>{item}</li>;
                    }
                    const section = item as OutlineItem;
                    return (
                      <li key={i} style={{ fontSize: "13px", color: "var(--th-text-secondary)", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600, color: "var(--th-text)" }}>{section.heading}</span>
                        {section.subheadings && section.subheadings.length > 0 && (
                          <ul style={{ margin: "4px 0 0", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "2px" }}>
                            {section.subheadings.map((sub, j) => (
                              <li key={j} style={{ fontSize: "12px", color: "var(--th-text-muted)" }}>{sub}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {research.competitorInsights && (
              <div>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Competitor Insights
                </h4>
                {Array.isArray(research.competitorInsights) ? (
                  <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {research.competitorInsights.map((item, i) => (
                      <li key={i} style={{ fontSize: "13px", color: "var(--th-text-secondary)", lineHeight: 1.5 }}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--th-text-secondary)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                    {String(research.competitorInsights)}
                  </p>
                )}
              </div>
            )}

            {research.externalSources && research.externalSources.length > 0 && (
              <div>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  External Sources ({research.externalSources.length})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {research.externalSources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: "var(--th-inset)",
                        border: "1px solid var(--th-border)",
                        textDecoration: "none",
                        transition: "border-color 0.15s ease",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--th-accent)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--th-border)")}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--th-text-muted)", flexShrink: 0 }}>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {src.title && (
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {src.title}
                          </div>
                        )}
                        <div style={{ fontSize: "11px", color: "var(--th-text-accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {src.url}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {research.targetWordCount && (
              <div>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                  Target Word Count
                </h4>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--th-text)" }}>{research.targetWordCount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Publish info */}
      {publish && (publish.postId || publish.editUrl || publish.previewUrl) && (
        <div>
          <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
            Published
          </h2>
          <div className="card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--th-success)" }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--th-success)" }}>
                Published to WordPress
              </span>
              {publish.publishedAt && (
                <span style={{ fontSize: "12px", color: "var(--th-text-muted)", marginLeft: "4px" }}>
                  {formatDate(publish.publishedAt)}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {publish.postId && (
                <div style={{ fontSize: "13px", color: "var(--th-text-secondary)" }}>
                  Post ID: <strong style={{ color: "var(--th-text)" }}>{publish.postId}</strong>
                </div>
              )}
              {publish.editUrl && (
                <a
                  href={publish.editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: "var(--th-accent-soft)",
                    color: "var(--th-text-accent)",
                    fontSize: "12px",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--th-accent-muted)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--th-accent-soft)")}
                >
                  Edit in WordPress
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </a>
              )}
              {publish.previewUrl && (
                <a
                  href={publish.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: "var(--th-inset)",
                    border: "1px solid var(--th-border)",
                    color: "var(--th-text-secondary)",
                    fontSize: "12px",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--th-border-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--th-border)")}
                >
                  Preview
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
