"use client";

import { useEffect, useState } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0a1628",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "3px solid #1e3a5f",
            borderTopColor: "#76A5FF",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!authed) {
    return <LeadGate onSuccess={() => setAuthed(true)} />;
  }

  return <>{children}</>;
}

function LeadGate({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !name.trim() || !email.trim()) return;

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      if (res.ok) {
        // Store email in localStorage so pipeline runs can track it silently
        localStorage.setItem("cps_lead_email", email.trim().toLowerCase());
        localStorage.setItem("cps_lead_name", name.trim());
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const ready = name.trim().length > 0 && email.trim().length > 0 && !loading;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0a1628 0%, #060e1a 100%)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "linear-gradient(135deg, #0d1f3c 0%, #092349 100%)",
          borderRadius: "20px",
          border: "1px solid rgba(118, 165, 255, 0.2)",
          boxShadow: "0 32px 64px rgba(0, 0, 0, 0.5)",
          padding: "clamp(24px, 5vw, 48px) clamp(20px, 6vw, 40px)",
          overflowY: "auto",
          maxHeight: "calc(100dvh - 48px)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div
            style={{
              fontSize: "30px",
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ fontWeight: 400 }}>bright</span>
            <span style={{ fontWeight: 700 }}>data</span>
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "rgba(255,255,255,0.45)",
            marginBottom: "32px",
            fontWeight: 500,
          }}
        >
          Content Pipeline Studio
        </div>

        {/* Value prop */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 10px",
              lineHeight: 1.3,
            }}
          >
            AI Content Pipeline Demo
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.55)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Enter your keyword, get a fully-researched, internally-linked
            article in under 10 minutes — powered by Bright Data&apos;s live web
            data.
          </p>
        </div>

        {/* Bullets */}
        <div
          style={{
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {[
            "Live SERP research via Bright Data Discover API",
            "Competitor content scraped + analysed automatically",
            "Vendor screenshots captured via Browser API",
            "Full article: up to 4,500 words, validated by AI",
          ].map((item, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  marginTop: "1px",
                  background: "rgba(118, 165, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="#76A5FF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.5,
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "6px",
              }}
            >
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              autoFocus
              autoComplete="name"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(118, 165, 255, 0.25)",
                background: "rgba(0, 0, 0, 0.35)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "rgba(118, 165, 255, 0.6)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor =
                  "rgba(118, 165, 255, 0.25)")
              }
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "6px",
              }}
            >
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              autoComplete="email"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                border: error
                  ? "1px solid rgba(255, 107, 107, 0.6)"
                  : "1px solid rgba(118, 165, 255, 0.25)",
                background: "rgba(0, 0, 0, 0.35)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "rgba(118, 165, 255, 0.6)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = error
                  ? "rgba(255, 107, 107, 0.6)"
                  : "rgba(118, 165, 255, 0.25)")
              }
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(255, 107, 107, 0.1)",
                border: "1px solid rgba(255, 107, 107, 0.3)",
                color: "#ff9999",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!ready}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "8px",
              border: "none",
              background: ready ? "#76A5FF" : "#1e3a5f",
              color: ready ? "#000a1a" : "#4a6a8f",
              fontSize: "14px",
              fontWeight: 700,
              cursor: ready ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
              marginTop: "4px",
              letterSpacing: "0.01em",
            }}
          >
            {loading ? "Getting access..." : "Get Free Access →"}
          </button>

          <p
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
              textAlign: "center",
              margin: "4px 0 0",
              lineHeight: 1.5,
            }}
          >
            No spam. Used only to track your demo session.
          </p>
        </form>
      </div>

      <div style={{ marginTop: "28px", textAlign: "center" }}>
        <a
          href="https://brightdata.com?utm_source=content-pipeline-studio&utm_medium=demo&utm_campaign=content-system-bd"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.3)",
            textDecoration: "none",
          }}
        >
          Powered by{" "}
          <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
            Bright Data
          </span>
        </a>
      </div>
    </div>
  );
}
