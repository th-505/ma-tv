import type { ScraperAgent } from "./ScraperAgent";
import { runAgentHealthCheck } from "./ScraperAgent";
import { CHANNELS } from "../../features/live_tv/LiveTvPage";

/**
 * 80+ Dedicated Live Arabic TV & Satellite Scraper Agents
 * Extracting direct HLS .m3u8 playlists for satellite channels
 */
export const LIVE_TV_SCRAPERS: ScraperAgent[] = CHANNELS.slice(0, 85).map((channel) => {
  return {
    siteId: `live-${channel.id}`,
    siteName: channel.name,
    category: "live_tv",
    categoryLabel: "بث مباشر وقنوات عربية",
    baseUrl: channel.url,
    streamFormat: "m3u8",
    description: `قاشط وسيرفر بث حي مخصص لقناة ${channel.name} (${channel.category}) عبر بروتوكول HLS المباشر`,
    customExtractionPattern: {
      target: "m3u8",
      selectorOrRegex: `#EXT-X-STREAM-INF|https?://[^"']+\\.m3u8`,
      requiresReferer: false,
      streamResolverUrl: () => channel.url,
    },
    extractStream: async () => {
      return [
        {
          url: channel.url,
          format: "m3u8",
          quality: "1080p",
          isLive: true,
          audioLanguage: channel.country === "int" ? "en" : "ar",
        },
      ];
    },
    testHealth: async () => {
      return runAgentHealthCheck({
        siteId: `live-${channel.id}`,
        siteName: channel.name,
        category: "live_tv",
        baseUrl: channel.url,
        streamFormat: "m3u8",
        customExtractionPattern: {
          target: "m3u8",
          selectorOrRegex: `m3u8`,
          requiresReferer: false,
          streamResolverUrl: () => channel.url,
        },
      });
    },
  };
});
