import type { ContentIdentity, CanonicalMetadata, MediaType, SeasonSummary, CastMember, EpisodeIdentity } from "../domain/content/ContentIdentity";


const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const DEFAULT_TMDB_API_KEY_V3 = "f562845c2beca65e1028ff2e31ccaff1";
const DEFAULT_TMDB_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkMGQxNjhiOTI5ZmU1ZGMyNGI4YTc0ZDQyNjlmMTUzOCIsIm5iZiI6MTc4NTM4MzU3OC43MTQsInN1YiI6IjZhNmFjYTlhNDU1N2Y1NzBjZGFjOGEzZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.zxtxxIA0IP5qeNAkOQDYYBHbMVoHXbeIABlDgt3HVRU";

const LS_KEY_API = "matv_tmdb_api_key";

export function tmdbImageUrl(path?: string, size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w500"): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function tmdbBackdropUrl(path?: string): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/w1280${path}`;
}

export function tmdbProfileUrl(path?: string): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/w185${path}`;
}

export function tmdbStillUrl(path?: string): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/w300${path}`;
}

export function getTmdbApiKey(): string {
  const custom = localStorage.getItem(LS_KEY_API);
  if (custom && custom.trim().length > 5) return custom.trim();
  const envKey = import.meta.env.VITE_TMDB_API_KEY;
  if (envKey && envKey.trim().length > 5) return envKey.trim();
  return DEFAULT_TMDB_API_KEY_V3;
}

export function setTmdbApiKey(key: string): void {
  if (key.trim()) localStorage.setItem(LS_KEY_API, key.trim());
  else localStorage.removeItem(LS_KEY_API);
}

export function getTmdbBearerToken(): string {
  const envToken = import.meta.env.VITE_TMDB_BEARER_TOKEN;
  if (envToken && envToken.trim().length > 10) return envToken.trim();
  return DEFAULT_TMDB_BEARER_TOKEN;
}

async function tmdbFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const apiKey = getTmdbApiKey();

  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const isJwt = apiKey.includes(".");
  const headers: Record<string, string> = {};
  if (isJwt) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else {
    url.searchParams.set("api_key", apiKey);
  }

  const resp = await fetch(url.toString(), { headers });
  if (!resp.ok) {
    // Fallback to bearer token if v3 key fails
    if (!isJwt) {
      const fallbackUrl = new URL(`${TMDB_BASE}${path}`);
      for (const [k, v] of Object.entries(params)) {
        fallbackUrl.searchParams.set(k, v);
      }
      const fbResp = await fetch(fallbackUrl.toString(), {
        headers: { Authorization: `Bearer ${getTmdbBearerToken()}` },
      });
      if (!fbResp.ok) throw new Error(`TMDB error: ${fbResp.status}`);
      return fbResp.json();
    }
    throw new Error(`TMDB error: ${resp.status}`);
  }
  return resp.json();
}

export async function fetchTrending(mediaType: MediaType, window: "day" | "week" = "week"): Promise<ContentIdentity[]> {
  const type = mediaType === "series" ? "tv" : "movie";
  const data = await tmdbFetch(`/trending/${type}/${window}`);
  return data.results.map((r: any) => mapTmdbToIdentity(r, mediaType));
}

export async function fetchPopular(mediaType: MediaType, page = 1): Promise<ContentIdentity[]> {
  const type = mediaType === "series" ? "tv" : "movie";
  const data = await tmdbFetch(`/${type}/popular`, { page: String(page) });
  return data.results.map((r: any) => mapTmdbToIdentity(r, mediaType));
}

export async function fetchTopRated(mediaType: MediaType, page = 1): Promise<ContentIdentity[]> {
  const type = mediaType === "series" ? "tv" : "movie";
  const data = await tmdbFetch(`/${type}/top_rated`, { page: String(page) });
  return data.results.map((r: any) => mapTmdbToIdentity(r, mediaType));
}

export async function fetchByGenre(mediaType: MediaType, genreId: number, page = 1): Promise<ContentIdentity[]> {
  const type = mediaType === "series" ? "tv" : "movie";
  const data = await tmdbFetch(`/discover/${type}`, {
    with_genres: String(genreId),
    page: String(page),
    sort_by: "popularity.desc",
  });
  return data.results.map((r: any) => mapTmdbToIdentity(r, mediaType));
}

export async function fetchByRegion(mediaType: MediaType, region: string, page = 1): Promise<ContentIdentity[]> {
  const type = mediaType === "series" ? "tv" : "movie";
  const data = await tmdbFetch(`/discover/${type}`, {
    with_original_language: region,
    page: String(page),
    sort_by: "popularity.desc",
  });
  return data.results.map((r: any) => mapTmdbToIdentity(r, mediaType));
}

export async function fetchDetails(tmdbId: number, mediaType: MediaType): Promise<ContentIdentity> {
  const type = mediaType === "series" ? "tv" : "movie";
  const data = await tmdbFetch(`/${type}/${tmdbId}`, {
    append_to_response: "credits,alternative_titles",
    language: "ar-SA",
  });

  let identity = mapTmdbToIdentity(data, mediaType);
  if (!identity.canonical.overview || isArabicMissing(data)) {
    try {
      const enData = await tmdbFetch(`/${type}/${tmdbId}`, {
        append_to_response: "credits,alternative_titles",
        language: "en-US",
      });
      const enIdentity = mapTmdbToIdentity(enData, mediaType);
      identity = {
        ...identity,
        canonical: {
          ...identity.canonical,
          overview: identity.canonical.overview || enIdentity.canonical.overview,
          title: identity.canonical.title || enIdentity.canonical.title,
        },
      };
    } catch {
      // keep arabic-only data
    }
  }

  return identity;
}

export async function searchTmdb(query: string, mediaType: MediaType): Promise<ContentIdentity[]> {
  const type = mediaType === "series" ? "tv" : "movie";
  const data = await tmdbFetch(`/search/${type}`, { query, language: "ar-SA" });
  return data.results
    .filter((r: any) => r.poster_path || r.backdrop_path)
    .map((r: any) => mapTmdbToIdentity(r, mediaType));
}

export async function searchMulti(query: string): Promise<ContentIdentity[]> {
  const data = await tmdbFetch(`/search/multi`, { query, language: "ar-SA" });
  return data.results
    .filter((r: any) => (r.media_type === "movie" || r.media_type === "tv") && (r.poster_path || r.backdrop_path))
    .map((r: any) => mapTmdbToIdentity(r, r.media_type === "tv" ? "series" : "movie"));
}

export async function fetchSimilar(tmdbId: number, mediaType: MediaType): Promise<ContentIdentity[]> {
  const type = mediaType === "series" ? "tv" : "movie";
  try {
    const data = await tmdbFetch(`/${type}/${tmdbId}/recommendations`, { language: "ar-SA", page: "1" });
    return (data.results || []).slice(0, 20).map((r: any) => mapTmdbToIdentity(r, mediaType));
  } catch {
    return [];
  }
}

export async function fetchSeasonDetails(tmdbId: number, seasonNumber: number): Promise<EpisodeIdentity[]> {
  const data = await tmdbFetch(`/tv/${tmdbId}/season/${seasonNumber}`, { language: "ar-SA" });
  return (data.episodes || []).map((ep: any) => ({
    tmdbId,
    seasonNumber: ep.season_number,
    episodeNumber: ep.episode_number,
    title: ep.name || `Episode ${ep.episode_number}`,
    overview: ep.overview,
    stillPath: ep.still_path,
    airDate: ep.air_date,
    runtime: ep.runtime,
  }));
}

function isArabicMissing(data: any): boolean {
  return !data.overview || data.overview.length < 10;
}

function mapTmdbToIdentity(r: any, mediaType: MediaType): ContentIdentity {
  const isTv = mediaType === "series" || r.first_air_date !== undefined || r.media_type === "tv";
  const title = isTv ? r.name : r.title;
  const originalTitle = isTv ? r.original_name : r.original_title;
  const releaseDate = isTv ? r.first_air_date : r.release_date;

  const seasons: SeasonSummary[] | undefined = isTv && r.seasons
    ? r.seasons.map((s: any) => ({
        seasonNumber: s.season_number,
        episodeCount: s.episode_count,
        name: s.name,
        overview: s.overview,
        posterPath: s.poster_path,
        airDate: s.air_date,
      }))
    : undefined;

  const cast: CastMember[] | undefined = r.credits?.cast
    ? r.credits.cast.slice(0, 20).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profilePath: c.profile_path,
        order: c.order,
      }))
    : undefined;

  const canonical: CanonicalMetadata = {
    title: title || originalTitle || "Unknown",
    originalTitle,
    overview: r.overview || "",
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
    releaseDate,
    genres: r.genres?.map((g: any) => g.name) ?? [],
    runtime: r.runtime || r.episode_run_time?.[0],
    voteAverage: r.vote_average,
    voteCount: r.vote_count,
    originalLanguage: r.original_language,
    productionCountries: r.production_countries?.map((c: any) => c.name),
    cast,
    seasons,
    episodeCount: r.number_of_episodes,
  };

  return {
    tmdbId: r.id,
    imdbId: r.imdb_id,
    mediaType: isTv ? "series" : "movie",
    canonical,
  };
}

export const TMDB_GENRES = {
  movie: {
    action: 28,
    adventure: 12,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    fantasy: 14,
    history: 36,
    horror: 27,
    music: 10402,
    mystery: 9648,
    romance: 10749,
    scifi: 878,
    thriller: 53,
    war: 10752,
    western: 37,
  },
  tv: {
    action: 10759,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    kids: 10762,
    mystery: 9648,
    scifi: 10765,
    war: 10768,
    western: 37,
  },
} as const;

export const ARABIC_LANGUAGE_CODE = "ar";
export const TMDB_REGIONS = {
  arabic: "ar",
  turkish: "tr",
  korean: "ko",
  hindi: "hi",
  japanese: "ja",
} as const;
