import type { ContentIdentity } from "../domain/content/ContentIdentity";
import type { PlaybackSource } from "../domain/playback/PlaybackSource";
import type { DiscoveryResult } from "../engines/discovery/ProviderDiscoveryEngine";
import { getProviderAdapters } from "./providers";
import { createCandidateMatcher } from "../engines/mapping/CandidateMatcher";
import { classifyConfidence } from "../domain/provider/ProviderMapping";

export interface ResolvedSource {
  providerId: string;
  sources: PlaybackSource[];
  latencyMs: number;
  error?: string;
}

const matcher = createCandidateMatcher();

export async function discoverProviders(
  identity: ContentIdentity,
  onProgress?: (result: DiscoveryResult) => void,
  maxConcurrency = 20
): Promise<DiscoveryResult[]> {
  const allAdapters = Array.from(getProviderAdapters().values());

  const contentType = identity.mediaType === "series" ? "series" : "movie";
  const eligible = allAdapters.filter(
    (a) =>
      a.manifest.contentTypes.includes(contentType as any) ||
      a.manifest.contentTypes.includes("movie") ||
      a.manifest.contentTypes.includes("series")
  );

  const adapters = eligible.slice(0, maxConcurrency);
  const results: DiscoveryResult[] = [];

  const promises = adapters.map(async (adapter) => {
    const start = performance.now();
    try {
      const searchResult = await adapter.search(identity);
      const latencyMs = Math.round(performance.now() - start);

      if (searchResult.error || searchResult.candidates.length === 0) {
        const result: DiscoveryResult = {
          providerId: adapter.manifest.providerId,
          found: false,
          sources: [],
          error: searchResult.error,
          latencyMs,
        };
        results.push(result);
        onProgress?.(result);
        return;
      }

      const matches = matcher.match(identity, searchResult.candidates);
      const bestMatch = matches[0];

      if (!bestMatch || classifyConfidence(bestMatch.confidence) === "REJECT") {
        const result: DiscoveryResult = {
          providerId: adapter.manifest.providerId,
          found: false,
          sources: [],
          latencyMs,
        };
        results.push(result);
        onProgress?.(result);
        return;
      }

      const resolveResult = await adapter.resolve(identity, bestMatch.providerItemId);
      const totalLatency = Math.round(performance.now() - start);

      const result: DiscoveryResult = {
        providerId: adapter.manifest.providerId,
        found: resolveResult.sources.length > 0,
        sources: resolveResult.sources,
        error: resolveResult.error,
        latencyMs: totalLatency,
      };
      results.push(result);
      onProgress?.(result);
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      const result: DiscoveryResult = {
        providerId: adapter.manifest.providerId,
        found: false,
        sources: [],
        error: {
          category: "HTTP_ERROR",
          message: String(err),
          providerId: adapter.manifest.providerId,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
        latencyMs,
      };
      results.push(result);
      onProgress?.(result);
    }
  });

  await Promise.all(promises);
  return results;
}

export async function quickPlay(
  identity: ContentIdentity,
  options: import("../domain/playback/PlaybackSource").QuickPlayOptions,
  performance: Map<string, import("../engines/ranking/PerformanceProfile").ProviderPerformanceProfile>
): Promise<import("../domain/playback/PlaybackSource").RankedSource[]> {
  const discoveryResults = await discoverProviders(identity);
  const allSources: PlaybackSource[] = [];

  for (const result of discoveryResults) {
    allSources.push(...result.sources);
  }

  const { createQuickPlayRankingEngine } = await import("../engines/ranking/QuickPlayRanking");
  const engine = createQuickPlayRankingEngine();
  return engine.rank(allSources, options, performance);
}
