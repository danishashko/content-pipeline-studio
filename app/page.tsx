"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";

interface ArticleRow {
  id: string;
  title: string;
  site: string;
  keyword: string;
  status: string;
  wordCount: number;
  createdAt: string;
}

interface JobActivity {
  id: string;
  keyword: string;
  site: string;
  status: string;
  currentStage?: string;
  stageProgress: Record<string, string>;
  startedAt?: string;
  error?: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "var(--th-inset)", color: "var(--th-text-muted)", label: "Pending" },
  researching: { bg: "var(--th-stage-research-soft)", color: "var(--th-stage-research)", label: "Researching" },
  writing: { bg: "var(--th-stage-write-soft)", color: "var(--th-stage-write)", label: "Writing" },
  validating: { bg: "var(--th-stage-validate-soft)", color: "var(--th-stage-validate)", label: "Validating" },
  publishing: { bg: "var(--th-stage-publish-soft)", color: "var(--th-stage-publish)", label: "Publishing" },
  completed: { bg: "var(--th-success-soft)", color: "var(--th-success)", label: "Completed" },
  failed: { bg: "var(--th-danger-soft)", color: "var(--th-danger)", label: "Failed" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        textTransform: "capitalize",
      }}
    >
      {status === "researching" || status === "writing" || status === "validating" || status === "publishing" ? (
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.color, animation: "pulse 2s infinite", flexShrink: 0 }} />
      ) : null}
      {cfg.label}
    </span>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="skeleton" style={{ height: "14px", width: i === 0 ? "60%" : "40%", borderRadius: "4px" }} />
        </td>
      ))}
    </tr>
  );
}

const STAGES = ["research", "write", "validate", "publish"];
const STAGE_COLORS: Record<string, string> = {
  research: "var(--th-stage-research)",
  write: "var(--th-stage-write)",
  validate: "var(--th-stage-validate)",
  publish: "var(--th-stage-publish)",
};

function MiniStageProgress({ stageProgress, currentStage }: { stageProgress: Record<string, string>; currentStage?: string }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {STAGES.map((stage) => {
        const isCompleted = stageProgress[stage] === "completed";
        const isCurrent = stage === currentStage;
        const color = STAGE_COLORS[stage];
        return (
          <div
            key={stage}
            title={stage}
            style={{
              width: "24px",
              height: "6px",
              borderRadius: "3px",
              background: isCompleted ? color : isCurrent ? color : "var(--th-inset)",
              opacity: isCurrent && !isCompleted ? 0.6 : 1,
              transition: "all 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sites: 0, queued: 0, completed: 0, active: 0 });
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [jobs, setJobs] = useState<JobActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [sitesRes, keywordsRes, articlesRes] = await Promise.allSettled([
          fetch("/api/sites"),
          fetch("/api/keywords?status=pending"),
          fetch("/api/articles?limit=10"),
        ]);

        let sitesCount = 0;
        let queuedCount = 0;
        let completedCount = 0;
        let activeCount = 0;
        let articleRows: ArticleRow[] = [];
        let jobRows: JobActivity[] = [];

        if (sitesRes.status === "fulfilled" && sitesRes.value.ok) {
          const data = await sitesRes.value.json();
          sitesCount = Array.isArray(data) ? data.length : (data.sites?.length ?? 0);
        }

        if (keywordsRes.status === "fulfilled" && keywordsRes.value.ok) {
          const data = await keywordsRes.value.json();
          const arr = Array.isArray(data) ? data : (data.keywords ?? []);
          queuedCount = arr.length;
          activeCount = arr.filter((k: { status: string }) =>
            ["researching", "writing", "validating", "publishing"].includes(k.status)
          ).length;
          jobRows = arr
            .filter((k: { status: string }) => ["researching", "writing", "validating", "publishing"].includes(k.status))
            .slice(0, 5)
            .map((k: { id: string; keyword: string; site?: string; status: string; currentStage?: string; stageProgress?: Record<string, string>; startedAt?: string; error?: string }) => ({
              id: k.id,
              keyword: k.keyword,
              site: k.site ?? "—",
              status: k.status,
              currentStage: k.currentStage,
              stageProgress: k.stageProgress ?? {},
              startedAt: k.startedAt,
              error: k.error,
            }));
        }

        if (articlesRes.status === "fulfilled" && articlesRes.value.ok) {
          const data = await articlesRes.value.json();
          const arr = Array.isArray(data) ? data : (data.articles ?? []);
          completedCount = arr.length;
          articleRows = arr.map((a: { id: string; title?: string; metadata?: { title?: string }; site?: string; keyword?: string; status?: string; wordCount?: number; word_count?: number; createdAt?: string; created_at?: string }) => ({
            id: a.id,
            title: a.title ?? a.metadata?.title ?? "Untitled",
            site: a.site ?? "—",
            keyword: a.keyword ?? "—",
            status: a.status ?? "completed",
            wordCount: a.wordCount ?? a.word_count ?? 0,
            createdAt: a.createdAt ?? a.created_at ?? "",
          }));
        }

        setStats({ sites: sitesCount, queued: queuedCount, completed: completedCount, active: activeCount });
        setArticles(articleRows);
        setJobs(jobRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--th-text)", margin: 0, lineHeight: 1.2 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "14px", color: "var(--th-text-secondary)", margin: "6px 0 0", lineHeight: 1.5 }}>
          Content pipeline overview
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "var(--th-danger-soft)", color: "var(--th-danger)", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: "20px" }}>
              <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "10px", marginBottom: "16px" }} />
              <div className="skeleton" style={{ width: "60px", height: "32px", borderRadius: "4px", marginBottom: "8px" }} />
              <div className="skeleton" style={{ width: "100px", height: "14px", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      ) : (
        <StatsCards
          sites={stats.sites}
          queued={stats.queued}
          completed={stats.completed}
          active={stats.active}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" }}>
        {/* Recent Articles */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--th-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--th-text)", margin: 0 }}>Recent Articles</h2>
              <p style={{ fontSize: "12px", color: "var(--th-text-muted)", margin: "2px 0 0" }}>Last 10 generated</p>
            </div>
            <a
              href="/articles"
              style={{ fontSize: "13px", color: "var(--th-text-accent)", textDecoration: "none", fontWeight: 500 }}
            >
              View all
            </a>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--th-inset)" }}>
                  {["Title", "Site", "Status", "Words", "Date"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--th-text-muted)",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px 16px", textAlign: "center", color: "var(--th-text-muted)", fontSize: "14px" }}>
                      No articles yet. Add keywords to the queue to get started.
                    </td>
                  </tr>
                ) : (
                  articles.map((article, idx) => (
                    <tr
                      key={article.id}
                      style={{
                        borderTop: idx > 0 ? "1px solid var(--th-border)" : "none",
                        transition: "background 0.1s ease",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--th-card-hover)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px", maxWidth: "220px" }}>
                        <a
                          href={`/articles/${article.id}`}
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "var(--th-text)",
                            textDecoration: "none",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {article.title}
                        </a>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--th-text-secondary)", whiteSpace: "nowrap" }}>{article.site}</td>
                      <td style={{ padding: "12px 16px" }}><StatusBadge status={article.status} /></td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--th-text-secondary)", whiteSpace: "nowrap" }}>
                        {article.wordCount > 0 ? article.wordCount.toLocaleString() : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--th-text-muted)", whiteSpace: "nowrap" }}>{formatDate(article.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline Activity */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--th-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--th-text)", margin: 0 }}>Pipeline Activity</h2>
              <p style={{ fontSize: "12px", color: "var(--th-text-muted)", margin: "2px 0 0" }}>Active jobs</p>
            </div>
            <a href="/pipeline" style={{ fontSize: "13px", color: "var(--th-text-accent)", textDecoration: "none", fontWeight: 500 }}>
              Monitor
            </a>
          </div>
          <div style={{ padding: "8px 0" }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ padding: "16px 24px", borderBottom: "1px solid var(--th-border)" }}>
                  <div className="skeleton" style={{ width: "60%", height: "14px", borderRadius: "4px", marginBottom: "8px" }} />
                  <div className="skeleton" style={{ width: "100%", height: "8px", borderRadius: "4px" }} />
                </div>
              ))
            ) : jobs.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--th-text-muted)", fontSize: "14px" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--th-text-muted)", margin: "0 auto", display: "block" }}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                No active jobs
              </div>
            ) : (
              jobs.map((job, idx) => (
                <div
                  key={job.id}
                  style={{
                    padding: "14px 24px",
                    borderBottom: idx < jobs.length - 1 ? "1px solid var(--th-border)" : "none",
                    transition: "background 0.1s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--th-card-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--th-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                      {job.keyword}
                    </span>
                    <StatusBadge status={job.status} />
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <MiniStageProgress stageProgress={job.stageProgress} currentStage={job.currentStage} />
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--th-text-muted)" }}>{job.site}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
