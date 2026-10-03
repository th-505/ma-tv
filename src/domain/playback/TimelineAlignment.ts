export type AlignmentMethod =
  | "cached_offset"
  | "duration_comparison"
  | "segment_landmark"
  | "audio_landmark"
  | "scene_landmark";

export interface AlignmentResult {
  offsetSeconds: number;
  confidence: number;
  method: AlignmentMethod;
}

export interface AlignmentCacheEntry {
  sourceProviderId: string;
  targetProviderId: string;
  contentId: number;
  offsetSeconds: number;
  confidence: number;
  method: AlignmentMethod;
  cachedAt: string;
}

export interface PlaybackProgress {
  contentId: number;
  position: number;
  duration: number;
  completed: boolean;
  updatedAt: string;
  providerId?: string;
  sourceId?: string;
}

export const COMPLETION_THRESHOLD = 0.95;
