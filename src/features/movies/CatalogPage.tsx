import { useState, useEffect, useCallback } from "react";
import { PosterCard } from "../../design_system/PosterCard";
import { Spinner } from "../../design_system/components";
import type { ContentIdentity } from "../../domain/content/ContentIdentity";
import { fetchPopular, fetchTopRated, fetchByGenre, fetchByRegion, TMDB_GENRES, TMDB_REGIONS } from "../../lib/tmdb";

interface CatalogPageProps {
  mediaType: "movie" | "series";
  onSelectContent: (identity: ContentIdentity) => void;
}

type Category = "popular" | "top_rated" | "action" | "comedy" | "drama" | "animation" | "horror" | "romance" | "scifi" | "arabic" | "turkish" | "korean" | "indian" | "anime";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "popular", label: "الأكثر مشاهدة" },
  { id: "top_rated", label: "الأعلى تقييمًا" },
  { id: "action", label: "أكشن" },
  { id: "comedy", label: "كوميديا" },
  { id: "drama", label: "دراما" },
  { id: "animation", label: "أنميشن" },
  { id: "horror", label: "رعب" },
  { id: "romance", label: "رومانسي" },
  { id: "scifi", label: "خيال علمي" },
  { id: "arabic", label: "عربي" },
  { id: "turkish", label: "تركي" },
  { id: "korean", label: "كوري" },
  { id: "indian", label: "هندي" },
  { id: "anime", label: "أنمي" },
];

export function CatalogPage({ mediaType, onSelectContent }: CatalogPageProps) {
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("popular");
  const [items, setItems] = useState<ContentIdentity[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadCategory = useCallback(async (cat: Category, pageNum: number, append: boolean) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      let result: ContentIdentity[] = [];
      const movieGenres = TMDB_GENRES.movie;
      const tvGenres = TMDB_GENRES.tv;

      switch (cat) {
        case "popular":
          result = await fetchPopular(mediaType, pageNum);
          break;
        case "top_rated":
          result = await fetchTopRated(mediaType, pageNum);
          break;
        case "action":
          result = await fetchByGenre(mediaType, mediaType === "movie" ? movieGenres.action : tvGenres.action, pageNum);
          break;
        case "comedy":
          result = await fetchByGenre(mediaType, mediaType === "movie" ? movieGenres.comedy : tvGenres.comedy, pageNum);
          break;
        case "drama":
          result = await fetchByGenre(mediaType, mediaType === "movie" ? movieGenres.drama : tvGenres.drama, pageNum);
          break;
        case "animation":
          result = await fetchByGenre(mediaType, mediaType === "movie" ? movieGenres.animation : tvGenres.animation, pageNum);
          break;
        case "horror":
          result = await fetchByGenre(mediaType, mediaType === "movie" ? movieGenres.horror : tvGenres.mystery, pageNum);
          break;
        case "romance":
          result = await fetchByGenre(mediaType, mediaType === "movie" ? movieGenres.romance : tvGenres.drama, pageNum);
          break;
        case "scifi":
          result = await fetchByGenre(mediaType, mediaType === "movie" ? movieGenres.scifi : tvGenres.scifi, pageNum);
          break;
        case "arabic":
          result = await fetchByRegion(mediaType, TMDB_REGIONS.arabic, pageNum);
          break;
        case "turkish":
          result = await fetchByRegion(mediaType, TMDB_REGIONS.turkish, pageNum);
          break;
        case "korean":
          result = await fetchByRegion(mediaType, TMDB_REGIONS.korean, pageNum);
          break;
        case "indian":
          result = await fetchByRegion(mediaType, TMDB_REGIONS.hindi, pageNum);
          break;
        case "anime":
          result = await fetchByGenre(mediaType, mediaType === "movie" ? movieGenres.animation : 16, pageNum);
          break;
      }

      if (append) {
        setItems((prev) => [...prev, ...result]);
      } else {
        setItems(result);
      }
      setHasMore(result.length >= 20);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [mediaType]);

  useEffect(() => {
    setPage(1);
    loadCategory(category, 1, false);
  }, [category, loadCategory]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadCategory(category, next, true);
  };

  return (
    <div style={{ paddingTop: "24px" }}>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--text-primary)",
          padding: "0 16px",
          marginBottom: "16px",
          fontFamily: "var(--font-arabic)",
        }}
      >
        {mediaType === "movie" ? "الأفلام" : "المسلسلات"}
      </h1>

      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "0 16px 16px",
          scrollbarWidth: "none",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "var(--font-arabic)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: category === cat.id ? "var(--gold-400)" : "var(--bg-elevated)",
              color: category === cat.id ? "var(--neutral-0)" : "var(--text-secondary)",
              border: category === cat.id ? "1px solid var(--gold-400)" : "1px solid var(--border-subtle)",
              transition: "all var(--transition-fast)",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <Spinner size={36} />
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "16px",
              padding: "0 16px",
            }}
          >
            {items.map((item) => (
              <PosterCard key={`${item.tmdbId}-${item.mediaType}`} identity={item} onClick={onSelectContent} showRating />
            ))}
          </div>

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  padding: "10px 32px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  if (!loadingMore) {
                    e.currentTarget.style.borderColor = "var(--border-gold)";
                    e.currentTarget.style.color = "var(--gold-400)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {loadingMore ? "..." : "تحميل المزيد"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
