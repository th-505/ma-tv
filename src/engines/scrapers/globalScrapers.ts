import type { ScraperAgent } from "./ScraperAgent";
import { runAgentHealthCheck } from "./ScraperAgent";
import { EMBED_SERVERS } from "../../lib/embedSources";

/**
 * 30 Global VOD Scraper Agents (قائمة عالمية — 30 سيرفر عالمي)
 */
export const GLOBAL_SCRAPERS: ScraperAgent[] = EMBED_SERVERS.map((server, idx) => {
  return {
    siteId: server.id,
    siteName: server.name,
    category: "global",
    categoryLabel: "قائمة عالمية",
    baseUrl: server.buildUrl(550, "movie").split("/embed")[0] || "https://vidsrc.su",
    streamFormat: "embed",
    description: `سيرفر عالمي مدمج #${idx + 1} (${server.badge}) لبث الأفلام والمسلسلات بجودة تصل إلى 1080p FHD`,
    customExtractionPattern: {
      target: "iframe",
      selectorOrRegex: `src=["'](https?://[^"']*(?:embed|v|player)[^"']*)["']`,
      requiresReferer: false,
      streamResolverUrl: (query, s, e) => {
        const id = parseInt(query) || 550;
        return server.buildUrl(id, s ? "series" : "movie", s, e);
      },
    },
    extractStream: async (query, s, e) => {
      const id = parseInt(query) || 550;
      const url = server.buildUrl(id, s ? "series" : "movie", s, e);
      return [
        {
          url,
          format: "embed",
          quality: "1080p",
          isLive: false,
          audioLanguage: "original",
        },
      ];
    },
    testHealth: async () => {
      return runAgentHealthCheck({
        siteId: server.id,
        siteName: server.name,
        category: "global",
        baseUrl: server.buildUrl(550, "movie"),
        streamFormat: "embed",
        customExtractionPattern: {
          target: "iframe",
          selectorOrRegex: "embed",
          requiresReferer: false,
          streamResolverUrl: () => server.buildUrl(550, "movie"),
        },
      });
    },
  };
});
