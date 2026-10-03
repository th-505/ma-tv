export type MediaType = "movie" | "series" | "episode";

export interface ContentIdentity {
  tmdbId: number;
  imdbId?: string;
  mediaType: MediaType;
  canonical: CanonicalMetadata;
}

export interface CanonicalMetadata {
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  genres: string[];
  runtime?: number;
  voteAverage?: number;
  voteCount?: number;
  originalLanguage?: string;
  productionCountries?: string[];
  cast?: CastMember[];
  seasons?: SeasonSummary[];
  episodeCount?: number;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profilePath?: string;
  order: number;
}

export interface SeasonSummary {
  seasonNumber: number;
  episodeCount: number;
  name: string;
  overview?: string;
  posterPath?: string;
  airDate?: string;
}

export interface EpisodeIdentity {
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview?: string;
  stillPath?: string;
  airDate?: string;
  runtime?: number;
}

export interface MetadataFallbackChain {
  locale: string;
  title: string;
  overview: string;
}

export const METADATA_FALLCHAIN: readonly string[] = ["ar-SA", "en-US", "original"] as const;
