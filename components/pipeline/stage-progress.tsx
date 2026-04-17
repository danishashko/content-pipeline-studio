interface StageProgressProps {
  stageProgress: Record<string, string>;
  currentStage?: string;
  error?: string;
}

const STAGES = [
  { key: "research", label: "Research", color: "var(--th-stage-research)", soft: "var(--th-stage-research-soft)" },
  { key: "write", label: "Write", color: "var(--th-stage-write)", soft: "var(--th-stage-write-soft)" },
  { key: "validate", label: "Validate", color: "var(--th-stage-validate)", soft: "var(--th-stage-validate-soft)" },
  { key: "publish", label: "Publish", color: "var(--th-stage-publish)", soft: "var(--th-stage-publish-soft)" },
];

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function getStageStatus(
  stageKey: string,
  stageProgress: Record<string, string>,
  currentStage: string | undefined,
  hasError: boolean
): "completed" | "active" | "failed" | "pending" {
  const progress = stageProgress[stageKey];
  if (progress === "completed") return "completed";
  if (progress === "failed" || (currentStage === stageKey && hasError)) return "failed";
  if (stageKey === currentStage && !hasError) return "active";
  return "pending";
}

export function StageProgress({ stageProgress, currentStage, error }: StageProgressProps) {
  const hasError = Boolean(error);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
      {STAGES.map((stage, idx) => {
        const status = getStageStatus(stage.key, stageProgress, currentStage, hasError);
        const isLast = idx === STAGES.length - 1;

        let circleBackground = "var(--th-inset)";
        let circleBorder = "var(--th-border)";
        let circleColor = "var(--th-text-muted)";
        let labelColor = "var(--th-text-muted)";
        let connectorColor = "var(--th-border)";

        if (status === "completed") {
          circleBackground = stage.color;
          circleBorder = stage.color;
          circleColor = "#fff";
          labelColor = stage.color;
          connectorColor = stage.color;
        } else if (status === "active") {
          circleBackground = stage.soft;
          circleBorder = stage.color;
          circleColor = stage.color;
          labelColor = stage.color;
        } else if (status === "failed") {
          circleBackground = "var(--th-danger-soft)";
          circleBorder = "var(--th-danger)";
          circleColor = "var(--th-danger)";
          labelColor = "var(--th-danger)";
        }

        return (
          <div key={stage.key} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            {/* Stage step */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: circleBackground,
                  border: `2px solid ${circleBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: circleColor,
                  fontSize: "11px",
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: status === "active" ? `0 0 0 4px ${stage.soft}` : "none",
                  animation: status === "active" ? "pulse 2s infinite" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {status === "completed" ? <CheckIcon /> : status === "failed" ? <XIcon /> : idx + 1}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: status === "active" || status === "completed" ? 600 : 500,
                  color: labelColor,
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                }}
              >
                {stage.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: "2px",
                  background: connectorColor,
                  margin: "0 4px",
                  marginBottom: "20px",
                  borderRadius: "1px",
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
