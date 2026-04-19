"use client";

import { useEffect, useState } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // Check auth by hitting a lightweight endpoint
    fetch("/api/auth")
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  // Still checking
  if (authed === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a1628" }}>
        <div style={{ width: "24px", height: "24px", border: "3px solid #1e3a5f", borderTopColor: "#76A5FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // Not authed - show login
  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />;
  }

  return <>{children}</>;
}

function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setLocked(false);
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked || loading || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 3) {
          setLocked(true);
          setCountdown(60);
          setError("Too many attempts. Please try again in 60 seconds.");
        } else {
          setError(`Invalid password. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? "" : "s"} remaining.`);
        }
        setPassword("");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "linear-gradient(180deg, #0a1628 0%, #060e1a 100%)",
      fontFamily: "var(--font-inter), system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: "420px", padding: "48px 40px",
        background: "linear-gradient(135deg, #0d1f3c 0%, #092349 100%)",
        borderRadius: "16px", border: "1px solid rgba(118, 165, 255, 0.15)",
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "28px", color: "#fff", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            <span style={{ fontWeight: 400 }}>bright</span>
            <span style={{ fontWeight: 700 }}>data</span>
          </div>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
            Content Pipeline Studio
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={locked}
              placeholder="Enter access password"
              autoFocus
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "8px",
                border: error ? "1px solid #ff6b6b" : "1px solid rgba(118, 165, 255, 0.3)",
                background: "rgba(0, 0, 0, 0.3)", color: "#fff", fontSize: "14px",
                outline: "none", boxSizing: "border-box",
                opacity: locked ? 0.5 : 1,
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: "8px", marginBottom: "16px",
              background: "rgba(255, 107, 107, 0.1)", border: "1px solid rgba(255, 107, 107, 0.3)",
              color: "#ff6b6b", fontSize: "13px",
            }}>
              {error}
              {locked && countdown > 0 && (
                <span style={{ display: "block", marginTop: "4px", fontWeight: 600 }}>
                  Retry in {countdown}s
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={locked || loading || !password}
            style={{
              width: "100%", padding: "12px", borderRadius: "8px", border: "none",
              background: locked || loading || !password ? "#1e3a5f" : "#76A5FF",
              color: locked || loading || !password ? "#4a6a8f" : "#000",
              fontSize: "14px", fontWeight: 600, cursor: locked || loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {loading ? "Verifying..." : "Enter"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <a
          href="https://brightdata.com?utm_source=content-pipeline-studio&utm_medium=demo&utm_campaign=content-system-bd"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
        >
          Powered by <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Bright Data</span>
        </a>
      </div>
    </div>
  );
}
