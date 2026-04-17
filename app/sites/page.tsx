"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Site {
  id: string;
  slug: string;
  name: string;
  companyName: string;
  tagline?: string;
  keywordCount?: number;
  articleCount?: number;
  createdAt?: string;
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

function SiteCard({ site }: { site: Site }) {
  const initials = site.companyName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const colors = [
    "linear-gradient(135deg, #3b82f6, #6366f1)",
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "linear-gradient(135deg, #22c55e, #06b6d4)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #06b6d4, #3b82f6)",
  ];
  const colorIdx = site.slug.charCodeAt(0) % colors.length;

  return (
    <Link
      href={`/sites/${site.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="card"
        style={{ padding: "24px", cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--th-shadow-lg)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--th-shadow)";
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: colors[colorIdx],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {initials || <GlobeIcon />}
          </div>
          <span style={{ color: "var(--th-text-muted)", opacity: 0.6 }}>
            <ArrowRightIcon />
          </span>
        </div>

        <div style={{ marginBottom: "4px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>
            {site.companyName}
          </h3>
        </div>
        <div style={{ fontSize: "12px", color: "var(--th-text-muted)", marginBottom: "16px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
          {site.slug}
        </div>

        {site.tagline && (
          <p style={{
            fontSize: "12px",
            color: "var(--th-text-secondary)",
            margin: "0 0 16px",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.5,
          }}>
            {site.tagline}
          </p>
        )}

        <div style={{ display: "flex", gap: "16px", paddingTop: "16px", borderTop: "1px solid var(--th-border)" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--th-text)" }}>
              {(site.keywordCount ?? 0).toLocaleString()}
            </div>
            <div style={{ fontSize: "11px", color: "var(--th-text-muted)", marginTop: "2px" }}>Keywords</div>
          </div>
          <div style={{ width: "1px", background: "var(--th-border)" }} />
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--th-text)" }}>
              {(site.articleCount ?? 0).toLocaleString()}
            </div>
            <div style={{ fontSize: "11px", color: "var(--th-text-muted)", marginTop: "2px" }}>Articles</div>
          </div>
          {site.createdAt && (
            <>
              <div style={{ width: "1px", background: "var(--th-border)" }} />
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--th-text)" }}>
                  {new Date(site.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </div>
                <div style={{ fontSize: "11px", color: "var(--th-text-muted)", marginTop: "2px" }}>Added</div>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data) => {
        const raw = Array.isArray(data) ? data : (data.sites ?? []);
        setSites(raw.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          slug: s.slug as string,
          name: (s.name as string) ?? "",
          companyName: ((s.config as Record<string, unknown>)?.companyName as string) ?? (s.name as string) ?? "",
          tagline: ((s.config as Record<string, unknown>)?.tagline as string) ?? "",
          createdAt: (s.created_at as string) ?? (s.createdAt as string),
        })));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--th-text)", margin: 0 }}>Sites</h1>
          <p style={{ fontSize: "14px", color: "var(--th-text-secondary)", margin: "6px 0 0" }}>
            {loading ? "Loading..." : `${sites.length} connected site${sites.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/sites/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "8px",
            background: "var(--th-accent)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--th-accent-hover)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--th-accent)")}
        >
          <PlusIcon />
          Add Site
        </Link>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "var(--th-danger-soft)", color: "var(--th-danger)", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: "24px" }}>
              <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "12px", marginBottom: "16px" }} />
              <div className="skeleton" style={{ width: "70%", height: "18px", borderRadius: "4px", marginBottom: "8px" }} />
              <div className="skeleton" style={{ width: "40%", height: "12px", borderRadius: "4px", marginBottom: "16px" }} />
              <div className="skeleton" style={{ width: "100%", height: "1px", marginBottom: "16px" }} />
              <div style={{ display: "flex", gap: "16px" }}>
                <div className="skeleton" style={{ width: "40px", height: "24px", borderRadius: "4px" }} />
                <div className="skeleton" style={{ width: "40px", height: "24px", borderRadius: "4px" }} />
              </div>
            </div>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "80px 40px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--th-inset)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--th-text-muted)" }}>
            <GlobeIcon />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--th-text)", margin: "0 0 8px" }}>No sites yet</h3>
            <p style={{ fontSize: "14px", color: "var(--th-text-muted)", margin: 0 }}>Add your first site to start generating content</p>
          </div>
          <Link
            href="/sites/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "8px",
              background: "var(--th-accent)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            <PlusIcon />
            Add your first site
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}
