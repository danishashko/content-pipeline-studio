"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function DashboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function SitesIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function ArticlesIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function SchedulesIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: collapsed ? "rotate(180deg)" : "none",
        transition: "transform 0.2s ease",
      }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <DashboardIcon /> },
  { label: "Sites", href: "/sites", icon: <SitesIcon /> },
  { label: "Queue", href: "/queue", icon: <QueueIcon /> },
  { label: "Pipeline", href: "/pipeline", icon: <PipelineIcon /> },
  { label: "Articles", href: "/articles", icon: <ArticlesIcon /> },
  { label: "Schedules", href: "/schedules", icon: <SchedulesIcon /> },
  { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
  { label: "Docs", href: "/docs", icon: <DocsIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <aside
      style={{
        width: isMobile ? "256px" : collapsed ? "64px" : "256px",
        minWidth: isMobile ? "256px" : collapsed ? "64px" : "256px",
        background: "var(--th-sidebar)",
        borderRight: "1px solid var(--th-border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        transition: isMobile
          ? "transform 0.25s ease"
          : "width 0.2s ease, min-width 0.2s ease",
        overflow: "hidden",
        position: isMobile ? "fixed" : "relative",
        top: isMobile ? 0 : undefined,
        left: isMobile ? 0 : undefined,
        zIndex: isMobile ? 100 : 20,
        transform: isMobile
          ? mobileOpen
            ? "translateX(0)"
            : "translateX(-100%)"
          : "none",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: !isMobile && collapsed ? "20px 0" : "20px 16px",
          borderBottom: "1px solid var(--th-border)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          justifyContent: !isMobile && collapsed ? "center" : "flex-start",
          minHeight: "64px",
        }}
      >
        {!isMobile && collapsed ? (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #76A5FF 0%, #092349 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "11px",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(118,165,255,0.4)",
            }}
          >
            BD
          </div>
        ) : (
          <div>
            <div
              style={{
                fontSize: "20px",
                color: "white",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              <span style={{ fontWeight: 400 }}>bright</span>
              <span style={{ fontWeight: 700 }}>data</span>
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--th-text-muted)",
                lineHeight: 1.2,
                marginTop: "4px",
              }}
            >
              Content Pipeline Studio
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          overflowY: "auto",
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          const isCollapsed = !isMobile && collapsed;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              onClick={() => {
                if (isMobile) setMobileOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: isCollapsed ? 0 : "10px",
                padding: isCollapsed ? "10px" : "10px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                color: active
                  ? "var(--th-text-accent)"
                  : "var(--th-text-secondary)",
                background: active ? "var(--th-accent-soft)" : "transparent",
                fontWeight: active ? 600 : 500,
                fontSize: "13px",
                transition: "background 0.15s ease, color 0.15s ease",
                justifyContent: isCollapsed ? "center" : "flex-start",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "var(--th-sidebar-hover)";
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--th-text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--th-text-secondary)";
                }
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "3px",
                    height: "20px",
                    borderRadius: "0 3px 3px 0",
                    background: "var(--th-accent)",
                  }}
                />
              )}
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div
        style={{
          borderTop: "1px solid var(--th-border)",
          padding: "8px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <ThemeToggle collapsed={!isMobile && collapsed} />
        {!isMobile && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: collapsed ? 0 : "10px",
              width: "100%",
              padding: collapsed ? "10px" : "10px 12px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              color: "var(--th-text-muted)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "background 0.15s ease, color 0.15s ease",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--th-sidebar-hover)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--th-text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--th-text-muted)";
            }}
          >
            <CollapseIcon collapsed={collapsed} />
            {!collapsed && <span>Collapse</span>}
          </button>
        )}

        {/* GitHub repo */}
        <a
          href="https://github.com/danishashko/content-pipeline-studio"
          target="_blank"
          rel="noopener noreferrer"
          title="Fork on GitHub"
          style={{
            display: "flex",
            alignItems: "center",
            gap: !isMobile && collapsed ? 0 : "8px",
            padding: !isMobile && collapsed ? "10px" : "10px 12px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--th-text-muted)",
            justifyContent: !isMobile && collapsed ? "center" : "flex-start",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--th-inset)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--th-text)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--th-text-muted)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          {(!isMobile && collapsed) ? null : <span>Fork on GitHub</span>}
        </a>

        {/* Powered by Bright Data */}
        {(isMobile || !collapsed) && (
          <a
            href="https://brightdata.com?utm_source=content-pipeline-studio&utm_medium=demo&utm_campaign=content-system-bd"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "11px",
              color: "var(--th-text-muted)",
              gap: "4px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--th-text-accent)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--th-text-muted)")
            }
          >
            Powered by{" "}
            <span style={{ fontWeight: 600 }}>
              <span style={{ fontWeight: 400 }}>bright</span>data
            </span>
          </a>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile top bar — replaces floating hamburger, gives pages room to breathe */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "52px",
            zIndex: 101,
            background: "var(--th-sidebar)",
            borderBottom: "1px solid var(--th-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <div style={{ fontSize: "18px", color: "white", lineHeight: 1 }}>
            <span style={{ fontWeight: 400 }}>bright</span>
            <span style={{ fontWeight: 700 }}>data</span>
          </div>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: "1px solid var(--th-border)",
              background: "transparent",
              color: "var(--th-text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mobileOpen ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar */}
      {sidebarContent}
    </>
  );
}
