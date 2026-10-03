import type { ScraperAgent, ScraperCategory, HealthTestResult } from "./ScraperAgent";
import type { EmbedServer } from "../../lib/embedSources";

export interface SimpleServerConfig {
  id?: string;
  name: string;
  category: ScraperCategory;
  urlTemplate: string;
  streamFormat?: "embed" | "m3u8" | "mp4";
  badge?: string;
  isGlobal?: boolean;
  requiresReferer?: boolean;
  refererUrl?: string;
  createdAt?: string;
  isUserAdded?: boolean;
}

const STORAGE_KEY = "matv_custom_servers_v1";

/**
 * Interpolates template variables in URL string:
 * {id} or {tmdbId} -> tmdb id
 * {type} -> "movie" | "tv"
 * {mediaType} -> "movie" | "series"
 * {season} or {s} -> season number
 * {episode} or {e} -> episode number
 * {title} or {query} -> url encoded title
 * {year} -> release year
 */
export function interpolateUrl(
  template: string,
  data: {
    id?: number | string;
    mediaType?: "movie" | "series" | "tv";
    season?: number;
    episode?: number;
    title?: string;
    year?: number;
  }
): string {
  const idStr = String(data.id ?? 550);
  const typeStr = data.mediaType === "series" ? "tv" : (data.mediaType || "movie");
  const mediaTypeStr = data.mediaType === "tv" ? "series" : (data.mediaType || "movie");
  const seasonStr = String(data.season ?? 1);
  const episodeStr = String(data.episode ?? 1);
  const titleStr = encodeURIComponent(data.title || "sample");
  const yearStr = String(data.year || new Date().getFullYear());

  return template
    .replace(/{id}/gi, idStr)
    .replace(/{tmdbId}/gi, idStr)
    .replace(/{type}/gi, typeStr)
    .replace(/{mediaType}/gi, mediaTypeStr)
    .replace(/{season}/gi, seasonStr)
    .replace(/{s}/gi, seasonStr)
    .replace(/{episode}/gi, episodeStr)
    .replace(/{e}/gi, episodeStr)
    .replace(/{title}/gi, titleStr)
    .replace(/{query}/gi, titleStr)
    .replace(/{year}/gi, yearStr);
}

/**
 * Builds a full ScraperAgent from a simple config definition
 */
export function createScraperFromConfig(config: SimpleServerConfig): ScraperAgent {
  const siteId = config.id || `custom-${config.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;
  const streamFormat = config.streamFormat || (config.isGlobal || config.category === "global" ? "embed" : "m3u8");
  const baseUrl = config.urlTemplate.startsWith("http") ? new URL(config.urlTemplate.replace(/{.*}/g, "1")).origin : "https://embed.tv";

  const categoryLabels: Record<ScraperCategory, string> = {
    global: "قائمة عالمية",
    movies: "أفلام ومسلسلات",
    live_tv: "بث مباشر وقنوات",
    sports: "رياضة وكورة قدم",
    wrestling: "مصارعة وفنون قتالية",
    anime: "أنمي وكرتون",
    asian: "دراما آسيوية",
  };

  return {
    siteId,
    siteName: config.name,
    category: config.category,
    categoryLabel: categoryLabels[config.category] || "سيرفر مخصص",
    baseUrl,
    streamFormat,
    description: config.badge ? `${config.badge} - رابط مباشر` : (config.isUserAdded ? "سيرفر مُضاف يدوياً" : "سيرفر مخصص"),
    customExtractionPattern: {
      target: streamFormat === "embed" ? "iframe" : (streamFormat === "mp4" ? "mp4" : "m3u8"),
      selectorOrRegex: "custom-stream",
      requiresReferer: config.requiresReferer || false,
      streamResolverUrl: (query, season, episode) => {
        return interpolateUrl(config.urlTemplate, {
          id: query,
          title: query,
          season,
          episode,
          mediaType: season ? "series" : "movie",
        });
      },
    },
    extractStream: async (query, season, episode) => {
      const resolvedUrl = interpolateUrl(config.urlTemplate, {
        id: query,
        title: query,
        season,
        episode,
        mediaType: season ? "series" : "movie",
      });
      return [
        {
          url: resolvedUrl,
          quality: "1080p",
          format: streamFormat,
          serverName: config.name,
          audioLanguage: config.category === "movies" || config.category === "live_tv" ? "ar" : "original",
          isLive: config.category === "live_tv" || config.category === "sports",
        },
      ];
    },
    testHealth: async (sampleQuery = "550"): Promise<HealthTestResult> => {
      const start = performance.now();
      const testUrl = interpolateUrl(config.urlTemplate, {
        id: sampleQuery,
        title: "test",
        season: 1,
        episode: 1,
      });

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);

        await fetch(testUrl, {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
          headers: config.requiresReferer ? { Referer: config.refererUrl || baseUrl } : undefined,
        });

        clearTimeout(timer);
        const latency = Math.round(performance.now() - start);

        return {
          siteId,
          siteName: config.name,
          category: config.category,
          status: latency < 600 ? "ONLINE" : "SLOW",
          latencyMs: latency,
          testedAt: new Date().toLocaleTimeString("ar-SA"),
          streamFormat,
          endpointUrl: testUrl,
          details: `استجابة حقيقية (${latency}ms) - جاهز للتشغيل`,
        };
      } catch (err: any) {
        return {
          siteId,
          siteName: config.name,
          category: config.category,
          status: "OFFLINE",
          latencyMs: 9999,
          testedAt: new Date().toLocaleTimeString("ar-SA"),
          streamFormat,
          endpointUrl: testUrl,
          details: "تعذر الاتصال بالخادم المباشر",
          error: err?.message,
        };
      }
    },
  };
}

/**
 * Builds an EmbedServer for the media player from a simple config definition
 */
export function createEmbedServerFromConfig(config: SimpleServerConfig): EmbedServer {
  const id = config.id || `custom-${config.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  const embedCat = config.category === "anime" ? "anime" : config.category === "asian" ? "asian" : config.category === "sports" ? "sports" : "global";

  return {
    id,
    name: config.name,
    category: embedCat,
    badge: config.badge || (config.isUserAdded ? "مُضاف يدوياً" : "سيرفر مخصص"),
    buildUrl: (tmdbId, mediaType, season, episode, title, year) => {
      return interpolateUrl(config.urlTemplate, {
        id: tmdbId,
        mediaType,
        season,
        episode,
        title,
        year,
      });
    },
  };
}

/**
 * ServerManager Class for dynamic addition, deletion, persistence and bulk import/export
 */
class ServerManager {
  private customServers: SimpleServerConfig[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.customServers = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Failed to load custom servers from storage", e);
      this.customServers = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customServers));
      this.notifyListeners();
    } catch (e) {
      console.error("Failed to save custom servers to storage", e);
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Get all registered custom servers
   */
  getCustomServers(): SimpleServerConfig[] {
    return this.customServers;
  }

  /**
   * Add a new server easily (1-click from UI or code)
   */
  addServer(config: SimpleServerConfig): SimpleServerConfig {
    const id = config.id || `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newServer: SimpleServerConfig = {
      ...config,
      id,
      createdAt: new Date().toISOString(),
      isUserAdded: true,
      badge: config.badge || "مُضاف يدوياً",
    };

    // Replace if exists, or append
    const existingIndex = this.customServers.findIndex((s) => s.id === id);
    if (existingIndex >= 0) {
      this.customServers[existingIndex] = newServer;
    } else {
      this.customServers.push(newServer);
    }

    this.saveToStorage();
    return newServer;
  }

  /**
   * Remove a custom server by ID
   */
  removeServer(id: string): boolean {
    const prevLen = this.customServers.length;
    this.customServers = this.customServers.filter((s) => s.id !== id);
    if (this.customServers.length !== prevLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Bulk import servers from JSON string
   */
  importServers(jsonStr: string): { successCount: number; errors: string[] } {
    const errors: string[] = [];
    let successCount = 0;

    try {
      const parsed = JSON.parse(jsonStr);
      const list = Array.isArray(parsed) ? parsed : [parsed];

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item.name || !item.urlTemplate) {
          errors.push(`العنصر #${i + 1} يفتقد إلى الاسم أو قالب الرابط`);
          continue;
        }

        this.addServer({
          name: String(item.name).trim(),
          category: item.category || "global",
          urlTemplate: String(item.urlTemplate).trim(),
          streamFormat: item.streamFormat || "embed",
          badge: item.badge || "مستورد",
          isGlobal: item.isGlobal ?? (item.category === "global"),
          requiresReferer: !!item.requiresReferer,
          refererUrl: item.refererUrl,
        });
        successCount++;
      }
    } catch (e: any) {
      errors.push(`صيغة JSON غير صالحة: ${e?.message || e}`);
    }

    return { successCount, errors };
  }

  /**
   * Export all custom servers to JSON string
   */
  exportServers(): string {
    return JSON.stringify(this.customServers, null, 2);
  }

  /**
   * Convert all custom servers to ScraperAgent instances
   */
  getCustomScraperAgents(): ScraperAgent[] {
    return this.customServers.map((s) => createScraperFromConfig(s));
  }

  /**
   * Convert all global custom servers to EmbedServer instances
   */
  getCustomEmbedServers(): EmbedServer[] {
    return this.customServers
      .filter((s) => s.isGlobal || s.category === "global" || s.streamFormat === "embed")
      .map((s) => createEmbedServerFromConfig(s));
  }
}

export const serverManager = new ServerManager();
