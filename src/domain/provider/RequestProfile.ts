export type RequestProfileType =
  | "discovery"
  | "metadata"
  | "playback"
  | "download";

export interface ProviderRequestProfile {
  profileType: RequestProfileType;
  headers: Record<string, string>;
  timeoutMs: number;
  retryLimit: number;
  redirectPolicy: "follow" | "manual" | "error";
  refererPolicy: "none" | "origin" | "custom";
  customReferer?: string;
  cachePolicy: "no-store" | "no-cache" | "max-age";
  cacheMaxAgeSec?: number;
}

export interface EffectiveRequestProfile extends ProviderRequestProfile {
  platformAdjusted: boolean;
  platformNotes?: string[];
}

export const DEFAULT_PROFILES: Record<RequestProfileType, ProviderRequestProfile> = {
  discovery: {
    profileType: "discovery",
    headers: {
      Accept: "application/json, text/html",
      "Accept-Language": "ar-SA, en-US;q=0.8",
    },
    timeoutMs: 15000,
    retryLimit: 2,
    redirectPolicy: "follow",
    refererPolicy: "none",
    cachePolicy: "max-age",
    cacheMaxAgeSec: 300,
  },
  metadata: {
    profileType: "metadata",
    headers: {
      Accept: "application/json",
      "Accept-Language": "ar-SA, en-US;q=0.8",
    },
    timeoutMs: 10000,
    retryLimit: 1,
    redirectPolicy: "follow",
    refererPolicy: "none",
    cachePolicy: "max-age",
    cacheMaxAgeSec: 86400,
  },
  playback: {
    profileType: "playback",
    headers: {
      Accept: "*/*",
    },
    timeoutMs: 30000,
    retryLimit: 1,
    redirectPolicy: "follow",
    refererPolicy: "origin",
    cachePolicy: "no-store",
  },
  download: {
    profileType: "download",
    headers: {
      Accept: "*/*",
    },
    timeoutMs: 60000,
    retryLimit: 3,
    redirectPolicy: "follow",
    refererPolicy: "origin",
    cachePolicy: "no-store",
  },
};
