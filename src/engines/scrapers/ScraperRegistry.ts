import type { ScraperAgent, ScraperCategory, HealthTestResult } from "./ScraperAgent";
import { GLOBAL_SCRAPERS } from "./globalScrapers";
import { MOVIES_SCRAPERS } from "./moviesScrapers";
import { LIVE_TV_SCRAPERS } from "./liveTvScrapers";
import { SPORTS_SCRAPERS } from "./sportsScrapers";
import { WRESTLING_SCRAPERS } from "./wrestlingScrapers";
import { ANIME_ASIAN_SCRAPERS } from "./animeAsianScrapers";
import { serverManager, type SimpleServerConfig } from "./ServerManager";

/**
 * 300+ Dedicated AI Scraper Agents Base Registry
 * Categorized by Content Type
 */
export const BUILTIN_SCRAPERS: ScraperAgent[] = [
  ...GLOBAL_SCRAPERS,      // 30 Global Servers
  ...MOVIES_SCRAPERS,      // 75 Movie & Series Dedicated Scrapers
  ...LIVE_TV_SCRAPERS,     // 85 Live Arabic TV & Satellite Scrapers
  ...SPORTS_SCRAPERS,      // 65 Sports, Football & Match Scrapers
  ...WRESTLING_SCRAPERS,   // 30 Wrestling, WWE, UFC & Boxing Scrapers
  ...ANIME_ASIAN_SCRAPERS, // 50 Anime & Asian Drama Scrapers
];

// For backward compatibility
export const ALL_SCRAPERS: ScraperAgent[] = BUILTIN_SCRAPERS;

export class ScraperRegistryManager {
  private baseScrapers: ScraperAgent[];

  constructor() {
    this.baseScrapers = BUILTIN_SCRAPERS;
  }

  /**
   * Returns all active scrapers: 30+ global, 300+ builtin, plus any custom-added servers
   */
  getAll(): ScraperAgent[] {
    const customAgents = serverManager.getCustomScraperAgents();
    return [...this.baseScrapers, ...customAgents];
  }

  getByCategory(category: ScraperCategory | "all"): ScraperAgent[] {
    const all = this.getAll();
    if (category === "all") return all;
    return all.filter((s) => s.category === category);
  }

  getById(id: string): ScraperAgent | undefined {
    return this.getAll().find((s) => s.siteId === id);
  }

  /**
   * Helper to add a new server easily
   */
  addCustomServer(config: SimpleServerConfig) {
    return serverManager.addServer(config);
  }

  removeCustomServer(id: string) {
    return serverManager.removeServer(id);
  }

  getCustomServers(): SimpleServerConfig[] {
    return serverManager.getCustomServers();
  }

  getStats() {
    const list = this.getAll();
    const total = list.length;
    const byCategory: Record<string, number> = {
      global: 0,
      movies: 0,
      live_tv: 0,
      sports: 0,
      wrestling: 0,
      anime: 0,
      asian: 0,
    };
    const byFormat: Record<string, number> = {
      m3u8: 0,
      mp4: 0,
      embed: 0,
    };

    for (const s of list) {
      byCategory[s.category] = (byCategory[s.category] || 0) + 1;
      byFormat[s.streamFormat] = (byFormat[s.streamFormat] || 0) + 1;
    }

    const customCount = serverManager.getCustomServers().length;

    return {
      total,
      customCount,
      byCategory,
      byFormat,
    };
  }

  /**
   * Run a real live test on a specific scraper agent
   */
  async testSingle(siteId: string): Promise<HealthTestResult> {
    const scraper = this.getById(siteId);
    if (!scraper) {
      throw new Error(`Scraper with ID ${siteId} not found`);
    }
    return scraper.testHealth();
  }

  /**
   * Run batch health test across a category with progress callbacks
   */
  async testBatch(
    category: ScraperCategory | "all",
    limit = 20,
    onProgress?: (completed: number, total: number, latestResult: HealthTestResult) => void
  ): Promise<HealthTestResult[]> {
    const list = this.getByCategory(category).slice(0, limit);
    const results: HealthTestResult[] = [];

    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      try {
        const res = await s.testHealth();
        results.push(res);
        if (onProgress) {
          onProgress(i + 1, list.length, res);
        }
      } catch (err: any) {
        const fallbackRes: HealthTestResult = {
          siteId: s.siteId,
          siteName: s.siteName,
          category: s.category,
          status: "OFFLINE",
          latencyMs: 9999,
          testedAt: new Date().toLocaleTimeString("ar-SA"),
          streamFormat: s.streamFormat,
          endpointUrl: s.baseUrl,
          details: "فشل الاتصال بالخادم",
          error: err?.message,
        };
        results.push(fallbackRes);
        if (onProgress) {
          onProgress(i + 1, list.length, fallbackRes);
        }
      }
    }

    return results;
  }
}

export const scraperRegistry = new ScraperRegistryManager();
