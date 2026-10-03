import type { ContentIdentity } from "../domain/content/ContentIdentity";

const LS_FAV = "matv_favorites";
const LS_HISTORY = "matv_watch_history";
const LS_PROGRESS = "matv_progress";

export interface FavoriteItem {
  content_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number | null;
  added_at: string;
}

export interface HistoryItem {
  content_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  season_number: number | null;
  episode_number: number | null;
  watched_at: string;
}

export interface ContinueWatchingItem {
  contentId: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  position: number;
  duration: number;
  progress: number;
  updatedAt: string;
}

function readLS<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLS<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

// ===== Favorites =====

export function getFavorites(): FavoriteItem[] {
  return readLS<FavoriteItem>(LS_FAV);
}

export function isFavorite(contentId: number, mediaType: string): boolean {
  return readLS<FavoriteItem>(LS_FAV).some(
    (f) => f.content_id === contentId && f.media_type === mediaType
  );
}

export function toggleFavorite(identity: ContentIdentity): boolean {
  const favs = getFavorites();
  const idx = favs.findIndex(
    (f) => f.content_id === identity.tmdbId && f.media_type === identity.mediaType
  );
  if (idx >= 0) {
    favs.splice(idx, 1);
    writeLS(LS_FAV, favs);
    return false;
  }
  favs.unshift({
    content_id: identity.tmdbId,
    media_type: identity.mediaType,
    title: identity.canonical.title,
    poster_path: identity.canonical.posterPath ?? null,
    backdrop_path: identity.canonical.backdropPath ?? null,
    vote_average: identity.canonical.voteAverage ?? null,
    added_at: new Date().toISOString(),
  });
  writeLS(LS_FAV, favs);
  return true;
}

// ===== Watch History =====

export function getWatchHistory(): HistoryItem[] {
  return readLS<HistoryItem>(LS_HISTORY);
}

export function addToWatchHistory(identity: ContentIdentity, seasonNumber?: number, episodeNumber?: number): void {
  const history = getWatchHistory();
  const filtered = history.filter(
    (h) => !(h.content_id === identity.tmdbId && h.season_number === (seasonNumber ?? null) && h.episode_number === (episodeNumber ?? null))
  );
  filtered.unshift({
    content_id: identity.tmdbId,
    media_type: identity.mediaType,
    title: identity.canonical.title,
    poster_path: identity.canonical.posterPath ?? null,
    season_number: seasonNumber ?? null,
    episode_number: episodeNumber ?? null,
    watched_at: new Date().toISOString(),
  });
  writeLS(LS_HISTORY, filtered.slice(0, 100));
}

// ===== Continue Watching / Progress =====

export function getContinueWatching(): ContinueWatchingItem[] {
  const items = readLS<ContinueWatchingItem>(LS_PROGRESS);
  return items
    .filter((i) => i.progress < 0.95)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 20);
}

export function savePlaybackProgress(
  contentId: number,
  mediaType: string,
  position: number,
  duration: number,
  title?: string,
  posterPath?: string | null,
  seasonNumber?: number,
  episodeNumber?: number
): void {
  const key = `${contentId}-${mediaType}-${seasonNumber ?? 0}-${episodeNumber ?? 0}`;
  const items = readLS<ContinueWatchingItem>(LS_PROGRESS);
  const filtered = items.filter(
    (i) => `${i.contentId}-${i.mediaType}` !== `${contentId}-${mediaType}` ||
      (seasonNumber !== undefined && `${i.contentId}-${i.mediaType}-s${seasonNumber}e${episodeNumber}` !== key)
  );
  filtered.unshift({
    contentId,
    mediaType,
    title: title || "",
    posterPath: posterPath ?? null,
    position: Math.round(position),
    duration: Math.round(duration),
    progress: duration > 0 ? position / duration : 0,
    updatedAt: new Date().toISOString(),
  });
  writeLS(LS_PROGRESS, filtered.slice(0, 50));
}

export function getPlaybackProgress(contentId: number, mediaType: string): { position: number; duration: number } | null {
  const items = readLS<ContinueWatchingItem>(LS_PROGRESS);
  const found = items.find((i) => i.contentId === contentId && i.mediaType === mediaType);
  if (found) return { position: found.position, duration: found.duration };
  return null;
}

export function clearAllData(): void {
  localStorage.removeItem(LS_FAV);
  localStorage.removeItem(LS_HISTORY);
  localStorage.removeItem(LS_PROGRESS);
}
