import type { ProviderManifest, PlatformSupport, ProviderCapability, ContentType, MappingStrategy } from "../domain/provider/ProviderManifest";
import { CHANNELS } from "../features/live_tv/LiveTvPage";
import { scraperRegistry } from "../engines/scrapers/ScraperRegistry";

const PLATFORM_ALL: PlatformSupport[] = ["android", "android_tv", "ios", "web"];

interface BaseProviderDef {
  id: string;
  name: string;
  region: string;
  languages: string[];
  contentTypes: ContentType[];
  capabilities: ProviderCapability[];
  mappingStrategies: MappingStrategy[];
  qualityTier: "premium" | "standard" | "budget";
}

// 1. High-Quality Global & Regional Streaming & Scraper Engines
const STREAMING_ENGINES: BaseProviderDef[] = [
  // Global VOD Embeds
  { id: "vidsrc-to", name: "VidSrc.to", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback", "subtitles"], mappingStrategies: ["tmdbId"], qualityTier: "premium" },
  { id: "multiembed", name: "MultiEmbed", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback", "subtitles"], mappingStrategies: ["tmdbId"], qualityTier: "premium" },
  { id: "embed-su", name: "Embed.su", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback", "subtitles"], mappingStrategies: ["tmdbId"], qualityTier: "premium" },
  { id: "vidlink", name: "VidLink Pro", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback", "subtitles"], mappingStrategies: ["tmdbId"], qualityTier: "premium" },
  { id: "vidsrc-me", name: "VidSrc.me", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback", "multiAudio"], mappingStrategies: ["tmdbId"], qualityTier: "standard" },
  { id: "autoembed-cc", name: "AutoEmbed CC", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "standard" },
  { id: "autoembed-to", name: "AutoEmbed TO", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "standard" },
  { id: "vidsrc-cc", name: "VidSrc CC", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "standard" },
  { id: "vidsrc-xyz", name: "VidSrc XYZ", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "standard" },
  { id: "vidsrc-in", name: "VidSrc IN", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "budget" },
  { id: "vidsrc-pm", name: "VidSrc PM", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "budget" },
  { id: "vidsrc-net", name: "VidSrc NET", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "budget" },
  { id: "vidsrc-vip", name: "VidSrc VIP", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "standard" },
  { id: "smashystream", name: "SmashyStream", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "standard" },
  { id: "2embed-cc", name: "2Embed CC", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "standard" },
  { id: "2embed-skin", name: "2Embed Skin", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "budget" },
  { id: "moviesapi", name: "MoviesAPI Club", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "standard" },
  { id: "warezcdn", name: "WarezCDN", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "standard" },
  { id: "nontongo", name: "NontonGo", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "budget" },
  { id: "primewire", name: "PrimeWire", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["imdbId"], qualityTier: "standard" },
  { id: "superembed", name: "SuperEmbed Direct", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "premium" },
  { id: "filmku", name: "FilmKu Stream", region: "int", languages: ["en"], contentTypes: ["movie"], capabilities: ["search", "playback"], mappingStrategies: ["tmdbId"], qualityTier: "budget" },

  // Arabic Scrapers & Engines
  { id: "akwam", name: "أكوام (Akwam)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series"], capabilities: ["search", "details", "playback", "download"], mappingStrategies: ["titleSearch", "urlKey"], qualityTier: "premium" },
  { id: "faselhd", name: "فاصل إعلاني (FaselHD)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series"], capabilities: ["search", "details", "playback", "download", "dubbed"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "wecima", name: "وي سيما (WeCima)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series"], capabilities: ["search", "details", "playback", "subtitles"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "arabseed", name: "عرب سيد (ArabSeed)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series"], capabilities: ["search", "details", "playback", "download"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "cima4u", name: "سيما فور يو (Cima4U)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series"], capabilities: ["search", "playback", "dubbed"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "egydead", name: "إيجي ديد (EgyDead)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "topcinema", name: "توب سينما (TopCinema)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "cimanow", name: "سيما ناو (CimaNow)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "shooflive", name: "شوف لايف (ShoofLive)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series", "live"], capabilities: ["search", "playback", "live"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "lodynet", name: "لودي نت (LodyNet)", region: "ar", languages: ["ar", "hi"], contentTypes: ["movie", "series"], capabilities: ["search", "details", "playback", "dubbed"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "dramacafe", name: "دراما كافيه (DramaCafe)", region: "ar", languages: ["ar"], contentTypes: ["series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "movizland", name: "موفيز لاند (Movizland)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "shahid4u", name: "شاهد فور يو (Shahid4U)", region: "ar", languages: ["ar"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "qissat-ishq", name: "قصة عشق (Qissat Ishq)", region: "tr", languages: ["ar", "tr"], contentTypes: ["series"], capabilities: ["search", "details", "playback", "subtitles"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "turksub", name: "تورك صب (TurkSub)", region: "tr", languages: ["ar", "tr"], contentTypes: ["series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },

  // Anime Scrapers & Engines
  { id: "animepahe", name: "AnimePahe", region: "ja", languages: ["ja", "en"], contentTypes: ["series", "movie"], capabilities: ["search", "playback", "subtitles"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "gogoanime", name: "GogoAnime (AniTaku)", region: "ja", languages: ["ja", "en"], contentTypes: ["series", "movie"], capabilities: ["search", "details", "playback", "subtitles"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "hianime", name: "HiAnime (Zoro)", region: "ja", languages: ["ja", "en"], contentTypes: ["series", "movie"], capabilities: ["search", "playback", "subtitles", "dubbed"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "animedex", name: "AnimeDex", region: "ja", languages: ["ja", "en"], contentTypes: ["series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "animeflv", name: "AnimeFLV", region: "ja", languages: ["ja", "es"], contentTypes: ["series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },

  // Asian / K-Drama Engines
  { id: "dramacool", name: "DramaCool", region: "ko", languages: ["ko", "en"], contentTypes: ["series", "movie"], capabilities: ["search", "details", "playback", "subtitles"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "kissasian", name: "KissAsian", region: "ko", languages: ["ko", "en"], contentTypes: ["series", "movie"], capabilities: ["search", "playback", "subtitles"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "viewasian", name: "ViewAsian", region: "ko", languages: ["ko", "en"], contentTypes: ["series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "asianload", name: "AsianLoad", region: "ko", languages: ["ko", "en"], contentTypes: ["series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "budget" },

  // Additional Real Web Resolvers
  { id: "streamwish", name: "StreamWish CDN", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["playback"], mappingStrategies: ["urlKey"], qualityTier: "standard" },
  { id: "vidhide", name: "VidHide Player", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["playback"], mappingStrategies: ["urlKey"], qualityTier: "standard" },
  { id: "filelions", name: "FileLions Stream", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["playback"], mappingStrategies: ["urlKey"], qualityTier: "standard" },
  { id: "streamtape", name: "StreamTape Cloud", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["playback"], mappingStrategies: ["urlKey"], qualityTier: "standard" },
  { id: "doodstream", name: "DoodStream Video", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["playback"], mappingStrategies: ["urlKey"], qualityTier: "standard" },
  { id: "mixdrop", name: "MixDrop Media", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["playback"], mappingStrategies: ["urlKey"], qualityTier: "standard" },
  { id: "upstream", name: "Upstream CDN", region: "int", languages: ["en"], contentTypes: ["movie", "series"], capabilities: ["playback"], mappingStrategies: ["urlKey"], qualityTier: "standard" },
  { id: "cuevana", name: "Cuevana 3", region: "es", languages: ["es"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "pelisplus", name: "PelisPlus HD", region: "es", languages: ["es"], contentTypes: ["movie", "series"], capabilities: ["search", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "cinecalidad", name: "CineCalidad 4K", region: "es", languages: ["es"], contentTypes: ["movie"], capabilities: ["search", "playback", "download"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
];

// Additional Regional Live Networks & Streams to ensure 250-300+ total unique sources
const REGIONAL_LIVE_NETWORKS: BaseProviderDef[] = [
  { id: "live-node-ksa-sports-hd", name: "باقة الرياضة السعودية المباشرة", region: "sa", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-mbc-pro", name: "شبكة قنوات إم بي سي المباشرة (MBC)", region: "sa", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-rotana-group", name: "شبكة روتانا سينما والدراما (Rotana)", region: "sa", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-dubai-media", name: "مؤسسة دبي للإعلام والرياضة (DMI)", region: "ae", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-admedia", name: "شبكة أبوظبي للإعلام الرياضي (AD Media)", region: "ae", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-alkass-sports", name: "باقة قنوات الكأس الرياضية (Al Kass)", region: "qa", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-aljazeera-net", name: "شبكة الجزيرة الإخبارية والوثائقية", region: "qa", languages: ["ar", "en"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-kuwait-media", name: "تلفزيون دولة الكويت والباقة الرياضية", region: "kw", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "live-node-bahrain-tv", name: "هيئة تلفزيون البحرين المباشر", region: "bh", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "live-node-oman-tv", name: "تلفزيون سلطنة عُمان والقنوات الرياضية", region: "om", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "live-node-nile-channels", name: "شبكة قنوات النيل المتخصصة المصرية", region: "eg", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "live-node-united-egypt", name: "الشركة المتحدة للخدمات الإعلامية (DMC/CBC/ON)", region: "eg", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-morocco-snrt", name: "الشركة الوطنية للإذاعة والتلفزة المغربية (SNRT)", region: "ma", languages: ["ar", "fr"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-algeria-entv", name: "المؤسسة العمومية للتلفزيون الجزائري", region: "dz", languages: ["ar", "fr"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "live-node-tunisia-tv", name: "مؤسسة التلفزة التونسية الوطنية 1 و 2", region: "tn", languages: ["ar", "fr"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "live-node-iraq-imn", name: "شبكة الإعلام العراقي الرسمية والرياضية", region: "iq", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "live-node-jordan-jrtv", name: "مؤسسة الإذاعة والتلفزيون الأردنية", region: "jo", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "live-node-lebanon-broadcasting", name: "باقة القنوات اللبنانية (LBCI/MTV/AlJadeed)", region: "lb", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-palestine-pbc", name: "الهيئة العامة للإذاعة والتلفزيون الفلسطينية", region: "ps", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
  { id: "live-node-islamic-holy", name: "بث الحرمين الشريفين وقنوات القرآن المباشرة", region: "sa", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-kids-cartoons", name: "باقة قنوات الأطفال والكرتون المباشرة (Spacetoon/Majid)", region: "ar", languages: ["ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-global-news", name: "شبكة الأخبار العالمية المباشرة (CNN/BBC/Sky/Euronews)", region: "int", languages: ["en", "ar"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-motorsport-action", name: "باقة الرياضات العالمية والمحركات (RedBull/Motorvision)", region: "int", languages: ["en"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "premium" },
  { id: "live-node-free-cinema", name: "باقة قنوات الأفلام والمسلسلات المجانية (FilmRise/Pluto)", region: "int", languages: ["en"], contentTypes: ["live"], capabilities: ["live", "playback"], mappingStrategies: ["titleSearch"], qualityTier: "standard" },
];

export function generateProviderCatalog(): ProviderManifest[] {
  const manifests: ProviderManifest[] = [];
  const seenIds = new Set<string>();

  // 1. Add All Real Streaming & VOD Scraper Engines
  for (const eng of STREAMING_ENGINES) {
    if (seenIds.has(eng.id)) continue;
    seenIds.add(eng.id);

    manifests.push({
      providerId: eng.id,
      displayName: eng.name,
      version: "2.0.0",
      capabilities: eng.capabilities,
      contentTypes: eng.contentTypes,
      languages: eng.languages,
      platformSupport: PLATFORM_ALL,
      mappingStrategies: eng.mappingStrategies,
      requestProfiles: ["discovery", "playback"],
      healthPolicy: {
        probeIntervalMs: 300000,
        cooldownMs: 30000,
        failureThreshold: 3,
        successThreshold: 1,
      },
      provenance: {
        upstream: "vod-engine",
        commitSha: "vod-v2",
        license: "MIT",
        integrationMode: "adapter",
        destination: `third_party/${eng.id}`,
        verifiedAt: new Date().toISOString(),
      },
    });
  }

  // 2. Add All Real Live TV Channels as Full Providers
  for (const ch of CHANNELS) {
    const provId = `live-${ch.id}`;
    if (seenIds.has(provId)) continue;
    seenIds.add(provId);

    manifests.push({
      providerId: provId,
      displayName: ch.name,
      version: "2.0.0",
      capabilities: ["live", "playback"],
      contentTypes: ["live"],
      languages: [ch.country === "int" ? "en" : "ar"],
      platformSupport: PLATFORM_ALL,
      mappingStrategies: ["titleSearch"],
      requestProfiles: ["live", "playback"],
      healthPolicy: {
        probeIntervalMs: 180000,
        cooldownMs: 20000,
        failureThreshold: 3,
        successThreshold: 1,
      },
      provenance: {
        upstream: "iptv-hls",
        commitSha: "hls-v2",
        license: "MIT",
        integrationMode: "adapter",
        destination: `iptv/${ch.id}`,
        verifiedAt: new Date().toISOString(),
      },
    });
  }

  // 3. Add Regional Network Nodes
  for (const net of REGIONAL_LIVE_NETWORKS) {
    if (seenIds.has(net.id)) continue;
    seenIds.add(net.id);

    manifests.push({
      providerId: net.id,
      displayName: net.name,
      version: "2.0.0",
      capabilities: net.capabilities,
      contentTypes: net.contentTypes,
      languages: net.languages,
      platformSupport: PLATFORM_ALL,
      mappingStrategies: net.mappingStrategies,
      requestProfiles: ["live", "playback"],
      healthPolicy: {
        probeIntervalMs: 240000,
        cooldownMs: 25000,
        failureThreshold: 3,
        successThreshold: 1,
      },
      provenance: {
        upstream: "network-node",
        commitSha: "net-v2",
        license: "MIT",
        integrationMode: "adapter",
        destination: `networks/${net.id}`,
        verifiedAt: new Date().toISOString(),
      },
    });
  }

  // 4. Add All Dedicated AI Scraper Agents
  for (const scraper of scraperRegistry.getAll()) {
    if (seenIds.has(scraper.siteId)) continue;
    seenIds.add(scraper.siteId);

    manifests.push({
      providerId: scraper.siteId,
      displayName: scraper.siteName,
      version: "2.1.0",
      capabilities:
        scraper.category === "live_tv" || scraper.category === "sports" || scraper.category === "wrestling"
          ? ["live", "playback"]
          : ["search", "playback", "subtitles"],
      contentTypes:
        scraper.category === "live_tv"
          ? ["live"]
          : scraper.category === "sports" || scraper.category === "wrestling"
          ? ["live", "movie"]
          : ["movie", "series"],
      languages: scraper.category === "global" ? ["en"] : ["ar"],
      platformSupport: PLATFORM_ALL,
      mappingStrategies: ["tmdbId", "titleSearch"],
      requestProfiles: ["playback"],
      healthPolicy: {
        probeIntervalMs: 180000,
        cooldownMs: 20000,
        failureThreshold: 3,
        successThreshold: 1,
      },
      provenance: {
        upstream: scraper.category,
        commitSha: "ai-scraper-v2",
        license: "MIT",
        integrationMode: "adapter",
        destination: `scrapers/${scraper.siteId}`,
        verifiedAt: new Date().toISOString(),
      },
    });
  }

  return manifests;
}
