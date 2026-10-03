export type ErrorCategory =
  | "NETWORK_TIMEOUT"
  | "DNS_FAILURE"
  | "HTTP_ERROR"
  | "NOT_FOUND"
  | "MAPPING_NOT_FOUND"
  | "MAPPING_LOW_CONFIDENCE"
  | "PARSER_CHANGED"
  | "SOURCE_EXPIRED"
  | "PLATFORM_UNSUPPORTED"
  | "CORS_BLOCKED"
  | "CODEC_UNSUPPORTED"
  | "MANIFEST_INVALID"
  | "PLAYBACK_FAILED"
  | "STORAGE_LOW"
  | "SUBTITLE_NOT_FOUND"
  | "RESTRICTED"
  | "CAPABILITY_UNAVAILABLE";

export type SupportStatus =
  | "SUPPORTED"
  | "UNSUPPORTED_ON_PLATFORM"
  | "RESTRICTED"
  | "CORS_BLOCKED"
  | "CAPABILITY_UNAVAILABLE";

export interface ProviderError {
  category: ErrorCategory;
  message: string;
  providerId?: string;
  retryable: boolean;
  timestamp: string;
}

export function isRetryable(category: ErrorCategory): boolean {
  switch (category) {
    case "NETWORK_TIMEOUT":
    case "DNS_FAILURE":
    case "HTTP_ERROR":
    case "SOURCE_EXPIRED":
      return true;
    case "NOT_FOUND":
    case "MAPPING_NOT_FOUND":
    case "MAPPING_LOW_CONFIDENCE":
    case "PARSER_CHANGED":
    case "PLATFORM_UNSUPPORTED":
    case "CORS_BLOCKED":
    case "CODEC_UNSUPPORTED":
    case "MANIFEST_INVALID":
    case "PLAYBACK_FAILED":
    case "STORAGE_LOW":
    case "SUBTITLE_NOT_FOUND":
    case "RESTRICTED":
      return false;
    default:
      return false;
  }
}

export function isProviderOutage(category: ErrorCategory): boolean {
  switch (category) {
    case "PLATFORM_UNSUPPORTED":
    case "CORS_BLOCKED":
    case "CAPABILITY_UNAVAILABLE":
    case "RESTRICTED":
      return false;
    default:
      return true;
  }
}
