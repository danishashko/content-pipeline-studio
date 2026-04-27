"use client";

import { useEffect, useState, useCallback } from "react";
import { apiPath } from "@/lib/base-path";

interface Site {
  id: string;
  slug: string;
  companyName: string;
}

interface Keyword {
  id: string;
  keyword: string;
  siteId: string;
  site?: string;
  status: string;
  priority: number;
  targetWordCount: number;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  pending: {
    bg: "var(--th-inset)",
    color: "var(--th-text-muted)",
    label: "Pending",
  },
  researching: {
    bg: "var(--th-stage-research-soft)",
    color: "var(--th-stage-research)",
    label: "Researching",
  },
  writing: {
    bg: "var(--th-stage-write-soft)",
    color: "var(--th-stage-write)",
    label: "Writing",
  },
  validating: {
    bg: "var(--th-stage-validate-soft)",
    color: "var(--th-stage-validate)",
    label: "Validating",
  },
  publishing: {
    bg: "var(--th-stage-publish-soft)",
    color: "var(--th-stage-publish)",
    label: "Publishing",
  },
  completed: {
    bg: "var(--th-success-soft)",
    color: "var(--th-success)",
    label: "Completed",
  },
  failed: {
    bg: "var(--th-danger-soft)",
    color: "var(--th-danger)",
    label: "Failed",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
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
      }}
    >
      {["researching", "writing", "validating", "publishing"].includes(
        status,
      ) && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: cfg.color,
            animation: "pulse 2s infinite",
            flexShrink: 0,
          }}
        />
      )}
      {cfg.label}
    </span>
  );
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "—";
  }
}

export default function QueuePage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteFilter, setSiteFilter] = useState("all");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Bulk import
  const [bulkText, setBulkText] = useState("");
  const [bulkSiteId, setBulkSiteId] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const [limitReached, setLimitReached] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const url =
        siteFilter !== "all"
          ? apiPath(`/api/keywords?siteId=${siteFilter}`)
          : apiPath("/api/keywords");
      const [kwRes, sitesRes] = await Promise.allSettled([
        fetch(url),
        fetch(apiPath("/api/sites")),
      ]);

      if (kwRes.status === "fulfilled" && kwRes.value.ok) {
        const d = await kwRes.value.json();
        setKeywords(Array.isArray(d) ? d : (d.keywords ?? []));
      }
      if (sitesRes.status === "fulfilled" && sitesRes.value.ok) {
        const d = await sitesRes.value.json();
        const raw: Record<string, unknown>[] = Array.isArray(d)
          ? d
          : (d.sites ?? []);
        setSites(
          raw.map((s) => ({
            id: s.id as string,
            slug: s.slug as string,
            companyName: (s.name ??
              (s.config as Record<string, unknown>)?.companyName ??
              s.slug) as string,
          })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [siteFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRun(keywordId: string) {
    const email =
      typeof window !== "undefined"
        ? (localStorage.getItem("cps_lead_email") ?? "")
        : "";
    setRunningId(keywordId);
    setLimitReached(false);
    try {
      const res = await fetch(apiPath(`/api/pipeline/run`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordId, email }),
      });
      if (res.status === 403) {
        setLimitReached(true);
        return;
      }
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunningId(null);
    }
  }

  async function handleDelete(keywordId: string) {
    if (!confirm("Delete this keyword?")) return;
    setDeletingId(keywordId);
    try {
      const res = await fetch(apiPath(`/api/keywords/${keywordId}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setKeywords((kws) => kws.filter((k) => k.id !== keywordId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBulkImport(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkText.trim() || !bulkSiteId) return;
    setImportLoading(true);
    setImportResult(null);

    const kwLines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    try {
      const res = await fetch(apiPath("/api/keywords/bulk"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: kwLines, siteId: bulkSiteId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Failed: ${res.status}`);
      setImportResult(
        `Imported ${data.count ?? kwLines.length} keyword${kwLines.length !== 1 ? "s" : ""}`,
      );
      setBulkText("");
      await loadData();
    } catch (err) {
      setImportResult(
        `Error: ${err instanceof Error ? err.message : "Import failed"}`,
      );
    } finally {
      setImportLoading(false);
    }
  }

  const siteMap: Record<string, string> = {};
  sites.forEach((s) => {
    siteMap[s.id] = s.companyName;
  });

  const displayedKeywords = keywords.filter(
    (k) => siteFilter === "all" || k.siteId === siteFilter,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--th-text)",
              margin: 0,
            }}
          >
            Keyword Queue
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--th-text-secondary)",
              margin: "6px 0 0",
            }}
          >
            {loading
              ? "Loading..."
              : `${displayedKeywords.length} keyword${displayedKeywords.length !== 1 ? "s" : ""} in queue`}
          </p>
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
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.companyName}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "var(--th-danger-soft)",
            color: "var(--th-danger)",
            fontSize: "14px",
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              float: "right",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--th-danger)",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Keywords table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "560px",
            }}
          >
            <thead>
              <tr style={{ background: "var(--th-inset)" }}>
                {[
                  "Keyword",
                  "Site",
                  "Status",
                  "Priority",
                  "Word Count",
                  "Created",
                  "Actions",
                ].map((h) => (
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: "14px 16px" }}>
                        <div
                          className="skeleton"
                          style={{
                            height: "14px",
                            width: j === 0 ? "60%" : "40%",
                            borderRadius: "4px",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayedKeywords.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "60px 16px",
                      textAlign: "center",
                      color: "var(--th-text-muted)",
                      fontSize: "14px",
                    }}
                  >
                    No keywords in queue. Import keywords below to get started.
                  </td>
                </tr>
              ) : (
                displayedKeywords.map((kw, idx) => (
                  <tr
                    key={kw.id}
                    style={{
                      borderTop:
                        idx > 0 ? "1px solid var(--th-border)" : "none",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--th-card-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--th-text)",
                        maxWidth: "220px",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                      >
                        {kw.keyword}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "12px",
                        color: "var(--th-text-secondary)",
                      }}
                    >
                      {siteMap[kw.siteId] ?? kw.site ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={kw.status} />
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "13px",
                        color: "var(--th-text-secondary)",
                      }}
                    >
                      {kw.priority}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "13px",
                        color: "var(--th-text-secondary)",
                      }}
                    >
                      {kw.targetWordCount.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "12px",
                        color: "var(--th-text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(kw.createdAt)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {kw.status === "pending" || kw.status === "failed" ? (
                          <button
                            onClick={() => handleRun(kw.id)}
                            disabled={runningId === kw.id}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "none",
                              background:
                                runningId === kw.id
                                  ? "var(--th-inset)"
                                  : "var(--th-accent-soft)",
                              color:
                                runningId === kw.id
                                  ? "var(--th-text-muted)"
                                  : "var(--th-text-accent)",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor:
                                runningId === kw.id ? "not-allowed" : "pointer",
                              transition: "background 0.15s ease",
                            }}
                          >
                            {runningId === kw.id ? "Starting..." : "Run"}
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDelete(kw.id)}
                          disabled={deletingId === kw.id}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: "var(--th-danger-soft)",
                            color: "var(--th-danger)",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor:
                              deletingId === kw.id ? "not-allowed" : "pointer",
                            opacity: deletingId === kw.id ? 0.6 : 1,
                          }}
                        >
                          {deletingId === kw.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Import */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--th-text)",
              margin: "0 0 4px",
            }}
          >
            Bulk Import Keywords
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "var(--th-text-secondary)",
              margin: 0,
            }}
          >
            Paste keywords one per line. All will be added to the selected site.
          </p>
        </div>

        <form
          onSubmit={handleBulkImport}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 200px",
              gap: "12px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--th-text)",
                }}
              >
                Keywords
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={
                  "best SEO tools 2025\nkeyword research guide\ncontent marketing strategy"
                }
                rows={6}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--th-border)",
                  background: "var(--th-inset)",
                  color: "var(--th-text)",
                  fontSize: "13px",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--th-accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--th-ring)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--th-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {bulkText.trim() && (
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--th-text-muted)",
                    margin: 0,
                  }}
                >
                  {bulkText.split("\n").filter((l) => l.trim()).length} keyword
                  {bulkText.split("\n").filter((l) => l.trim()).length !== 1
                    ? "s"
                    : ""}{" "}
                  detected
                </p>
              )}
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--th-text)",
                }}
              >
                Site
              </label>
              <select
                value={bulkSiteId}
                onChange={(e) => setBulkSiteId(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--th-border)",
                  background: "var(--th-card)",
                  color: "var(--th-text)",
                  fontSize: "13px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Select site...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {importResult && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: importResult.startsWith("Error")
                  ? "var(--th-danger-soft)"
                  : "var(--th-success-soft)",
                color: importResult.startsWith("Error")
                  ? "var(--th-danger)"
                  : "var(--th-success)",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {importResult}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={importLoading || !bulkText.trim() || !bulkSiteId}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                background:
                  importLoading || !bulkText.trim() || !bulkSiteId
                    ? "var(--th-border)"
                    : "var(--th-accent)",
                color:
                  importLoading || !bulkText.trim() || !bulkSiteId
                    ? "var(--th-text-muted)"
                    : "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor:
                  importLoading || !bulkText.trim() || !bulkSiteId
                    ? "not-allowed"
                    : "pointer",
                transition: "background 0.15s ease",
              }}
            >
              {importLoading ? "Importing..." : "Import Keywords"}
            </button>
          </div>
        </form>
      </div>

      {/* Article limit reached modal */}
      {limitReached && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLimitReached(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "var(--th-card)",
              border: "1px solid var(--th-border)",
              borderRadius: "16px",
              padding: "36px 32px",
              boxShadow: "var(--th-shadow-lg)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "var(--th-accent-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--th-text-accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--th-text)",
                margin: "0 0 10px",
              }}
            >
              You&apos;ve used your free article
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--th-text-secondary)",
                margin: "0 0 28px",
                lineHeight: 1.6,
              }}
            >
              This demo gives each visitor one article to try the pipeline. Want
              unlimited runs? Fork the project on GitHub and connect your own
              Bright Data API keys — it takes under 5 minutes.
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <a
                href="https://github.com/danishashko/content-pipeline-studio/fork"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  background: "var(--th-text)",
                  color: "var(--th-bg)",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Fork on GitHub
              </a>
              <a
                href="https://brightdata.com/cp/start?utm_source=content-pipeline-studio&utm_medium=demo&utm_campaign=limit-reached"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  background: "var(--th-accent-soft)",
                  color: "var(--th-text-accent)",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Get Bright Data API Keys (free $5 credit)
              </a>
              <button
                onClick={() => setLimitReached(false)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--th-border)",
                  background: "transparent",
                  color: "var(--th-text-secondary)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
