"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface SiteConfig {
  slug: string;
  companyName: string;
  tagline?: string;
  companyDescription?: string;
  wpBaseUrl?: string;
  wpUsername?: string;
  wpAppPassword?: string;
  wpAuthorName?: string;
  blogSitemapUrl?: string;
  mainSitemapUrl?: string;
  domains?: string[];
  products?: { name: string; description: string }[];
  productPages?: { url: string; title: string; description: string }[];
  cta?: { url: string; defaultText: string; fallbackSentence?: string };
  brandColors?: { backgroundRgb: number[]; accentRgb: number[] };
  industries?: string[];
  competitors?: string[];
  coreValues?: string[];
  messagingPrinciples?: string[];
  insightGuardrails?: string[];
  authorName?: string;
  authorTitle?: string;
  customerPainPoints?: Record<string, string>;
  caseStudies?: { name: string; context: string; problem: string; solution: string; results: string[]; quote: string }[];
}

interface Site {
  id: string;
  slug: string;
  name: string;
  config: SiteConfig;
  created_at?: string;
  updated_at?: string;
}

interface Keyword {
  id: string;
  keyword: string;
  status: string;
  priority: number;
  targetWordCount: number;
  createdAt: string;
}

interface Article {
  id: string;
  title?: string;
  metadata?: { title?: string };
  keyword?: string;
  wordCount?: number;
  word_count?: number;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

type TabId = "keywords" | "articles" | "suggestions" | "settings";

interface Suggestion {
  keyword: string;
  searchVolume: number;
  competition: number;
  cpc: number;
  difficulty: "low" | "medium" | "high";
  rationale: string;
  contentAngle: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "var(--th-inset)", color: "var(--th-text-muted)" },
  researching: { bg: "var(--th-stage-research-soft)", color: "var(--th-stage-research)" },
  writing: { bg: "var(--th-stage-write-soft)", color: "var(--th-stage-write)" },
  validating: { bg: "var(--th-stage-validate-soft)", color: "var(--th-stage-validate)" },
  publishing: { bg: "var(--th-stage-publish-soft)", color: "var(--th-stage-publish)" },
  completed: { bg: "var(--th-success-soft)", color: "var(--th-success)" },
  failed: { bg: "var(--th-danger-soft)", color: "var(--th-danger)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 600,
      background: cfg.bg, color: cfg.color,
      textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

function formatDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--th-border)",
  background: "var(--th-card)",
  color: "var(--th-text)",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "80px",
  fontFamily: "inherit",
};

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  textarea,
  hint,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  hint?: string;
}) {
  const focusStyle = {
    borderColor: "var(--th-accent)",
    boxShadow: "0 0 0 3px var(--th-ring)",
  };
  const blurStyle = {
    borderColor: "var(--th-border)",
    boxShadow: "none",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label htmlFor={id} style={{ fontSize: "13px", fontWeight: 600, color: "var(--th-text)" }}>{label}</label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          style={{ ...textareaStyle, fontFamily: type === "password" ? "var(--font-jetbrains-mono), monospace" : "inherit" }}
          onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
          onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          style={{ ...inputStyle, fontFamily: type === "password" ? "var(--font-jetbrains-mono), monospace" : "inherit" }}
          onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
          onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}
        />
      )}
      {hint && <p style={{ fontSize: "11px", color: "var(--th-text-muted)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput("");
  }

  return (
    <div>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--th-text)", marginBottom: "8px" }}>{label}</label>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "6px",
        padding: "8px", borderRadius: "8px",
        border: "1px solid var(--th-border)", background: "var(--th-inset)",
        minHeight: "44px", alignItems: "center",
      }}>
        {tags.map(tag => (
          <span key={tag} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "3px 10px", borderRadius: "20px",
            background: "var(--th-accent-soft)", color: "var(--th-text-accent)",
            fontSize: "12px", fontWeight: 500,
          }}>
            {tag}
            <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1, fontSize: "14px" }}>
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ""}
          style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px", color: "var(--th-text)", flex: 1, minWidth: "80px" }}
        />
      </div>
      <p style={{ fontSize: "11px", color: "var(--th-text-muted)", margin: "4px 0 0" }}>Press Enter or comma to add</p>
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--th-text)", margin: "0 0 2px" }}>{title}</h3>
        {description && <p style={{ fontSize: "12px", color: "var(--th-text-secondary)", margin: 0 }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", color: "var(--th-text)", fontWeight: 500, wordBreak: "break-all" }}>
        {value || "—"}
      </div>
    </div>
  );
}

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("keywords");

  // Suggestions tab state
  const [suggestSeed, setSuggestSeed] = useState("");
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set());

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit form fields - Identity
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editCompanyDescription, setEditCompanyDescription] = useState("");
  const [editAuthorName, setEditAuthorName] = useState("");
  const [editAuthorTitle, setEditAuthorTitle] = useState("");

  // Edit form fields - WordPress
  const [editWpBaseUrl, setEditWpBaseUrl] = useState("");
  const [editWpUsername, setEditWpUsername] = useState("");
  const [editWpAppPassword, setEditWpAppPassword] = useState("");
  const [editWpAuthorName, setEditWpAuthorName] = useState("");
  const [editBlogSitemapUrl, setEditBlogSitemapUrl] = useState("");
  const [editMainSitemapUrl, setEditMainSitemapUrl] = useState("");

  // Edit form fields - Content Strategy
  const [editIndustries, setEditIndustries] = useState<string[]>([]);
  const [editCompetitors, setEditCompetitors] = useState<string[]>([]);
  const [editCoreValues, setEditCoreValues] = useState<string[]>([]);
  const [editMessagingPrinciples, setEditMessagingPrinciples] = useState<string[]>([]);
  const [editInsightGuardrails, setEditInsightGuardrails] = useState<string[]>([]);
  const [editCtaUrl, setEditCtaUrl] = useState("");
  const [editCtaText, setEditCtaText] = useState("");
  const [editCtaFallback, setEditCtaFallback] = useState("");

  // Edit form fields - Products
  const [editProductPages, setEditProductPages] = useState<{ url: string; title: string; description: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [siteRes, kwRes, artRes] = await Promise.allSettled([
          fetch(`/api/sites/${id}`),
          fetch(`/api/keywords?siteId=${id}`),
          fetch(`/api/articles?siteId=${id}`),
        ]);

        if (siteRes.status === "fulfilled" && siteRes.value.ok) {
          const data = await siteRes.value.json();
          setSite(data.site);
        }
        if (kwRes.status === "fulfilled" && kwRes.value.ok) {
          const d = await kwRes.value.json();
          setKeywords(Array.isArray(d) ? d : (d.keywords ?? []));
        }
        if (artRes.status === "fulfilled" && artRes.value.ok) {
          const d = await artRes.value.json();
          setArticles(Array.isArray(d) ? d : (d.articles ?? []));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load site");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function initEditForm(s: Site) {
    const c = s.config ?? {};
    setEditCompanyName(c.companyName ?? "");
    setEditTagline(c.tagline ?? "");
    setEditCompanyDescription(c.companyDescription ?? "");
    setEditAuthorName(c.authorName ?? "");
    setEditAuthorTitle(c.authorTitle ?? "");
    setEditWpBaseUrl(c.wpBaseUrl ?? "");
    setEditWpUsername(c.wpUsername ?? "");
    setEditWpAppPassword(c.wpAppPassword ?? "");
    setEditWpAuthorName(c.wpAuthorName ?? "");
    setEditBlogSitemapUrl(c.blogSitemapUrl ?? "");
    setEditMainSitemapUrl(c.mainSitemapUrl ?? "");
    setEditIndustries(c.industries ?? []);
    setEditCompetitors(c.competitors ?? []);
    setEditCoreValues(c.coreValues ?? []);
    setEditMessagingPrinciples(c.messagingPrinciples ?? []);
    setEditInsightGuardrails(c.insightGuardrails ?? []);
    setEditCtaUrl(c.cta?.url ?? "");
    setEditCtaText(c.cta?.defaultText ?? "");
    setEditCtaFallback(c.cta?.fallbackSentence ?? "");
    setEditProductPages(c.productPages ?? []);
  }

  function handleEditClick() {
    if (site) initEditForm(site);
    setSaveError(null);
    setEditMode(true);
  }

  function handleCancel() {
    setEditMode(false);
    setSaveError(null);
  }

  async function handleSave() {
    if (!site) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updatedConfig: SiteConfig = {
        ...site.config,
        companyName: editCompanyName,
        tagline: editTagline || undefined,
        companyDescription: editCompanyDescription || undefined,
        authorName: editAuthorName || undefined,
        authorTitle: editAuthorTitle || undefined,
        wpBaseUrl: editWpBaseUrl || undefined,
        wpUsername: editWpUsername || undefined,
        wpAppPassword: editWpAppPassword || undefined,
        wpAuthorName: editWpAuthorName || undefined,
        blogSitemapUrl: editBlogSitemapUrl || undefined,
        mainSitemapUrl: editMainSitemapUrl || undefined,
        industries: editIndustries,
        competitors: editCompetitors,
        coreValues: editCoreValues,
        messagingPrinciples: editMessagingPrinciples,
        insightGuardrails: editInsightGuardrails,
        cta: { url: editCtaUrl, defaultText: editCtaText, fallbackSentence: editCtaFallback || undefined },
        productPages: editProductPages.filter(p => p.url && p.title),
      };

      const res = await fetch(`/api/sites/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: updatedConfig }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Save failed: ${res.status}`);
      }

      const data = await res.json();
      setSite(data.site);
      setEditMode(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "keywords", label: "Keywords", count: keywords.length },
    { id: "articles", label: "Articles", count: articles.length },
    { id: "suggestions", label: "Suggestions" },
    { id: "settings", label: "Settings" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div className="skeleton" style={{ width: "200px", height: "28px", borderRadius: "6px" }} />
        <div className="card" style={{ padding: "24px" }}>
          <div className="skeleton" style={{ width: "60%", height: "20px", borderRadius: "4px", marginBottom: "12px" }} />
          <div className="skeleton" style={{ width: "40%", height: "14px", borderRadius: "4px" }} />
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--th-danger)" }}>
        {error ?? "Site not found"}
      </div>
    );
  }

  const cfg = site.config ?? {} as SiteConfig;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/sites" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--th-border)", color: "var(--th-text-secondary)", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>{cfg.companyName ?? site.name}</h1>
            <p style={{ fontSize: "13px", color: "var(--th-text-muted)", margin: "4px 0 0", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{site.slug}</p>
          </div>
        </div>
        {confirmDelete ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--th-danger)", fontWeight: 500 }}>Delete this site and all its data?</span>
            <button
              onClick={async () => {
                setDeleting(true);
                try {
                  const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
                  if (!res.ok) throw new Error("Failed to delete");
                  router.push("/sites");
                } catch {
                  setError("Failed to delete site");
                  setDeleting(false);
                  setConfirmDelete(false);
                }
              }}
              disabled={deleting}
              style={{
                padding: "6px 14px", borderRadius: "6px", border: "none",
                background: "var(--th-danger)", color: "#fff",
                fontSize: "13px", fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                padding: "6px 14px", borderRadius: "6px",
                border: "1px solid var(--th-border)", background: "transparent",
                color: "var(--th-text-secondary)", fontSize: "13px", fontWeight: 500, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", borderRadius: "8px",
              border: "1px solid var(--th-border)", background: "transparent",
              color: "var(--th-text-muted)", fontSize: "13px", fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--th-danger)";
              e.currentTarget.style.color = "var(--th-danger)";
              e.currentTarget.style.background = "var(--th-danger-soft)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--th-border)";
              e.currentTarget.style.color = "var(--th-text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Delete
          </button>
        )}
      </div>

      {/* Site summary card */}
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
          {[
            { label: "Base URL", value: cfg.wpBaseUrl ?? "—" },
            { label: "Keywords", value: keywords.length.toString() },
            { label: "Articles", value: articles.length.toString() },
            { label: "Industries", value: (cfg.industries ?? []).join(", ") || "—" },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "14px", color: "var(--th-text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--th-border)", marginBottom: "20px" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                color: activeTab === tab.id ? "var(--th-text-accent)" : "var(--th-text-secondary)",
                borderBottom: activeTab === tab.id ? "2px solid var(--th-accent)" : "2px solid transparent",
                marginBottom: "-1px",
                transition: "color 0.15s ease",
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  padding: "1px 7px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  background: activeTab === tab.id ? "var(--th-accent-soft)" : "var(--th-inset)",
                  color: activeTab === tab.id ? "var(--th-text-accent)" : "var(--th-text-muted)",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Keywords tab */}
        {activeTab === "keywords" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--th-inset)" }}>
                  {["Keyword", "Status", "Priority", "Word Count", "Created"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--th-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keywords.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--th-text-muted)", fontSize: "14px" }}>
                      No keywords yet. Add keywords in the <Link href="/queue" style={{ color: "var(--th-text-accent)" }}>Queue</Link>.
                    </td>
                  </tr>
                ) : (
                  keywords.map((kw, idx) => (
                    <tr key={kw.id} style={{ borderTop: idx > 0 ? "1px solid var(--th-border)" : "none" }}>
                      <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 500, color: "var(--th-text)" }}>{kw.keyword}</td>
                      <td style={{ padding: "12px 16px" }}><StatusBadge status={kw.status} /></td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--th-text-secondary)" }}>{kw.priority}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--th-text-secondary)" }}>{kw.targetWordCount.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--th-text-muted)" }}>{formatDate(kw.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Articles tab */}
        {activeTab === "articles" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--th-inset)" }}>
                  {["Title", "Keyword", "Words", "Status", "Date"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--th-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--th-text-muted)", fontSize: "14px" }}>
                      No articles yet
                    </td>
                  </tr>
                ) : (
                  articles.map((article, idx) => (
                    <tr key={article.id} style={{ borderTop: idx > 0 ? "1px solid var(--th-border)" : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--th-card-hover)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px", maxWidth: "240px" }}>
                        <Link href={`/articles/${article.id}`} style={{ fontSize: "13px", fontWeight: 500, color: "var(--th-text)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {article.title ?? article.metadata?.title ?? "Untitled"}
                        </Link>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--th-text-secondary)" }}>{article.keyword ?? "—"}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--th-text-secondary)" }}>
                        {((article.wordCount ?? article.word_count) ?? 0) > 0 ? (article.wordCount ?? article.word_count)!.toLocaleString() : "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}><StatusBadge status={article.status ?? "completed"} /></td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--th-text-muted)" }}>{formatDate(article.createdAt ?? article.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Suggestions tab */}
        {activeTab === "suggestions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Search bar */}
            <div className="card" style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: "13px", color: "var(--th-text-muted)", margin: "0 0 12px" }}>
                Enter a seed keyword to get AI-powered topic suggestions, or leave blank to analyze your site&apos;s existing domain keywords.
              </p>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  value={suggestSeed}
                  onChange={e => setSuggestSeed(e.target.value)}
                  placeholder="e.g. web scraping, data extraction..."
                  onKeyDown={e => {
                    if (e.key === "Enter" && !suggestLoading) {
                      setSuggestError(null);
                      setSuggestLoading(true);
                      fetch("/api/keywords/suggest", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ siteId: id, seedKeyword: suggestSeed || undefined }),
                      })
                        .then(r => r.json())
                        .then(d => {
                          if (d.error) throw new Error(d.error);
                          setSuggestions(d.suggestions ?? []);
                          setAddedKeywords(new Set());
                        })
                        .catch(err => setSuggestError(err.message))
                        .finally(() => setSuggestLoading(false));
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--th-border)",
                    background: "var(--th-inset)",
                    color: "var(--th-text)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  disabled={suggestLoading}
                  onClick={() => {
                    setSuggestError(null);
                    setSuggestLoading(true);
                    fetch("/api/keywords/suggest", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ siteId: id, seedKeyword: suggestSeed || undefined }),
                    })
                      .then(r => r.json())
                      .then(d => {
                        if (d.error) throw new Error(d.error);
                        setSuggestions(d.suggestions ?? []);
                        setAddedKeywords(new Set());
                      })
                      .catch(err => setSuggestError(err.message))
                      .finally(() => setSuggestLoading(false));
                  }}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: suggestLoading ? "var(--th-inset)" : "var(--th-accent)",
                    color: suggestLoading ? "var(--th-text-muted)" : "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: suggestLoading ? "not-allowed" : "pointer",
                    transition: "background 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  {suggestLoading ? "Analyzing..." : "Suggest Topics"}
                </button>
              </div>
              {suggestError && (
                <p style={{ fontSize: "13px", color: "var(--th-danger)", margin: "8px 0 0" }}>{suggestError}</p>
              )}
            </div>

            {/* Skeleton while loading */}
            {suggestLoading && (
              <div className="card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--th-inset)" }}>
                      {["Keyword", "Volume", "Competition", "CPC", "Difficulty", "Content Angle", ""].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--th-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderTop: i > 0 ? "1px solid var(--th-border)" : "none" }}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} style={{ padding: "12px 16px" }}>
                            <div className="skeleton" style={{ height: "14px", borderRadius: "4px", width: j === 0 ? "140px" : j === 5 ? "180px" : "60px" }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Results table */}
            {!suggestLoading && suggestions.length > 0 && (
              <div className="card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--th-inset)" }}>
                      {["Keyword", "Volume", "Competition", "CPC", "Difficulty", "Content Angle", ""].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--th-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map((s, idx) => {
                      const isAdded = addedKeywords.has(s.keyword);
                      const diffColors: Record<string, { bg: string; color: string }> = {
                        low: { bg: "var(--th-success-soft)", color: "var(--th-success)" },
                        medium: { bg: "var(--th-stage-research-soft)", color: "var(--th-stage-research)" },
                        high: { bg: "var(--th-danger-soft)", color: "var(--th-danger)" },
                      };
                      const dc = diffColors[s.difficulty] ?? diffColors.medium;
                      return (
                        <tr
                          key={s.keyword}
                          style={{ borderTop: idx > 0 ? "1px solid var(--th-border)" : "none" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--th-card-hover)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "12px 16px", maxWidth: "180px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--th-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.keyword}</div>
                            <div style={{ fontSize: "11px", color: "var(--th-text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.rationale}</div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--th-text-secondary)", whiteSpace: "nowrap" }}>
                            {s.searchVolume.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--th-text-secondary)" }}>
                            {(s.competition * 100).toFixed(0)}%
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--th-text-secondary)", whiteSpace: "nowrap" }}>
                            ${s.cpc.toFixed(2)}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: dc.bg, color: dc.color, textTransform: "capitalize" }}>
                              {s.difficulty}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--th-text-secondary)", maxWidth: "200px" }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.contentAngle}</div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <button
                              disabled={isAdded}
                              onClick={() => {
                                if (isAdded) return;
                                fetch("/api/keywords", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ siteId: id, keyword: s.keyword, priority: 0, targetWordCount: 2000 }),
                                })
                                  .then(r => r.json())
                                  .then(d => {
                                    if (d.error) return;
                                    setAddedKeywords(prev => new Set([...prev, s.keyword]));
                                  })
                                  .catch(() => {/* silent */});
                              }}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "1px solid",
                                borderColor: isAdded ? "var(--th-success)" : "var(--th-border)",
                                background: isAdded ? "var(--th-success-soft)" : "var(--th-card)",
                                color: isAdded ? "var(--th-success)" : "var(--th-text-secondary)",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: isAdded ? "default" : "pointer",
                                whiteSpace: "nowrap",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {isAdded ? "Added" : "Add to Queue"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!suggestLoading && suggestions.length === 0 && (
              <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--th-text-muted)", fontSize: "14px" }}>
                Click &quot;Suggest Topics&quot; to get AI-powered keyword recommendations for this site.
              </div>
            )}
          </div>
        )}

        {/* Settings tab */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Settings header with Edit button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>Site Configuration</h2>
                <p style={{ fontSize: "13px", color: "var(--th-text-muted)", margin: "4px 0 0" }}>
                  {editMode ? "Edit your site settings below, then save." : "View and edit your site configuration."}
                </p>
              </div>
              {!editMode && (
                <button
                  onClick={handleEditClick}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--th-border)",
                    background: "var(--th-card)",
                    color: "var(--th-text)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.15s ease, border-color 0.15s ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "var(--th-inset)";
                    e.currentTarget.style.borderColor = "var(--th-border-hover)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "var(--th-card)";
                    e.currentTarget.style.borderColor = "var(--th-border)";
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
              )}
            </div>

            {/* Save error */}
            {saveError && (
              <div style={{ padding: "12px 16px", borderRadius: "8px", background: "var(--th-danger-soft)", color: "var(--th-danger)", fontSize: "14px" }}>
                {saveError}
              </div>
            )}

            {/* View mode */}
            {!editMode && (
              <>
                {/* Identity */}
                <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>Identity</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <ReadOnlyField label="Slug" value={cfg.slug ?? site.slug} />
                    <ReadOnlyField label="Company Name" value={cfg.companyName ?? ""} />
                    <ReadOnlyField label="Tagline" value={cfg.tagline ?? ""} />
                    <ReadOnlyField label="Author Name" value={cfg.authorName ?? ""} />
                    <ReadOnlyField label="Author Title" value={cfg.authorTitle ?? ""} />
                  </div>
                  {cfg.companyDescription && (
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Company Description</div>
                      <div style={{ fontSize: "14px", color: "var(--th-text)", lineHeight: "1.6" }}>{cfg.companyDescription}</div>
                    </div>
                  )}
                </div>

                {/* WordPress */}
                <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>WordPress</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <ReadOnlyField label="WP Base URL" value={cfg.wpBaseUrl ?? ""} />
                    <ReadOnlyField label="WP Username" value={cfg.wpUsername ?? ""} />
                    <ReadOnlyField label="WP Author Name" value={cfg.wpAuthorName ?? ""} />
                    <ReadOnlyField label="Application Password" value={cfg.wpAppPassword ? "••••••••••••" : ""} />
                    <ReadOnlyField label="Blog Sitemap URL" value={cfg.blogSitemapUrl ?? ""} />
                    <ReadOnlyField label="Main Sitemap URL" value={cfg.mainSitemapUrl ?? ""} />
                  </div>
                </div>

                {/* Content Strategy */}
                <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>Content Strategy</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Industries</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(cfg.industries ?? []).length > 0 ? (cfg.industries ?? []).map(t => (
                          <span key={t} style={{ padding: "3px 10px", borderRadius: "20px", background: "var(--th-accent-soft)", color: "var(--th-text-accent)", fontSize: "12px", fontWeight: 500 }}>{t}</span>
                        )) : <span style={{ fontSize: "14px", color: "var(--th-text-muted)" }}>—</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Competitors</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(cfg.competitors ?? []).length > 0 ? (cfg.competitors ?? []).map(t => (
                          <span key={t} style={{ padding: "3px 10px", borderRadius: "20px", background: "var(--th-inset)", color: "var(--th-text-secondary)", fontSize: "12px", fontWeight: 500 }}>{t}</span>
                        )) : <span style={{ fontSize: "14px", color: "var(--th-text-muted)" }}>—</span>}
                      </div>
                    </div>
                    <ReadOnlyField label="CTA URL" value={cfg.cta?.url ?? ""} />
                    <ReadOnlyField label="CTA Text" value={cfg.cta?.defaultText ?? ""} />
                  </div>
                  {cfg.cta?.fallbackSentence && <ReadOnlyField label="CTA Fallback Sentence" value={cfg.cta.fallbackSentence} />}
                  {(cfg.coreValues ?? []).length > 0 && (
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Core Values</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(cfg.coreValues ?? []).map(t => (
                          <span key={t} style={{ padding: "3px 10px", borderRadius: "20px", background: "var(--th-inset)", color: "var(--th-text-secondary)", fontSize: "12px", fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(cfg.messagingPrinciples ?? []).length > 0 && (
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Messaging Principles</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(cfg.messagingPrinciples ?? []).map(t => (
                          <span key={t} style={{ padding: "3px 10px", borderRadius: "20px", background: "var(--th-inset)", color: "var(--th-text-secondary)", fontSize: "12px", fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(cfg.insightGuardrails ?? []).length > 0 && (
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Insight Guardrails</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(cfg.insightGuardrails ?? []).map(t => (
                          <span key={t} style={{ padding: "3px 10px", borderRadius: "20px", background: "var(--th-inset)", color: "var(--th-text-secondary)", fontSize: "12px", fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Pages */}
                {(cfg.productPages ?? []).length > 0 && (
                  <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>Product Pages</h3>
                    {(cfg.productPages ?? []).map((pp, idx) => (
                      <div key={idx} style={{ padding: "16px", borderRadius: "8px", background: "var(--th-inset)", border: "1px solid var(--th-border)" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--th-text)", marginBottom: "4px" }}>{pp.title}</div>
                        <div style={{ fontSize: "12px", color: "var(--th-text-accent)", marginBottom: "6px" }}>{pp.url}</div>
                        {pp.description && <div style={{ fontSize: "13px", color: "var(--th-text-secondary)" }}>{pp.description}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Edit mode */}
            {editMode && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Identity */}
                <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <SectionCard title="Identity" description="Basic site information and branding">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <Field label="Company Name" id="edit-companyName" value={editCompanyName} onChange={setEditCompanyName} placeholder="Acme Corp" />
                      <Field label="Tagline" id="edit-tagline" value={editTagline} onChange={setEditTagline} placeholder="We make great things" />
                    </div>
                    <Field label="Company Description" id="edit-companyDescription" value={editCompanyDescription} onChange={setEditCompanyDescription} placeholder="Brief description of the company..." textarea />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <Field label="Author Name" id="edit-authorName" value={editAuthorName} onChange={setEditAuthorName} placeholder="Jane Smith" />
                      <Field label="Author Title" id="edit-authorTitle" value={editAuthorTitle} onChange={setEditAuthorTitle} placeholder="Content Strategist" />
                    </div>
                  </SectionCard>
                </div>

                {/* WordPress */}
                <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <SectionCard title="WordPress" description="Connection details for WordPress REST API">
                    <Field label="WordPress Base URL" id="edit-wpBaseUrl" value={editWpBaseUrl} onChange={setEditWpBaseUrl} type="url" placeholder="https://acme.com" hint="The root URL of your WordPress site" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <Field label="WP Username" id="edit-wpUsername" value={editWpUsername} onChange={setEditWpUsername} placeholder="admin" />
                      <Field label="Application Password" id="edit-wpAppPassword" value={editWpAppPassword} onChange={setEditWpAppPassword} type="password" placeholder="xxxx xxxx xxxx xxxx" hint="Generate in WP Admin > Users > Profile" />
                    </div>
                    <Field label="WP Author Name" id="edit-wpAuthorName" value={editWpAuthorName} onChange={setEditWpAuthorName} placeholder="Jane Smith" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <Field label="Blog Sitemap URL" id="edit-blogSitemapUrl" value={editBlogSitemapUrl} onChange={setEditBlogSitemapUrl} type="url" placeholder="https://acme.com/blog-sitemap.xml" />
                      <Field label="Main Sitemap URL" id="edit-mainSitemapUrl" value={editMainSitemapUrl} onChange={setEditMainSitemapUrl} type="url" placeholder="https://acme.com/sitemap.xml" />
                    </div>
                  </SectionCard>
                </div>

                {/* Content Strategy */}
                <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <SectionCard title="Content Strategy" description="Industries, competitors, and call-to-action settings">
                    <TagInput label="Industries" tags={editIndustries} onChange={setEditIndustries} placeholder="Add industry tags..." />
                    <TagInput label="Competitors" tags={editCompetitors} onChange={setEditCompetitors} placeholder="Add competitor domains..." />
                    <TagInput label="Core Values" tags={editCoreValues} onChange={setEditCoreValues} placeholder="Add core values..." />
                    <TagInput label="Messaging Principles" tags={editMessagingPrinciples} onChange={setEditMessagingPrinciples} placeholder="Add messaging principles..." />
                    <TagInput label="Insight Guardrails" tags={editInsightGuardrails} onChange={setEditInsightGuardrails} placeholder="Add insight guardrails..." />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <Field label="CTA URL" id="edit-ctaUrl" value={editCtaUrl} onChange={setEditCtaUrl} type="url" placeholder="https://acme.com/get-started" />
                      <Field label="CTA Text" id="edit-ctaText" value={editCtaText} onChange={setEditCtaText} placeholder="Get Started Free" />
                    </div>
                    <Field label="CTA Fallback Sentence" id="edit-ctaFallback" value={editCtaFallback} onChange={setEditCtaFallback} placeholder="Learn more at acme.com" />
                  </SectionCard>
                </div>

                {/* Product Pages */}
                <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <SectionCard title="Product Pages" description="Link key product/service pages to improve internal linking">
                    {editProductPages.length === 0 ? (
                      <div style={{ padding: "24px", border: "2px dashed var(--th-border)", borderRadius: "8px", textAlign: "center", color: "var(--th-text-muted)", fontSize: "13px" }}>
                        No product pages added yet
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {editProductPages.map((pp, idx) => (
                          <div key={idx} style={{ padding: "16px", borderRadius: "8px", background: "var(--th-inset)", border: "1px solid var(--th-border)", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product {idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => setEditProductPages(editProductPages.filter((_, i) => i !== idx))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--th-danger)", fontSize: "13px", fontWeight: 500, padding: "4px 8px", borderRadius: "6px" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--th-danger-soft)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "none")}
                              >
                                Remove
                              </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                              <Field label="URL" id={`edit-pp-url-${idx}`} type="url" placeholder="https://..." value={pp.url} onChange={v => setEditProductPages(editProductPages.map((p, i) => i === idx ? { ...p, url: v } : p))} />
                              <Field label="Title" id={`edit-pp-title-${idx}`} placeholder="Product Name" value={pp.title} onChange={v => setEditProductPages(editProductPages.map((p, i) => i === idx ? { ...p, title: v } : p))} />
                            </div>
                            <Field label="Description" id={`edit-pp-desc-${idx}`} placeholder="Brief description..." value={pp.description} onChange={v => setEditProductPages(editProductPages.map((p, i) => i === idx ? { ...p, description: v } : p))} textarea />
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditProductPages([...editProductPages, { url: "", title: "", description: "" }])}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "10px 16px", borderRadius: "8px",
                        border: "1px dashed var(--th-border-hover)", background: "transparent",
                        color: "var(--th-text-secondary)", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "var(--th-inset)";
                        e.currentTarget.style.borderColor = "var(--th-accent)";
                        e.currentTarget.style.color = "var(--th-text-accent)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "var(--th-border-hover)";
                        e.currentTarget.style.color = "var(--th-text-secondary)";
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add Product Page
                    </button>
                  </SectionCard>
                </div>

                {/* Save / Cancel */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    style={{
                      display: "inline-flex", alignItems: "center", padding: "10px 20px",
                      borderRadius: "8px", border: "1px solid var(--th-border)",
                      background: "transparent", color: "var(--th-text-secondary)",
                      fontSize: "14px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "var(--th-inset)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !editCompanyName}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "8px",
                      padding: "10px 24px", borderRadius: "8px", border: "none",
                      background: saving || !editCompanyName ? "var(--th-border)" : "var(--th-accent)",
                      color: saving || !editCompanyName ? "var(--th-text-muted)" : "#fff",
                      fontSize: "14px", fontWeight: 600,
                      cursor: saving || !editCompanyName ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
