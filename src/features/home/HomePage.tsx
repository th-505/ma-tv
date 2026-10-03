import { useState, useEffect, useCallback } from "react";
import { Rail, HeroSection } from "../../design_system/Rail";
import { PosterCard } from "../../design_system/PosterCard";
import { Spinner } from "../../design_system/components";
import type { ContentIdentity } from "../../domain/content/ContentIdentity";
import {
  fetchTrending,
  fetchPopular,
  fetchTopRated,
  fetchByRegion,
  fetchByGenre,
  tmdbBackdropUrl,
  TMDB_REGIONS,
} from "../../lib/tmdb";
import { getContinueWatching, type ContinueWatchingItem } from "../../lib/progress";

interface HomePageProps {
  onSelectContent: (identity: ContentIdentity) => void;
  onSelectTab?: (tab: "movies" | "series") => void;
}

export function HomePage({ onSelectContent, onSelectTab }: HomePageProps) {
  const [loading, setLoading] = useState(true);
  const [trendingMovies, setTrendingMovies] = useState<ContentIdentity[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<ContentIdentity[]>([]);
  const [popularMovies, setPopularMovies] = useState<ContentIdentity[]>([]);
  const [popularSeries, setPopularSeries] = useState<ContentIdentity[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<ContentIdentity[]>([]);
  const [arabicContent, setArabicContent] = useState<ContentIdentity[]>([]);
  const [turkishContent, setTurkishContent] = useState<ContentIdentity[]>([]);
  const [koreanContent, setKoreanContent] = useState<ContentIdentity[]>([]);
  const [animeContent, setAnimeContent] = useState<ContentIdentity[]>([]);
  const [indianContent, setIndianContent] = useState<ContentIdentity[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendMov, trendSer, popMov, popSer, topMov, arabic, turkish, korean, anime, indian, cw] = await Promise.all([
        fetchTrending("movie").catch(() => []),
        fetchTrending("series").catch(() => []),
        fetchPopular("movie").catch(() => []),
        fetchPopular("series").catch(() => []),
        fetchTopRated("movie").catch(() => []),
        fetchByRegion("movie", TMDB_REGIONS.arabic).catch(() => []),
        fetchByRegion("series", TMDB_REGIONS.turkish).catch(() => []),
        fetchByRegion("series", TMDB_REGIONS.korean).catch(() => []),
        fetchByGenre("movie", 16).catch(() => []),
        fetchByRegion("movie", TMDB_REGIONS.hindi).catch(() => []),
        getContinueWatching(),
      ]);

      setTrendingMovies(trendMov);
      setTrendingSeries(trendSer);
      setPopularMovies(popMov);
      setPopularSeries(popSer);
      setTopRatedMovies(topMov);
      setArabicContent(arabic);
      setTurkishContent(turkish);
      setKoreanContent(korean);
      setAnimeContent(anime);
      setIndianContent(indian);
      setContinueWatching(cw);
    } catch (err) {
      setError("Failed to load content. TMDB API key may not be configured.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--accent-error)", fontSize: "16px", marginBottom: "16px" }}>{error}</p>
        <p style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>
          Add VITE_TMDB_API_KEY to enable content browsing.
        </p>
      </div>
    );
  }

  const heroItem = trendingMovies[0] ?? trendingSeries[0];

  return (
    <div style={{ paddingTop: "16px" }}>
      {heroItem && (
        <HeroSection
          backdropUrl={tmdbBackdropUrl(heroItem.canonical.backdropPath)}
          title={heroItem.canonical.title}
          overview={heroItem.canonical.overview}
        >
          <button
            onClick={() => onSelectContent(heroItem)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              background: "var(--gold-400)",
              color: "var(--neutral-0)",
              borderRadius: "var(--radius-full)",
              fontWeight: 700,
              fontSize: "15px",
              border: "none",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gold-300)";
              e.currentTarget.style.boxShadow = "var(--shadow-gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--gold-400)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            ⚡ تشغيل سريع
          </button>
        </HeroSection>
      )}

      {continueWatching.length > 0 && (
        <Rail title="استمرار المشاهدة">
          {continueWatching.map((item) => {
            const identity: ContentIdentity = {
              tmdbId: item.contentId,
              mediaType: item.mediaType as any,
              canonical: {
                title: item.title || "",
                overview: "",
                posterPath: item.posterPath ?? undefined,
                genres: [],
              },
            };
            return (
              <div key={item.contentId} style={{ width: 160, flexShrink: 0, cursor: "pointer" }} onClick={() => onSelectContent(identity)}>
                <div style={{ position: "relative", width: 160, height: 90, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                  {item.posterPath ? (
                    <img src={`https://image.tmdb.org/t/p/w300${item.posterPath}`} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--neutral-100)" }} />
                  )}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "rgba(255,255,255,0.2)" }}>
                    <div style={{ width: `${item.progress * 100}%`, height: "100%", background: "var(--gold-400)" }} />
                  </div>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginTop: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{Math.round(item.progress * 100)}% watched</div>
              </div>
            );
          })}
        </Rail>
      )}

      {trendingMovies.length > 0 && (
        <Rail title="أفلام رائجة" onSeeAll={() => onSelectTab?.("movies")}>
          {trendingMovies.map((item) => (
            <PosterCard key={item.tmdbId} identity={item} onClick={onSelectContent} showRating />
          ))}
        </Rail>
      )}

      {trendingSeries.length > 0 && (
        <Rail title="مسلسلات رائجة" onSeeAll={() => onSelectTab?.("series")}>
          {trendingSeries.map((item) => (
            <PosterCard key={item.tmdbId} identity={item} onClick={onSelectContent} showRating />
          ))}
        </Rail>
      )}

      {topRatedMovies.length > 0 && (
        <Rail title="الأعلى تقييمًا" onSeeAll={() => onSelectTab?.("movies")}>
          {topRatedMovies.map((item) => (
            <PosterCard key={item.tmdbId} identity={item} onClick={onSelectContent} showRating />
          ))}
        </Rail>
      )}

      {arabicContent.length > 0 && (
        <Rail title="أفلام عربية" onSeeAll={() => onSelectTab?.("movies")}>
          {arabicContent.map((item) => (
            <PosterCard key={item.tmdbId} identity={item} onClick={onSelectContent} />
          ))}
        </Rail>
      )}

      {turkishContent.length > 0 && (
        <Rail title="مسلسلات تركية" onSeeAll={() => onSelectTab?.("series")}>
          {turkishContent.map((item) => (
            <PosterCard key={item.tmdbId} identity={item} onClick={onSelectContent} />
          ))}
        </Rail>
      )}

      {koreanContent.length > 0 && (
        <Rail title="مسلسلات كورية" onSeeAll={() => onSelectTab?.("series")}>
          {koreanContent.map((item) => (
            <PosterCard key={item.tmdbId} identity={item} onClick={onSelectContent} />
          ))}
        </Rail>
      )}

      {animeContent.length > 0 && (
        <Rail title="أنمي" onSeeAll={() => onSelectTab?.("series")}>
          {animeContent.map((item) => (
            <PosterCard key={item.tmdbId} identity={item} onClick={onSelectContent} showRating />
          ))}
        </Rail>
      )}

      {indianContent.length > 0 && (
        <Rail title="أفلام هندية" onSeeAll={() => onSelectTab?.("movies")}>
          {indianContent.map((item) => (
            <PosterCard key={item.tmdbId} identity={item} onClick={onSelectContent} showRating />
          ))}
        </Rail>
      )}

      {popularSeries.length > 0 && (
        <Rail title="مسلسلات شائعة" onSeeAll={() => onSelectTab?.("series")}>
          {popularSeries.map((item) => (
            <PosterCard key={item.tmdbId} identity={item} onClick={onSelectContent} showRating />
          ))}
        </Rail>
      )}

      {popularMovies.length > 0 && (
        <Rail title="الأكثر مشاهدة" onSeeAll={() => onSelectTab?.("movies")}>
          {popularMovies.map((item) => (
            <PosterCard key={item.tmdbId} identity={item} onClick={onSelectContent} showRating />
          ))}
        </Rail>
      )}
    </div>
  );
}
