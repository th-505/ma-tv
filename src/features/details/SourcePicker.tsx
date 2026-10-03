import { useState } from "react";
import { X, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Card, Badge } from "../../design_system/components";
import type { RankedSource } from "../../domain/playback/PlaybackSource";
import { getEmbedServerById } from "../../lib/embedSources";

interface SourcePickerProps {
  sources: RankedSource[];
  onClose: () => void;
  onSelect: (source: RankedSource["source"]) => void;
}

export function SourcePicker({ sources, onClose, onSelect }: SourcePickerProps) {
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    new Set(sources.length > 0 ? [sources[0].source.providerId] : [])
  );

  const toggleProvider = (providerId: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
  };

  const groupedByProvider = new Map<string, RankedSource[]>();
  for (const s of sources) {
    const list = groupedByProvider.get(s.source.providerId) ?? [];
    list.push(s);
    groupedByProvider.set(s.source.providerId, list);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "80vh",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          border: "1px solid var(--border-default)",
          borderBottom: "none",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-arabic)",
            }}
          >
            السيرفرات ومصادر التشغيل
            <Badge variant="gold">{sources.length} سيرفر</Badge>
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: "6px",
              borderRadius: "var(--radius-md)",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "var(--bg-elevated)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.background = "none";
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Source list */}
        <div style={{ overflowY: "auto", padding: "12px 20px", flex: 1 }}>
          {sources.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)", fontFamily: "var(--font-arabic)" }}>
              لا توجد مصادر متاحة
            </div>
          ) : (
            Array.from(groupedByProvider.entries()).map(([providerId, providerSources]) => {
              const isExpanded = expandedProviders.has(providerId);
              const best = providerSources[0];
              const serverInfo = getEmbedServerById(providerId);
              const displayName = serverInfo?.name || providerId;

              return (
                <Card
                  key={providerId}
                  variant={best.rank === 1 ? "gold" : "default"}
                  style={{
                    marginBottom: "8px",
                    overflow: "hidden",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {/* Provider header */}
                  <div
                    onClick={() => toggleProvider(providerId)}
                    style={{
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      {best.rank === 1 && (
                        <Zap size={16} style={{ color: "var(--gold-400)" }} fill="currentColor" />
                      )}
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>
                        {displayName}
                      </span>
                      {serverInfo?.badge && (
                        <Badge variant="gold">{serverInfo.badge}</Badge>
                      )}
                      <Badge>{best.source.audioLanguage === "ar" ? "عربي" : "أصلي"}</Badge>
                      {best.source.hasSubtitles && <Badge variant="success">ترجمة</Badge>}
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={18} style={{ color: "var(--text-tertiary)" }} />
                    ) : (
                      <ChevronDown size={18} style={{ color: "var(--text-tertiary)" }} />
                    )}
                  </div>

                  {/* Expanded qualities */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "8px 16px" }}>
                      {providerSources.map((rs) => (
                        <button
                          key={rs.source.sourceId}
                          onClick={() => onSelect(rs.source)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                            transition: "all var(--transition-fast)",
                            background: "transparent",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-elevated-hover)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Badge variant="gold">{rs.source.quality}</Badge>
                            <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-arabic)" }}>
                              {rs.source.audioLanguage === "ar" ? "مدبلج / مترجم عربي" : "لغة أصلية"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                              {rs.score}pts
                            </span>
                            <Zap size={14} style={{ color: "var(--gold-400)" }} fill="currentColor" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
