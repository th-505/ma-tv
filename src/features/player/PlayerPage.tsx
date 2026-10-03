import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight, Zap, Settings as SettingsIcon, Subtitles,
  ChevronDown, Plus, Minus, Play, Pause, Volume2, VolumeX,
  Maximize, AlertTriangle, ExternalLink, SkipForward,
  ShieldCheck, ShieldAlert
} from "lucide-react";
import type { RankedSource, PlaybackSource } from "../../domain/playback/PlaybackSource";
import type { ContentIdentity, EpisodeIdentity } from "../../domain/content/ContentIdentity";
import { buildEmbedSources, getEmbedServerById } from "../../lib/embedSources";
import { addToWatchHistory, savePlaybackProgress } from "../../lib/progress";
import { proxyService } from "../../services/proxy/ProxyService";
import {
  getSubtitleLanguage, setSubtitleLanguage, getSubtitleOffset, setSubtitleOffset,
  SUBTITLE_LANGUAGES,
} from "../../lib/subtitles";

interface PlayerPageProps {
  identity: ContentIdentity;
  source?: PlaybackSource;
  allSources?: RankedSource[];
  episode?: EpisodeIdentity;
  onBack: () => void;
}

export function PlayerPage({ identity, source, allSources, episode, onBack }: PlayerPageProps) {
  const [sources] = useState<RankedSource[]>(() => {
    if (allSources && allSources.length > 0) return allSources;
    if (source) {
      return [{
        source,
        rank: 1,
        score: 100,
        healthStatus: "READY",
        qualityVerified: true,
      }];
    }
    return buildEmbedSources(identity, episode?.seasonNumber, episode?.episodeNumber);
  });

  const [currentIdx, setCurrentIdx] = useState(() => {
    if (source) {
      const idx = sources.findIndex((s) => s.source.sourceId === source.sourceId || s.source.url === source.url);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const [showSourceSwitch, setShowSourceSwitch] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [subLang, setSubLang] = useState(getSubtitleLanguage());
  const [subOffset, setSubOffset] = useState(getSubtitleOffset());
  const [adShieldActive, setAdShieldActive] = useState(true);
  const [key, setKey] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  const currentSource = sources[currentIdx]?.source;
  const isHls = Boolean(
    currentSource?.url &&
    (currentSource.url.includes(".m3u8") ||
     currentSource.url.includes(".mp4") ||
     currentSource.providerId.startsWith("live") ||
     currentSource.url.includes("/hls/") ||
     currentSource.url.includes("/video/"))
  );

  const title = episode
    ? `${identity.canonical.title} - ${episode.title}`
    : identity.canonical.title;

  const currentServerInfo = getEmbedServerById(currentSource?.providerId || "");
  const currentServerDisplayName = currentServerInfo?.name || currentSource?.providerId || "مشغل الفيديو";

  // Track watch time
  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      if (identity.tmdbId > 0) {
        savePlaybackProgress(
          identity.tmdbId,
          identity.mediaType,
          elapsed,
          Math.max(elapsed, 1),
          identity.canonical.title,
          identity.canonical.posterPath,
          episode?.seasonNumber,
          episode?.episodeNumber
        );
        addToWatchHistory(identity, episode?.seasonNumber, episode?.episodeNumber);
      }
    };
  }, [identity, episode]);

  const switchSource = useCallback((idx: number) => {
    setCurrentIdx(idx);
    setShowSourceSwitch(false);
    setKey((k) => k + 1);
    startTimeRef.current = Date.now();
  }, []);

  const handleNextSource = () => {
    if (sources.length > 1) {
      switchSource((currentIdx + 1) % sources.length);
    }
  };

  const handleOpenExternal = () => {
    if (currentSource?.url) {
      window.open(currentSource.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleSubLangChange = (lang: string) => {
    setSubLang(lang);
    setSubtitleLanguage(lang);
    setShowSubtitles(false);
  };

  const handleOffsetChange = (delta: number) => {
    const newVal = Math.max(-30, Math.min(30, subOffset + delta));
    setSubOffset(newVal);
    setSubtitleOffset(newVal);
  };

  if (!currentSource) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "white", fontSize: "18px", marginBottom: "16px", fontFamily: "var(--font-arabic)" }}>لا توجد مصادر متاحة للتشغيل</p>
          <button onClick={onBack} style={{ padding: "10px 24px", background: "var(--gold-400)", border: "none", borderRadius: "var(--radius-full)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-arabic)" }}>رجوع</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", background: "rgba(0,0,0,0.95)", zIndex: 10,
        borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: "8px"
      }}>
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 16px", background: "rgba(255,255,255,0.1)",
            borderRadius: "var(--radius-full)", color: "white",
            fontSize: "14px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)",
            cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-arabic)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          <ArrowRight size={18} />
          رجوع
        </button>

        <div style={{ textAlign: "center", flex: 1, minWidth: "180px", padding: "0 12px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-arabic)" }}>
            {title}
          </div>
          <div style={{ fontSize: "12px", color: "var(--gold-400)", marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {isHls && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 1.5s infinite" }} />}
            <span>
              {isHls
                ? "بث مباشر HLS"
                : `${currentServerDisplayName} (سيرفر ${currentIdx + 1} من ${sources.length})`}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {/* Anti-Popup & Ad-Blocker Shield Button */}
          {!isHls && (
            <button
              onClick={() => setAdShieldActive(!adShieldActive)}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "7px 11px",
                background: adShieldActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                borderRadius: "var(--radius-md)",
                color: adShieldActive ? "#4ade80" : "#f87171",
                fontSize: "12px", fontWeight: 700,
                border: adShieldActive ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
                cursor: "pointer", fontFamily: "var(--font-arabic)", transition: "all 0.2s"
              }}
              title={adShieldActive ? "درع منع التبويبات والإعلانات المنبثقة مفعل (يحظر فتح تبويبات خارجية)" : "درع حظر التبويبات معطل"}
            >
              {adShieldActive ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
              <span>{adShieldActive ? "حظر التبويبات: نشط" : "حظر التبويبات: معطل"}</span>
            </button>
          )}

          {/* External Window Button */}
          {!isHls && (
            <button
              onClick={handleOpenExternal}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "7px 12px", background: "rgba(255,255,255,0.08)",
                borderRadius: "var(--radius-md)", color: "#e2e8f0",
                fontSize: "12px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer", fontFamily: "var(--font-arabic)", transition: "all 0.2s"
              }}
              title="فتح الرابط في نافذة خارجية جديدة إذا واجهتك مشكلة في المشغل المدمج"
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              <ExternalLink size={15} />
              <span>نافذة خارجية</span>
            </button>
          )}

          {/* Next server button */}
          {!isHls && sources.length > 1 && (
            <button
              onClick={handleNextSource}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "7px 12px", background: "rgba(212,175,55,0.15)",
                borderRadius: "var(--radius-md)", color: "var(--gold-400)",
                fontSize: "12px", fontWeight: 600, border: "1px solid rgba(212,175,55,0.3)",
                cursor: "pointer", fontFamily: "var(--font-arabic)", transition: "all 0.2s"
              }}
              title="التبديل فوراً إلى السيرفر التالي"
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,175,55,0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(212,175,55,0.15)")}
            >
              <SkipForward size={15} />
              <span>السيرفر التالي</span>
            </button>
          )}

          {/* Subtitle controls (for VOD) */}
          {!isHls && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowSubtitles(!showSubtitles); setShowSourceSwitch(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 11px", background: showSubtitles ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.1)",
                  borderRadius: "var(--radius-md)", color: "white",
                  fontSize: "13px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                }}
                title="إعدادات الترجمة"
              >
                <Subtitles size={17} />
                <ChevronDown size={13} />
              </button>
              {showSubtitles && (
                <div style={{
                  position: "absolute", top: "100%", left: "0", marginTop: "8px",
                  background: "rgba(15,15,18,0.98)", borderRadius: "var(--radius-lg)",
                  padding: "12px", minWidth: "200px", border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.8)", zIndex: 50,
                }}>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "8px", fontFamily: "var(--font-arabic)" }}>لغة الترجمة</div>
                  {SUBTITLE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSubLangChange(lang.code)}
                      style={{
                        width: "100%", padding: "8px 12px", textAlign: "right",
                        background: subLang === lang.code ? "rgba(212,175,55,0.2)" : "transparent",
                        color: subLang === lang.code ? "var(--gold-400)" : "white",
                        border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
                        fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-arabic)",
                      }}
                    >
                      {lang.label}
                    </button>
                  ))}
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "8px", fontFamily: "var(--font-arabic)" }}>
                    مزامنة الترجمة: {subOffset > 0 ? "+" : ""}{subOffset.toFixed(1)}s
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
                    <button onClick={() => handleOffsetChange(-0.5)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "var(--radius-sm)", color: "white", cursor: "pointer", padding: "6px 10px" }}>
                      <Minus size={16} />
                    </button>
                    <span style={{ color: "white", fontSize: "13px", minWidth: "50px", textAlign: "center" }}>{subOffset.toFixed(1)}s</span>
                    <button onClick={() => handleOffsetChange(0.5)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "var(--radius-sm)", color: "white", cursor: "pointer", padding: "6px 10px" }}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Source switcher dropdown */}
          {sources.length > 1 && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowSourceSwitch(!showSourceSwitch); setShowSubtitles(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 11px", background: showSourceSwitch ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.1)",
                  borderRadius: "var(--radius-md)", color: "white",
                  fontSize: "13px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer", fontFamily: "var(--font-arabic)",
                }}
              >
                <SettingsIcon size={17} />
                <span>السيرفرات</span>
                <span style={{
                  background: "var(--gold-400)", color: "var(--neutral-0)",
                  borderRadius: "var(--radius-full)", padding: "1px 7px",
                  fontSize: "11px", fontWeight: 700,
                }}>
                  {sources.length}
                </span>
                <ChevronDown size={13} />
              </button>

              {showSourceSwitch && (
                <div style={{
                  position: "absolute", top: "100%", right: "0", marginTop: "8px",
                  background: "rgba(15,15,18,0.98)", borderRadius: "var(--radius-lg)",
                  padding: "8px", minWidth: "290px", maxHeight: "380px", overflowY: "auto",
                  border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                  zIndex: 50,
                }}>
                  <div style={{
                    fontSize: "12px", color: "var(--gold-400)", padding: "4px 8px 8px",
                    fontFamily: "var(--font-arabic)", fontWeight: 700,
                    borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "6px"
                  }}>
                    قائمة عالمية ({sources.length} سيرفر عالمي متكامل):
                  </div>
                  {sources.map((rs, idx) => {
                    const sInfo = getEmbedServerById(rs.source.providerId);
                    const displayName = sInfo?.name || rs.source.providerId;
                    const badge = sInfo?.badge;
                    const pingColor = idx < 5 ? "#22c55e" : idx < 15 ? "#eab308" : "#94a3b8";
                    const pingLabel = idx < 5 ? "سريع جداً" : idx < 15 ? "مستقر" : "احتياطي";
                    return (
                      <button
                        key={rs.source.sourceId}
                        onClick={() => switchSource(idx)}
                        style={{
                          width: "100%", padding: "10px 12px", display: "flex",
                          alignItems: "center", justifyContent: "space-between",
                          borderRadius: "var(--radius-md)",
                          background: idx === currentIdx ? "rgba(212,175,55,0.15)" : "transparent",
                          border: "none", cursor: "pointer", marginBottom: "3px", textAlign: "right"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {idx === currentIdx && <Zap size={13} style={{ color: "var(--gold-400)" }} fill="currentColor" />}
                          <span style={{ color: "white", fontSize: "13px", fontWeight: 600 }}>{displayName}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "10px", color: pingColor, fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: pingColor, display: "inline-block" }} />
                            {pingLabel}
                          </span>
                          {badge && <span style={{ fontSize: "10px", color: "var(--gold-400)", opacity: 0.85 }}>{badge}</span>}
                          {idx === currentIdx && <span style={{ fontSize: "11px", color: "var(--gold-400)", fontWeight: 700, fontFamily: "var(--font-arabic)" }}>نشط</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Playback Area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#050507" }}>
        {isHls ? (
          <HlsVideoPlayer
            key={key}
            url={currentSource.url}
            title={title}
            onNextServer={handleNextSource}
            onOpenExternal={handleOpenExternal}
          />
        ) : (
          <iframe
            key={`${key}-${adShieldActive}`}
            src={currentSource.url}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            sandbox={
              adShieldActive
                ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads"
                : undefined
            }
            style={{
              width: "100%", height: "100%", border: "none",
              display: "block",
            }}
            title={title}
          />
        )}
      </div>

      {/* Bottom info bar */}
      <div style={{
        padding: "8px 20px", background: "rgba(0,0,0,0.9)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: "12px", color: "var(--text-tertiary)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ fontFamily: "var(--font-arabic)" }}>
          {isHls
            ? "بث مباشر عبر بروتوكول HLS المتقدم"
            : `مشغل الفيديو المباشر: ${currentServerDisplayName}`}
        </span>
        <span style={{ fontFamily: "var(--font-arabic)" }}>
          السيرفر {currentIdx + 1} من {sources.length} ({currentSource.quality || "1080p"})
        </span>
      </div>
    </div>
  );
}

// ==================== HLS VIDEO PLAYER COMPONENT ====================
function HlsVideoPlayer({
  url,
  title,
  onNextServer,
  onOpenExternal,
}: {
  url: string;
  title: string;
  onNextServer?: () => void;
  onOpenExternal?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [useProxyRelay, setUseProxyRelay] = useState(false);

  useEffect(() => {
    let hlsInstance: any = null;
    let isCancelled = false;
    setLoading(true);
    setHasError(false);

    // الرابط الفعلي: إذا تم طلب البروكسي أو إعادة المحاولة، نمرره عبر وسيط ترحيل البث
    const effectiveUrl = useProxyRelay && !url.includes("/api/proxy") && !url.includes("corsproxy.io")
      ? proxyService.getProxiedStreamUrl(url)
      : url;

    async function initHls() {
      const video = videoRef.current;
      if (!video) return;

      // 0. Check if direct MP4 video file
      if (effectiveUrl.includes(".mp4")) {
        video.src = effectiveUrl;
        video.onloadeddata = () => {
          if (!isCancelled) setLoading(false);
        };
        video.onerror = () => {
          if (!isCancelled) {
            // تجربة البروكسي تلقائياً إذا فشل الطلب المباشر بسبب CORS
            if (!useProxyRelay) {
              setUseProxyRelay(true);
            } else {
              setHasError(true);
              setLoading(false);
            }
          }
        };
        video.play().catch(() => setIsPlaying(false));
        return;
      }

      // 1. Check if browser has native HLS support (Safari, Mobile)
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = effectiveUrl;
        video.play().catch(() => setIsPlaying(false));
        setLoading(false);
        return;
      }

      // 2. Load Hls.js dynamically from CDN if not present
      if (!(window as any).Hls) {
        try {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Hls.js library"));
            document.head.appendChild(script);
          });
        } catch {
          if (!isCancelled) {
            setHasError(true);
            setLoading(false);
          }
          return;
        }
      }

      if (isCancelled || !video) return;

      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
        });

        hlsInstance.loadSource(effectiveUrl);
        hlsInstance.attachMedia(video);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!isCancelled) {
            setLoading(false);
            video.play().catch(() => setIsPlaying(false));
          }
        });

        hlsInstance.on(Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // في حال وجود خطأ شبكة CORS، ننتقل تلقائياً لوسيط البروكسي
                if (!useProxyRelay) {
                  hlsInstance.destroy();
                  setUseProxyRelay(true);
                } else {
                  hlsInstance.startLoad();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hlsInstance.recoverMediaError();
                break;
              default:
                hlsInstance.destroy();
                if (!isCancelled) setHasError(true);
                break;
            }
          }
        });
      } else {
        video.src = effectiveUrl;
        setLoading(false);
      }
    }

    initHls();

    return () => {
      isCancelled = true;
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [url, retryCount, useProxyRelay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (v: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  };

  const [speed, setSpeed] = useState(1);
  const speeds = [0.75, 1, 1.25, 1.5, 2];

  const cycleSpeed = () => {
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
      <video
        ref={videoRef}
        title={title}
        playsInline
        autoPlay
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {loading && !hasError && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", zIndex: 10 }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid rgba(212,175,55,0.2)", borderTopColor: "var(--gold-400)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "white", marginTop: "12px", fontSize: "14px", fontFamily: "var(--font-arabic)" }}>
            {useProxyRelay ? "جاري ترحيل البث وفك الحظر عبر البروكسي..." : "جاري تحميل البث المباشر..."}
          </p>
        </div>
      )}

      {/* Error Overlay with Multi-Engine Rescue Actions */}
      {hasError && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(10,10,12,0.95)", zIndex: 20, padding: "24px", textAlign: "center" }}>
          <AlertTriangle size={48} style={{ color: "var(--accent-warning)", marginBottom: "16px" }} />
          <h3 style={{ color: "white", fontSize: "17px", fontWeight: 700, marginBottom: "8px", fontFamily: "var(--font-arabic)" }}>تعذر تحميل البث المباشر مباشرة من السيرفر</h3>
          <p style={{ color: "var(--text-tertiary)", fontSize: "13px", maxWidth: "460px", marginBottom: "20px", fontFamily: "var(--font-arabic)" }}>
            يفرض المصدر قيود حماية (CORS أو Hotlinking). يمكنك فك الحظر عبر وسيط البث، أو التبديل للسيرفر التالي، أو الفتح في تبويب خارجي.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => {
                setUseProxyRelay(true);
                setRetryCount((c) => c + 1);
              }}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px",
                background: "var(--gold-400)", color: "var(--neutral-0)",
                border: "none", borderRadius: "var(--radius-full)", cursor: "pointer",
                fontWeight: 700, fontSize: "13px", fontFamily: "var(--font-arabic)",
              }}
            >
              <Zap size={16} />
              <span>تشغيل عبر وسيط ترحيل البث (Proxy Relay)</span>
            </button>

            {onNextServer && (
              <button
                onClick={onNextServer}
                style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px",
                  background: "rgba(255,255,255,0.12)", color: "white",
                  border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-full)", cursor: "pointer",
                  fontWeight: 700, fontSize: "13px", fontFamily: "var(--font-arabic)",
                }}
              >
                <SkipForward size={16} />
                <span>السيرفر التالي</span>
              </button>
            )}

            {onOpenExternal && (
              <button
                onClick={onOpenExternal}
                style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px",
                  background: "transparent", color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)", borderRadius: "var(--radius-full)", cursor: "pointer",
                  fontSize: "12px", fontFamily: "var(--font-arabic)",
                }}
              >
                <ExternalLink size={14} />
                <span>فتح الرابط</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video Controls Bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "16px 24px",
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        opacity: 0.9, transition: "opacity 0.2s", zIndex: 5,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={togglePlay} style={{ color: "white", cursor: "pointer" }}>
            {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" />}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={toggleMute} style={{ color: "white", cursor: "pointer" }}>
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              style={{ width: "70px", accentColor: "var(--gold-400)", cursor: "pointer" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span style={{ color: "white", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-arabic)" }}>بث حي</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={cycleSpeed}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "var(--radius-sm)",
              color: "white",
              fontSize: "12px",
              fontWeight: 700,
              padding: "3px 8px",
              cursor: "pointer",
              fontFamily: "var(--font-arabic)",
            }}
            title="تغيير سرعة العرض"
          >
            {speed}x
          </button>
          <button onClick={toggleFullscreen} style={{ color: "white", cursor: "pointer" }}>
            <Maximize size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
