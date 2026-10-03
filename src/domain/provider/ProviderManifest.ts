export type ProviderId = string;

export type ProviderCapability =
  | "search"
  | "details"
  | "playback"
  | "download"
  | "resumableDownload"
  | "live"
  | "subtitles"
  | "dubbed"
  | "multiAudio";

export type ContentType = "movie" | "series" | "episode" | "live";

export type PlatformSupport = "android" | "android_tv" | "ios" | "web";

export type MappingStrategy = "tmdbId" | "imdbId" | "titleSearch" | "urlKey";

export type HealthStatus = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNSUPPORTED";

export interface ProviderManifest {
  providerId: ProviderId;
  displayName: string;
  version: string;
  capabilities: ProviderCapability[];
  contentTypes: ContentType[];
  languages: string[];
  platformSupport: PlatformSupport[];
  mappingStrategies: MappingStrategy[];
  requestProfiles: string[];
  healthPolicy: HealthPolicy;
  provenance: ProviderProvenance;
}

export interface HealthPolicy {
  probeIntervalMs: number;
  cooldownMs: number;
  failureThreshold: number;
  successThreshold: number;
}

export interface ProviderProvenance {
  upstream: string;
  commitSha: string;
  license: string;
  integrationMode: "adapter" | "fork" | "vendored";
  destination: string;
  verifiedAt: string;
}

export interface CapabilityHealth {
  search: HealthStatus;
  mapping: HealthStatus;
  playback: HealthStatus;
  download: HealthStatus;
  live: HealthStatus;
}

export const RESERVED_PROVIDER_IDS = new Set<string>();

export function reserveProviderId(id: ProviderId): void {
  RESERVED_PROVIDER_IDS.add(id);
}
