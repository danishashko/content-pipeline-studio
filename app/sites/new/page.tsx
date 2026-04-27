"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { apiPath } from "@/lib/base-path";

interface ProductPage {
  url: string;
  title: string;
  description: string;
}

interface PainPoint {
  category: string;
  description: string;
}

interface CaseStudy {
  name: string;
  problem: string;
  solution: string;
  result: string;
  quote: string;
}

function TagInput({
  label,
  placeholder,
  tags,
  onChange,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--th-text)",
          marginBottom: "8px",
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid var(--th-border)",
          background: "var(--th-inset)",
          minHeight: "44px",
          alignItems: "center",
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 10px",
              borderRadius: "20px",
              background: "var(--th-accent-soft)",
              color: "var(--th-text-accent)",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                padding: 0,
                lineHeight: 1,
                fontSize: "14px",
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ""}
          style={{
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: "13px",
            color: "var(--th-text)",
            flex: 1,
            minWidth: "80px",
          }}
        />
      </div>
      <p
        style={{
          fontSize: "11px",
          color: "var(--th-text-muted)",
          margin: "4px 0 0",
        }}
      >
        Press Enter or comma to add
      </p>
    </div>
  );
}

function FormField({
  label,
  id,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
  hint,
  textarea,
}: {
  label: string;
  id: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  textarea?: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--th-border)",
    background: "var(--th-card)",
    color: "var(--th-text)",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    boxSizing: "border-box",
    fontFamily:
      type === "password" ? "var(--font-jetbrains-mono), monospace" : "inherit",
    resize: textarea ? "vertical" : undefined,
    minHeight: textarea ? "80px" : undefined,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        htmlFor={id}
        style={{ fontSize: "13px", fontWeight: 600, color: "var(--th-text)" }}
      >
        {label}{" "}
        {required && <span style={{ color: "var(--th-danger)" }}>*</span>}
      </label>
      {textarea ? (
        <textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--th-accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--th-ring)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--th-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--th-accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--th-ring)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--th-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      )}
      {hint && (
        <p
          style={{ fontSize: "11px", color: "var(--th-text-muted)", margin: 0 }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div>
        <h2
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--th-text)",
            margin: "0 0 4px",
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--th-text-secondary)",
              margin: 0,
            }}
          >
            {description}
          </p>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {children}
      </div>
    </div>
  );
}

export default function NewSitePage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section 1: Identity
  const [slug, setSlug] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  // Section 2: WordPress
  const [wpBaseUrl, setWpBaseUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");

  // Section 3: Content Strategy
  const [industries, setIndustries] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaText, setCtaText] = useState("");

  // Section 4: Products
  const [productPages, setProductPages] = useState<ProductPage[]>([]);

  // Section 5: Brand Voice
  const [messagingPrinciples, setMessagingPrinciples] = useState("");
  const [insightGuardrails, setInsightGuardrails] = useState("");

  // Section 6: Pain Points
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);

  // Section 7: Case Studies
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);

  // Sitemaps
  const [mainSitemapUrl, setMainSitemapUrl] = useState("");
  const [blogSitemapUrl, setBlogSitemapUrl] = useState("");

  function addProductPage() {
    setProductPages([...productPages, { url: "", title: "", description: "" }]);
  }

  function updateProductPage(
    idx: number,
    field: keyof ProductPage,
    value: string,
  ) {
    setProductPages(
      productPages.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  }

  function removeProductPage(idx: number) {
    setProductPages(productPages.filter((_, i) => i !== idx));
  }

  function addPainPoint() {
    setPainPoints([...painPoints, { category: "", description: "" }]);
  }

  function updatePainPoint(idx: number, field: keyof PainPoint, value: string) {
    setPainPoints(
      painPoints.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  }

  function removePainPoint(idx: number) {
    setPainPoints(painPoints.filter((_, i) => i !== idx));
  }

  function addCaseStudy() {
    setCaseStudies([
      ...caseStudies,
      { name: "", problem: "", solution: "", result: "", quote: "" },
    ]);
  }

  function updateCaseStudy(idx: number, field: keyof CaseStudy, value: string) {
    setCaseStudies(
      caseStudies.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    );
  }

  function removeCaseStudy(idx: number) {
    setCaseStudies(caseStudies.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const parsedPainPoints = Object.fromEntries(
        painPoints
          .filter((p) => p.category && p.description)
          .map((p) => [p.category, p.description]),
      );

      const body = {
        slug,
        companyName,
        tagline,
        companyDescription,
        wpBaseUrl,
        wpUsername,
        wpAppPassword,
        mainSitemapUrl: mainSitemapUrl || undefined,
        blogSitemapUrl: blogSitemapUrl || undefined,
        industries,
        competitors,
        cta: { url: ctaUrl, defaultText: ctaText },
        productPages: productPages.filter((p) => p.url && p.title),
        domains: wpBaseUrl ? [new URL(wpBaseUrl).hostname] : [],
        products: [],
        coreValues: [],
        messagingPrinciples: messagingPrinciples
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        insightGuardrails: insightGuardrails
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        customerPainPoints: parsedPainPoints,
        caseStudies: caseStudies
          .filter((c) => c.name && c.problem)
          .map((c) => ({
            name: c.name,
            context: "",
            problem: c.problem,
            solution: c.solution,
            results: c.result ? [c.result] : [],
            quote: c.quote,
          })),
      };

      const res = await fetch(apiPath("/api/sites"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed: ${res.status}`);
      }

      router.push("/sites");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        maxWidth: "720px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link
          href="/sites"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "1px solid var(--th-border)",
            color: "var(--th-text-secondary)",
            textDecoration: "none",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--th-inset)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--th-text)",
              margin: 0,
            }}
          >
            Add Site
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--th-text-secondary)",
              margin: "4px 0 0",
            }}
          >
            Connect a new WordPress site to the content pipeline
          </p>
        </div>
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

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        {/* Section 1 */}
        <SectionCard
          title="Identity"
          description="Basic site information and branding"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <FormField
              label="Slug"
              id="slug"
              required
              placeholder="acme-corp"
              value={slug}
              onChange={setSlug}
              hint="Unique identifier, lowercase with hyphens"
            />
            <FormField
              label="Company Name"
              id="companyName"
              required
              placeholder="Acme Corp"
              value={companyName}
              onChange={setCompanyName}
            />
          </div>
          <FormField
            label="Tagline"
            id="tagline"
            placeholder="We make great things"
            value={tagline}
            onChange={setTagline}
          />
          <FormField
            label="Company Description"
            id="companyDescription"
            placeholder="Brief description of the company..."
            value={companyDescription}
            onChange={setCompanyDescription}
            textarea
          />
        </SectionCard>

        {/* Section 2 */}
        <SectionCard
          title="WordPress"
          description="Connection details for WordPress REST API"
        >
          <FormField
            label="WordPress Base URL"
            id="wpBaseUrl"
            required
            type="url"
            placeholder="https://acme.com"
            value={wpBaseUrl}
            onChange={setWpBaseUrl}
            hint="The root URL of your WordPress site"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <FormField
              label="WP Username"
              id="wpUsername"
              placeholder="admin"
              value={wpUsername}
              onChange={setWpUsername}
            />
            <FormField
              label="Application Password"
              id="wpAppPassword"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx"
              value={wpAppPassword}
              onChange={setWpAppPassword}
              hint="Generate in WP Admin > Users > Profile"
            />
          </div>
        </SectionCard>

        {/* Section 3 */}
        <SectionCard
          title="Content Strategy"
          description="Industries, competitors, and call-to-action settings"
        >
          <TagInput
            label="Industries"
            placeholder="Add industry tags..."
            tags={industries}
            onChange={setIndustries}
          />
          <TagInput
            label="Competitors"
            placeholder="Add competitor domains..."
            tags={competitors}
            onChange={setCompetitors}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <FormField
              label="CTA URL"
              id="ctaUrl"
              type="url"
              placeholder="https://acme.com/get-started"
              value={ctaUrl}
              onChange={setCtaUrl}
            />
            <FormField
              label="CTA Text"
              id="ctaText"
              placeholder="Get Started Free"
              value={ctaText}
              onChange={setCtaText}
            />
          </div>
        </SectionCard>

        {/* Section 4 */}
        <SectionCard
          title="Product Pages"
          description="Link key product/service pages to improve internal linking"
        >
          {productPages.length === 0 ? (
            <div
              style={{
                padding: "24px",
                border: "2px dashed var(--th-border)",
                borderRadius: "8px",
                textAlign: "center",
                color: "var(--th-text-muted)",
                fontSize: "13px",
              }}
            >
              No product pages added yet
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {productPages.map((product, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    background: "var(--th-inset)",
                    border: "1px solid var(--th-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--th-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Product {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProductPage(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--th-danger)",
                        fontSize: "13px",
                        fontWeight: 500,
                        padding: "4px 8px",
                        borderRadius: "6px",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--th-danger-soft)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "none")
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <FormField
                      label="URL"
                      id={`pp-url-${idx}`}
                      type="url"
                      placeholder="https://..."
                      value={product.url}
                      onChange={(v) => updateProductPage(idx, "url", v)}
                    />
                    <FormField
                      label="Title"
                      id={`pp-title-${idx}`}
                      placeholder="Product Name"
                      value={product.title}
                      onChange={(v) => updateProductPage(idx, "title", v)}
                    />
                  </div>
                  <FormField
                    label="Description"
                    id={`pp-desc-${idx}`}
                    placeholder="Brief description..."
                    value={product.description}
                    onChange={(v) => updateProductPage(idx, "description", v)}
                    textarea
                  />
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addProductPage}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px dashed var(--th-border-hover)",
              background: "transparent",
              color: "var(--th-text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--th-inset)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--th-accent)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--th-text-accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--th-border-hover)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--th-text-secondary)";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Product Page
          </button>
        </SectionCard>

        {/* Section 5: Sitemaps */}
        <SectionCard
          title="Sitemaps"
          description="Optional — helps the pipeline discover existing content for internal linking"
        >
          <FormField
            label="Main Sitemap URL"
            id="mainSitemapUrl"
            type="url"
            placeholder="https://acme.com/sitemap.xml"
            value={mainSitemapUrl}
            onChange={setMainSitemapUrl}
          />
          <FormField
            label="Blog Sitemap URL"
            id="blogSitemapUrl"
            type="url"
            placeholder="https://acme.com/blog-sitemap.xml"
            value={blogSitemapUrl}
            onChange={setBlogSitemapUrl}
          />
        </SectionCard>

        {/* Section 6: Brand Voice */}
        <SectionCard
          title="Brand Voice"
          description="Optional — shapes article tone and keeps the writer on-brand"
        >
          <FormField
            label="Messaging Principles"
            id="messagingPrinciples"
            placeholder={
              "One principle per line, e.g.:\nLead with data, not claims\nAvoid buzzwords like 'game-changing'\nAlways cite the source of statistics"
            }
            value={messagingPrinciples}
            onChange={setMessagingPrinciples}
            textarea
            hint="Each line becomes a writing rule for the AI"
          />
          <FormField
            label="Insight Guardrails"
            id="insightGuardrails"
            placeholder={
              "One rule per line, e.g.:\nNever claim 100% uptime\nDo not compare pricing directly\nAvoid naming specific customer losses"
            }
            value={insightGuardrails}
            onChange={setInsightGuardrails}
            textarea
            hint="Things the AI should never say or claim"
          />
        </SectionCard>

        {/* Section 7: Pain Points */}
        <SectionCard
          title="Customer Pain Points"
          description="Optional — helps the AI frame articles around real buyer problems"
        >
          {painPoints.length === 0 ? (
            <div
              style={{
                padding: "24px",
                border: "2px dashed var(--th-border)",
                borderRadius: "8px",
                textAlign: "center",
                color: "var(--th-text-muted)",
                fontSize: "13px",
              }}
            >
              No pain points added yet
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {painPoints.map((pp, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr auto",
                    gap: "10px",
                    alignItems: "start",
                  }}
                >
                  <FormField
                    label={idx === 0 ? "Category" : ""}
                    id={`pp-cat-${idx}`}
                    placeholder="e.g. Data Quality"
                    value={pp.category}
                    onChange={(v) => updatePainPoint(idx, "category", v)}
                  />
                  <FormField
                    label={idx === 0 ? "Description" : ""}
                    id={`pp-desc-${idx}`}
                    placeholder="Teams spend 40% of time cleaning scraped data..."
                    value={pp.description}
                    onChange={(v) => updatePainPoint(idx, "description", v)}
                  />
                  <button
                    type="button"
                    onClick={() => removePainPoint(idx)}
                    style={{
                      marginTop: idx === 0 ? "24px" : "0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--th-danger)",
                      fontSize: "18px",
                      padding: "8px",
                      borderRadius: "6px",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addPainPoint}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px dashed var(--th-border-hover)",
              background: "transparent",
              color: "var(--th-text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--th-inset)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Pain Point
          </button>
        </SectionCard>

        {/* Section 8: Case Studies */}
        <SectionCard
          title="Case Studies"
          description="Optional — gives the AI real proof points to reference in articles"
        >
          {caseStudies.length === 0 ? (
            <div
              style={{
                padding: "24px",
                border: "2px dashed var(--th-border)",
                borderRadius: "8px",
                textAlign: "center",
                color: "var(--th-text-muted)",
                fontSize: "13px",
              }}
            >
              No case studies added yet
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {caseStudies.map((cs, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    background: "var(--th-inset)",
                    border: "1px solid var(--th-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--th-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Case Study {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCaseStudy(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--th-danger)",
                        fontSize: "13px",
                        fontWeight: 500,
                        padding: "4px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <FormField
                    label="Customer / Company Name"
                    id={`cs-name-${idx}`}
                    placeholder="Acme Corp"
                    value={cs.name}
                    onChange={(v) => updateCaseStudy(idx, "name", v)}
                  />
                  <FormField
                    label="Problem"
                    id={`cs-problem-${idx}`}
                    placeholder="They were spending 3 days/week manually collecting pricing data..."
                    value={cs.problem}
                    onChange={(v) => updateCaseStudy(idx, "problem", v)}
                    textarea
                  />
                  <FormField
                    label="Solution"
                    id={`cs-solution-${idx}`}
                    placeholder="Switched to our Web Scraper API with JavaScript rendering..."
                    value={cs.solution}
                    onChange={(v) => updateCaseStudy(idx, "solution", v)}
                    textarea
                  />
                  <FormField
                    label="Key Result"
                    id={`cs-result-${idx}`}
                    placeholder="Reduced data collection time by 90%, saving $120K/year"
                    value={cs.result}
                    onChange={(v) => updateCaseStudy(idx, "result", v)}
                  />
                  <FormField
                    label="Customer Quote"
                    id={`cs-quote-${idx}`}
                    placeholder={`"This cut our data ops costs in half." — Jane Smith, CTO`}
                    value={cs.quote}
                    onChange={(v) => updateCaseStudy(idx, "quote", v)}
                    textarea
                  />
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addCaseStudy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px dashed var(--th-border-hover)",
              background: "transparent",
              color: "var(--th-text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--th-inset)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Case Study
          </button>
        </SectionCard>

        {/* Submit */}
        <div
          style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
        >
          <Link
            href="/sites"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid var(--th-border)",
              color: "var(--th-text-secondary)",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--th-inset)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !slug || !companyName || !wpBaseUrl}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              background:
                submitting || !slug || !companyName || !wpBaseUrl
                  ? "var(--th-border)"
                  : "var(--th-accent)",
              color:
                submitting || !slug || !companyName || !wpBaseUrl
                  ? "var(--th-text-muted)"
                  : "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor:
                submitting || !slug || !companyName || !wpBaseUrl
                  ? "not-allowed"
                  : "pointer",
              transition: "background 0.15s ease",
            }}
          >
            {submitting ? "Creating..." : "Create Site"}
          </button>
        </div>
      </form>
    </div>
  );
}
