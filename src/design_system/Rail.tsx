import { type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

interface RailProps {
  title: string;
  children: ReactNode;
  onSeeAll?: () => void;
}

export function Rail({ title, children, onSeeAll }: RailProps) {
  return (
    <section style={{ marginBottom: "32px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          padding: "0 16px",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "var(--font-arabic)",
          }}
        >
          {title}
        </h2>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              color: "var(--text-tertiary)",
              transition: "color var(--transition-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold-400)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            الكل
            <ChevronLeft size={16} />
          </button>
        )}
      </div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          padding: "0 16px 8px",
          scrollbarWidth: "none",
        }}
      >
        {children}
      </div>
    </section>
  );
}

interface HeroSectionProps {
  backdropUrl?: string;
  title: string;
  overview: string;
  children?: ReactNode;
}

export function HeroSection({ backdropUrl, title, overview, children }: HeroSectionProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "420px",
        borderRadius: "0 0 var(--radius-xl) var(--radius-xl)",
        overflow: "hidden",
        marginBottom: "32px",
      }}
    >
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt={title}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, var(--bg-primary) 5%, rgba(10,10,11,0.5) 50%, rgba(10,10,11,0.3) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          left: "24px",
          right: "24px",
          maxWidth: "600px",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: "8px",
            lineHeight: 1.2,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "16px",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {overview}
        </p>
        {children}
      </div>
    </div>
  );
}
