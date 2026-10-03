import type { PlaybackSource, RankedSource, QuickPlayOptions, QualityTier } from "../../domain/playback/PlaybackSource";
import type { ProviderPerformanceProfile } from "./PerformanceProfile";

export interface QuickPlayRankingEngine {
  rank(
    sources: PlaybackSource[],
    options: QuickPlayOptions,
    performance: Map<string, ProviderPerformanceProfile>
  ): RankedSource[];
}

const QUALITY_ORDER: Record<QualityTier, number> = {
  "4K": 4,
  "1080p": 3,
  "720p": 2,
  "480p": 1,
  "360p": 0,
  unknown: 0,
};

function passesPreference(quality: QualityTier, options: QuickPlayOptions): boolean {
  switch (options.preference) {
    case "4k_only":
      return quality === "4K";
    case "4k_1080p":
      return quality === "4K" || quality === "1080p";
    case "1080p_only":
      return quality === "1080p";
    case "1080p_720p":
      return quality === "1080p" || quality === "720p";
    case "all":
      return true;
    case "auto":
      return true;
    default:
      return true;
  }
}

export function createQuickPlayRankingEngine(): QuickPlayRankingEngine {
  return {
    rank(sources, options, performance) {
      const filtered = sources.filter((s) =>
        passesPreference(s.quality, options)
      );

      const ranked = filtered.map((source): RankedSource => {
        const perf = performance.get(source.providerId);
        const qualityScore = QUALITY_ORDER[source.quality] * 25;
        const stabilityScore = perf ? perf.successRateEMA * 100 : 50;
        const latencyScore = perf
          ? Math.max(0, 100 - perf.startupLatencyEMA / 20)
          : 50;
        const bufferingScore = perf
          ? Math.max(0, 100 - perf.bufferingRateEMA * 10)
          : 80;
        const audioScore =
          options.preferredAudioLanguage &&
          source.audioLanguage === options.preferredAudioLanguage
            ? 100
            : 50;
        const subtitleScore = options.preferSubtitles && source.hasSubtitles ? 100 : 50;
        const qualityVerifiedScore =
          source.qualityConfidence === "TRACK_VERIFIED"
            ? 100
            : source.qualityConfidence === "MANIFEST_VERIFIED"
              ? 85
              : source.qualityConfidence === "PROVIDER_DECLARED"
                ? 60
                : 30;

        const score =
          qualityScore * 0.2 +
          qualityVerifiedScore * 0.2 +
          stabilityScore * 0.2 +
          latencyScore * 0.1 +
          bufferingScore * 0.1 +
          audioScore * 0.1 +
          subtitleScore * 0.1;

        return {
          source,
          rank: 0,
          score: Math.round(score),
          latencyMs: perf?.startupLatencyEMA,
          healthStatus: perf ? healthToStatus(perf) : "UNKNOWN",
          qualityVerified:
            source.qualityConfidence === "TRACK_VERIFIED" ||
            source.qualityConfidence === "MANIFEST_VERIFIED",
        };
      });

      ranked.sort((a, b) => b.score - a.score);
      ranked.forEach((r, i) => (r.rank = i + 1));
      return ranked;
    },
  };
}

function healthToStatus(perf: ProviderPerformanceProfile): string {
  if (perf.successRateEMA > 0.85) return "HEALTHY";
  if (perf.successRateEMA > 0.5) return "DEGRADED";
  return "UNHEALTHY";
}
