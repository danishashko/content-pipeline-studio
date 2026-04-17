"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Site {
  id: string;
  slug: string;
  companyName: string;
}

interface Article {
  id: string;
  title?: string;
  metadata?: { title?: string; targetKeyword?: string };
  site?: string;
  siteId?: string;
  keyword?: string;
  wordCount?: number;
  word_count?: number;
  status?: string;
  createdAt?: string;
  created_at?: string;
  linksTotal?: number;
  linksVerified?: number;
}

function formatDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function ExportIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteFilter, setSiteFilter] = useState("all");
  const [search, setSearch] = useState("");

  const siteMap: Record<string, string> = {};
  sites.forEach((s) => { siteMap[s.id] = s.companyName; });

  const loadData = useCallback(async () => {
    try {
      const url = siteFilter !== "all" ? `/api/articles?siteId=${siteFilter}` : "/api/articles";
      const [artRes, sitesRes] = await Promise.allSettled([
        fetch(url),
        fetch("/api/sites"),
      ]);
      if (artRes.status === "fulfilled" && artRes.value.ok) {
        const d = await artRes.value.json();
        setArticles(Array.isArray(d) ? d : (d.articles ?? []));
      }
      if (sitesRes.status === "fulfilled" && sitesRes.value.ok) {
        const d = await sitesRes.value.json();
        setSites(Array.isArray(d) ? d : (d.sites ?? []));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [siteFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleExport(article: Article) {
    try {
      const res = await fetch(`/api/articles/${article.id}`);
      if (!res.ok) throw new Error("Failed to fetch article");
      const data = await res.json();
      const content = data.markdownContent ?? data.articleOutput?.markdownContent ?? "";
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(article.title ?? article.metadata?.title ?? "article").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    }
  }

  const filtered = articles.filter((a) => {
    const title = (a.title ?? a.metadata?.title ?? "").toLowerCase();
    const keyword = (a.keyword ?? a.metadata?.targetKeyword ?? "").toLowerCase();
    const q = search.toLowerCase();
    return !q || title.includes(q) || keyword.includes(q);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>Articles</h1>
          <p style={{ fontSize: "14px", color: "var(--th-text-secondary)", margin: "6px 0 0" }}>
            {loading ? "Loading..." : `${filtered.length} article${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--th-text-muted)" }}>
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "9px 12px 9px 32px",
                borderRadius: "8px",
                border: "1px solid var(--th-border)",
                background: "var(--th-card)",
                color: "var(--th-text)",
                fontSize: "13px",
                outline: "none",
                width: "220px",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--th-accent)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--th-border)"}
            />
          </div>
          {/* Site filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid var(--th-border)",
              background: "var(--th-card)",
              color: "var(--th-text)",
              fontSize: "13px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="all">All Sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "var(--th-danger-soft)", color: "var(--th-danger)", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--th-inset)" }}>
              {["Title", "Site", "Keyword", "Words", "Links", "Date", "Actions"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--th-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}>
                      <div className="skeleton" style={{ height: "14px", width: j === 0 ? "70%" : "40%", borderRadius: "4px" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "60px 16px", textAlign: "center", color: "var(--th-text-muted)", fontSize: "14px" }}>
                  {search ? `No articles matching "${search}"` : "No articles yet. Run the pipeline to generate content."}
                </td>
              </tr>
            ) : (
              filtered.map((article, idx) => {
                const title = article.title ?? article.metadata?.title ?? "Untitled";
                const keyword = article.keyword ?? article.metadata?.targetKeyword ?? "—";
                const siteName = siteMap[article.siteId ?? ""] ?? article.site ?? "—";
                const words = article.wordCount ?? article.word_count ?? 0;
                const linksVerified = article.linksVerified ?? 0;
                const linksTotal = article.linksTotal ?? 0;

                return (
                  <tr
                    key={article.id}
                    style={{ borderTop: idx > 0 ? "1px solid var(--th-border)" : "none", transition: "background 0.1s ease" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--th-card-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", maxWidth: "260px" }}>
                      <Link
                        href={`/articles/${article.id}`}
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--th-text)",
                          textDecoration: "none",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--th-text-accent)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--th-text)")}
                      >
                        {title}
                      </Link>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--th-text-secondary)", whiteSpace: "nowrap" }}>{siteName}</td>
                    <td style={{ padding: "12px 16px", maxWidth: "180px" }}>
                      <span style={{ fontSize: "12px", color: "var(--th-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{keyword}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--th-text-secondary)", whiteSpace: "nowrap" }}>
                      {words > 0 ? words.toLocaleString() : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      {linksTotal > 0 ? (
                        <span style={{ fontSize: "12px", color: linksVerified === linksTotal ? "var(--th-success)" : "var(--th-warning)" }}>
                          {linksVerified}/{linksTotal}
                        </span>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--th-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--th-text-muted)", whiteSpace: "nowrap" }}>
                      {formatDate(article.createdAt ?? article.created_at)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <Link
                          href={`/articles/${article.id}`}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            background: "var(--th-accent-soft)",
                            color: "var(--th-text-accent)",
                            fontSize: "12px",
                            fontWeight: 600,
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleExport(article)}
                          title="Export Markdown"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "5px 8px",
                            borderRadius: "6px",
                            border: "1px solid var(--th-border)",
                            background: "transparent",
                            color: "var(--th-text-secondary)",
                            cursor: "pointer",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--th-inset)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <ExportIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
