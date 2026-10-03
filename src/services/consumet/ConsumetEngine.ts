import type { ExtractedStream } from "../../engines/scrapers/ScraperAgent";
import type {
  ConsumetProvider,
  ConsumetProviderMeta,
  ConsumetSearchItem,
  ConsumetSearchResult,
  ConsumetEpisode,
  ConsumetMediaInfo,
  ConsumetStreamResponse,
  ConsumetServer,
  ConsumetHealthResult,
  ConsumetEngineConfig,
} from "./types";

/**
 * Default public Consumet API instances with proven availability
 */
export const DEFAULT_CONSUMET_INSTANCES: string[] = [
  "https://api.consumet.org",
  "https://consumet-api.up.railway.app",
  "https://consumet.beebank.dev",
  "https://consumet.moe",
];

export const CONSUMET_STORAGE_KEY = "matv_consumet_url";

/**
 * Provider metadata list with categorization and defaults
 */
export const CONSUMET_PROVIDERS: ConsumetProviderMeta[] = [
  {
    id: "gogoanime",
    name: "GogoAnime (AniTaku)",
    category: "anime",
    categoryLabel: "أنمي وكرتون",
    defaultAudioLang: "ja",
    description: "أكبر مكتبة أنمي مع روابط HLS .m3u8 مباشرة وجودات متعددة من 360p إلى 1080p",
    supportsServers: true,
  },
  {
    id: "zoro",
    name: "Zoro / HiAnime",
    category: "anime",
    categoryLabel: "أنمي وكرتون",
    defaultAudioLang: "ja",
    description: "تدفقات Ultra HD HLS مدبلجة ومترجمة مع مسارات ترجمة VTT كاملة",
    supportsServers: true,
  },
  {
    id: "dramacool",
    name: "DramaCool",
    category: "asian",
    categoryLabel: "دراما آسيوية وكورية",
    defaultAudioLang: "ko",
    description: "بث مباشر لمسلسلات الدراما الكورية واليابانية مع سيرفرات متعددة وترجمة فورية",
    supportsServers: true,
  },
  {
    id: "viewasian",
    name: "ViewAsian",
    category: "asian",
    categoryLabel: "دراما آسيوية وكورية",
    defaultAudioLang: "ko",
    description: "مستودع دراما شرق آسيا بمسارات تدفق m3u8 سريعة",
    supportsServers: true,
  },
  {
    id: "flixhq",
    name: "FlixHQ",
    category: "movies",
    categoryLabel: "أفلام ومسلسلات غربية",
    defaultAudioLang: "en",
    description: "أفلام هوليوود ومسلسلات المنصات العالمية بجودة Full HD مع ترجمات متعددة",
    supportsServers: true,
  },
  {
    id: "superstream",
    name: "SuperStream",
    category: "movies",
    categoryLabel: "أفلام ومسلسلات غربية",
    defaultAudioLang: "en",
    description: "سيرفرات تدفق مباشر عالية السرعة للمحتوى السينمائي والتلفزيوني",
    supportsServers: true,
  },
];

export class ConsumetEngine {
  private activeUrl: string;
  private fallbackUrls: string[];
  private timeoutMs: number;
  private preferredSubLanguage: string;

  constructor(config?: ConsumetEngineConfig) {
    const savedUrl = typeof localStorage !== "undefined"
      ? localStorage.getItem(CONSUMET_STORAGE_KEY)
      : null;

    this.activeUrl = (config?.baseUrl || savedUrl || DEFAULT_CONSUMET_INSTANCES[0]).replace(/\/+$/, "");
    this.fallbackUrls = config?.fallbackUrls || DEFAULT_CONSUMET_INSTANCES;
    this.timeoutMs = config?.timeoutMs || 8000;
    this.preferredSubLanguage = config?.preferredSubLanguage || "ar";
  }

  /**
   * Get list of supported providers
   */
  public getAvailableProviders(): ConsumetProviderMeta[] {
    return CONSUMET_PROVIDERS;
  }

  /**
   * Get metadata for a specific provider
   */
  public getProviderMeta(provider: ConsumetProvider): ConsumetProviderMeta | undefined {
    return CONSUMET_PROVIDERS.find((p) => p.id === provider);
  }

  /**
   * Get currently configured active endpoint
   */
  public getActiveEndpoint(): string {
    return this.activeUrl;
  }

  /**
   * Change active endpoint and persist to local storage
   */
  public setActiveEndpoint(url: string): void {
    this.activeUrl = url.trim().replace(/\/+$/, "");
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(CONSUMET_STORAGE_KEY, this.activeUrl);
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Reset active endpoint to default
   */
  public resetToDefaultEndpoint(): void {
    this.setActiveEndpoint(DEFAULT_CONSUMET_INSTANCES[0]);
  }

  /**
   * Build candidate route paths for a given action and provider
   */
  private getCandidateRoutes(
    action: "search" | "info" | "watch" | "servers",
    provider: ConsumetProvider,
    params: { query?: string; id?: string; episodeId?: string; mediaId?: string; server?: string; page?: number }
  ): string[] {
    const { query, id, episodeId, mediaId, server, page = 1 } = params;
    const q = encodeURIComponent(query || "");
    const ep = encodeURIComponent(episodeId || "");
    const mid = mediaId ? encodeURIComponent(mediaId) : "";
    const srvParam = server ? `&server=${encodeURIComponent(server)}` : "";

    switch (provider) {
      case "gogoanime": {
        if (action === "search") return [`/anime/gogoanime/${q}?page=${page}`];
        if (action === "info") return [`/anime/gogoanime/info/${encodeURIComponent(id || "")}`];
        if (action === "watch") {
          const srv = server ? `?server=${encodeURIComponent(server)}` : "";
          return [`/anime/gogoanime/watch/${ep}${srv}`];
        }
        if (action === "servers") return [`/anime/gogoanime/servers/${ep}`];
        break;
      }

      case "zoro":
      case "hianime": {
        if (action === "search") {
          return [
            `/anime/zoro/${q}?page=${page}`,
            `/anime/hianime/${q}?page=${page}`,
          ];
        }
        if (action === "info") {
          const targetId = encodeURIComponent(id || "");
          return [
            `/anime/zoro/info?id=${targetId}`,
            `/anime/zoro/info/${targetId}`,
            `/anime/hianime/info?id=${targetId}`,
          ];
        }
        if (action === "watch") {
          return [
            `/anime/zoro/watch?episodeId=${ep}${srvParam}`,
            `/anime/hianime/watch?episodeId=${ep}${srvParam}`,
            `/anime/zoro/watch/${ep}${srvParam ? `?${srvParam.substring(1)}` : ""}`,
          ];
        }
        if (action === "servers") {
          return [
            `/anime/zoro/servers?episodeId=${ep}`,
            `/anime/hianime/servers?episodeId=${ep}`,
          ];
        }
        break;
      }

      case "dramacool": {
        if (action === "search") {
          return [
            `/movies/dramacool/${q}?page=${page}`,
            `/drama/dramacool/${q}?page=${page}`,
          ];
        }
        if (action === "info") {
          const targetId = encodeURIComponent(id || "");
          return [
            `/movies/dramacool/info?id=${targetId}`,
            `/drama/dramacool/info?id=${targetId}`,
          ];
        }
        if (action === "watch") {
          const midParam = mid ? `&mediaId=${mid}` : "";
          return [
            `/movies/dramacool/watch?episodeId=${ep}${midParam}${srvParam}`,
            `/drama/dramacool/watch?episodeId=${ep}${midParam}${srvParam}`,
          ];
        }
        if (action === "servers") {
          const midParam = mid ? `&mediaId=${mid}` : "";
          return [
            `/movies/dramacool/servers?episodeId=${ep}${midParam}`,
            `/drama/dramacool/servers?episodeId=${ep}${midParam}`,
          ];
        }
        break;
      }

      case "viewasian": {
        if (action === "search") {
          return [
            `/movies/viewasian/${q}?page=${page}`,
            `/drama/viewasian/${q}?page=${page}`,
          ];
        }
        if (action === "info") {
          const targetId = encodeURIComponent(id || "");
          return [
            `/movies/viewasian/info?id=${targetId}`,
            `/drama/viewasian/info?id=${targetId}`,
          ];
        }
        if (action === "watch") {
          const midParam = mid ? `&mediaId=${mid}` : "";
          return [
            `/movies/viewasian/watch?episodeId=${ep}${midParam}${srvParam}`,
            `/drama/viewasian/watch?episodeId=${ep}${midParam}${srvParam}`,
          ];
        }
        if (action === "servers") {
          return [`/movies/viewasian/servers?episodeId=${ep}`];
        }
        break;
      }

      case "flixhq": {
        if (action === "search") return [`/movies/flixhq/${q}?page=${page}`];
        if (action === "info") {
          const targetId = encodeURIComponent(id || "");
          return [
            `/movies/flixhq/info?id=${targetId}`,
            `/movies/flixhq/info/${targetId}`,
          ];
        }
        if (action === "watch") {
          const midParam = mid ? `&mediaId=${mid}` : "";
          return [
            `/movies/flixhq/watch?episodeId=${ep}${midParam}${srvParam}`,
            `/movies/flixhq/watch/${ep}${midParam ? `?mediaId=${mid}` : ""}`,
          ];
        }
        if (action === "servers") {
          const midParam = mid ? `&mediaId=${mid}` : "";
          return [`/movies/flixhq/servers?episodeId=${ep}${midParam}`];
        }
        break;
      }

      case "superstream": {
        if (action === "search") return [`/movies/superstream/${q}?page=${page}`];
        if (action === "info") {
          const targetId = encodeURIComponent(id || "");
          return [`/movies/superstream/info?id=${targetId}`];
        }
        if (action === "watch") {
          const midParam = mid ? `&mediaId=${mid}` : "";
          return [`/movies/superstream/watch?episodeId=${ep}${midParam}${srvParam}`];
        }
        if (action === "servers") {
          return [`/movies/superstream/servers?episodeId=${ep}`];
        }
        break;
      }
    }

    return [];
  }

  /**
   * Internal fetch executor with multi-endpoint & multi-route fallback
   */
  private async fetchWithFallback<T>(
    action: "search" | "info" | "watch" | "servers",
    provider: ConsumetProvider,
    params: { query?: string; id?: string; episodeId?: string; mediaId?: string; server?: string; page?: number }
  ): Promise<T> {
    const candidateEndpoints = Array.from(new Set([this.activeUrl, ...this.fallbackUrls]));
    const candidateRoutes = this.getCandidateRoutes(action, provider, params);

    if (candidateRoutes.length === 0) {
      throw new Error(`ConsumetEngine: Unsupported provider or action '${provider}/${action}'`);
    }

    let lastError: Error | null = null;

    // Try candidate endpoints
    for (const endpoint of candidateEndpoints) {
      // Try candidate route variations for the provider
      for (const route of candidateRoutes) {
        const fullUrl = `${endpoint.replace(/\/+$/, "")}${route.startsWith("/") ? "" : "/"}${route}`;

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.timeoutMs);

          const response = await fetch(fullUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          });

          clearTimeout(timer);

          if (!response.ok) {
            // 404 might just mean an alternative route or missing episode, continue fallback
            continue;
          }

          const data = await response.json();
          // If this endpoint responded successfully and wasn't our active one, remember it
          if (endpoint !== this.activeUrl) {
            this.activeUrl = endpoint;
          }

          return data as T;
        } catch (err: any) {
          lastError = err instanceof Error ? err : new Error(String(err));
          // Continue to next route/endpoint
        }
      }
    }

    throw lastError || new Error(`ConsumetEngine request failed for ${provider}/${action}`);
  }

  /**
   * 1. Search content across providers
   */
  public async search(
    query: string,
    provider: ConsumetProvider = "gogoanime",
    page = 1
  ): Promise<ConsumetSearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { currentPage: 1, hasNextPage: false, results: [] };
    }

    try {
      const response = await this.fetchWithFallback<any>("search", provider, {
        query: trimmed,
        page,
      });

      // Normalize search results
      const rawResults = Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response)
        ? response
        : [];

      const normalizedItems: ConsumetSearchItem[] = rawResults.map((item: any) => {
        let displayTitle = "";
        if (typeof item.title === "string") {
          displayTitle = item.title;
        } else if (item.title && typeof item.title === "object") {
          displayTitle =
            item.title.english ||
            item.title.userPreferred ||
            item.title.romaji ||
            item.title.native ||
            "";
        }

        return {
          id: String(item.id || item.url || ""),
          title: displayTitle || String(item.name || item.id || "Untitled"),
          url: item.url,
          image: item.image || item.cover,
          cover: item.cover || item.image,
          releaseDate: item.releaseDate || item.year,
          type: item.type,
          subOrDub: item.subOrDub,
          totalEpisodes: item.totalEpisodes || item.episodes?.length,
          seasons: item.seasons,
        };
      });

      return {
        currentPage: response?.currentPage || page,
        hasNextPage: Boolean(response?.hasNextPage),
        results: normalizedItems,
      };
    } catch (err: any) {
      console.warn(`ConsumetEngine search failed on ${provider}:`, err);
      return { currentPage: page, hasNextPage: false, results: [] };
    }
  }

  /**
   * 2. Retrieve detailed info and episodes for a media item
   */
  public async getMediaInfo(
    mediaId: string,
    provider: ConsumetProvider = "gogoanime"
  ): Promise<ConsumetMediaInfo> {
    const response = await this.fetchWithFallback<any>("info", provider, { id: mediaId });

    let displayTitle = "";
    if (typeof response?.title === "string") {
      displayTitle = response.title;
    } else if (response?.title && typeof response.title === "object") {
      displayTitle =
        response.title.english ||
        response.title.userPreferred ||
        response.title.romaji ||
        response.title.native ||
        "";
    }

    const rawEpisodes = Array.isArray(response?.episodes) ? response.episodes : [];
    const normalizedEpisodes: ConsumetEpisode[] = rawEpisodes.map((ep: any, index: number) => ({
      id: String(ep.id || index + 1),
      number: typeof ep.number === "number" ? ep.number : index + 1,
      title: ep.title || `Episode ${ep.number || index + 1}`,
      season: ep.season,
      url: ep.url,
      isFiller: Boolean(ep.isFiller),
    }));

    return {
      id: String(response?.id || mediaId),
      title: displayTitle || String(response?.name || mediaId),
      url: response?.url,
      genres: Array.isArray(response?.genres) ? response.genres : [],
      totalEpisodes: response?.totalEpisodes || normalizedEpisodes.length,
      image: response?.image || response?.cover,
      cover: response?.cover || response?.image,
      description: response?.description,
      type: response?.type,
      releaseDate: response?.releaseDate,
      status: response?.status,
      episodes: normalizedEpisodes,
    };
  }

  /**
   * 3. Fetch direct stream sources for an episode and transform into MA-TV ExtractedStream[]
   */
  public async getStreamSources(
    episodeId: string,
    provider: ConsumetProvider = "gogoanime",
    mediaId?: string,
    server?: string
  ): Promise<ExtractedStream[]> {
    try {
      const response = await this.fetchWithFallback<ConsumetStreamResponse>("watch", provider, {
        episodeId,
        mediaId,
        server,
      });

      return this.transformToExtractedStreams(response, provider);
    } catch (err: any) {
      console.warn(`ConsumetEngine getStreamSources failed for episode ${episodeId}:`, err);
      return [];
    }
  }

  /**
   * 4. Fetch available server options for an episode
   */
  public async getEpisodeServers(
    episodeId: string,
    provider: ConsumetProvider = "gogoanime",
    mediaId?: string
  ): Promise<ConsumetServer[]> {
    try {
      const response = await this.fetchWithFallback<any>("servers", provider, {
        episodeId,
        mediaId,
      });

      if (Array.isArray(response)) {
        return response.map((s: any) => ({
          name: String(s.name || s.serverName || "Server"),
          url: s.url,
        }));
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * 5. Transform raw Consumet watch response into MA-TV's ExtractedStream domain model
   */
  public transformToExtractedStreams(
    streamResponse: ConsumetStreamResponse,
    provider: ConsumetProvider
  ): ExtractedStream[] {
    if (!streamResponse || !Array.isArray(streamResponse.sources)) {
      return [];
    }

    const providerMeta = this.getProviderMeta(provider);
    const audioLang = providerMeta?.defaultAudioLang || "en";

    // Extract headers (e.g. Referer)
    const headers = streamResponse.headers || {};

    // Select the best subtitle track (favor Arabic if preferred, else English, else first)
    let bestSubtitleUrl: string | undefined = undefined;
    if (Array.isArray(streamResponse.subtitles) && streamResponse.subtitles.length > 0) {
      const arabicSub = streamResponse.subtitles.find(
        (s) => s.lang && /arabic|العربية|^ar$/i.test(s.lang)
      );
      const englishSub = streamResponse.subtitles.find(
        (s) => s.lang && /english|^en$/i.test(s.lang)
      );

      if (this.preferredSubLanguage === "ar" && arabicSub) {
        bestSubtitleUrl = arabicSub.url;
      } else if (englishSub) {
        bestSubtitleUrl = englishSub.url;
      } else {
        bestSubtitleUrl = streamResponse.subtitles[0].url;
      }
    }

    const extracted: ExtractedStream[] = [];

    for (const src of streamResponse.sources) {
      if (!src?.url) continue;

      const isM3U8 = src.isM3U8 || src.url.includes(".m3u8") || !src.url.includes(".mp4");
      const quality = src.quality || (isM3U8 ? "auto" : "1080p");
      const providerDisplayName = providerMeta?.name || provider.toUpperCase();

      extracted.push({
        url: src.url,
        format: isM3U8 ? "m3u8" : "mp4",
        quality: quality,
        isLive: false,
        serverName: `Consumet: ${providerDisplayName} (${quality})`,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        subtitlesUrl: bestSubtitleUrl,
        audioLanguage: audioLang,
      });
    }

    return extracted;
  }

  /**
   * 6. High-level resolver: searches, resolves episode metadata, and extracts direct streams
   */
  public async resolveEpisodeStream(
    query: string,
    season = 1,
    episode = 1,
    provider: ConsumetProvider = "gogoanime"
  ): Promise<ExtractedStream[]> {
    const searchRes = await this.search(query, provider);
    if (!searchRes.results.length) {
      return [];
    }

    // Pick top search result
    const media = searchRes.results[0];
    const info = await this.getMediaInfo(media.id, provider);

    if (!info.episodes.length) {
      return [];
    }

    // Match episode number or season
    let targetEp = info.episodes.find((ep) => {
      if (ep.season !== undefined && ep.season !== season) return false;
      return ep.number === episode;
    });

    if (!targetEp) {
      targetEp = info.episodes.find((ep) => ep.number === episode) || info.episodes[0];
    }

    return this.getStreamSources(targetEp.id, provider, media.id);
  }

  /**
   * 7. Health check method for testing latency to a Consumet server endpoint
   */
  public async testHealth(instanceUrl?: string): Promise<ConsumetHealthResult> {
    const targetUrl = (instanceUrl || this.activeUrl).replace(/\/+$/, "");
    const start = performance.now();
    const now = new Date().toLocaleTimeString("ar-SA");

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      // Consumet instances expose root GET '/' with JSON status or swagger docs
      const response = await fetch(`${targetUrl}/`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - start);
      const isOnline = response.ok || response.status === 200 || response.status === 304;

      return {
        endpoint: targetUrl,
        isOnline,
        latencyMs,
        status: latencyMs > 2000 ? "SLOW" : isOnline ? "ONLINE" : "OFFLINE",
        testedAt: now,
        details: isOnline
          ? `خادم Consumet نشط واستجاب خلال (${latencyMs}ms)`
          : `الخادم أعاد رمز استجابة (${response.status})`,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      const isTimeout = err?.name === "AbortError";

      return {
        endpoint: targetUrl,
        isOnline: false,
        latencyMs,
        status: "OFFLINE",
        testedAt: now,
        error: isTimeout ? "انتهت مهلة الاتصال بالخادم (Timeout)" : err?.message,
        details: isTimeout ? "تجاوز مهلة الرد المحددة (4000ms)" : "فشل الاتصال بالواجهة السحابية",
      };
    }
  }

  /**
   * 8. Run health check across all configured public instances in parallel
   */
  public async checkAllInstances(): Promise<ConsumetHealthResult[]> {
    const endpoints = Array.from(new Set([this.activeUrl, ...this.fallbackUrls]));
    return Promise.all(endpoints.map((url) => this.testHealth(url)));
  }

  /**
   * 9. Find fastest healthy instance and automatically switch to it
   */
  public async findFastestInstance(): Promise<string> {
    const results = await this.checkAllInstances();
    const onlineResults = results
      .filter((r) => r.isOnline)
      .sort((a, b) => a.latencyMs - b.latencyMs);

    if (onlineResults.length > 0) {
      const fastest = onlineResults[0].endpoint;
      this.setActiveEndpoint(fastest);
      return fastest;
    }

    return this.activeUrl;
  }
}

/**
 * Global singleton instance
 */
export const consumetEngine = new ConsumetEngine();
