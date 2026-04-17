interface StatsCardsProps {
  sites: number;
  queued: number;
  completed: number;
  active: number;
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function KeywordsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}

function ArticleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  description: string;
}

export function StatsCards({ sites, queued, completed, active }: StatsCardsProps) {
  const cards: StatCard[] = [
    {
      label: "Total Sites",
      value: sites,
      icon: <GlobeIcon />,
      iconBg: "var(--th-accent-soft)",
      iconColor: "var(--th-text-accent)",
      accentColor: "var(--th-accent)",
      description: "Connected sites",
    },
    {
      label: "Keywords in Queue",
      value: queued,
      icon: <KeywordsIcon />,
      iconBg: "var(--th-stage-research-soft)",
      iconColor: "var(--th-stage-research)",
      accentColor: "var(--th-stage-research)",
      description: "Pending generation",
    },
    {
      label: "Articles Generated",
      value: completed,
      icon: <ArticleIcon />,
      iconBg: "var(--th-success-soft)",
      iconColor: "var(--th-success)",
      accentColor: "var(--th-success)",
      description: "Successfully published",
    },
    {
      label: "Pipeline Active",
      value: active,
      icon: <ActivityIcon />,
      iconBg: "var(--th-stage-write-soft)",
      iconColor: "var(--th-stage-write)",
      accentColor: "var(--th-stage-write)",
      description: "Jobs running now",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="card"
          style={{
            padding: "20px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle accent line at top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: card.accentColor,
              opacity: 0.6,
            }}
          />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: card.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: card.iconColor,
              }}
            >
              {card.icon}
            </div>
            {card.label === "Pipeline Active" && card.value > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "var(--th-stage-write)",
                  background: "var(--th-stage-write-soft)",
                  padding: "3px 8px",
                  borderRadius: "20px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--th-stage-write)",
                    animation: "pulse 2s infinite",
                  }}
                />
                Live
              </span>
            )}
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--th-text)", lineHeight: 1, marginBottom: "6px" }}>
            {card.value.toLocaleString()}
          </div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--th-text)", marginBottom: "2px" }}>
            {card.label}
          </div>
          <div style={{ fontSize: "12px", color: "var(--th-text-muted)" }}>
            {card.description}
          </div>
        </div>
      ))}
    </div>
  );
}
