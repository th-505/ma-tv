export interface ProviderMapping {
  providerId: string;
  tmdbId: number;
  imdbId?: string;
  contentType: string;
  providerItemId: string;
  providerUrlKey?: string;
  matchedTitle: string;
  matchedYear?: number;
  confidence: number;
  method: "tmdbId" | "imdbId" | "titleSearch" | "urlKey";
  verifiedAt: string;
  expiresAt: string;
}

export interface NegativeMapping {
  providerId: string;
  tmdbId: number;
  contentType: string;
  reason: "noResult" | "lowConfidence" | "restricted" | "unsupported";
  recordedAt: string;
  expiresAt: string;
}

export interface MappingCacheEntry {
  mapping: ProviderMapping | null;
  negative: NegativeMapping | null;
  stale: boolean;
}

export type ConfidenceLevel = "AUTO" | "SUGGESTED" | "REJECT";

export function classifyConfidence(score: number): ConfidenceLevel {
  if (score >= 85) return "AUTO";
  if (score >= 60) return "SUGGESTED";
  return "REJECT";
}

export interface MatchFactors {
  originalTitle?: string;
  arabicTitle?: string;
  alternativeTitles?: string[];
  year?: number;
  mediaType?: string;
  season?: number;
  episode?: number;
  imdbId?: string;
}

export interface CandidateMatchResult {
  providerItemId: string;
  matchedTitle: string;
  matchedYear?: number;
  confidence: number;
  method: ProviderMapping["method"];
}
