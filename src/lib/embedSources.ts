import type { ContentIdentity } from "../domain/content/ContentIdentity";
import type { PlaybackSource, RankedSource, QualityTier } from "../domain/playback/PlaybackSource";

export interface EmbedServer {
  id: string;
  name: string;
  category: "global" | "arabic" | "anime" | "asian" | "sports";
  badge: string;
  buildUrl: (tmdbId: number, mediaType: "movie" | "series", season?: number, episode?: number, title?: string, year?: number) => string;
}

/**
 * قائمة عالمية — 30 سيرفر عالمي متكامل
 * جميع السيرفرات مجهزة للعمل المباشر داخل المشغل المدمج
 */
export const EMBED_SERVERS: EmbedServer[] = [
  // --- السيرفرات الأساسية المعتمدة (1-10) ---
  {
    id: "vidsrc-su",
    name: "VidSrc SU (سيرفر 1)",
    category: "global",
    badge: "1080p Ultra",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidsrc.su/embed/movie/${id}`
        : `https://vidsrc.su/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "vidlink",
    name: "VidLink Pro (سيرفر 2)",
    category: "global",
    badge: "سريع جداً HLS",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidlink.pro/movie/${id}`
        : `https://vidlink.pro/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "vidsrc-to",
    name: "VidSrc TO (سيرفر 3)",
    category: "global",
    badge: "متعدد الجودات",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "2embed-cc",
    name: "2Embed CC (سيرفر 4)",
    category: "global",
    badge: "مستقر FHD",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://www.2embed.cc/embed/${id}`
        : `https://www.2embed.cc/embedtv/${id}&s=${s ?? 1}&e=${e ?? 1}`,
  },
  {
    id: "videasy",
    name: "Videasy Player (سيرفر 5)",
    category: "global",
    badge: "واجهة نظيفة",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://player.videasy.net/movie/${id}`
        : `https://player.videasy.net/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "autoembed-co",
    name: "AutoEmbed CO (سيرفر 6)",
    category: "global",
    badge: "1080p Auto",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://autoembed.co/movie/tmdb/${id}`
        : `https://autoembed.co/tv/tmdb/${id}-${s ?? 1}-${e ?? 1}`,
  },
  {
    id: "multiembed",
    name: "MultiEmbed (سيرفر 7)",
    category: "global",
    badge: "سيرفر رئيسي",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s ?? 1}&e=${e ?? 1}`,
  },
  {
    id: "nontongo",
    name: "NontonGo HD (سيرفر 8)",
    category: "global",
    badge: "مشغل سريع",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://www.nontongo.win/embed/movie/${id}`
        : `https://www.nontongo.win/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "vidsrc-me",
    name: "VidSrc ME (سيرفر 9)",
    category: "global",
    badge: "ترجمات متعددة",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidsrc.me/embed/movie?tmdb=${id}`
        : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s ?? 1}&episode=${e ?? 1}`,
  },
  {
    id: "smashystream",
    name: "SmashyStream (سيرفر 10)",
    category: "global",
    badge: "مشغل بديل",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://embed.smashystream.com/playere.php?tmdb=${id}`
        : `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s ?? 1}&episode=${e ?? 1}`,
  },

  // --- السيرفرات البديلة والمستقرة (11-20) ---
  {
    id: "vidsrc-io",
    name: "VidSrc IO (سيرفر 11)",
    category: "global",
    badge: "احتياطي نشط",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidsrc.io/embed/movie/${id}`
        : `https://vidsrc.io/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "vidsrc-pm",
    name: "VidSrc PM (سيرفر 12)",
    category: "global",
    badge: "سيرفر CDN",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidsrc.pm/embed/movie/${id}`
        : `https://vidsrc.pm/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "2embed-skin",
    name: "2Embed Skin (سيرفر 13)",
    category: "global",
    badge: "واجهة مخصصة",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://2embed.skin/embed/movie/${id}`
        : `https://2embed.skin/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "tugaflix",
    name: "TugaFlix (سيرفر 14)",
    category: "global",
    badge: "بث بديل",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://play2.tugaflix.com/embed/movie/${id}`
        : `https://play2.tugaflix.com/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "superembed",
    name: "SuperEmbed Direct (سيرفر 15)",
    category: "global",
    badge: "مباشر FHD",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`
        : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s ?? 1}&e=${e ?? 1}`,
  },
  {
    id: "filmku",
    name: "FilmKu Stream (سيرفر 16)",
    category: "global",
    badge: "سريع",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://filmku.stream/embed/${id}`
        : `https://filmku.stream/embed/${id}?s=${s ?? 1}&e=${e ?? 1}`,
  },
  {
    id: "embed-su",
    name: "Embed.su (سيرفر 17)",
    category: "global",
    badge: "Ultra Clean",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "vidsrc-cc",
    name: "VidSrc CC (سيرفر 18)",
    category: "global",
    badge: "1080p Stream",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${id}`
        : `https://vidsrc.cc/v2/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "vidsrc-xyz",
    name: "VidSrc XYZ (سيرفر 19)",
    category: "global",
    badge: "Backup Server",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidsrc.xyz/embed/movie/${id}`
        : `https://vidsrc.xyz/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "moviesapi",
    name: "MoviesAPI Club (سيرفر 20)",
    category: "global",
    badge: "سيرفر متعدد",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://moviesapi.club/movie/${id}`
        : `https://moviesapi.club/tv/${id}-${s ?? 1}-${e ?? 1}`,
  },

  // --- السيرفرات الإضافية المكملة لـ 30 (21-30) ---
  {
    id: "warezcdn",
    name: "WarezCDN Player (سيرفر 21)",
    category: "global",
    badge: "Multi Language",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://embed.warezcdn.com/filme/${id}`
        : `https://embed.warezcdn.com/serie/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "primewire",
    name: "PrimeWire Stream (سيرفر 22)",
    category: "global",
    badge: "FHD Direct",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://www.primewire.tf/embed/movie?imdb=${id}`
        : `https://www.primewire.tf/embed/tv?imdb=${id}&season=${s ?? 1}&episode=${e ?? 1}`,
  },
  {
    id: "autoembed-cc",
    name: "AutoEmbed CC (سيرفر 23)",
    category: "global",
    badge: "سريع",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://player.autoembed.cc/embed/movie/${id}`
        : `https://player.autoembed.cc/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "vidsrc-vip",
    name: "VidSrc VIP (سيرفر 24)",
    category: "global",
    badge: "VIP Stream",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidsrc.vip/embed/movie/${id}`
        : `https://vidsrc.vip/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "vidsrc-in",
    name: "VidSrc IN (سيرفر 25)",
    category: "global",
    badge: "سيرفر آسيا",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidsrc.in/embed/movie/${id}`
        : `https://vidsrc.in/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "vidsrc-net",
    name: "VidSrc NET (سيرفر 26)",
    category: "global",
    badge: "احتياطي شبكي",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidsrc.net/embed/movie/${id}`
        : `https://vidsrc.net/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "streamwish-embed",
    name: "StreamWish Global (سيرفر 27)",
    category: "global",
    badge: "CDN Fast",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://streamwish.to/e/${id}`
        : `https://streamwish.to/e/${id}_s${s ?? 1}_e${e ?? 1}`,
  },
  {
    id: "vidhide-embed",
    name: "VidHide Stream (سيرفر 28)",
    category: "global",
    badge: "Direct Play",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://vidhidepro.com/v/${id}`
        : `https://vidhidepro.com/v/${id}_s${s ?? 1}_e${e ?? 1}`,
  },
  {
    id: "streamtape-embed",
    name: "StreamTape Cloud (سيرفر 29)",
    category: "global",
    badge: "Cloud Stream",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://streamtape.com/e/${id}`
        : `https://streamtape.com/e/${id}_s${s ?? 1}_e${e ?? 1}`,
  },
  {
    id: "doodstream-embed",
    name: "DoodStream Video (سيرفر 30)",
    category: "global",
    badge: "سيرفر عالمي 30",
    buildUrl: (id, type, s, e) =>
      type === "movie"
        ? `https://dood.to/e/${id}`
        : `https://dood.to/e/${id}_s${s ?? 1}_e${e ?? 1}`,
  },
];

/**
 * بوابات المشاهدة الخارجية المباشرة
 */
export interface ExternalPortal {
  id: string;
  name: string;
  badge: string;
  buildSearchUrl: (title: string, year?: number) => string;
}

export const EXTERNAL_PORTALS: ExternalPortal[] = [
  {
    id: "akwam",
    name: "Akwam (أكوام)",
    badge: "عربي مدبلج ومترجم",
    buildSearchUrl: (title) => `https://akwam.to/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: "faselhd",
    name: "FaselHD (فاصل إعلاني)",
    badge: "سيرفرات مشاهدة وتحميل",
    buildSearchUrl: (title) => `https://www.faselhd.club/?s=${encodeURIComponent(title)}`,
  },
  {
    id: "wecima",
    name: "WeCima (ماي سيما)",
    badge: "جودة عالية 1080p",
    buildSearchUrl: (title) => `https://wecima.show/search/${encodeURIComponent(title)}`,
  },
  {
    id: "arabseed",
    name: "ArabSeed (عرب سيد)",
    badge: "تحميل ومشاهدة",
    buildSearchUrl: (title) => `https://arabseed.show/find/?find=${encodeURIComponent(title)}`,
  },
  {
    id: "cima4u",
    name: "Cima4U (سيما فور يو)",
    badge: "مترجم عربي",
    buildSearchUrl: (title) => `https://cima4u.skin/?s=${encodeURIComponent(title)}`,
  },
  {
    id: "egydead",
    name: "EgyDead (إيجي ديد)",
    badge: "مسلسلات ورعب",
    buildSearchUrl: (title) => `https://egydead.live/?s=${encodeURIComponent(title)}`,
  },
  {
    id: "hianime",
    name: "HiAnime (أنمي)",
    badge: "أنمي مترجم FHD",
    buildSearchUrl: (title) => `https://hianime.to/search?keyword=${encodeURIComponent(title)}`,
  },
  {
    id: "dramacool",
    name: "DramaCool (دراما آسيوية)",
    badge: "كوري وآسيوي",
    buildSearchUrl: (title) => `https://dramacool.ch/search?type=movies&keyword=${encodeURIComponent(title)}`,
  },
];

import { serverManager } from "../engines/scrapers/ServerManager";

/**
 * Returns all active Embed servers (30 built-in + all custom registered servers)
 */
export function getAllEmbedServers(): EmbedServer[] {
  const custom = serverManager.getCustomEmbedServers();
  return [...EMBED_SERVERS, ...custom];
}

export function getEmbedServerById(id: string): EmbedServer | undefined {
  return getAllEmbedServers().find((s) => s.id === id);
}

export function buildEmbedSources(
  identity: ContentIdentity,
  season?: number,
  episode?: number
): RankedSource[] {
  const mediaType = identity.mediaType === "series" ? "series" : "movie";
  const now = new Date().toISOString();
  const title = identity.canonical.title;
  const year = identity.canonical.releaseDate
    ? parseInt(identity.canonical.releaseDate.substring(0, 4))
    : undefined;

  const allServers = getAllEmbedServers();

  return allServers.map((server, idx) => {
    const isArabic = server.category === "arabic";
    const source: PlaybackSource = {
      providerId: server.id,
      sourceId: `${server.id}-${identity.tmdbId}`,
      url: server.buildUrl(identity.tmdbId, mediaType, season, episode, title, year),
      quality: "1080p" as QualityTier,
      audioLanguage: isArabic ? "ar" : "original",
      hasSubtitles: true,
      resolvedAt: now,
      qualityConfidence: idx < 5 ? "TRACK_VERIFIED" : "PROVIDER_DECLARED",
    };

    return {
      source,
      rank: idx + 1,
      score: Math.max(30, 100 - idx * 2),
      healthStatus: "READY",
      qualityVerified: idx < 5,
    };
  });
}

export function buildLiveSource(url: string, name: string): PlaybackSource {
  return {
    providerId: "live-hls",
    sourceId: `live-${name}`,
    url,
    quality: "1080p" as QualityTier,
    audioLanguage: "ar",
    hasSubtitles: false,
    resolvedAt: new Date().toISOString(),
    qualityConfidence: "TRACK_VERIFIED",
  };
}
