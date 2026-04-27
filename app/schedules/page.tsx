"use client";

import { useEffect, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { apiPath } from "@/lib/base-path";

interface Site {
  id: string;
  slug: string;
  companyName: string;
}

interface Schedule {
  id: string;
  siteId: string;
  siteName?: string | null;
  cronExpression: string;
  description?: string | null;
  maxArticlesPerRun: number;
  enabled: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
}

const CRON_PRESETS: Record<string, string> = {
  daily: "0 9 * * *",
  weekly: "0 9 * * 1",
  biweekly: "0 9 1,15 * *",
  monthly: "0 9 1 * *",
};

const DAY_CRONS: Record<string, string> = {
  "0": "0 9 * * 0",
  "1": "0 9 * * 1",
  "2": "0 9 * * 2",
  "3": "0 9 * * 3",
  "4": "0 9 * * 4",
  "5": "0 9 * * 5",
  "6": "0 9 * * 6",
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function humanReadableCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;
  const [min, hour, dom, , dow] = parts;
  const h = parseInt(hour, 10);
  const m = parseInt(min, 10);
  const timeStr = `${h % 12 || 12}${m > 0 ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;

  if (dow !== "*") {
    const days = dow.split(",").map((d) => DAY_NAMES[parseInt(d, 10)] ?? d);
    return `Every ${days.join(" & ")} at ${timeStr}`;
  }
  if (dom === "1,15") return `1st & 15th of month at ${timeStr}`;
  if (dom === "1") return `1st of month at ${timeStr}`;
  if (dom === "*") return `Daily at ${timeStr}`;
  return cron;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid var(--th-border)",
  background: "var(--th-inset)",
  color: "var(--th-text)",
  fontSize: "13px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default function SchedulesPage() {
  const isMobile = useIsMobile();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form state
  const [formSiteId, setFormSiteId] = useState("");
  const [formFrequency, setFormFrequency] = useState("daily");
  const [formDayOfWeek, setFormDayOfWeek] = useState("1");
  const [formHour, setFormHour] = useState("9");
  const [formMaxArticles, setFormMaxArticles] = useState("3");
  const [formDescription, setFormDescription] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [schRes, sitesRes] = await Promise.allSettled([
        fetch(apiPath("/api/schedules")),
        fetch(apiPath("/api/sites")),
      ]);
      if (schRes.status === "fulfilled" && schRes.value.ok) {
        const d = await schRes.value.json();
        setSchedules(d.schedules ?? []);
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function buildCronFromForm(): string {
    const h = parseInt(formHour, 10);
    if (formFrequency === "weekly")
      return DAY_CRONS[formDayOfWeek] ?? `0 ${h} * * 1`;
    if (formFrequency === "biweekly") return `0 ${h} 1,15 * *`;
    if (formFrequency === "monthly") return `0 ${h} 1 * *`;
    return `0 ${h} * * *`; // daily
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formSiteId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiPath("/api/schedules"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: formSiteId,
          cronExpression: buildCronFromForm(),
          description: formDescription || null,
          maxArticlesPerRun: parseInt(formMaxArticles, 10) || 1,
          enabled: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setShowForm(false);
      setFormSiteId("");
      setFormFrequency("daily");
      setFormDayOfWeek("1");
      setFormHour("9");
      setFormMaxArticles("3");
      setFormDescription("");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create schedule",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this schedule?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(apiPath("/api/schedules"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggle(schedule: Schedule) {
    setTogglingId(schedule.id);
    try {
      const res = await fetch(apiPath("/api/schedules"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: schedule.id, enabled: !schedule.enabled }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === schedule.id ? { ...s, enabled: !s.enabled } : s,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle failed");
    } finally {
      setTogglingId(null);
    }
  }

  const focusStyle = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    e.currentTarget.style.borderColor = "var(--th-accent)";
    e.currentTarget.style.boxShadow = "0 0 0 3px var(--th-ring)";
  };
  const blurStyle = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    e.currentTarget.style.borderColor = "var(--th-border)";
    e.currentTarget.style.boxShadow = "none";
  };

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
            Schedules
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--th-text-secondary)",
              margin: "6px 0 0",
            }}
          >
            Automated content generation
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: showForm ? "var(--th-inset)" : "var(--th-accent)",
            color: showForm ? "var(--th-text-secondary)" : "#fff",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
        >
          {showForm ? <ChevronUpIcon /> : <PlusIcon />}
          {showForm ? "Cancel" : "Add Schedule"}
        </button>
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
              fontSize: "16px",
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="card" style={{ padding: "24px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--th-text)",
              margin: "0 0 20px",
            }}
          >
            New Schedule
          </h2>
          <form onSubmit={handleCreate}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              {/* Site */}
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
                  value={formSiteId}
                  onChange={(e) => setFormSiteId(e.target.value)}
                  required
                  style={{
                    ...inputStyle,
                    background: "var(--th-card)",
                    cursor: "pointer",
                  }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                >
                  <option value="">Select site...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
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
                  Frequency
                </label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value)}
                  style={{
                    ...inputStyle,
                    background: "var(--th-card)",
                    cursor: "pointer",
                  }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly (1st &amp; 15th)</option>
                  <option value="monthly">Monthly (1st)</option>
                </select>
              </div>

              {/* Day of week (only for weekly) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  opacity: formFrequency === "weekly" ? 1 : 0.4,
                }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--th-text)",
                  }}
                >
                  Day of Week
                </label>
                <select
                  value={formDayOfWeek}
                  onChange={(e) => setFormDayOfWeek(e.target.value)}
                  disabled={formFrequency !== "weekly"}
                  style={{
                    ...inputStyle,
                    background: "var(--th-card)",
                    cursor:
                      formFrequency === "weekly" ? "pointer" : "not-allowed",
                  }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={String(i)}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 2fr",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              {/* Hour */}
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
                  Hour (24h)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={formHour}
                  onChange={(e) => setFormHour(e.target.value)}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              {/* Max articles */}
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
                  Max Articles / Run
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={formMaxArticles}
                  onChange={(e) => setFormMaxArticles(e.target.value)}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              {/* Description */}
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
                  Description{" "}
                  <span
                    style={{ color: "var(--th-text-muted)", fontWeight: 400 }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly blog posts for site A"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
            </div>

            {/* Preview */}
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "var(--th-inset)",
                fontSize: "13px",
                color: "var(--th-text-secondary)",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "var(--th-text-muted)" }}>Preview:</span>
              <span style={{ fontWeight: 600, color: "var(--th-text)" }}>
                {humanReadableCron(buildCronFromForm())}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "11px",
                  color: "var(--th-text-muted)",
                  marginLeft: "4px",
                }}
              >
                ({buildCronFromForm()})
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "1px solid var(--th-border)",
                  background: "transparent",
                  color: "var(--th-text-secondary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !formSiteId}
                style={{
                  padding: "9px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    saving || !formSiteId
                      ? "var(--th-border)"
                      : "var(--th-accent)",
                  color:
                    saving || !formSiteId ? "var(--th-text-muted)" : "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: saving || !formSiteId ? "not-allowed" : "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                {saving ? "Creating..." : "Create Schedule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {!loading && schedules.length === 0 && (
          <div
            style={{
              padding: "64px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "var(--th-inset)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--th-text-muted)",
              }}
            >
              <ClockIcon />
            </div>
            <div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--th-text)",
                  margin: "0 0 4px",
                }}
              >
                No schedules yet
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--th-text-muted)",
                  margin: 0,
                }}
              >
                Add a schedule to automate content generation
              </p>
            </div>
          </div>
        )}
        <div
          style={{
            overflowX: "auto",
            display: !loading && schedules.length === 0 ? "none" : undefined,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "600px",
            }}
          >
            <thead>
              <tr style={{ background: "var(--th-inset)" }}>
                {[
                  "Site",
                  "Schedule",
                  "Max Articles",
                  "Status",
                  "Last Run",
                  "Next Run",
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
                Array.from({ length: 3 }).map((_, i) => (
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
              ) : schedules.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: "80px 16px", textAlign: "center" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "14px",
                          background: "var(--th-inset)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--th-text-muted)",
                        }}
                      >
                        <ClockIcon />
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--th-text)",
                            margin: "0 0 4px",
                          }}
                        >
                          No schedules yet
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "var(--th-text-muted)",
                            margin: 0,
                          }}
                        >
                          Add a schedule to automate content generation
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                schedules.map((schedule, idx) => (
                  <tr
                    key={schedule.id}
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
                    <td style={{ padding: "13px 16px" }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--th-text)",
                        }}
                      >
                        {schedule.siteName ?? schedule.siteId}
                      </div>
                      {schedule.description && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--th-text-muted)",
                            marginTop: "2px",
                          }}
                        >
                          {schedule.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--th-text)",
                          fontWeight: 500,
                        }}
                      >
                        {humanReadableCron(schedule.cronExpression)}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--th-text-muted)",
                          marginTop: "2px",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                        }}
                      >
                        {schedule.cronExpression}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: "13px",
                        color: "var(--th-text-secondary)",
                      }}
                    >
                      {schedule.maxArticlesPerRun}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <button
                        onClick={() => handleToggle(schedule)}
                        disabled={togglingId === schedule.id}
                        title={
                          schedule.enabled
                            ? "Click to disable"
                            : "Click to enable"
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          border: "none",
                          background: schedule.enabled
                            ? "var(--th-success-soft)"
                            : "var(--th-inset)",
                          color: schedule.enabled
                            ? "var(--th-success)"
                            : "var(--th-text-muted)",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor:
                            togglingId === schedule.id
                              ? "not-allowed"
                              : "pointer",
                          opacity: togglingId === schedule.id ? 0.6 : 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: schedule.enabled
                              ? "var(--th-success)"
                              : "var(--th-text-muted)",
                            flexShrink: 0,
                          }}
                        />
                        {schedule.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: "12px",
                        color: "var(--th-text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(schedule.lastRunAt)}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: "12px",
                        color: "var(--th-text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(schedule.nextRunAt)}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        disabled={deletingId === schedule.id}
                        title="Delete schedule"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--th-border)",
                          background: "transparent",
                          color: "var(--th-text-muted)",
                          cursor:
                            deletingId === schedule.id
                              ? "not-allowed"
                              : "pointer",
                          opacity: deletingId === schedule.id ? 0.5 : 1,
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "var(--th-danger-soft)";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--th-danger)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "var(--th-danger)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--th-text-muted)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "var(--th-border)";
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
