"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { StageProgress } from "@/components/pipeline/stage-progress";

interface PipelineJob {
  id: string;
  keywordId: string;
  siteId: string;
  keyword?: string;
  site?: string;
  status: string;
  currentStage?: string;
  stageProgress: Record<string, string>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  researchOutput?: {
    targetKeyword?: string;
    recommendedTitle?: string;
    targetWordCount?: number;
  };
  articleOutput?: {
    metadata?: {
      title?: string;
      metaDescription?: string;
      targetKeyword?: string;
    };
    markdownContent?: string;
  };
}

interface JobDetail {
  stageProgress: Record<string, string>;
  currentStage?: string;
  error?: string;
  researchOutput?: PipelineJob["researchOutput"];
  articleOutput?: PipelineJob["articleOutput"];
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "var(--th-inset)", color: "var(--th-text-muted)", label: "Pending" },
  researching: { bg: "var(--th-stage-research-soft)", color: "var(--th-stage-research)", label: "Researching" },
  writing: { bg: "var(--th-stage-write-soft)", color: "var(--th-stage-write)", label: "Writing" },
  validating: { bg: "var(--th-stage-validate-soft)", color: "var(--th-stage-validate)", label: "Validating" },
  publishing: { bg: "var(--th-stage-publish-soft)", color: "var(--th-stage-publish)", label: "Publishing" },
  completed: { bg: "var(--th-success-soft)", color: "var(--th-success)", label: "Completed" },
  failed: { bg: "var(--th-danger-soft)", color: "var(--th-danger)", label: "Failed" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "4px 12px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 600,
      background: cfg.bg, color: cfg.color,
    }}>
      {["researching", "writing", "validating", "publishing"].includes(status) && (
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.color, animation: "pulse 2s infinite", flexShrink: 0 }} />
      )}
      {cfg.label}
    </span>
  );
}

function formatDuration(start?: string, end?: string) {
  if (!start) return null;
  const from = new Date(start).getTime();
  const to = end ? new Date(end).getTime() : Date.now();
  const secs = Math.floor((to - from) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}m ${rem}s`;
}

function formatTime(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
  catch { return "—"; }
}

export default function PipelinePage() {
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<Record<string, JobDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/keywords");
      if (!res.ok) return;
      const data = await res.json();
      const arr: PipelineJob[] = (Array.isArray(data) ? data : (data.keywords ?? []))
        .filter((k: { status: string }) => k.status !== "pending")
        .map((k: {
          id: string;
          keywordId?: string;
          siteId?: string;
          site_id?: string;
          keyword: string;
          site?: string;
          status: string;
          currentStage?: string;
          current_stage?: string;
          stageProgress?: Record<string, string>;
          stage_progress?: Record<string, string>;
          error?: string;
          startedAt?: string;
          started_at?: string;
          completedAt?: string;
          completed_at?: string;
          createdAt: string;
          created_at?: string;
        }) => ({
          id: k.id,
          keywordId: k.keywordId ?? k.id,
          siteId: k.siteId ?? k.site_id ?? "",
          keyword: k.keyword,
          site: k.site,
          status: k.status,
          currentStage: k.currentStage ?? k.current_stage,
          stageProgress: k.stageProgress ?? k.stage_progress ?? {},
          error: k.error,
          startedAt: k.startedAt ?? k.started_at,
          completedAt: k.completedAt ?? k.completed_at,
          createdAt: k.createdAt ?? k.created_at ?? "",
        }));
      setJobs(arr);
      setLastUpdated(new Date());
    } catch {
      // silently ignore refresh errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    intervalRef.current = setInterval(loadJobs, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadJobs]);

  async function loadJobDetail(keywordId: string) {
    setDetailLoading(keywordId);
    try {
      const res = await fetch(`/api/pipeline/status/${keywordId}?by=keyword`);
      if (res.ok) {
        const data = await res.json();
        const j = data.job;
        if (j) {
          const detail: JobDetail = {
            stageProgress: j.stage_progress ?? {},
            currentStage: j.current_stage,
            error: j.error,
            researchOutput: j.research_output,
            articleOutput: j.validated_output ?? j.article_output,
          };
          setJobDetails((prev) => ({ ...prev, [keywordId]: detail }));
        }
      }
    } catch {
      // ignore
    } finally {
      setDetailLoading(null);
    }
  }

  function toggleExpand(jobId: string) {
    if (expandedId === jobId) {
      setExpandedId(null);
    } else {
      setExpandedId(jobId);
      if (!jobDetails[jobId]) {
        loadJobDetail(jobId);
      }
    }
  }

  const activeJobs = jobs.filter((j) => ["researching", "writing", "validating", "publishing"].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const failedJobs = jobs.filter((j) => j.status === "failed");

  function JobRow({ job }: { job: PipelineJob }) {
    const isExpanded = expandedId === job.id;
    const detail = jobDetails[job.id];
    const duration = formatDuration(job.startedAt, job.completedAt);

    return (
      <div
        style={{
          border: "1px solid var(--th-border)",
          borderRadius: "10px",
          overflow: "hidden",
          transition: "border-color 0.15s ease",
        }}
        onMouseEnter={e => !isExpanded && ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--th-border-hover)")}
        onMouseLeave={e => !isExpanded && ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--th-border)")}
      >
        {/* Main row */}
        <div
          onClick={() => toggleExpand(job.id)}
          style={{
            padding: "16px 20px",
            cursor: "pointer",
            background: isExpanded ? "var(--th-inset)" : "var(--th-card)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            transition: "background 0.15s ease",
          }}
        >
          {/* Expand chevron */}
          <div style={{ color: "var(--th-text-muted)", flexShrink: 0, transition: "transform 0.2s ease", transform: isExpanded ? "rotate(180deg)" : "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* Keyword + site */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--th-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>
              {job.keyword}
            </div>
            <div style={{ fontSize: "12px", color: "var(--th-text-muted)" }}>
              {job.site ?? job.siteId}
              {duration && <span style={{ marginLeft: "8px" }}>· {duration}</span>}
            </div>
          </div>

          {/* Stage progress */}
          <div style={{ width: "280px", flexShrink: 0 }}>
            <StageProgress
              stageProgress={job.stageProgress}
              currentStage={job.currentStage}
              error={job.error}
            />
          </div>

          {/* Status */}
          <div style={{ flexShrink: 0 }}>
            <StatusBadge status={job.status} />
          </div>

          {/* Time */}
          <div style={{ fontSize: "12px", color: "var(--th-text-muted)", flexShrink: 0, textAlign: "right", minWidth: "80px" }}>
            {formatTime(job.startedAt ?? job.createdAt)}
          </div>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div style={{ padding: "20px", background: "var(--th-card)", borderTop: "1px solid var(--th-border)" }}>
            {detailLoading === job.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="skeleton" style={{ height: "14px", width: "50%", borderRadius: "4px" }} />
                <div className="skeleton" style={{ height: "14px", width: "70%", borderRadius: "4px" }} />
                <div className="skeleton" style={{ height: "80px", width: "100%", borderRadius: "4px" }} />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Left: stage detail */}
                <div>
                  <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                    Stage Status
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {["research", "write", "validate", "publish"].map((stage) => {
                      const progress = (detail?.stageProgress ?? job.stageProgress)[stage];
                      const stageColors: Record<string, string> = {
                        research: "var(--th-stage-research)",
                        write: "var(--th-stage-write)",
                        validate: "var(--th-stage-validate)",
                        publish: "var(--th-stage-publish)",
                      };
                      return (
                        <div key={stage} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: progress === "completed" ? stageColors[stage] : progress === "failed" ? "var(--th-danger)" : (detail?.currentStage ?? job.currentStage) === stage ? stageColors[stage] : "var(--th-border)", flexShrink: 0 }} />
                          <span style={{ fontSize: "13px", color: "var(--th-text)", textTransform: "capitalize", flex: 1 }}>{stage}</span>
                          <span style={{ fontSize: "12px", color: "var(--th-text-muted)", textTransform: "capitalize" }}>{progress ?? "pending"}</span>
                        </div>
                      );
                    })}
                  </div>
                  {(detail?.error ?? job.error) && (
                    <div style={{ marginTop: "16px", padding: "10px 14px", borderRadius: "8px", background: "var(--th-danger-soft)", color: "var(--th-danger)", fontSize: "12px", lineHeight: 1.5 }}>
                      {detail?.error ?? job.error}
                    </div>
                  )}
                </div>

                {/* Right: research/article summary */}
                <div>
                  {(detail?.researchOutput ?? job.researchOutput) && (
                    <div>
                      <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                        Research Output
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(detail?.researchOutput ?? job.researchOutput)?.recommendedTitle && (
                          <div style={{ fontSize: "13px", color: "var(--th-text)", fontWeight: 500 }}>
                            {(detail?.researchOutput ?? job.researchOutput)?.recommendedTitle}
                          </div>
                        )}
                        {(detail?.researchOutput ?? job.researchOutput)?.targetWordCount && (
                          <div style={{ fontSize: "12px", color: "var(--th-text-muted)" }}>
                            Target: {(detail?.researchOutput ?? job.researchOutput)?.targetWordCount?.toLocaleString()} words
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {(detail?.articleOutput ?? job.articleOutput) && (
                    <div style={{ marginTop: "16px" }}>
                      <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                        Article Preview
                      </h4>
                      <div style={{ fontSize: "13px", color: "var(--th-text)", fontWeight: 500, marginBottom: "6px" }}>
                        {(detail?.articleOutput ?? job.articleOutput)?.metadata?.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--th-text-secondary)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                        {(detail?.articleOutput ?? job.articleOutput)?.metadata?.metaDescription}
                      </div>
                    </div>
                  )}
                  {!detail?.researchOutput && !detail?.articleOutput && !job.researchOutput && !job.articleOutput && (
                    <div style={{ color: "var(--th-text-muted)", fontSize: "13px", paddingTop: "8px" }}>
                      Output will appear here as stages complete.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>Pipeline Monitor</h1>
          <p style={{ fontSize: "14px", color: "var(--th-text-secondary)", margin: "6px 0 0" }}>
            Live job tracking · Auto-refreshes every 5s
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "12px", color: "var(--th-text-muted)" }}>
            Last updated: {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", background: activeJobs.length > 0 ? "var(--th-success-soft)" : "var(--th-inset)", color: activeJobs.length > 0 ? "var(--th-success)" : "var(--th-text-muted)", fontSize: "12px", fontWeight: 600 }}>
            {activeJobs.length > 0 && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--th-success)", animation: "pulse 2s infinite" }} />}
            {activeJobs.length} Active
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div className="skeleton" style={{ width: "14px", height: "14px", borderRadius: "50%" }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: "40%", height: "14px", borderRadius: "4px", marginBottom: "6px" }} />
                  <div className="skeleton" style={{ width: "20%", height: "12px", borderRadius: "4px" }} />
                </div>
                <div className="skeleton" style={{ width: "280px", height: "36px", borderRadius: "8px" }} />
                <div className="skeleton" style={{ width: "80px", height: "24px", borderRadius: "20px" }} />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card" style={{ padding: "80px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--th-inset)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--th-text-muted)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--th-text)", margin: "0 0 8px" }}>No pipeline activity</h3>
            <p style={{ fontSize: "14px", color: "var(--th-text-muted)", margin: 0 }}>
              Run a keyword from the <a href="/queue" style={{ color: "var(--th-text-accent)" }}>Queue</a> to start the pipeline.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Active */}
          {activeJobs.length > 0 && (
            <div>
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--th-success)", animation: "pulse 2s infinite", display: "inline-block" }} />
                Active ({activeJobs.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {activeJobs.map((job) => <JobRow key={job.id} job={job} />)}
              </div>
            </div>
          )}

          {/* Failed */}
          {failedJobs.length > 0 && (
            <div>
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                Failed ({failedJobs.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {failedJobs.map((job) => <JobRow key={job.id} job={job} />)}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedJobs.length > 0 && (
            <div>
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                Completed ({completedJobs.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {completedJobs.slice(0, 10).map((job) => <JobRow key={job.id} job={job} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
