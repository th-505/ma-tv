export type SourceState =
  | "UNKNOWN"
  | "DISCOVERED"
  | "RESOLVING"
  | "PROBED"
  | "READY"
  | "FAILED"
  | "EXPIRED"
  | "UNSUPPORTED"
  | "RESTRICTED";

export type QualityConfidence =
  | "UNVERIFIED"
  | "PROVIDER_DECLARED"
  | "MANIFEST_VERIFIED"
  | "TRACK_VERIFIED";

export interface PlaybackSource {
  providerId: string;
  sourceId: string;
  url: string;
  quality: QualityTier;
  audioLanguage: string;
  hasSubtitles: boolean;
  resolvedAt: string;
  expiresAt?: string;
  qualityConfidence: QualityConfidence;
  manifestData?: ManifestData;
}

export type QualityTier = "4K" | "1080p" | "720p" | "480p" | "360p" | "unknown";

export interface ManifestData {
  bandwidth?: number;
  resolution?: string;
  codecs?: string[];
  variants?: ManifestVariant[];
}

export interface ManifestVariant {
  bandwidth: number;
  resolution: string;
  codecs: string;
  url: string;
}

export interface RankedSource {
  source: PlaybackSource;
  rank: number;
  score: number;
  latencyMs?: number;
  healthStatus: string;
  qualityVerified: boolean;
}

export type QuickPlayPreference = "auto" | "4k_only" | "4k_1080p" | "1080p_only" | "1080p_720p" | "all";

export interface QuickPlayOptions {
  preference: QuickPlayPreference;
  allowLowerQualityFallback: boolean;
  preferredAudioLanguage?: string;
  preferDubbed: boolean;
  preferSubtitles: boolean;
  subtitleLanguage?: string;
}

export const DEFAULT_QUICK_PLAY_OPTIONS: QuickPlayOptions = {
  preference: "auto",
  allowLowerQualityFallback: true,
  preferredAudioLanguage: "original",
  preferDubbed: false,
  preferSubtitles: true,
  subtitleLanguage: "ar",
};
