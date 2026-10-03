import { useState, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { PosterCard } from "../../design_system/PosterCard";
import { Spinner } from "../../design_system/components";
import type { ContentIdentity } from "../../domain/content/ContentIdentity";
import { searchTmdb, searchMulti } from "../../lib/tmdb";

interface SearchPageProps {
  onSelectContent: (identity: ContentIdentity) => void;
  onClose: () => void;
  initialMode?: "mix" | "movie" | "series";
}

export function SearchPage({ onSelectContent, onClose, initialMode = "mix" }: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContentIdentity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<"mix" | "movie" | "series">(initialMode);

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      if (searchType === "mix") {
        const res = await searchMulti(q);
        setResults(res);
      } else {
        const res = await searchTmdb(q, searchType);
        setResults(res);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchType, initialMode]);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", paddingTop: "16px" }}>
      {/* Search header */}
      <div style={{ padding: "0 16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Search size={20} style={{ color: "var(--text-tertiary)" }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن فيلم أو مسلسل..."
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: "15px",
                fontFamily: "var(--font-arabic)",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ color: "var(--text-tertiary)", cursor: "pointer", background: "none", border: "none" }}>
                <X size={18} />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-full)",
              color: "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 600,
              border: "1px solid var(--border-default)",
              cursor: "pointer",
            }}
          >
            إغلاق
          </button>
        </div>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: "8px" }}>
          {(["mix", "movie", "series"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSearchType(t)}
              style={{
                padding: "6px 20px",
                borderRadius: "var(--radius-full)",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "var(--font-arabic)",
                background: searchType === t ? "var(--gold-400)" : "var(--bg-elevated)",
                color: searchType === t ? "var(--neutral-0)" : "var(--text-secondary)",
                border: searchType === t ? "1px solid var(--gold-400)" : "1px solid var(--border-subtle)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {t === "mix" ? "الكل" : t === "movie" ? "أفلام" : "مسلسلات"}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <Spinner size={36} />
        </div>
      ) : query.trim().length < 2 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-tertiary)", fontSize: "15px" }}>
          اكتب حرفين على الأقل للبحث
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-tertiary)", fontSize: "15px" }}>
          لا توجد نتائج
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "16px",
            padding: "0 16px",
          }}
        >
          {results.map((item) => (
            <PosterCard key={`${item.tmdbId}-${item.mediaType}`} identity={item} onClick={onSelectContent} showRating />
          ))}
        </div>
      )}
    </div>
  );
}
