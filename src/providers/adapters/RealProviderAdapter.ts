import type { ProviderManifest } from "../../domain/provider/ProviderManifest";
import type { PlaybackSource, QualityTier } from "../../domain/playback/PlaybackSource";
import type { ContentIdentity } from "../../domain/content/ContentIdentity";
import type { ProviderError } from "../../domain/provider/ErrorTaxonomy";
import { getEmbedServerById, EXTERNAL_PORTALS } from "../../lib/embedSources";
import { CHANNELS } from "../../features/live_tv/LiveTvPage";
import { scraperRegistry } from "../../engines/scrapers/ScraperRegistry";
import { scrapeDirectVideoStream } from "../../engines/scrapers/DirectStreamScraper";

export interface ProviderAdapter {
  manifest: ProviderManifest;
  search(identity: ContentIdentity): Promise<SearchResult>;
  resolve(identity: ContentIdentity, providerItemId: string, season?: number, episode?: number): Promise<ResolveResult>;
}

export interface SearchResult {
  candidates: SearchResultCandidate[];
  error?: ProviderError;
  latencyMs: number;
}

export interface SearchResultCandidate {
  providerItemId: string;
  providerUrlKey?: string;
  title: string;
  year?: number;
  alternativeTitles?: string[];
  contentType?: string;
}

export interface ResolveResult {
  sources: PlaybackSource[];
  error?: ProviderError;
  latencyMs: number;
}

export class RealProviderAdapter implements ProviderAdapter {
  manifest: ProviderManifest;

  constructor(manifest: ProviderManifest) {
    this.manifest = manifest;
  }

  async search(identity: ContentIdentity): Promise<SearchResult> {
    const start = performance.now();
    const cleanTitle = identity.canonical.title.trim();
    const year = identity.canonical.releaseDate
      ? parseInt(identity.canonical.releaseDate.substring(0, 4))
      : undefined;

    // Check if provider supports this content type
    const mediaType = identity.mediaType === "series" ? "series" : "movie";
    const supportsType = this.manifest.contentTypes.includes(mediaType as any);

    if (!supportsType && !this.manifest.contentTypes.includes("live")) {
      return {
        candidates: [],
        latencyMs: Math.round(performance.now() - start),
      };
    }

    const candidate: SearchResultCandidate = {
      providerItemId: `${this.manifest.providerId}-${identity.tmdbId}`,
      providerUrlKey: cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: identity.canonical.title,
      year,
      alternativeTitles: identity.canonical.originalTitle
        ? [identity.canonical.originalTitle]
        : [],
      contentType: mediaType,
    };

    return {
      candidates: [candidate],
      latencyMs: Math.round(performance.now() - start),
    };
  }

  async resolve(
    identity: ContentIdentity,
    _providerItemId: string,
    season?: number,
    episode?: number
  ): Promise<ResolveResult> {
    const start = performance.now();
    const now = new Date().toISOString();
    const mediaType = identity.mediaType === "series" ? "series" : "movie";

    // 0. Check if this is one of our Dedicated AI Scrapers
    const dedicatedAgent = scraperRegistry.getById(this.manifest.providerId);
    if (dedicatedAgent) {
      try {
        const streams = await dedicatedAgent.extractStream(identity.canonical.title, season, episode);
        if (streams.length > 0) {
          const sources: PlaybackSource[] = streams.map((st, i) => ({
            providerId: this.manifest.providerId,
            sourceId: `${this.manifest.providerId}-${identity.tmdbId}-${i}`,
            url: st.url,
            quality: "1080p" as QualityTier,
            audioLanguage: st.audioLanguage || "ar",
            hasSubtitles: true,
            resolvedAt: now,
            qualityConfidence: "TRACK_VERIFIED",
          }));
          return {
            sources,
            latencyMs: Math.round(performance.now() - start),
          };
        }
      } catch {
        // Fallback
      }
    }

    // 1. Check if this is an Embed Server or Scraper Engine
    const embedServer = getEmbedServerById(this.manifest.providerId);
    if (embedServer) {
      const year = identity.canonical.releaseDate
        ? parseInt(identity.canonical.releaseDate.substring(0, 4))
        : undefined;

      const realUrl = embedServer.buildUrl(
        identity.tmdbId,
        mediaType,
        season,
        episode,
        identity.canonical.title,
        year
      );

      const source: PlaybackSource = {
        providerId: this.manifest.providerId,
        sourceId: `${this.manifest.providerId}-${identity.tmdbId}`,
        url: realUrl,
        quality: "1080p" as QualityTier,
        audioLanguage: embedServer.category === "arabic" ? "ar" : "original",
        hasSubtitles: true,
        resolvedAt: now,
        qualityConfidence: "TRACK_VERIFIED",
      };

      return {
        sources: [source],
        latencyMs: Math.round(performance.now() - start),
      };
    }

    // 2. Check if this is an External Portal (Akwam, FaselHD, WeCima, etc.)
    const portal = EXTERNAL_PORTALS.find((p) => p.id === this.manifest.providerId);
    if (portal) {
      const isM3u8 = portal.id === "faselhd" || portal.id === "arabseed" || portal.id === "egydead" || portal.id === "hianime" || portal.id === "dramacool";
      const format = isM3u8 ? "m3u8" : "mp4";
      const scraped = await scrapeDirectVideoStream({
        siteId: portal.id,
        siteName: portal.name,
        baseUrl: `https://${portal.id}.com`,
        title: identity.canonical.title,
        season,
        episode,
        defaultFormat: format,
        audioLanguage: portal.id === "hianime" ? "ja" : portal.id === "dramacool" ? "ko" : "ar",
      });

      const sources: PlaybackSource[] = scraped.map((st, i) => ({
        providerId: this.manifest.providerId,
        sourceId: `${this.manifest.providerId}-${identity.tmdbId}-${i}`,
        url: st.url,
        quality: "1080p" as QualityTier,
        audioLanguage: st.audioLanguage || "ar",
        hasSubtitles: true,
        resolvedAt: now,
        qualityConfidence: "TRACK_VERIFIED",
      }));

      return {
        sources,
        latencyMs: Math.round(performance.now() - start),
      };
    }

    // 3. Check if this is a Live Channel Provider
    if (this.manifest.providerId.startsWith("live-")) {
      const rawChId = this.manifest.providerId.replace("live-", "");
      const liveCh = CHANNELS.find((c) => c.id === rawChId);

      if (liveCh) {
        const source: PlaybackSource = {
          providerId: this.manifest.providerId,
          sourceId: `live-${liveCh.id}`,
          url: liveCh.url,
          quality: "1080p" as QualityTier,
          audioLanguage: liveCh.country === "int" ? "en" : "ar",
          hasSubtitles: false,
          resolvedAt: now,
          qualityConfidence: "TRACK_VERIFIED",
        };

        return {
          sources: [source],
          latencyMs: Math.round(performance.now() - start),
        };
      }
    }

    // 3. Fallback to MultiEmbed stream if recognized TMDB content
    if (identity.tmdbId > 0) {
      const source: PlaybackSource = {
        providerId: this.manifest.providerId,
        sourceId: `${this.manifest.providerId}-${identity.tmdbId}`,
        url: `https://multiembed.mov/?video_id=${identity.tmdbId}&tmdb=1`,
        quality: "1080p" as QualityTier,
        audioLanguage: "original",
        hasSubtitles: true,
        resolvedAt: now,
        qualityConfidence: "PROVIDER_DECLARED",
      };

      return {
        sources: [source],
        latencyMs: Math.round(performance.now() - start),
      };
    }

    return {
      sources: [],
      latencyMs: Math.round(performance.now() - start),
      error: {
        category: "PLAYBACK_FAILED",
        message: `لم يتم العثور على مصدر تشغيل صالح لمزود ${this.manifest.displayName}`,
        providerId: this.manifest.providerId,
        retryable: true,
        timestamp: now,
      },
    };
  }
}
