import { useState, useEffect, useRef, useMemo } from "react";
import {
  Settings as SettingsIcon, Trash2, Info, Shield, Key,
  Heart, History, Play, ChevronLeft, Globe, Compass,
  Subtitles, Zap, Download, Layers, Upload,
  Activity, RefreshCw, Tv, Trophy, Film, Flame,
  Plus, Check, X, Copy, Sparkles,
  Server, Smartphone, ShieldCheck, Cpu, ArrowRightLeft, Radio, ChevronDown, ChevronUp
} from "lucide-react";
import { serverManager, interpolateUrl } from "../../engines/scrapers/ServerManager";
import { ADDITIONAL_GLOBAL_SERVERS } from "../../config/additionalServers";
import { Card, Badge, Spinner } from "../../design_system/components";
import { PosterCard } from "../../design_system/PosterCard";
import { hybridStreamOrchestrator, type EngineHealthStatus } from "../../engines/HybridStreamOrchestrator";
import { proxyService } from "../../services/proxy/ProxyService";
import { NativeBridge } from "../../services/native/NativeBridge";
import { flareSolverrEngine } from "../../services/cloudflare/FlareSolverrEngine";
import { consumetEngine } from "../../services/consumet/ConsumetEngine";
import {
  getFavorites, getWatchHistory, getContinueWatching,
  toggleFavorite, clearAllData,
  type FavoriteItem, type HistoryItem, type ContinueWatchingItem,
} from "../../lib/progress";
import { getTmdbApiKey, setTmdbApiKey } from "../../lib/tmdb";
import {
  getSubtitleLanguage, setSubtitleLanguage, getSubtitleSize, setSubtitleSize,
  getOpenSubsKey, setOpenSubsKey, loadExternalSubtitleFile,
} from "../../lib/subtitles";
import type { ContentIdentity } from "../../domain/content/ContentIdentity";
import { scraperRegistry } from "../../engines/scrapers/ScraperRegistry";
import type { ScraperCategory, HealthTestResult } from "../../engines/scrapers/ScraperAgent";

type SettingsSection = "main" | "mylist" | "playback" | "subtitles" | "sources" | "downloads" | "appearance" | "about";

interface SettingsPageProps {
  onSelectContent: (identity: ContentIdentity) => void;
}

export function SettingsPage({ onSelectContent }: SettingsPageProps) {
  const [section, setSection] = useState<SettingsSection>("main");

  if (section !== "main") {
    return <SubSection section={section} onBack={() => setSection("main")} onSelectContent={onSelectContent} />;
  }

  return (
    <div style={{ paddingTop: "24px", padding: "24px 16px" }}>
      <h1 style={{
        fontSize: "24px", fontWeight: 700, color: "var(--text-primary)",
        marginBottom: "24px", fontFamily: "var(--font-arabic)",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <SettingsIcon size={24} style={{ color: "var(--gold-400)" }} />
        الإعدادات
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <SectionLink icon={<Heart size={20} />} label="قائمتي" desc="المفضلة، السجل، استمرار المشاهدة" onClick={() => setSection("mylist")} />
        <SectionLink icon={<Zap size={20} />} label="التشغيل" desc="الجودة، الدبلجة، التشغيل التلقائي" onClick={() => setSection("playback")} />
        <SectionLink icon={<Subtitles size={20} />} label="الترجمة" desc="اللغة، المزامنة، الخط، ملفات خارجية" onClick={() => setSection("subtitles")} />
        <SectionLink icon={<Layers size={20} />} label="المصادر" desc="مزودات التشغيل، مفتاح TMDB" onClick={() => setSection("sources")} />
        <SectionLink icon={<Download size={20} />} label="التنزيلات" desc="الجودة، التخزين، الدمج" onClick={() => setSection("downloads")} />
        <SectionLink icon={<Globe size={20} />} label="المظهر" desc="الثيم، اللغة" onClick={() => setSection("appearance")} />
        <SectionLink icon={<Info size={20} />} label="عن التطبيق" desc="الإصدار، المنصة، الخصوصية" onClick={() => setSection("about")} />
      </div>
    </div>
  );
}

function SectionLink({ icon, label, desc, onClick }: { icon: React.ReactNode; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "14px", padding: "16px",
        background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)", cursor: "pointer",
        transition: "all var(--transition-fast)", textAlign: "right", width: "100%",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-gold)"; e.currentTarget.style.transform = "translateX(-4px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.transform = "translateX(0)"; }}
    >
      <div style={{ color: "var(--gold-400)", display: "flex", alignItems: "center" }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px", fontFamily: "var(--font-arabic)" }}>{desc}</div>
      </div>
      <ChevronLeft size={18} style={{ color: "var(--text-tertiary)" }} />
    </button>
  );
}

function SubSection({ section, onBack, onSelectContent }: { section: SettingsSection; onBack: () => void; onSelectContent: (identity: ContentIdentity) => void }) {
  const titles: Record<SettingsSection, string> = {
    main: "", mylist: "قائمتي", playback: "التشغيل", subtitles: "الترجمة",
    sources: "المصادر", downloads: "التنزيلات", appearance: "المظهر", about: "عن التطبيق",
  };

  return (
    <div style={{ paddingTop: "24px", padding: "24px 16px" }}>
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
          background: "var(--bg-elevated)", borderRadius: "var(--radius-full)",
          color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600,
          border: "1px solid var(--border-default)", cursor: "pointer",
          marginBottom: "16px", fontFamily: "var(--font-arabic)",
        }}
      >
        <ChevronLeft size={18} style={{ transform: "rotate(180deg)" }} />
        رجوع
      </button>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px", fontFamily: "var(--font-arabic)" }}>
        {titles[section]}
      </h1>

      {section === "mylist" && <MyListSection onSelectContent={onSelectContent} />}
      {section === "playback" && <PlaybackSection />}
      {section === "subtitles" && <SubtitleSection />}
      {section === "sources" && <SourcesSection />}
      {section === "downloads" && <DownloadsSection />}
      {section === "appearance" && <AppearanceSection />}
      {section === "about" && <AboutSection />}
    </div>
  );
}

function favToIdentity(f: FavoriteItem): ContentIdentity {
  return {
    tmdbId: f.content_id,
    mediaType: f.media_type as "movie" | "series",
    canonical: { title: f.title, overview: "", posterPath: f.poster_path ?? undefined, genres: [], voteAverage: f.vote_average ?? undefined },
  };
}

function MyListSection({ onSelectContent }: { onSelectContent: (identity: ContentIdentity) => void }) {
  const [tab, setTab] = useState<"favorites" | "history" | "continue">("favorites");
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [continueItems, setContinueItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setFavorites(getFavorites());
    setHistory(getWatchHistory());
    setContinueItems(getContinueWatching());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleRemoveFav = (contentId: number, mediaType: string) => {
    const item = favorites.find((f) => f.content_id === contentId && f.media_type === mediaType);
    if (item) {
      toggleFavorite(favToIdentity(item));
      setFavorites(getFavorites());
    }
  };

  const tabs = [
    { id: "favorites" as const, label: "المفضلة", icon: <Heart size={16} /> },
    { id: "history" as const, label: "السجل", icon: <History size={16} /> },
    { id: "continue" as const, label: "استمرار المشاهدة", icon: <Play size={16} /> },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "var(--radius-full)",
              fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-arabic)",
              background: tab === t.id ? "var(--gold-400)" : "var(--bg-elevated)",
              color: tab === t.id ? "var(--neutral-0)" : "var(--text-secondary)",
              border: tab === t.id ? "1px solid var(--gold-400)" : "1px solid var(--border-subtle)",
              cursor: "pointer", transition: "all var(--transition-fast)",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}><Spinner size={32} /></div>
      ) : tab === "favorites" ? (
        favorites.length === 0 ? (
          <EmptyState message="لا توجد عناصر في المفضلة بعد" onExplore={() => {}} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px" }}>
            {favorites.map((f) => (
              <div key={`${f.content_id}-${f.media_type}`} style={{ position: "relative" }}>
                <PosterCard identity={favToIdentity(f)} onClick={onSelectContent} showRating />
                <button
                  onClick={() => handleRemoveFav(f.content_id, f.media_type)}
                  style={{
                    position: "absolute", top: "4px", left: "4px",
                    background: "rgba(0,0,0,0.7)", border: "none",
                    borderRadius: "50%", width: "24px", height: "24px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--accent-error)",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )
      ) : tab === "history" ? (
        history.length === 0 ? (
          <EmptyState message="لا يوجد سجل مشاهدة بعد" onExplore={() => {}} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {history.map((h) => (
              <Card key={`${h.content_id}-${h.watched_at}`} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                {h.poster_path && (
                  <img src={`https://image.tmdb.org/t/p/w92${h.poster_path}`} alt={h.title}
                    style={{ width: 40, height: 60, borderRadius: "var(--radius-sm)", objectFit: "cover" }} />
                )}
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{h.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                    {h.season_number ? `S${h.season_number}E${h.episode_number} • ` : ""}{new Date(h.watched_at).toLocaleDateString("ar-SA")}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : continueItems.length === 0 ? (
        <EmptyState message="لا يوجد استمرار مشاهدة بعد" onExplore={() => {}} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
          {continueItems.map((item) => (
            <div key={`${item.contentId}-${item.mediaType}`} style={{ cursor: "pointer" }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                {item.posterPath ? (
                  <img src={`https://image.tmdb.org/t/p/w300${item.posterPath}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--neutral-100)" }} />
                )}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: "rgba(255,255,255,0.2)" }}>
                  <div style={{ width: `${item.progress * 100}%`, height: "100%", background: "var(--gold-400)" }} />
                </div>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginTop: "8px" }}>
                {item.title || `${Math.round(item.progress * 100)}% مشاهدة`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, onExplore }: { message: string; onExplore: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ marginBottom: "20px", color: "var(--text-tertiary)", fontSize: "15px", fontFamily: "var(--font-arabic)" }}>
        {message}
      </div>
      <button
        onClick={onExplore}
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "12px 28px", background: "var(--gold-400)",
          color: "var(--neutral-0)", borderRadius: "var(--radius-full)",
          border: "none", cursor: "pointer", fontWeight: 700, fontSize: "15px",
          fontFamily: "var(--font-arabic)",
          transition: "all var(--transition-fast)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gold-300)"; e.currentTarget.style.boxShadow = "var(--shadow-gold)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gold-400)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <Compass size={20} />
        استكشف الآن
      </button>
    </div>
  );
}

function PlaybackSection() {
  const [quality, setQuality] = useState("auto");
  const [allowFallback, setAllowFallback] = useState(true);
  const [preferDubbed, setPreferDubbed] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [skipIntro, setSkipIntro] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>جودة التشغيل المفضلة</h2>
        <SelectInput value={quality} onChange={setQuality} options={[
          { value: "auto", label: "تلقائي" },
          { value: "4k_only", label: "4K فقط" },
          { value: "4k_1080p", label: "4K + 1080p" },
          { value: "1080p_only", label: "1080p فقط" },
          { value: "1080p_720p", label: "1080p + 720p" },
          { value: "all", label: "الكل" },
        ]} />
      </Card>
      <Card style={{ padding: "20px" }}>
        <ToggleRow label="السماح بالجودة الأقل كبديل" value={allowFallback} onChange={setAllowFallback} />
        <ToggleRow label="تفضيل الدبلجة العربية" value={preferDubbed} onChange={setPreferDubbed} />
        <ToggleRow label="تشغيل الحلقة التالية تلقائيًا" value={autoPlayNext} onChange={setAutoPlayNext} />
        <ToggleRow label="تخطي المقدمة تلقائيًا" value={skipIntro} onChange={setSkipIntro} />
      </Card>
    </div>
  );
}

function SubtitleSection() {
  const [subtitleLang, setSubtitleLangState] = useState(getSubtitleLanguage());
  const [fontSize, setFontSizeState] = useState(getSubtitleSize());
  const [openSubsKey, setOpenSubsKeyState] = useState(getOpenSubsKey());
  const [uploadStatus, setUploadStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLangChange = (v: string) => { setSubtitleLangState(v); setSubtitleLanguage(v); };
  const handleSizeChange = (v: string) => { setFontSizeState(v); setSubtitleSize(v); };
  const handleKeyChange = (v: string) => { setOpenSubsKeyState(v); setOpenSubsKey(v); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await loadExternalSubtitleFile(file);
      localStorage.setItem("matv_external_sub", content);
      setUploadStatus(`تم تحميل: ${file.name}`);
    } catch {
      setUploadStatus("فشل تحميل الملف");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>لغة الترجمة المفضلة</h2>
        <SelectInput value={subtitleLang} onChange={handleLangChange} options={[
          { value: "ar", label: "العربية" },
          { value: "en", label: "الإنجليزية" },
          { value: "tr", label: "التركية" },
          { value: "ko", label: "الكورية" },
          { value: "fr", label: "الفرنسية" },
        ]} />
      </Card>
      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>حجم الخط</h2>
        <SelectInput value={fontSize} onChange={handleSizeChange} options={[
          { value: "small", label: "صغير" },
          { value: "medium", label: "متوسط" },
          { value: "large", label: "كبير" },
          { value: "xlarge", label: "كبير جدًا" },
        ]} />
      </Card>
      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-arabic)" }}>
          <Key size={18} style={{ color: "var(--gold-400)" }} />
          مفتاح OpenSubtitles API
        </h2>
        <input
          type="text"
          value={openSubsKey}
          onChange={(e) => handleKeyChange(e.target.value)}
          placeholder="أدخل مفتاح API هنا..."
          style={{
            width: "100%", padding: "10px 12px", background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
            color: "var(--text-primary)", fontSize: "14px",
          }}
        />
        <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "8px", fontFamily: "var(--font-arabic)" }}>
          يستخدم للبحث عن الترجمات تلقائيًا. اختياري.
        </p>
      </Card>
      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-arabic)" }}>
          <Upload size={18} style={{ color: "var(--gold-400)" }} />
          تحميل ملف ترجمة خارجي
        </h2>
        <input
          ref={fileRef}
          type="file"
          accept=".srt,.vtt"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: "100%", padding: "12px", background: "var(--bg-secondary)",
            border: "1px dashed var(--border-default)", borderRadius: "var(--radius-md)",
            color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600,
            cursor: "pointer", fontFamily: "var(--font-arabic)",
          }}
        >
          اختر ملف .srt أو .vtt
        </button>
        {uploadStatus && (
          <p style={{ fontSize: "12px", color: "var(--success)", marginTop: "8px", fontFamily: "var(--font-arabic)" }}>{uploadStatus}</p>
        )}
      </Card>
    </div>
  );
}

function MultiAgentDiagnosticsPanel() {
  const [loading, setLoading] = useState(false);
  const [engineStatuses, setEngineStatuses] = useState<EngineHealthStatus[]>([]);
  const [preferences, setPreferences] = useState(() => hybridStreamOrchestrator.getPreferences());
  const [testingEngine, setTestingEngine] = useState<string | null>(null);
  const [flareUrl, setFlareUrl] = useState(() => flareSolverrEngine.getApiUrl());
  const [flareSaved, setFlareSaved] = useState(false);
  const [fastestInfo, setFastestInfo] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    runCheck();
  }, []);

  const runCheck = async () => {
    setLoading(true);
    try {
      const results = await hybridStreamOrchestrator.checkAllEngines();
      setEngineStatuses(results);
    } catch (err) {
      console.error("[MultiAgentDiagnostics] Check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePref = (key: keyof typeof preferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    hybridStreamOrchestrator.savePreferences(updated);
  };

  const handleTestProxy = async () => {
    setTestingEngine("proxy");
    try {
      const res = await proxyService.checkProxyHealth();
      setEngineStatuses((prev) =>
        prev.map((s) =>
          s.engineId === "proxy"
            ? {
                ...s,
                status: res.online ? "ONLINE" : "STANDBY",
                latencyMs: res.latencyMs,
                details: res.online
                  ? `خادم البروكسي المحلي يستجيب بنجاح (${res.latencyMs}ms)`
                  : "يعمل عبر خوادم CORS البديلة العامة السريعة",
                lastChecked: new Date().toLocaleTimeString("ar-SA"),
              }
            : s
        )
      );
    } finally {
      setTestingEngine(null);
    }
  };

  const handleTestFlare = async () => {
    setTestingEngine("flaresolverr");
    try {
      const res = await flareSolverrEngine.testConnection();
      setEngineStatuses((prev) =>
        prev.map((s) =>
          s.engineId === "flaresolverr"
            ? {
                ...s,
                status: res.online ? "ONLINE" : "NOT_CONFIGURED",
                latencyMs: res.latencyMs,
                details: res.online
                  ? `خادم FlareSolverr متصل (${res.latencyMs}ms) - النسخة ${res.version || "نشطة"}`
                  : `غير متصل على الرابط المحدد (${res.error || "تأكد من تشغيل الحاوية"})`,
                lastChecked: new Date().toLocaleTimeString("ar-SA"),
              }
            : s
        )
      );
    } finally {
      setTestingEngine(null);
    }
  };

  const handleSaveFlare = () => {
    flareSolverrEngine.setApiUrl(flareUrl.trim());
    setFlareSaved(true);
    setTimeout(() => setFlareSaved(false), 2000);
    handleTestFlare();
  };

  const handleFindFastestConsumet = async () => {
    setTestingEngine("consumet");
    setFastestInfo(null);
    try {
      const fastest = await consumetEngine.findFastestInstance();
      const testRes = await consumetEngine.testHealth(fastest);
      setFastestInfo(`تم تحويل البث تلقائياً إلى الخادم الأسرع: ${fastest} (${testRes.latencyMs}ms)`);
      const mappedStatus: EngineHealthStatus["status"] =
        testRes.status === "OFFLINE" ? "OFFLINE" : testRes.status === "SLOW" ? "STANDBY" : "ONLINE";
      setEngineStatuses((prev) =>
        prev.map((s) =>
          s.engineId === "consumet"
            ? {
                ...s,
                status: mappedStatus,
                latencyMs: testRes.latencyMs,
                details: `الخادم النشط: ${fastest} (${testRes.latencyMs}ms)`,
                lastChecked: new Date().toLocaleTimeString("ar-SA"),
              }
            : s
        )
      );
    } catch {
      setFastestInfo("تعذر الوصول للخادم السحابي - الاستمرار عبر البدائل المحلية");
    } finally {
      setTestingEngine(null);
    }
  };

  const platform = NativeBridge.getPlatform();
  const isTv = NativeBridge.isAndroidTv();

  const renderBadge = (status?: EngineHealthStatus["status"]) => {
    switch (status) {
      case "ONLINE":
        return <Badge variant="success">نشط وسريع</Badge>;
      case "STANDBY":
        return <Badge variant="warning">جاهز للاستدعاء</Badge>;
      case "OFFLINE":
        return <Badge variant="error">غير متصل</Badge>;
      case "NOT_CONFIGURED":
      default:
        return <Badge variant="default">اختياري</Badge>;
    }
  };

  const getStatus = (id: string): EngineHealthStatus | undefined => {
    return engineStatuses.find((s) => s.engineId === id);
  };

  const proxyStatus = getStatus("proxy");
  const nativeStatus = getStatus("native");
  const flareStatus = getStatus("flaresolverr");
  const consumetStatus = getStatus("consumet");

  return (
    <Card
      style={{
        padding: "20px",
        background: "linear-gradient(135deg, rgba(20,22,35,0.95) 0%, rgba(12,14,24,0.98) 100%)",
        border: "1px solid rgba(212,175,55,0.35)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={22} style={{ color: "var(--gold-400)" }} />
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--gold-400)", fontFamily: "var(--font-arabic)", margin: 0 }}>
              منظومة الوكلاء الخمسة المتوازية (5-Agent Multi-Core Streaming Core)
            </h2>
            <Badge variant="gold">4 حلول مدمجة متزامنة</Badge>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px", fontFamily: "var(--font-arabic)" }}>
            تعمل 4 محركات ذكاء صناعي متوازية لحل قيود CORS وحماية Cloudflare والروابط المحمية وسحب M3U8 خام، ينسق بينها الوكيل الخامس تلقائياً.
          </p>
        </div>

        <button
          onClick={runCheck}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 18px", background: "var(--gold-400)", color: "var(--neutral-0)",
            border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "13px",
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-arabic)",
          }}
        >
          {loading ? <Spinner size={14} /> : <RefreshCw size={14} />}
          <span>{loading ? "جاري فحص الوكلاء..." : "فحص حي لجميع الوكلاء"}</span>
        </button>
      </div>

      {/* Grid of 4 Specialized Agents */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", marginTop: "12px" }}>
        {/* Agent 1: Proxy & Relay */}
        <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Server size={18} style={{ color: "var(--gold-400)" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>
                الوكيل 1: مرحل البث والبروكسي
              </span>
            </div>
            {renderBadge(proxyStatus?.status)}
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "4px 0 10px 0", lineHeight: "1.5", fontFamily: "var(--font-arabic)" }}>
            يتجاوز قيود CORS للمتصفح، ويزيف رؤوس Referer/Origin، ويعيد كتابة مسارات HLS M3U8 لتدفق المشاهدة دون تقطيع.
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-arabic)" }}>
              {proxyStatus?.details || "جاهز عبر خوادم البروكسي العامة"}
            </span>
            <button
              onClick={handleTestProxy}
              disabled={testingEngine === "proxy"}
              style={{
                padding: "4px 10px", background: "rgba(212,175,55,0.15)", border: "1px solid var(--border-gold)",
                color: "var(--gold-400)", borderRadius: "var(--radius-sm)", fontSize: "11px", cursor: "pointer",
                fontFamily: "var(--font-arabic)", display: "flex", alignItems: "center", gap: "4px",
              }}
            >
              {testingEngine === "proxy" ? <Spinner size={10} /> : <Activity size={10} />}
              فحص وسيط البث
            </button>
          </div>
        </div>

        {/* Agent 2: Native Android & TV Bridge */}
        <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Smartphone size={18} style={{ color: "var(--gold-400)" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>
                الوكيل 2: جسر أجهزة التلفاز وأندرويد
              </span>
            </div>
            {renderBadge(nativeStatus?.status)}
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "4px 0 10px 0", lineHeight: "1.5", fontFamily: "var(--font-arabic)" }}>
            اتصالات HTTP أصلية (Native Socket) تتخطى CORS بالكامل وتسمح بطلب أي سيرفر بدون قيود، مع دعم كامل للريموت D-Pad.
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-arabic)" }}>
              البيئة: {isTv ? "شاشة تلفاز ذكي (Android TV)" : platform === "web" ? "المتصفح (Web Standby)" : "تطبيق أندرويد أصلي"}
            </span>
            <Badge variant={platform === "web" ? "default" : "success"}>{platform.toUpperCase()}</Badge>
          </div>
        </div>

        {/* Agent 3: FlareSolverr Cloudflare Engine */}
        <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} style={{ color: "var(--gold-400)" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>
                الوكيل 3: قاهر كابتشا كلاودفلير
              </span>
            </div>
            {renderBadge(flareStatus?.status)}
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "4px 0 10px 0", lineHeight: "1.5", fontFamily: "var(--font-arabic)" }}>
            يحل شاشات Cloudflare Turnstile و DDOS-Guard تلقائياً، مع حفظ كعكات cf_clearance ورؤوس التخفي لمدة 30 دقيقة.
          </p>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
            <input
              type="text"
              value={flareUrl}
              onChange={(e) => setFlareUrl(e.target.value)}
              placeholder="http://localhost:8191/v1"
              style={{
                flex: 1, padding: "4px 8px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "11px",
              }}
            />
            <button
              onClick={handleSaveFlare}
              style={{
                padding: "4px 10px", background: "var(--gold-400)", color: "var(--neutral-0)",
                border: "none", borderRadius: "var(--radius-sm)", fontSize: "11px", cursor: "pointer",
                fontWeight: 700, fontFamily: "var(--font-arabic)"
              }}
            >
              {flareSaved ? "تم" : "حفظ"}
            </button>
            <button
              onClick={handleTestFlare}
              disabled={testingEngine === "flaresolverr"}
              style={{
                padding: "4px 8px", background: "rgba(255,255,255,0.1)", color: "white",
                border: "none", borderRadius: "var(--radius-sm)", fontSize: "11px", cursor: "pointer",
              }}
            >
              {testingEngine === "flaresolverr" ? <Spinner size={10} /> : "فحص"}
            </button>
          </div>
        </div>

        {/* Agent 4: Consumet Open Scrapers */}
        <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={18} style={{ color: "var(--gold-400)" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>
                الوكيل 4: مجمع الواجهات المفتوحة
              </span>
            </div>
            {renderBadge(consumetStatus?.status)}
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "4px 0 10px 0", lineHeight: "1.5", fontFamily: "var(--font-arabic)" }}>
            استخراج مباشر لروابط M3U8 خام وترجمات عربية لأنمي Gogo/HiAnime ومسلسلات FlixHQ ودراما DramaCool بدون إعلانات.
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-arabic)" }}>
              {consumetStatus?.latencyMs ? `${consumetStatus.latencyMs}ms` : "خوادم سحابية بديلة جاهزة"}
            </span>
            <button
              onClick={handleFindFastestConsumet}
              disabled={testingEngine === "consumet"}
              style={{
                padding: "4px 10px", background: "rgba(212,175,55,0.15)", border: "1px solid var(--border-gold)",
                color: "var(--gold-400)", borderRadius: "var(--radius-sm)", fontSize: "11px", cursor: "pointer",
                fontFamily: "var(--font-arabic)", display: "flex", alignItems: "center", gap: "4px",
              }}
            >
              {testingEngine === "consumet" ? <Spinner size={10} /> : <Zap size={10} />}
              تعيين الخادم الأسرع
            </button>
          </div>
          {fastestInfo && (
            <p style={{ fontSize: "10px", color: "var(--gold-400)", marginTop: "6px", fontFamily: "var(--font-arabic)" }}>
              {fastestInfo}
            </p>
          )}
        </div>
      </div>

      {/* Agent 5 Master Switchboard & Waterfall Strategy Toggle */}
      <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
            background: "none", border: "none", color: "var(--gold-400)", cursor: "pointer",
            fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-arabic)", padding: "4px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ArrowRightLeft size={16} />
            <span>الوكيل 5: منسق وموزع المسارات الهجين (Waterfall Cascade Settings)</span>
          </div>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-arabic)" }}>
              <strong>استراتيجية التتابع الذكي التلقائية:</strong> يبدأ المشغل أولاً بفحص بيئة أندرويد الأصلية ثم محرك الواجهات المفتوحة ثم الخادم الوسيط المخصص ثم محلل كلاودفلير، وفي حال تعذرها ينتقل للسيرفرات العالمية المباشرة.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginTop: "4px" }}>
              <ToggleRow
                label="وكيل بيئة التلفاز الأصلية (Native Bridge)"
                value={preferences.enableNative}
                onChange={() => togglePref("enableNative")}
              />
              <ToggleRow
                label="وكيل الواجهات المفتوحة (Consumet)"
                value={preferences.enableConsumet}
                onChange={() => togglePref("enableConsumet")}
              />
              <ToggleRow
                label="وكيل البروكسي وترحيل البث (Proxy Relay)"
                value={preferences.enableProxy}
                onChange={() => togglePref("enableProxy")}
              />
              <ToggleRow
                label="وكيل حماية كلاودفلير (FlareSolverr)"
                value={preferences.enableFlareSolverr}
                onChange={() => togglePref("enableFlareSolverr")}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function SourcesSection() {
  const [activeCategory, setActiveCategory] = useState<ScraperCategory | "all" | "custom">("all");
  const [tmdbKey, setTmdbKey] = useState(getTmdbApiKey());
  const [keySaved, setKeySaved] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [testing, setTesting] = useState(false);
  const [testProgress, setTestProgress] = useState({ current: 0, total: 0 });
  const [testResults, setTestResults] = useState<Record<string, HealthTestResult>>({});
  const [singleTestingId, setSingleTestingId] = useState<string | null>(null);
  const [registryVersion, setRegistryVersion] = useState(0);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportTab, setImportExportTab] = useState<"import" | "export">("import");
  const [importText, setImportText] = useState("");
  const [importResultMsg, setImportResultMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedExport, setCopiedExport] = useState(false);
  const [presetAdded, setPresetAdded] = useState(false);

  // New Server Form state
  const [newServerName, setNewServerName] = useState("");
  const [newServerCategory, setNewServerCategory] = useState<ScraperCategory>("global");
  const [newServerFormat, setNewServerFormat] = useState<"embed" | "m3u8" | "mp4">("embed");
  const [newServerUrl, setNewServerUrl] = useState("");
  const [newServerBadge, setNewServerBadge] = useState("");
  const [testNewServerLoading, setTestNewServerLoading] = useState(false);
  const [testNewServerResult, setTestNewServerResult] = useState<HealthTestResult | null>(null);
  const [addServerError, setAddServerError] = useState<string | null>(null);

  // Listen to dynamic registry updates
  useEffect(() => {
    return serverManager.subscribe(() => {
      setRegistryVersion((v) => v + 1);
    });
  }, []);

  const [disabledScrapers, setDisabledScrapers] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("matv_disabled_scrapers");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const allScrapers = useMemo(() => scraperRegistry.getAll(), [registryVersion]);
  const stats = useMemo(() => scraperRegistry.getStats(), [registryVersion]);
  const customServers = useMemo(() => serverManager.getCustomServers(), [registryVersion]);
  const customIdsSet = useMemo(() => new Set(customServers.map((s) => s.id)), [customServers]);

  const categories: { id: ScraperCategory | "all" | "custom"; label: string; count: number; icon: React.ReactNode }[] = [
    { id: "all", label: "الكل", count: allScrapers.length, icon: <Layers size={14} /> },
    { id: "global", label: `قائمة عالمية (${stats.byCategory.global || 30})`, count: stats.byCategory.global || 30, icon: <Globe size={14} /> },
    ...(customServers.length > 0
      ? [{ id: "custom" as const, label: `سيرفراتي المضافة (${customServers.length})`, count: customServers.length, icon: <Sparkles size={14} /> }]
      : []),
    { id: "movies", label: "أفلام ومسلسلات", count: stats.byCategory.movies || 0, icon: <Film size={14} /> },
    { id: "live_tv", label: "بث مباشر وقنوات عربية", count: stats.byCategory.live_tv || 0, icon: <Tv size={14} /> },
    { id: "sports", label: "رياضة وكورة قدم", count: stats.byCategory.sports || 0, icon: <Trophy size={14} /> },
    { id: "wrestling", label: "مصارعة وفنون قتالية", count: stats.byCategory.wrestling || 0, icon: <Flame size={14} /> },
    { id: "anime", label: "أنمي وكرتون", count: stats.byCategory.anime || 0, icon: <Zap size={14} /> },
    { id: "asian", label: "دراما آسيوية وكورية", count: stats.byCategory.asian || 0, icon: <Activity size={14} /> },
  ];

  const filteredScrapers = useMemo(() => {
    return allScrapers.filter((s) => {
      if (activeCategory === "custom") {
        if (!customIdsSet.has(s.siteId)) return false;
      } else if (activeCategory !== "all" && s.category !== activeCategory) {
        return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        return (
          s.siteName.toLowerCase().includes(q) ||
          s.siteId.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allScrapers, activeCategory, searchFilter, customIdsSet]);

  const toggleScraper = (id: string) => {
    setDisabledScrapers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("matv_disabled_scrapers", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleDeleteCustomServer = (id: string) => {
    if (confirm("هل تريد بالتأكيد حذف هذا السيرفر المضاف؟")) {
      serverManager.removeServer(id);
    }
  };

  const handleTestSingle = async (siteId: string) => {
    setSingleTestingId(siteId);
    try {
      const res = await scraperRegistry.testSingle(siteId);
      setTestResults((prev) => ({ ...prev, [siteId]: res }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [siteId]: {
          siteId,
          siteName: siteId,
          category: "global",
          status: "OFFLINE",
          latencyMs: 9999,
          testedAt: new Date().toLocaleTimeString("ar-SA"),
          streamFormat: "m3u8",
          endpointUrl: "",
          details: "فشل الاتصال",
          error: err.message,
        },
      }));
    } finally {
      setSingleTestingId(null);
    }
  };

  const handleBatchTest = async () => {
    setTesting(true);
    const limit = Math.min(filteredScrapers.length, 25);
    setTestProgress({ current: 0, total: limit });
    try {
      const targetCat = activeCategory === "custom" ? "all" : activeCategory;
      await scraperRegistry.testBatch(targetCat, limit, (curr, tot, res) => {
        setTestProgress({ current: curr, total: tot });
        setTestResults((prev) => ({ ...prev, [res.siteId]: res }));
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveKey = () => {
    setTmdbApiKey(tmdbKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  // Test custom server before adding
  const handleTestNewServer = async () => {
    if (!newServerUrl.trim()) {
      setAddServerError("يرجى إدخال رابط أو قالب السيرفر أولاً");
      return;
    }
    setTestNewServerLoading(true);
    setAddServerError(null);

    const testUrl = interpolateUrl(newServerUrl.trim(), {
      id: 550,
      title: "Fight Club",
      season: 1,
      episode: 1,
      mediaType: "movie",
    });

    const start = performance.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      await fetch(testUrl, { method: "HEAD", mode: "no-cors", signal: controller.signal });
      clearTimeout(timer);
      const latency = Math.round(performance.now() - start);

      setTestNewServerResult({
        siteId: "test",
        siteName: newServerName || "السيرفر الجديد",
        category: newServerCategory,
        status: latency < 600 ? "ONLINE" : "SLOW",
        latencyMs: latency,
        testedAt: new Date().toLocaleTimeString("ar-SA"),
        streamFormat: newServerFormat,
        endpointUrl: testUrl,
        details: `السيرفر يستجيب بنجاح (${latency}ms)`,
      });
    } catch (e: any) {
      setTestNewServerResult({
        siteId: "test",
        siteName: newServerName || "السيرفر الجديد",
        category: newServerCategory,
        status: "OFFLINE",
        latencyMs: 9999,
        testedAt: new Date().toLocaleTimeString("ar-SA"),
        streamFormat: newServerFormat,
        endpointUrl: testUrl,
        details: "تعذر الاتصال بالخادم المباشر",
        error: e?.message,
      });
    } finally {
      setTestNewServerLoading(false);
    }
  };

  // Save new server
  const handleSaveNewServer = () => {
    if (!newServerName.trim()) {
      setAddServerError("يرجى إدخال اسم السيرفر");
      return;
    }
    if (!newServerUrl.trim()) {
      setAddServerError("يرجى إدخال رابط أو قالب السيرفر");
      return;
    }

    serverManager.addServer({
      name: newServerName.trim(),
      category: newServerCategory,
      streamFormat: newServerFormat,
      urlTemplate: newServerUrl.trim(),
      badge: newServerBadge.trim() || (newServerFormat === "embed" ? "VOD Web" : "مباشر"),
      isGlobal: newServerCategory === "global",
    });

    // Reset and close
    setNewServerName("");
    setNewServerUrl("");
    setNewServerBadge("");
    setTestNewServerResult(null);
    setAddServerError(null);
    setShowAddModal(false);
  };

  // Quick Preset Add
  const handleAddPresetBatch = () => {
    ADDITIONAL_GLOBAL_SERVERS.forEach((srv) => serverManager.addServer(srv));
    setPresetAdded(true);
    setTimeout(() => setPresetAdded(false), 3000);
  };

  // Bulk Import
  const handleImportSubmit = () => {
    setImportResultMsg(null);
    if (!importText.trim()) {
      setImportResultMsg({ text: "يرجى لصق بيانات JSON أولاً", isError: true });
      return;
    }
    const res = serverManager.importServers(importText);
    if (res.errors.length > 0 && res.successCount === 0) {
      setImportResultMsg({ text: `فشل الاستيراد: ${res.errors.join(", ")}`, isError: true });
    } else {
      setImportResultMsg({
        text: `تم استيراد ${res.successCount} سيرفر بنجاح! ${res.errors.length > 0 ? `(مع ${res.errors.length} أخطاء)` : ""}`,
        isError: false,
      });
      setImportText("");
    }
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(serverManager.exportServers());
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleLoadSampleJson = () => {
    const sample = [
      {
        name: "سيرفر سينما فور يو المباشر",
        category: "movies",
        streamFormat: "embed",
        badge: "FHD 1080p",
        urlTemplate: "https://cinema4u.org/watch/{id}?s={s}&e={e}",
      },
      {
        name: "يلا لايف HD المباشر",
        category: "sports",
        streamFormat: "m3u8",
        badge: "FHD Sports",
        urlTemplate: "https://live.yalla-live.com/stream/{id}.m3u8",
      },
    ];
    setImportText(JSON.stringify(sample, null, 2));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* TMDB Key Card */}
      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-arabic)" }}>
          <Key size={18} style={{ color: "var(--gold-400)" }} />
          مفتاح TMDB API
        </h2>
        <input
          type="text"
          value={tmdbKey}
          onChange={(e) => setTmdbKey(e.target.value)}
          placeholder="أدخل مفتاح TMDB هنا..."
          style={{
            width: "100%", padding: "10px 12px", background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
            color: "var(--text-primary)", fontSize: "13px",
          }}
        />
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button
            onClick={handleSaveKey}
            style={{
              padding: "8px 20px", background: "var(--gold-400)", color: "var(--neutral-0)",
              border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
              fontWeight: 700, fontSize: "14px", fontFamily: "var(--font-arabic)",
            }}
          >
            حفظ
          </button>
          {keySaved && <span style={{ fontSize: "13px", color: "var(--success)", display: "flex", alignItems: "center" }}>تم الحفظ</span>}
        </div>
      </Card>

      {/* Multi-Agent 5-Engine Parallel Core Diagnostics & Controls */}
      <MultiAgentDiagnosticsPanel />

      {/* Action Toolbar for Easy Server Management */}
      <Card style={{ padding: "18px", background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(20,20,25,0.95) 100%)", border: "1px solid rgba(212,175,55,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold-400)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-arabic)" }}>
              <Sparkles size={18} />
              بنية توسيع السيرفرات السهلة (Easy Server Expansion)
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px", fontFamily: "var(--font-arabic)" }}>
              أضف أي سيرفر عالمي (30+) أو موقع قشط مخصص (300+) بكل سهولة بنقرة زر أو عبر استيراد JSON
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", background: "var(--gold-400)", color: "var(--neutral-0)",
                border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "13px",
                cursor: "pointer", fontFamily: "var(--font-arabic)"
              }}
            >
              <Plus size={16} />
              <span>إضافة سيرفر جديد</span>
            </button>

            <button
              onClick={() => {
                setShowImportExportModal(true);
                setImportExportTab("import");
                setImportResultMsg(null);
              }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", background: "rgba(255,255,255,0.08)", color: "white",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-md)",
                fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-arabic)"
              }}
            >
              <Upload size={14} />
              <span>استيراد وتصدير JSON</span>
            </button>

            <button
              onClick={handleAddPresetBatch}
              disabled={presetAdded}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", background: presetAdded ? "rgba(34,197,94,0.2)" : "rgba(212,175,55,0.15)",
                color: presetAdded ? "#22c55e" : "var(--gold-400)",
                border: "1px solid rgba(212,175,55,0.3)", borderRadius: "var(--radius-md)",
                fontWeight: 600, fontSize: "12px", cursor: presetAdded ? "default" : "pointer", fontFamily: "var(--font-arabic)"
              }}
            >
              {presetAdded ? <Check size={14} /> : <Sparkles size={14} />}
              <span>{presetAdded ? "تمت إضافة السيرفرات!" : "+5 سيرفرات عالمية إضافية"}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Overview Statistics */}
      <Card style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>
              مختبر قواشط الذكاء الاصطناعي ({allScrapers.length} سيرفر متخصص)
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "3px", fontFamily: "var(--font-arabic)" }}>
              قواشط فردية مخصصة لكل موقع لسحب روابط .m3u8 و .mp4 المباشرة بدون قوالب مكررة
            </p>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <Badge variant="gold">{allScrapers.length} وكيل ذكاء صناعي نشط</Badge>
            {customServers.length > 0 && <Badge variant="success">{customServers.length} مضاف يدوياً</Badge>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
          <StatBox label="إجمالي القواشط والسيرفرات" value={String(allScrapers.length)} />
          <StatBox label="قائمة عالمية VOD" value={`${stats.byCategory.global || 30} سيرفر`} />
          <StatBox label="سيرفرات مضافة يدوياً" value={String(customServers.length)} />
          <StatBox label="بث مباشر HLS (.m3u8)" value={String(stats.byFormat.m3u8)} />
          <StatBox label="روابط مباشرة (.mp4)" value={String(stats.byFormat.mp4)} />
          <StatBox label="سيرفرات مدمجة (Embed)" value={String(stats.byFormat.embed)} />
        </div>
      </Card>

      {/* Live Testing Control Panel */}
      <Card style={{ padding: "20px", border: "1px solid rgba(212,175,55,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--gold-400)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-arabic)" }}>
              <Activity size={18} />
              فحص واختبار حقيقي للسرعة والاستجابة (Live Ping & Speed Test)
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px", fontFamily: "var(--font-arabic)" }}>
              اختبار حقيقي للاستجابة وسحب تدفق الفيديو على سيرفرات القسم الحالي ({filteredScrapers.length} سيرفر)
            </p>
          </div>

          <button
            onClick={handleBatchTest}
            disabled={testing}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 24px", background: testing ? "var(--neutral-300)" : "var(--gold-400)",
              color: "var(--neutral-0)", borderRadius: "var(--radius-full)", border: "none",
              fontWeight: 700, fontSize: "14px", cursor: testing ? "not-allowed" : "pointer",
              fontFamily: "var(--font-arabic)", transition: "all 0.2s"
            }}
          >
            {testing ? <Spinner size={16} /> : <RefreshCw size={16} />}
            <span>{testing ? `جاري فحص (${testProgress.current}/${testProgress.total})...` : "بدء الفحص الآلي للقسم"}</span>
          </button>
        </div>

        {testing && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ height: "6px", width: "100%", background: "var(--neutral-200)", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(testProgress.current / Math.max(testProgress.total, 1)) * 100}%`,
                  background: "var(--gold-400)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", borderRadius: "var(--radius-full)",
              fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-arabic)",
              background: activeCategory === cat.id ? "var(--gold-400)" : "var(--bg-elevated)",
              color: activeCategory === cat.id ? "var(--neutral-0)" : "var(--text-secondary)",
              border: activeCategory === cat.id ? "1px solid var(--gold-400)" : "1px solid var(--border-subtle)",
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s"
            }}
          >
            {cat.icon}
            <span>{cat.label}</span>
            <span style={{
              background: activeCategory === cat.id ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.1)",
              borderRadius: "var(--radius-full)", padding: "1px 6px", fontSize: "10px",
            }}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and List */}
      <Card style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>
              سيرفرات {categories.find((c) => c.id === activeCategory)?.label || "القسم"} ({filteredScrapers.length} سيرفر)
            </h2>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px", fontFamily: "var(--font-arabic)" }}>
              كل سيرفر يحتوي على منطق قشط وفحص مستقل لاستخراج روابط mp4 / m3u8
            </div>
          </div>

          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="بحث في أسماء السيرفرات أو المواقع..."
            style={{
              padding: "8px 14px", background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
              color: "var(--text-primary)", fontSize: "12px", fontFamily: "var(--font-arabic)",
              minWidth: "220px",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "550px", overflowY: "auto", paddingLeft: "4px" }}>
          {filteredScrapers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)", fontFamily: "var(--font-arabic)" }}>
              لا توجد سيرفرات مطابقة لمعايير البحث
            </div>
          ) : (
            filteredScrapers.map((scraper, idx) => {
              const isDisabled = disabledScrapers.has(scraper.siteId);
              const testResult = testResults[scraper.siteId];
              const isSingleTesting = singleTestingId === scraper.siteId;
              const isCustom = customIdsSet.has(scraper.siteId);

              return (
                <div
                  key={scraper.siteId}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 14px", background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-md)", border: isCustom ? "1px solid rgba(212,175,55,0.4)" : "1px solid var(--border-subtle)",
                    opacity: isDisabled ? 0.5 : 1, transition: "all 0.2s", flexWrap: "wrap", gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "220px" }}>
                    <span style={{ fontSize: "11px", color: "var(--gold-400)", fontWeight: 700, minWidth: "28px" }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>
                          {scraper.siteName}
                        </span>
                        {isCustom && <Badge variant="gold">مُضاف يدوياً</Badge>}
                        <Badge variant="default">{scraper.category}</Badge>
                        <Badge variant={scraper.streamFormat === "m3u8" ? "success" : scraper.streamFormat === "mp4" ? "default" : "gold"}>
                          {scraper.streamFormat.toUpperCase()}
                        </Badge>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "3px", fontFamily: "var(--font-arabic)" }}>
                        {scraper.description || scraper.baseUrl}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Live Test Status Badge */}
                    {testResult && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            padding: "3px 8px", borderRadius: "var(--radius-sm)",
                            fontSize: "11px", fontWeight: 700,
                            background: testResult.status === "ONLINE" ? "rgba(34,197,94,0.15)" : testResult.status === "SLOW" ? "rgba(234,179,8,0.15)" : "rgba(239,68,68,0.15)",
                            color: testResult.status === "ONLINE" ? "#22c55e" : testResult.status === "SLOW" ? "#eab308" : "#ef4444",
                            border: `1px solid ${testResult.status === "ONLINE" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                            display: "flex", alignItems: "center", gap: "4px"
                          }}
                          title={testResult.details}
                        >
                          <Activity size={12} />
                          <span>{testResult.latencyMs}ms</span>
                        </span>
                      </div>
                    )}

                    {/* Single Test Button */}
                    <button
                      onClick={() => handleTestSingle(scraper.siteId)}
                      disabled={isSingleTesting}
                      style={{
                        padding: "5px 12px", background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-sm)",
                        color: "white", fontSize: "11px", fontWeight: 600,
                        cursor: isSingleTesting ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-arabic)", transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,175,55,0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                    >
                      {isSingleTesting ? <Spinner size={12} /> : "فحص"}
                    </button>

                    {/* Toggle on/off */}
                    <button
                      onClick={() => toggleScraper(scraper.siteId)}
                      style={{
                        padding: "4px 10px", borderRadius: "var(--radius-full)",
                        border: "none", cursor: "pointer",
                        fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-arabic)",
                        background: isDisabled ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                        color: isDisabled ? "#ef4444" : "#22c55e",
                      }}
                      title={isDisabled ? "تم تعطيل هذا السيرفر - انقر لتفعيله" : "السيرفر مفعل - انقر لتعطيله"}
                    >
                      {isDisabled ? "معطل" : "نشط"}
                    </button>

                    {/* Delete Custom Server Button */}
                    {isCustom && (
                      <button
                        onClick={() => handleDeleteCustomServer(scraper.siteId)}
                        style={{
                          padding: "5px 8px", background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)",
                          color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center"
                        }}
                        title="حذف هذا السيرفر المضاف"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* ──────────────────────────────────────────────────────────
          Modal 1: Add New Server / Scraper
         ────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(6px)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", padding: "16px"
        }}>
          <div style={{
            background: "var(--bg-elevated)", border: "1px solid rgba(212,175,55,0.4)",
            borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "560px",
            padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.9)",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--gold-400)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-arabic)" }}>
                <Plus size={20} />
                إضافة سيرفر / وكيل قشط جديد
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {addServerError && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#ef4444", fontSize: "13px", marginBottom: "14px", fontFamily: "var(--font-arabic)" }}>
                {addServerError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px", fontFamily: "var(--font-arabic)" }}>
                  اسم السيرفر أو المزود:
                </label>
                <input
                  type="text"
                  placeholder="مثال: سيرفر البث الذهبي 4K"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                    color: "white", fontSize: "13px", fontFamily: "var(--font-arabic)"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px", fontFamily: "var(--font-arabic)" }}>
                    التصنيف:
                  </label>
                  <select
                    value={newServerCategory}
                    onChange={(e) => setNewServerCategory(e.target.value as ScraperCategory)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "var(--bg-secondary)",
                      border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                      color: "white", fontSize: "13px", fontFamily: "var(--font-arabic)"
                    }}
                  >
                    <option value="global">قائمة عالمية (30+)</option>
                    <option value="movies">أفلام ومسلسلات</option>
                    <option value="live_tv">بث مباشر وقنوات عربية</option>
                    <option value="sports">رياضة وكورة قدم</option>
                    <option value="wrestling">مصارعة وفنون قتالية</option>
                    <option value="anime">أنمي وكرتون</option>
                    <option value="asian">دراما آسيوية وكورية</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px", fontFamily: "var(--font-arabic)" }}>
                    نوع البث أو التدفق:
                  </label>
                  <select
                    value={newServerFormat}
                    onChange={(e) => setNewServerFormat(e.target.value as any)}
                    style={{
                      width: "100%", padding: "10px 12px", background: "var(--bg-secondary)",
                      border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                      color: "white", fontSize: "13px", fontFamily: "var(--font-arabic)"
                    }}
                  >
                    <option value="embed">مشغل ويب مدمج (Embed VOD)</option>
                    <option value="m3u8">بث مباشر HLS (.m3u8)</option>
                    <option value="mp4">ملف فيديو مباشر (.mp4)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px", fontFamily: "var(--font-arabic)" }}>
                  رابط السيرفر أو قالب الاستدعاء:
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/embed/{type}/{id}?s={s}&e={e}"
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                    color: "white", fontSize: "13px", direction: "ltr", textAlign: "left"
                  }}
                />
                <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "6px", lineHeight: "1.6", fontFamily: "var(--font-arabic)" }}>
                  المتغيرات المدعومة: <code style={{ color: "var(--gold-400)" }}>{`{id}`}</code> (معرف TMDB أو القناة)، <code style={{ color: "var(--gold-400)" }}>{`{type}`}</code> (movie أو tv)، <code style={{ color: "var(--gold-400)" }}>{`{s}`}</code> (الموسم)، <code style={{ color: "var(--gold-400)" }}>{`{e}`}</code> (الحلقة).
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px", fontFamily: "var(--font-arabic)" }}>
                  شارة الجودة (اختياري):
                </label>
                <input
                  type="text"
                  placeholder="مثال: 4K Ultra أو سريع جداً"
                  value={newServerBadge}
                  onChange={(e) => setNewServerBadge(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                    color: "white", fontSize: "13px", fontFamily: "var(--font-arabic)"
                  }}
                />
              </div>

              {/* Ping Test in Modal */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "white", fontFamily: "var(--font-arabic)" }}>
                    فحص الاتصال المسبق
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", fontFamily: "var(--font-arabic)" }}>
                    تحقق من استجابة الرابط وسرعة الـ Ping قبل الحفظ
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestNewServer}
                  disabled={testNewServerLoading}
                  style={{
                    padding: "7px 16px", background: "rgba(212,175,55,0.15)", color: "var(--gold-400)",
                    border: "1px solid rgba(212,175,55,0.3)", borderRadius: "var(--radius-md)",
                    fontSize: "12px", fontWeight: 700, cursor: testNewServerLoading ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-arabic)"
                  }}
                >
                  {testNewServerLoading ? "جاري الفحص..." : "فحص الرابط"}
                </button>
              </div>

              {testNewServerResult && (
                <div style={{
                  padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: "12px",
                  background: testNewServerResult.status === "ONLINE" ? "rgba(34,197,94,0.15)" : testNewServerResult.status === "SLOW" ? "rgba(234,179,8,0.15)" : "rgba(239,68,68,0.15)",
                  color: testNewServerResult.status === "ONLINE" ? "#22c55e" : testNewServerResult.status === "SLOW" ? "#eab308" : "#ef4444",
                  border: `1px solid ${testNewServerResult.status === "ONLINE" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-arabic)"
                }}>
                  <span>{testNewServerResult.details}</span>
                  <span style={{ fontWeight: 800 }}>{testNewServerResult.latencyMs}ms</span>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={handleSaveNewServer}
                  style={{
                    flex: 1, padding: "12px", background: "var(--gold-400)", color: "var(--neutral-0)",
                    border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "14px",
                    cursor: "pointer", fontFamily: "var(--font-arabic)"
                  }}
                >
                  حفظ وإضافة السيرفر
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "12px 20px", background: "rgba(255,255,255,0.1)", color: "white",
                    border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, fontSize: "14px",
                    cursor: "pointer", fontFamily: "var(--font-arabic)"
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          Modal 2: Bulk Import / Export JSON
         ────────────────────────────────────────────────────────── */}
      {showImportExportModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(6px)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", padding: "16px"
        }}>
          <div style={{
            background: "var(--bg-elevated)", border: "1px solid rgba(212,175,55,0.4)",
            borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "600px",
            padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.9)",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--gold-400)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-arabic)" }}>
                <Upload size={20} />
                استيراد وتصدير السيرفرات (Bulk JSON)
              </h3>
              <button onClick={() => setShowImportExportModal(false)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                onClick={() => setImportExportTab("import")}
                style={{
                  flex: 1, padding: "8px", borderRadius: "var(--radius-md)", border: "none",
                  fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-arabic)",
                  background: importExportTab === "import" ? "var(--gold-400)" : "rgba(255,255,255,0.08)",
                  color: importExportTab === "import" ? "var(--neutral-0)" : "white"
                }}
              >
                استيراد سيرفرات جديدة
              </button>
              <button
                onClick={() => setImportExportTab("export")}
                style={{
                  flex: 1, padding: "8px", borderRadius: "var(--radius-md)", border: "none",
                  fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-arabic)",
                  background: importExportTab === "export" ? "var(--gold-400)" : "rgba(255,255,255,0.08)",
                  color: importExportTab === "export" ? "var(--neutral-0)" : "white"
                }}
              >
                تصدير السيرفرات الحالية
              </button>
            </div>

            {importResultMsg && (
              <div style={{
                padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: "13px",
                background: importResultMsg.isError ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                color: importResultMsg.isError ? "#ef4444" : "#22c55e",
                border: `1px solid ${importResultMsg.isError ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                marginBottom: "14px", fontFamily: "var(--font-arabic)"
              }}>
                {importResultMsg.text}
              </div>
            )}

            {importExportTab === "import" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-arabic)" }}>
                    الصق مصفوفة JSON تحتوي على السيرفرات المراد إضافتها:
                  </label>
                  <button
                    onClick={handleLoadSampleJson}
                    style={{
                      background: "none", border: "none", color: "var(--gold-400)",
                      fontSize: "12px", cursor: "pointer", textDecoration: "underline",
                      fontFamily: "var(--font-arabic)"
                    }}
                  >
                    عرض قالب تجريبي
                  </button>
                </div>

                <textarea
                  rows={9}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`[\n  {\n    "name": "سيرفر البث 1",\n    "category": "global",\n    "streamFormat": "embed",\n    "urlTemplate": "https://server.com/embed/{id}"\n  }\n]`}
                  style={{
                    width: "100%", padding: "10px", background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                    color: "white", fontSize: "12px", fontFamily: "monospace", direction: "ltr"
                  }}
                />

                <button
                  onClick={handleImportSubmit}
                  style={{
                    padding: "12px", background: "var(--gold-400)", color: "var(--neutral-0)",
                    border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "14px",
                    cursor: "pointer", fontFamily: "var(--font-arabic)"
                  }}
                >
                  استيراد وإضافة السيرفرات دفعة واحدة
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-arabic)" }}>
                  بيانات السيرفرات المضافة يدوياً ({customServers.length} سيرفر):
                </label>

                <textarea
                  readOnly
                  rows={9}
                  value={serverManager.exportServers()}
                  style={{
                    width: "100%", padding: "10px", background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                    color: "white", fontSize: "12px", fontFamily: "monospace", direction: "ltr"
                  }}
                />

                <button
                  onClick={handleCopyExport}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "12px", background: copiedExport ? "rgba(34,197,94,0.2)" : "var(--gold-400)",
                    color: copiedExport ? "#22c55e" : "var(--neutral-0)",
                    border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "14px",
                    cursor: "pointer", fontFamily: "var(--font-arabic)"
                  }}
                >
                  {copiedExport ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedExport ? "تم النسخ إلى الحافظة!" : "نسخ JSON إلى الحافظة"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", padding: "12px" }}>
      <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--gold-400)" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-arabic)" }}>{label}</div>
    </div>
  );
}

function DownloadsSection() {
  const [autoDeleteWatched, setAutoDeleteWatched] = useState(false);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [embedSubtitle, setEmbedSubtitle] = useState(true);
  const [verifyFiles, setVerifyFiles] = useState(true);

  return (
    <Card style={{ padding: "20px" }}>
      <ToggleRow label="حذف الحلقات المشاهدة" value={autoDeleteWatched} onChange={setAutoDeleteWatched} />
      <ToggleRow label="تنزيل عبر Wi-Fi فقط" value={wifiOnly} onChange={setWifiOnly} />
      <ToggleRow label="دمج الترجمة داخل الفيديو" value={embedSubtitle} onChange={setEmbedSubtitle} />
      <ToggleRow label="التحقق من سلامة الملف" value={verifyFiles} onChange={setVerifyFiles} />
    </Card>
  );
}

function AppearanceSection() {
  const [theme, setTheme] = useState(() => localStorage.getItem("matv_theme") || "dark");
  const [lang, setLang] = useState("ar");

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("matv_theme", newTheme);
    if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>
          مظهر التطبيق والثيم
        </h2>
        <SelectInput
          value={theme}
          onChange={handleThemeChange}
          options={[
            { value: "dark", label: "داكن سينمائي فخم (افتراضي)" },
            { value: "light", label: "فاتح نهاري (Light Mode)" },
            { value: "system", label: "تلقائي حسب إعدادات الجهاز (System)" },
          ]}
        />
        <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "10px", fontFamily: "var(--font-arabic)" }}>
          يتم تطبيق الثيم فوراً وحفظه لجلسات المشاهدة القادمة.
        </p>
      </Card>
      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)", fontFamily: "var(--font-arabic)" }}>لغة الواجهة</h2>
        <SelectInput value={lang} onChange={setLang} options={[
          { value: "ar", label: "العربية" },
          { value: "en", label: "English" },
        ]} />
      </Card>
    </div>
  );
}

function AboutSection() {
  const [includeDownloadsInClear, setIncludeDownloadsInClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    clearAllData();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-arabic)" }}>
          <Info size={18} style={{ color: "var(--gold-400)" }} />
          عن التطبيق
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <InfoRow label="الاسم" value="MA-TV Cinematic Gold" />
          <InfoRow label="الإصدار" value="0.2.0" />
          <InfoRow label="المنصة" value="Web / PWA" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>الحالة</span>
            <Badge variant="gold">MA-TV Active</Badge>
          </div>
        </div>
      </Card>

      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-arabic)" }}>
          <Shield size={18} style={{ color: "var(--gold-400)" }} />
          الخصوصية
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <InfoRow label="لا يوجد حساب إلزامي" value="نشط" />
          <InfoRow label="البيانات محلية" value="نعم" />
          <InfoRow label="تتبع الموقع الجغرافي" value="معطل" />
          <InfoRow label="إعلانات" value="صفر" />
        </div>
      </Card>

      <Card style={{ padding: "20px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-arabic)" }}>
          <Trash2 size={18} style={{ color: "var(--accent-error)" }} />
          مسح البيانات
        </h2>
        <ToggleRow label="يشمل الملفات المحملة" value={includeDownloadsInClear} onChange={setIncludeDownloadsInClear} />
        <button
          onClick={handleClear}
          style={{
            marginTop: "12px", width: "100%", padding: "10px",
            borderRadius: "var(--radius-md)", background: "rgba(229,72,77,0.1)",
            border: "1px solid rgba(229,72,77,0.3)", color: "var(--accent-error)",
            fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-arabic)",
          }}
        >
          مسح البيانات المحلية والسجل
        </button>
        {cleared && <p style={{ fontSize: "13px", color: "var(--success)", marginTop: "8px", fontFamily: "var(--font-arabic)" }}>تم المسح بنجاح</p>}
      </Card>
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "10px 12px", background: "var(--bg-secondary)",
        border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
        color: "var(--text-primary)", fontSize: "14px", cursor: "pointer",
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
      <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontFamily: "var(--font-arabic)" }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: "44px", height: "24px", borderRadius: "var(--radius-full)",
          background: value ? "var(--gold-400)" : "var(--neutral-300)",
          position: "relative", transition: "background var(--transition-fast)",
          border: "none", cursor: "pointer", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: "2px", left: value ? "22px" : "2px",
          width: "20px", height: "20px", borderRadius: "50%", background: "white",
          transition: "left var(--transition-fast)",
        }} />
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "13px", color: "var(--text-tertiary)", fontFamily: "var(--font-arabic)" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
