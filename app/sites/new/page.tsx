"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProductPage {
  url: string;
  title: string;
  description: string;
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
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--th-text)", marginBottom: "8px" }}>
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
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1, fontSize: "14px" }}
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
      <p style={{ fontSize: "11px", color: "var(--th-text-muted)", margin: "4px 0 0" }}>Press Enter or comma to add</p>
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
    fontFamily: type === "password" ? "var(--font-jetbrains-mono), monospace" : "inherit",
    resize: textarea ? "vertical" : undefined,
    minHeight: textarea ? "80px" : undefined,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label htmlFor={id} style={{ fontSize: "13px", fontWeight: 600, color: "var(--th-text)" }}>
        {label} {required && <span style={{ color: "var(--th-danger)" }}>*</span>}
      </label>
      {textarea ? (
        <textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          onFocus={e => {
            e.currentTarget.style.borderColor = "var(--th-accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--th-ring)";
          }}
          onBlur={e => {
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
          onFocus={e => {
            e.currentTarget.style.borderColor = "var(--th-accent)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--th-ring)";
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = "var(--th-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      )}
      {hint && <p style={{ fontSize: "11px", color: "var(--th-text-muted)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--th-text)", margin: "0 0 4px" }}>{title}</h2>
        {description && <p style={{ fontSize: "13px", color: "var(--th-text-secondary)", margin: 0 }}>{description}</p>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {children}
      </div>
    </div>
  );
}

export default function NewSitePage() {
  const router = useRouter();
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

  function addProductPage() {
    setProductPages([...productPages, { url: "", title: "", description: "" }]);
  }

  function updateProductPage(idx: number, field: keyof ProductPage, value: string) {
    setProductPages(productPages.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  }

  function removeProductPage(idx: number) {
    setProductPages(productPages.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const body = {
        slug,
        companyName,
        tagline,
        companyDescription,
        wpBaseUrl,
        wpUsername,
        wpAppPassword,
        industries,
        competitors,
        cta: { url: ctaUrl, defaultText: ctaText },
        productPages: productPages.filter((p) => p.url && p.title),
        domains: wpBaseUrl ? [new URL(wpBaseUrl).hostname] : [],
        products: [],
        coreValues: [],
        messagingPrinciples: [],
        insightGuardrails: [],
        customerPainPoints: {},
        caseStudies: [],
      };

      const res = await fetch("/api/sites", {
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
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "720px" }}>
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
          onMouseEnter={e => (e.currentTarget.style.background = "var(--th-inset)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>Add Site</h1>
          <p style={{ fontSize: "14px", color: "var(--th-text-secondary)", margin: "4px 0 0" }}>
            Connect a new WordPress site to the content pipeline
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "var(--th-danger-soft)", color: "var(--th-danger)", fontSize: "14px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Section 1 */}
        <SectionCard title="Identity" description="Basic site information and branding">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField label="Slug" id="slug" required placeholder="acme-corp" value={slug} onChange={setSlug} hint="Unique identifier, lowercase with hyphens" />
            <FormField label="Company Name" id="companyName" required placeholder="Acme Corp" value={companyName} onChange={setCompanyName} />
          </div>
          <FormField label="Tagline" id="tagline" placeholder="We make great things" value={tagline} onChange={setTagline} />
          <FormField label="Company Description" id="companyDescription" placeholder="Brief description of the company..." value={companyDescription} onChange={setCompanyDescription} textarea />
        </SectionCard>

        {/* Section 2 */}
        <SectionCard title="WordPress" description="Connection details for WordPress REST API">
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField label="WP Username" id="wpUsername" placeholder="admin" value={wpUsername} onChange={setWpUsername} />
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
        <SectionCard title="Content Strategy" description="Industries, competitors, and call-to-action settings">
          <TagInput label="Industries" placeholder="Add industry tags..." tags={industries} onChange={setIndustries} />
          <TagInput label="Competitors" placeholder="Add competitor domains..." tags={competitors} onChange={setCompetitors} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField label="CTA URL" id="ctaUrl" type="url" placeholder="https://acme.com/get-started" value={ctaUrl} onChange={setCtaUrl} />
            <FormField label="CTA Text" id="ctaText" placeholder="Get Started Free" value={ctaText} onChange={setCtaText} />
          </div>
        </SectionCard>

        {/* Section 4 */}
        <SectionCard title="Product Pages" description="Link key product/service pages to improve internal linking">
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
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--th-danger-soft)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <FormField label="URL" id={`pp-url-${idx}`} type="url" placeholder="https://..." value={product.url} onChange={v => updateProductPage(idx, "url", v)} />
                    <FormField label="Title" id={`pp-title-${idx}`} placeholder="Product Name" value={product.title} onChange={v => updateProductPage(idx, "title", v)} />
                  </div>
                  <FormField label="Description" id={`pp-desc-${idx}`} placeholder="Brief description..." value={product.description} onChange={v => updateProductPage(idx, "description", v)} textarea />
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
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--th-inset)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--th-accent)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--th-text-accent)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--th-border-hover)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--th-text-secondary)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product Page
          </button>
        </SectionCard>

        {/* Submit */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
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
            onMouseEnter={e => (e.currentTarget.style.background = "var(--th-inset)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
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
              background: submitting || !slug || !companyName || !wpBaseUrl ? "var(--th-border)" : "var(--th-accent)",
              color: submitting || !slug || !companyName || !wpBaseUrl ? "var(--th-text-muted)" : "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: submitting || !slug || !companyName || !wpBaseUrl ? "not-allowed" : "pointer",
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
