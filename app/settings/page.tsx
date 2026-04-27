"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { apiPath } from "@/lib/base-path";

interface ApiStatus {
  openrouter: boolean;
  brightData: boolean;
  supabase: boolean;
  gemini: boolean;
}

interface ApiCard {
  key: keyof ApiStatus;
  name: string;
  description: string;
  maskedKey: string;
  icon: React.ReactNode;
}

interface ModelRow {
  stage: string;
  stageColor: string;
  stageSoft: string;
  model: string;
  provider: string;
  providerColor: string;
  use: string;
}

const MODEL_ROWS: ModelRow[] = [
  {
    stage: "Research",
    stageColor: "var(--th-stage-research)",
    stageSoft: "var(--th-stage-research-soft)",
    model: "moonshotai/kimi-k2.5",
    provider: "Moonshot AI",
    providerColor: "#8b5cf6",
    use: "Deep web research, competitor analysis, source extraction",
  },
  {
    stage: "Write",
    stageColor: "var(--th-stage-write)",
    stageSoft: "var(--th-stage-write-soft)",
    model: "anthropic/claude-sonnet-4-6",
    provider: "Anthropic",
    providerColor: "#e07b39",
    use: "Long-form article generation with source grounding",
  },
  {
    stage: "Validate",
    stageColor: "var(--th-stage-validate)",
    stageSoft: "var(--th-stage-validate-soft)",
    model: "anthropic/claude-sonnet-4-6",
    provider: "Anthropic",
    providerColor: "#e07b39",
    use: "Link verification, fact checking, quality scoring",
  },
  {
    stage: "Publish",
    stageColor: "var(--th-stage-publish)",
    stageSoft: "var(--th-stage-publish-soft)",
    model: "openai/gpt-4o-mini",
    provider: "OpenAI",
    providerColor: "#10a37f",
    use: "SEO metadata, WordPress formatting and submission",
  },
];

function CheckCircleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XCircleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function OpenRouterIcon() {
  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #6366f1, #3b82f6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 800,
        fontSize: "13px",
      }}
    >
      OR
    </div>
  );
}

function BrightDataIcon() {
  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 800,
        fontSize: "13px",
      }}
    >
      BD
    </div>
  );
}

function SupabaseIcon() {
  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 800,
        fontSize: "13px",
      }}
    >
      SB
    </div>
  );
}

function GeminiIcon() {
  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 800,
        fontSize: "13px",
      }}
    >
      GI
    </div>
  );
}

const API_CARDS: ApiCard[] = [
  {
    key: "openrouter",
    name: "OpenRouter",
    description:
      "Model routing for all pipeline stages. Routes to Claude, GPT-4o, and Kimi.",
    maskedKey: "sk-or-v1-...xxxx",
    icon: <OpenRouterIcon />,
  },
  {
    key: "brightData",
    name: "Bright Data",
    description:
      "Web scraping and search engine queries for the research stage.",
    maskedKey: "brd_...xxxx",
    icon: <BrightDataIcon />,
  },
  {
    key: "supabase",
    name: "Supabase",
    description:
      "Database for jobs, keywords, sites, schedules, and article storage.",
    maskedKey: "eyJ...xxxx",
    icon: <SupabaseIcon />,
  },
  {
    key: "gemini",
    name: "Gemini",
    description:
      "Google Gemini for supplemental AI tasks and content validation.",
    maskedKey: "AIza...xxxx",
    icon: <GeminiIcon />,
  },
];

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiPath("/api/status"))
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const configuredCount = status
    ? Object.values(status).filter(Boolean).length
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
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
            Settings
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--th-text-secondary)",
              margin: "6px 0 0",
            }}
          >
            API configuration and status
          </p>
        </div>
        {!loading && status && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              background:
                configuredCount === 4
                  ? "var(--th-success-soft)"
                  : configuredCount > 0
                    ? "var(--th-warning-soft)"
                    : "var(--th-danger-soft)",
              color:
                configuredCount === 4
                  ? "var(--th-success)"
                  : configuredCount > 0
                    ? "var(--th-warning)"
                    : "var(--th-danger)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {configuredCount === 4 ? <CheckCircleIcon /> : <XCircleIcon />}
            {configuredCount}/4 APIs configured
          </div>
        )}
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
        </div>
      )}

      {/* API Cards grid */}
      <div>
        <h2
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--th-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 16px",
          }}
        >
          API Keys
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          {API_CARDS.map((card) => {
            const isConfigured = status ? status[card.key] : null;
            return (
              <div
                key={card.key}
                className="card"
                style={{ padding: "20px 24px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                  }}
                >
                  {loading ? (
                    <div
                      className="skeleton"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{ flexShrink: 0 }}>{card.icon}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "var(--th-text)",
                          margin: 0,
                        }}
                      >
                        {card.name}
                      </h3>
                      {loading ? (
                        <div
                          className="skeleton"
                          style={{
                            width: "80px",
                            height: "22px",
                            borderRadius: "20px",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: isConfigured
                              ? "var(--th-success-soft)"
                              : "var(--th-danger-soft)",
                            color: isConfigured
                              ? "var(--th-success)"
                              : "var(--th-danger)",
                          }}
                        >
                          {isConfigured ? (
                            <CheckCircleIcon size={12} />
                          ) : (
                            <XCircleIcon size={12} />
                          )}
                          {isConfigured ? "Configured" : "Not Set"}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--th-text-secondary)",
                        margin: "0 0 12px",
                        lineHeight: 1.5,
                      }}
                    >
                      {card.description}
                    </p>
                    {loading ? (
                      <div
                        className="skeleton"
                        style={{ height: "32px", borderRadius: "6px" }}
                      />
                    ) : (
                      <div
                        style={{
                          padding: "7px 12px",
                          borderRadius: "6px",
                          background: "var(--th-inset)",
                          border: "1px solid var(--th-border)",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          fontSize: "12px",
                          color: isConfigured
                            ? "var(--th-text-secondary)"
                            : "var(--th-text-muted)",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {isConfigured ? card.maskedKey : "— not configured —"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p
          style={{
            fontSize: "12px",
            color: "var(--th-text-muted)",
            margin: "12px 0 0",
          }}
        >
          API keys are configured via environment variables in your deployment.
          Edit{" "}
          <code
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              background: "var(--th-inset)",
              padding: "1px 5px",
              borderRadius: "4px",
            }}
          >
            .env.local
          </code>{" "}
          to update them.
        </p>
      </div>

      {/* Model configuration */}
      <div>
        <h2
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--th-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 16px",
          }}
        >
          Model Configuration
        </h2>
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "480px",
              }}
            >
              <thead>
                <tr style={{ background: "var(--th-inset)" }}>
                  {["Stage", "Model", "Provider", "Use Case"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 20px",
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
                {MODEL_ROWS.map((row, idx) => (
                  <tr
                    key={row.stage}
                    style={{
                      borderTop:
                        idx > 0 ? "1px solid var(--th-border)" : "none",
                    }}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: row.stageSoft,
                          color: row.stageColor,
                        }}
                      >
                        {row.stage}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <code
                        style={{
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          fontSize: "12px",
                          color: "var(--th-text)",
                          background: "var(--th-inset)",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--th-border)",
                        }}
                      >
                        {row.model}
                      </code>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: row.providerColor,
                        }}
                      >
                        {row.provider}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: "12px",
                        color: "var(--th-text-secondary)",
                        maxWidth: "320px",
                      }}
                    >
                      {row.use}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p
          style={{
            fontSize: "12px",
            color: "var(--th-text-muted)",
            margin: "12px 0 0",
          }}
        >
          Models are routed via OpenRouter. Swap models by editing{" "}
          <code
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              background: "var(--th-inset)",
              padding: "1px 5px",
              borderRadius: "4px",
            }}
          >
            lib/pipeline/stages/
          </code>{" "}
          stage files.
        </p>
      </div>

      {/* Pipeline info */}
      <div>
        <h2
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--th-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 16px",
          }}
        >
          Pipeline Architecture
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          {[
            {
              stage: "Research",
              color: "var(--th-stage-research)",
              soft: "var(--th-stage-research-soft)",
              desc: "Competitor analysis, SERP data, external sources, content brief",
            },
            {
              stage: "Write",
              color: "var(--th-stage-write)",
              soft: "var(--th-stage-write-soft)",
              desc: "Long-form markdown with inline citations and source attribution",
            },
            {
              stage: "Validate",
              color: "var(--th-stage-validate)",
              soft: "var(--th-stage-validate-soft)",
              desc: "Link verification, fact-check scoring, hallucination detection",
            },
            {
              stage: "Publish",
              color: "var(--th-stage-publish)",
              soft: "var(--th-stage-publish-soft)",
              desc: "SEO metadata generation and WordPress REST API submission",
            },
          ].map((item, i) => (
            <div
              key={item.stage}
              className="card"
              style={{ padding: "16px 18px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: item.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "12px",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: item.color,
                  }}
                >
                  {item.stage}
                </span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--th-text-secondary)",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
