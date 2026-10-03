export type ConsumetProvider =
  | "gogoanime"
  | "zoro"
  | "hianime"
  | "dramacool"
  | "viewasian"
  | "flixhq"
  | "superstream";

export interface ConsumetProviderMeta {
  id: ConsumetProvider;
  name: string;
  category: "anime" | "asian" | "movies";
  categoryLabel: string;
  defaultAudioLang: string;
  description: string;
  supportsServers: boolean;
}

export interface ConsumetSearchItem {
  id: string;
  title: string;
  url?: string;
  image?: string;
  releaseDate?: string;
  subOrDub?: "sub" | "dub" | "both";
  type?: string;
}

export interface ConsumetSearchResult {
  currentPage: number;
  hasNextPage: boolean;
  results: ConsumetSearchItem[];
}

export interface ConsumetEpisode {
  id: string;
  number: number;
  title?: string;
  season?: number;
  url?: string;
  isFiller?: boolean;
}

export interface ConsumetMediaInfo {
  id: string;
  title: string;
  url?: string;
  genres?: string[];
  totalEpisodes?: number;
  image?: string;
  cover?: string;
  description?: string;
  type?: string;
  releaseDate?: string;
  status?: string;
  episodes: ConsumetEpisode[];
}

export interface ConsumetStreamSource {
  url: string;
  isM3U8: boolean;
  quality?: string;
}

export interface ConsumetSubtitle {
  url: string;
  lang: string;
}

export interface ConsumetStreamResponse {
  headers?: Record<string, string>;
  sources: ConsumetStreamSource[];
  subtitles?: ConsumetSubtitle[];
  download?: string;
}

export interface ConsumetServer {
  name: string;
  url: string;
}

export interface ConsumetHealthResult {
  endpoint: string;
  status: "ONLINE" | "SLOW" | "OFFLINE";
  isOnline: boolean;
  latencyMs: number;
  testedAt: string;
  details: string;
  error?: string;
}

export interface ConsumetEngineConfig {
  baseUrl?: string;
  fallbackUrls?: string[];
  timeoutMs?: number;
  retries?: number;
  preferredSubLanguage?: string;
}
