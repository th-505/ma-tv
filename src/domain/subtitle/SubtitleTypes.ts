export interface SubtitleQuery {
  tmdbId: number;
  imdbId?: string;
  title: string;
  originalTitle?: string;
  year?: number;
  season?: number;
  episode?: number;
  release?: string;
  fps?: number;
  language: string;
}

export interface SubtitleCandidate {
  providerId: string;
  subtitleId: string;
  language: string;
  fps?: number;
  releaseName?: string;
  downloadUrl: string;
  score: number;
  exactEpisode: boolean;
  releaseMatch: boolean;
}

export interface SubtitleRankingFactors {
  exactEpisode: boolean;
  releaseMatch: boolean;
  language: string;
  fps: number;
  providerHealth: string;
  historicalSuccess: number;
}

export interface SubtitleStyling {
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  outlineColor: string;
  outlineWidth: number;
  position: number;
}

export const DEFAULT_SUBTITLE_STYLING: SubtitleStyling = {
  fontSize: 18,
  fontColor: "#FFFFFF",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  outlineColor: "#000000",
  outlineWidth: 2,
  position: 85,
};
