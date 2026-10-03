import { type ContentIdentity } from "../domain/content/ContentIdentity";
import { tmdbImageUrl } from "../lib/tmdb";

interface PosterCardProps {
  identity: ContentIdentity;
  onClick?: (identity: ContentIdentity) => void;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
  showRating?: boolean;
}

export function PosterCard({
  identity,
  onClick,
  size = "md",
  showTitle = true,
  showRating = false,
}: PosterCardProps) {
  const dimensions = {
    sm: { width: 120, height: 180 },
    md: { width: 160, height: 240 },
    lg: { width: 200, height: 300 },
  };
  const dim = dimensions[size];

  const posterUrl = tmdbImageUrl(identity.canonical.posterPath, size === "lg" ? "w342" : "w185");
  const title = identity.canonical.title;
  const year = identity.canonical.releaseDate
    ? identity.canonical.releaseDate.substring(0, 4)
    : "";

  return (
    <div
      onClick={() => onClick?.(identity)}
      style={{
        width: dim.width,
        flexShrink: 0,
        cursor: "pointer",
        transition: "transform var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div
        style={{
          width: dim.width,
          height: dim.height,
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "var(--neutral-100)",
          border: "1px solid var(--border-subtle)",
          position: "relative",
          transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-gold)";
          e.currentTarget.style.boxShadow = "var(--shadow-gold)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--neutral-150)",
              color: "var(--text-tertiary)",
              fontSize: "13px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            {title}
          </div>
        )}
        {showRating && identity.canonical.voteAverage && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "rgba(0,0,0,0.8)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 6px",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--gold-400)",
            }}
          >
            ★ {identity.canonical.voteAverage.toFixed(1)}
          </div>
        )}
      </div>
      {showTitle && (
        <div style={{ marginTop: "8px", width: dim.width }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
          {year && (
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>
              {year}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
