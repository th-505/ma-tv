import { serverManager, type SimpleServerConfig } from "../engines/scrapers/ServerManager";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  سهولة توسيع السيرفرات (Easy Server Expansion Architecture)
 * ═══════════════════════════════════════════════════════════════════════════
 *  لإضافة أي سيرفر عالمي إضافي (30+ أو 50+) أو أي موقع قشط مخصص (300+ أو 500+)
 *  كل ما عليك هو إضافة عنصر جديد لهذه المصفوفة، والنظام سيتولى الباقي تلقائياً:
 *  1. إنشاء وكيل ذكاء صناعي متكامل (ScraperAgent)
 *  2. ربطه بمحرك فحص الاستجابة والـ Ping المباشر
 *  3. إضافته لقائمة المشغل المدمج في الموقع
 *  4. إدراجه في تبويبات الإعدادات مع إمكانية التفعيل والتعطيل
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ADDITIONAL_GLOBAL_SERVERS: SimpleServerConfig[] = [
  {
    name: "VidSrc CC (سيرفر 31 - مرآة احتياطية)",
    category: "global",
    streamFormat: "embed",
    badge: "Fast CDN",
    urlTemplate: "https://vidsrc.cc/v2/embed/{type}/{id}?autoPlay=false",
    isGlobal: true,
  },
  {
    name: "EmbedSoap (سيرفر 32 - سيرفر سينمائي)",
    category: "global",
    streamFormat: "embed",
    badge: "1080p Web",
    urlTemplate: "https://embedsoap.org/embed/{type}/{id}",
    isGlobal: true,
  },
  {
    name: "RivStream (سيرفر 33 - بدون انقطاع)",
    category: "global",
    streamFormat: "embed",
    badge: "Ultra Low Latency",
    urlTemplate: "https://rivstream.com/embed?type={type}&id={id}&s={s}&e={e}",
    isGlobal: true,
  },
  {
    name: "StreamFlix (سيرفر 34 - سيرفر عالمي)",
    category: "global",
    streamFormat: "embed",
    badge: "Multi Audio",
    urlTemplate: "https://streamflix.one/embed/{type}/{id}/{s}/{e}",
    isGlobal: true,
  },
  {
    name: "NovaEmbed (سيرفر 35 - ألياف ضوئية)",
    category: "global",
    streamFormat: "embed",
    badge: "4K Ready",
    urlTemplate: "https://novaembed.cc/video/{id}?season={s}&episode={e}",
    isGlobal: true,
  },
];

/**
 * حزمة سيرفرات وقواشط إضافية متخصصة (رياضة، قنوات، سينما)
 */
export const ADDITIONAL_SPECIALIZED_SERVERS: SimpleServerConfig[] = [
  {
    name: "يلا شوت اكسترا (بث مباشر عالي الدقة)",
    category: "sports",
    streamFormat: "m3u8",
    badge: "FHD Live",
    urlTemplate: "https://live.yalla-shoot-extra.tv/hls/matches/{id}.m3u8",
  },
  {
    name: "الأسطورة لايف (سيرفر المباريات الكبرى)",
    category: "sports",
    streamFormat: "m3u8",
    badge: "Multi Bitrate",
    urlTemplate: "https://live.ostora.tv/stream/match-{id}/index.m3u8",
  },
  {
    name: "عرب سيد VIP (سيرفر مباشر للأفلام)",
    category: "movies",
    streamFormat: "mp4",
    badge: "عربي مباشر",
    urlTemplate: "https://vip.arabseed.tv/stream/{id}/master.mp4",
  },
  {
    name: "أنمي تيتان (سيرفر الأنمي السريع)",
    category: "anime",
    streamFormat: "m3u8",
    badge: "مترجم عالي",
    urlTemplate: "https://titan-anime.tv/embed/{id}/{e}",
  },
  {
    name: "سيرفر المصارعة المباشرة (WWE Live Pass)",
    category: "wrestling",
    streamFormat: "m3u8",
    badge: "WWE / AEW Live",
    urlTemplate: "https://live.fightpass-stream.tv/wwe/event-{id}/playlist.m3u8",
  },
];

/**
 * وظيفة تسجيل دفعة سيرفرات برمجياً بكل سهولة
 */
export function registerServerBatch(servers: SimpleServerConfig[]): void {
  servers.forEach((srv) => {
    serverManager.addServer(srv);
  });
}
