import type { ProviderManifest, ProviderCapability, ContentType } from "../../domain/provider/ProviderManifest";
import type { ContentIdentity } from "../../domain/content/ContentIdentity";
import type { PlaybackSource } from "../../domain/playback/PlaybackSource";
import type { ProviderError } from "../../domain/provider/ErrorTaxonomy";

export interface DiscoveryResult {
  providerId: string;
  found: boolean;
  sources: PlaybackSource[];
  error?: ProviderError;
  latencyMs: number;
}

export interface ProviderDiscoveryEngine {
  discover(
    identity: ContentIdentity,
    contentType: ContentType,
    providers: ProviderManifest[]
  ): Promise<DiscoveryResult[]>;
}

export interface DiscoveryOptions {
  capability: ProviderCapability;
  maxConcurrency: number;
  stopOnFirstReady: boolean;
}
