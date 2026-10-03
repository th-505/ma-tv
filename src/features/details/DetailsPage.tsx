import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Zap, Clock, Star, Play, Heart, Share2, Check } from "lucide-react";
import { Card, Badge, Spinner } from "../../design_system/components";
import { PosterCard } from "../../design_system/PosterCard";
import type { ContentIdentity } from "../../domain/content/ContentIdentity";
import type { RankedSource, PlaybackSource } from "../../domain/playback/PlaybackSource";
import { fetchDetails, fetchSeasonDetails, fetchSimilar, tmdbImageUrl, tmdbBackdropUrl, tmdbProfileUrl } from "../../lib/tmdb";
import { buildEmbedSources, getEmbedServerById, EXTERNAL_PORTALS } from "../../lib/embedSources";
import { scrapeDirectVideoStream } from "../../engines/scrapers/DirectStreamScraper";
import { toggleFavorite, isFavorite } from "../../lib/progress";
import { SourcePicker } from "./SourcePicker";

interface DetailsPageProps {
  identity: ContentIdentity;
  onBack: () => void;
  onPlay: (identity: ContentIdentity, source: PlaybackSource, allSources: RankedSource[], episode?: import("../../domain/content/ContentIdentity").EpisodeIdentity) => void;
  onSelectContent: (identity: ContentIdentity) => void;
}

export function DetailsPage({ identity, onBack, onPlay, onSelectContent }: DetailsPageProps) {
  const [details, setDetails] = useState<ContentIdentity | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [sources, setSources] = useState<RankedSource[]>([]);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<import("../../domain/content/ContentIdentity").EpisodeIdentity[]>([]);
  const [favState, setFavState] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similar, setSimilar] = useState<ContentIdentity[]>([]);
  const [scrapingPortalId, setScrapingPortalId] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    setLoadingDetails(true);
    try {
      const d = await fetchDetails(identity.tmdbId, identity.mediaType);
      setDetails(d);
    } catch {
      setDetails(identity);
    } finally {
      setLoadingDetails(false);
    }
  }, [identity]);

  const loadEpisodes = useCallback(async (season: number) => {
    if (identity.mediaType !== "series") return;
    try {
      const eps = await fetchSeasonDetails(identity.tmdbId, season);
      setEpisodes(eps);
    } catch {
      setEpisodes([]);
    }
  }, [identity]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    if (details && identity.mediaType === "series") {
      loadEpisodes(selectedSeason);
    }
  }, [details, selectedSeason, identity.mediaType, loadEpisodes]);

  useEffect(() => {
    setSources(buildEmbedSources(identity, selectedSeason, selectedEpisode ?? undefined));
  }, [identity, selectedSeason, selectedEpisode]);

  useEffect(() => {
    setFavState(isFavorite(identity.tmdbId, identity.mediaType));
  }, [identity.tmdbId, identity.mediaType]);

  useEffect(() => {
    fetchSimilar(identity.tmdbId, identity.mediaType).then(setSimilar).catch(() => setSimilar([]));
  }, [identity.tmdbId, identity.mediaType]);

  const handleToggleFav = () => {
    const isFav = toggleFavorite(identity);
    setFavState(isFav);
  };

  const handleShare = async () => {
    const title = (details ?? identity).canonical.title;
    const shareData = {
      title,
      text: `شاهد ${title} بجودة عالية على MA-TV Cinematic Gold`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User dismiss
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard error
      }
    }
  };

  const handleQuickPlay = () => {
    if (sources.length > 0) {
      const ep = selectedEpisode
        ? episodes.find((e) => e.episodeNumber === selectedEpisode)
        : undefined;
      onPlay(identity, sources[0].source, sources, ep);
    }
  };

  const handleEpisodePlay = (epNum: number) => {
    const ep = episodes.find((e) => e.episodeNumber === epNum);
    const epSources = buildEmbedSources(identity, selectedSeason, epNum);
    if (epSources.length > 0) {
      onPlay(identity, epSources[0].source, epSources, ep);
    }
  };

  const handlePlayPortalDirect = async (portal: typeof EXTERNAL_PORTALS[0]) => {
    setScrapingPortalId(portal.id);
    try {
      const isM3u8 = portal.id === "faselhd" || portal.id === "arabseed" || portal.id === "egydead" || portal.id === "hianime" || portal.id === "dramacool";
      const format = isM3u8 ? "m3u8" : "mp4";
      const streams = await scrapeDirectVideoStream({
        siteId: portal.id,
        siteName: portal.name,
        baseUrl: `https://${portal.id}.com`,
        title: (details ?? identity).canonical.title,
        season: identity.mediaType === "series" ? selectedSeason : undefined,
        episode: identity.mediaType === "series" ? (selectedEpisode ?? 1) : undefined,
        defaultFormat: format,
        audioLanguage: portal.id === "hianime" ? "ja" : portal.id === "dramacool" ? "ko" : "ar",
      });

      if (streams.length > 0) {
        const stream = streams[0];
        const portalSource: PlaybackSource = {
          providerId: portal.id,
          sourceId: `${portal.id}-${identity.tmdbId}`,
          url: stream.url,
          quality: "1080p",
          audioLanguage: stream.audioLanguage || "ar",
          hasSubtitles: true,
          resolvedAt: new Date().toISOString(),
          qualityConfidence: "TRACK_VERIFIED",
        };
        const ranked: RankedSource = {
          source: portalSource,
          rank: 1,
          score: 100,
          healthStatus: "READY",
          qualityVerified: true,
        };
        onPlay(identity, portalSource, [ranked, ...sources]);
      }
    } finally {
      setScrapingPortalId(null);
    }
  };

  const displayData = details ?? identity;
  const backdropUrl = tmdbBackdropUrl(displayData.canonical.backdropPath);
  const posterUrl = tmdbImageUrl(displayData.canonical.posterPath, "w342");
  const year = displayData.canonical.releaseDate?.substring(0, 4);
  const hasSources = sources.length > 0;
  const bestSource = sources[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", animation: "fadeIn 0.3s ease" }}>
      {/* Backdrop */}
      <div style={{ position: "relative", width: "100%", height: "300px", overflow: "hidden" }}>
        {backdropUrl ? (
          <img src={backdropUrl} alt={displayData.canonical.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "var(--neutral-100)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,10,11,0.3) 0%, var(--bg-primary) 90%)" }} />

        <button
          onClick={onBack}
          style={{
            position: "absolute", top: "16px", left: "16px",
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(10px)", borderRadius: "var(--radius-full)",
            color: "var(--text-primary)", fontSize: "14px", fontWeight: 600,
            border: "1px solid var(--border-subtle)", cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.8)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
        >
          <ArrowRight size={18} />
          رجوع
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "0 24px", marginTop: "-80px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {/* Poster */}
          <div style={{ flexShrink: 0 }}>
            {posterUrl ? (
              <img src={posterUrl} alt={displayData.canonical.title} style={{
                width: "180px", height: "270px", borderRadius: "var(--radius-lg)",
                objectFit: "cover", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-lg)",
              }} />
            ) : (
              <div style={{ width: "180px", height: "270px", borderRadius: "var(--radius-lg)", background: "var(--neutral-100)", border: "1px solid var(--border-subtle)" }} />
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: "250px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px", lineHeight: 1.2 }}>
              {displayData.canonical.title}
            </h1>
            {displayData.canonical.originalTitle && displayData.canonical.originalTitle !== displayData.canonical.title && (
              <p style={{ fontSize: "15px", color: "var(--text-tertiary)", marginBottom: "12px" }}>
                {displayData.canonical.originalTitle}
              </p>
            )}

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {year && <Badge variant="default">{year}</Badge>}
              {displayData.canonical.voteAverage && (
                <Badge variant="gold"><Star size={12} /> {displayData.canonical.voteAverage.toFixed(1)}</Badge>
              )}
              {displayData.canonical.runtime && (
                <Badge variant="default"><Clock size={12} /> {displayData.canonical.runtime}د</Badge>
              )}
              {displayData.canonical.genres.slice(0, 3).map((g) => (
                <Badge key={g} variant="default">{g}</Badge>
              ))}
            </div>

            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "24px", maxWidth: "600px" }}>
              {displayData.canonical.overview || "لا يوجد وصف متاح حاليًا."}
            </p>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button
                onClick={handleQuickPlay}
                disabled={!hasSources}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 32px",
                  background: hasSources ? "var(--gold-400)" : "var(--neutral-200)",
                  color: hasSources ? "var(--neutral-0)" : "var(--text-tertiary)",
                  borderRadius: "var(--radius-full)", fontWeight: 700, fontSize: "16px",
                  border: "none", cursor: hasSources ? "pointer" : "not-allowed",
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => { if (hasSources) { e.currentTarget.style.background = "var(--gold-300)"; e.currentTarget.style.boxShadow = "var(--shadow-gold)"; } }}
                onMouseLeave={(e) => { if (hasSources) { e.currentTarget.style.background = "var(--gold-400)"; e.currentTarget.style.boxShadow = "none"; } }}
              >
                <Zap size={20} fill="currentColor" />
                تشغيل سريع
              </button>

              <button
                onClick={() => setShowSourcePicker(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 24px", background: "var(--bg-elevated)",
                  color: "var(--text-primary)", borderRadius: "var(--radius-full)",
                  fontWeight: 600, fontSize: "15px", border: "1px solid var(--border-default)",
                  cursor: "pointer", transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-gold)"; e.currentTarget.style.color = "var(--gold-400)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              >
                <Play size={18} />
                المصادر
                {hasSources && <Badge variant="gold">{sources.length}</Badge>}
              </button>

              <button
                onClick={handleToggleFav}
                style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "12px",
                  background: "var(--bg-elevated)", color: favState ? "var(--gold-400)" : "var(--text-primary)",
                  borderRadius: "var(--radius-full)",
                  border: favState ? "1px solid var(--border-gold)" : "1px solid var(--border-default)",
                  cursor: "pointer", transition: "all var(--transition-fast)",
                }}
                title={favState ? "إزالة من قائمتي" : "إضافة إلى قائمتي"}
              >
                <Heart size={18} fill={favState ? "currentColor" : "none"} />
              </button>

              <button
                onClick={handleShare}
                style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "12px 18px",
                  background: "var(--bg-elevated)", color: copied ? "var(--accent-success)" : "var(--text-primary)",
                  borderRadius: "var(--radius-full)",
                  border: copied ? "1px solid var(--accent-success)" : "1px solid var(--border-default)",
                  cursor: "pointer", transition: "all var(--transition-fast)",
                }}
                title="مشاركة العمل"
              >
                {copied ? <Check size={18} /> : <Share2 size={18} />}
                <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-arabic)" }}>
                  {copied ? "تم النسخ!" : "مشاركة"}
                </span>
              </button>
            </div>

            {/* Best source preview */}
            {hasSources && bestSource && (
              <Card variant="gold" style={{ padding: "12px 16px", marginBottom: "16px", maxWidth: "420px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <Zap size={14} style={{ color: "var(--gold-400)" }} fill="currentColor" />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--gold-400)", fontFamily: "var(--font-arabic)" }}>
                    السيرفر الأساسي: {getEmbedServerById(bestSource.source.providerId)?.name || bestSource.source.providerId}
                  </span>
                  <Badge variant="gold">{getEmbedServerById(bestSource.source.providerId)?.badge || bestSource.source.quality}</Badge>
                </div>
              </Card>
            )}

            {/* Direct Scraped Stream Servers (MP4 / M3U8 inside the app, never redirecting) */}
            <div style={{ marginTop: "14px", marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", color: "var(--gold-400)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-arabic)", fontWeight: 700 }}>
                <Zap size={14} style={{ color: "var(--gold-400)" }} fill="currentColor" />
                <span>قشط وتشغيل مباشر (سحب روابط MP4 / M3U8 وتشغيلها فوراً داخل التطبيق):</span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {EXTERNAL_PORTALS.map((portal) => {
                  const isScraping = scrapingPortalId === portal.id;
                  const isM3u8 = portal.id === "faselhd" || portal.id === "arabseed" || portal.id === "egydead" || portal.id === "hianime" || portal.id === "dramacool";
                  return (
                    <button
                      key={portal.id}
                      onClick={() => handlePlayPortalDirect(portal)}
                      disabled={isScraping}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "6px 12px", background: isScraping ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(212,175,55,0.3)", borderRadius: "var(--radius-full)",
                        color: "white", fontSize: "12px", cursor: isScraping ? "not-allowed" : "pointer",
                        transition: "all 0.2s", fontFamily: "var(--font-arabic)", fontWeight: 600
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(212,175,55,0.2)";
                        e.currentTarget.style.borderColor = "var(--gold-400)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
                      }}
                    >
                      {isScraping ? <Spinner size={12} /> : <Play size={11} fill="currentColor" style={{ color: "var(--gold-400)" }} />}
                      <span>{portal.name}</span>
                      <span style={{ fontSize: "10px", color: isM3u8 ? "#4ade80" : "var(--gold-400)", background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "10px" }}>
                        {isM3u8 ? "M3U8 مباشر" : "MP4 مباشر"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Cast */}
        {displayData.canonical.cast && displayData.canonical.cast.length > 0 && (
          <div style={{ marginTop: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>طاقم العمل</h2>
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "8px" }}>
              {displayData.canonical.cast.slice(0, 10).map((member) => (
                <div key={member.id} style={{ flexShrink: 0, width: "100px" }}>
                  {tmdbProfileUrl(member.profilePath) ? (
                    <img src={tmdbProfileUrl(member.profilePath)} alt={member.name} style={{
                      width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", marginBottom: "8px",
                    }} />
                  ) : (
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--neutral-150)", marginBottom: "8px" }} />
                  )}
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{member.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{member.character}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seasons / Episodes for series */}
        {identity.mediaType === "series" && displayData.canonical.seasons && (
          <div style={{ marginTop: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>الحلقات</h2>
              <select
                value={selectedSeason}
                onChange={(e) => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(null); }}
                style={{
                  padding: "6px 12px", background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)", fontSize: "14px", cursor: "pointer",
                }}
              >
                {displayData.canonical.seasons.filter((s) => s.seasonNumber > 0).map((s) => (
                  <option key={s.seasonNumber} value={s.seasonNumber}>الموسم {s.seasonNumber}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {episodes.length === 0 && loadingDetails ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}><Spinner size={24} /></div>
              ) : (
                episodes.map((ep) => (
                  <Card
                    key={ep.episodeNumber}
                    onClick={() => handleEpisodePlay(ep.episodeNumber)}
                    style={{ padding: "12px", display: "flex", gap: "12px", alignItems: "center", cursor: "pointer", transition: "all var(--transition-fast)" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-gold)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-subtle)"}
                  >
                    <div style={{ width: "120px", height: "68px", borderRadius: "var(--radius-md)", background: "var(--neutral-150)", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                      {ep.stillPath && (
                        <img src={`https://image.tmdb.org/t/p/w300${ep.stillPath}`} alt={ep.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
                        <Play size={20} style={{ color: "var(--gold-400)" }} fill="currentColor" />
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                        {ep.episodeNumber}. {ep.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ep.overview || "لا يوجد وصف"}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Similar / Recommended */}
      {similar.length > 0 && (
        <div style={{ padding: "32px 24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>
            مقترحات مشابهة
          </h2>
          <div style={{ display: "flex", gap: "16px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "8px" }}>
            {similar.map((item) => (
              <div key={item.tmdbId} style={{ flexShrink: 0, width: "140px" }}>
                <PosterCard identity={item} onClick={onSelectContent} showRating />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source Picker Modal */}
      {showSourcePicker && (
        <SourcePicker
          sources={sources}
          onClose={() => setShowSourcePicker(false)}
          onSelect={(src) => {
            const ep = selectedEpisode ? episodes.find((e) => e.episodeNumber === selectedEpisode) : undefined;
            onPlay(identity, src, sources, ep);
            setShowSourcePicker(false);
          }}
        />
      )}
    </div>
  );
}
