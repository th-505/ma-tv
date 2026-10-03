import { type ReactNode, type HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "gold";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

export function Card({ variant = "default", children, style, ...rest }: CardProps) {
  const variantStyles: Record<CardVariant, React.CSSProperties> = {
    default: {
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-subtle)",
    },
    elevated: {
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      boxShadow: "var(--shadow-md)",
    },
    gold: {
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-gold)",
      boxShadow: "var(--shadow-gold)",
    },
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        ...variantStyles[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "gold" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const variantColors: Record<string, { bg: string; color: string; border: string }> = {
    default: { bg: "rgba(255,255,255,0.08)", color: "var(--text-secondary)", border: "var(--border-default)" },
    gold: { bg: "rgba(212,175,55,0.12)", color: "var(--gold-400)", border: "var(--border-gold)" },
    success: { bg: "rgba(61,214,140,0.12)", color: "var(--accent-success)", border: "rgba(61,214,140,0.3)" },
    warning: { bg: "rgba(245,166,35,0.12)", color: "var(--accent-warning)", border: "rgba(245,166,35,0.3)" },
    error: { bg: "rgba(229,72,77,0.12)", color: "var(--accent-error)", border: "rgba(229,72,77,0.3)" },
    info: { bg: "rgba(59,130,246,0.12)", color: "var(--accent-info)", border: "rgba(59,130,246,0.3)" },
  };
  const v = variantColors[variant];
  const fontSize = size === "sm" ? "11px" : "13px";
  const padding = size === "sm" ? "2px 8px" : "4px 12px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: "var(--radius-full)",
        padding,
        fontSize,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 24, color = "var(--gold-400)" }: SpinnerProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid rgba(212,175,55,0.2`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}
