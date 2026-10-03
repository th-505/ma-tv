import type { ContentIdentity } from "../../domain/content/ContentIdentity";
import type { CandidateMatchResult, MatchFactors, ProviderMapping } from "../../domain/provider/ProviderMapping";
import { classifyConfidence } from "../../domain/provider/ProviderMapping";

export interface CandidateMatcher {
  match(
    identity: ContentIdentity,
    candidates: SearchResultCandidate[]
  ): CandidateMatchResult[];
}

export interface SearchResultCandidate {
  providerItemId: string;
  providerUrlKey?: string;
  title: string;
  year?: number;
  alternativeTitles?: string[];
  contentType?: string;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinRatio(a: string, b: string): number {
  const s1 = a.length < b.length ? a : b;
  const s2 = a.length < b.length ? b : a;
  if (s2.length === 0) return 1;

  let prev = new Array(s1.length + 1);
  let curr = new Array(s1.length + 1);

  for (let i = 0; i <= s1.length; i++) prev[i] = i;

  for (let j = 1; j <= s2.length; j++) {
    curr[0] = j;
    for (let i = 1; i <= s1.length; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      curr[i] = Math.min(prev[i] + 1, curr[i - 1] + 1, prev[i - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }

  const distance = prev[s1.length];
  return 1 - distance / s2.length;
}

function scoreCandidate(
  identity: ContentIdentity,
  candidate: SearchResultCandidate
): number {
  const factors: MatchFactors = {
    originalTitle: identity.canonical.originalTitle,
    arabicTitle: identity.canonical.title,
    alternativeTitles: [],
    year: identity.canonical.releaseDate
      ? parseInt(identity.canonical.releaseDate.substring(0, 4))
      : undefined,
    mediaType: identity.mediaType,
  };

  const normCanonical = normalizeTitle(identity.canonical.title);
  const normOriginal = identity.canonical.originalTitle
    ? normalizeTitle(identity.canonical.originalTitle)
    : normCanonical;
  const normCandidate = normalizeTitle(candidate.title);

  let titleScore = 0;

  if (normCandidate === normCanonical || normCandidate === normOriginal) {
    titleScore = 100;
  } else {
    titleScore = Math.round(levenshteinRatio(normCanonical, normCandidate) * 100);
    if (titleScore < 100) {
      const originalScore = Math.round(
        levenshteinRatio(normOriginal, normCandidate) * 100
      );
      if (originalScore > titleScore) titleScore = originalScore;
    }
  }

  if (candidate.alternativeTitles) {
    for (const alt of candidate.alternativeTitles) {
      const altScore = Math.round(
        levenshteinRatio(normCanonical, normalizeTitle(alt)) * 100
      );
      if (altScore > titleScore) titleScore = altScore;
    }
  }

  let yearScore = 0;
  if (factors.year && candidate.year) {
    yearScore = factors.year === candidate.year ? 100 : Math.max(0, 100 - Math.abs(factors.year - candidate.year) * 20);
  }

  let typeScore = 0;
  if (candidate.contentType && factors.mediaType) {
    typeScore = candidate.contentType === factors.mediaType ? 100 : 0;
  }

  const weighted = titleScore * 0.6 + yearScore * 0.25 + typeScore * 0.15;
  return Math.min(100, Math.round(weighted));
}

export function createCandidateMatcher(): CandidateMatcher {
  return {
    match(identity: ContentIdentity, candidates: SearchResultCandidate[]) {
      const results: CandidateMatchResult[] = candidates.map((c) => {
        const score = scoreCandidate(identity, c);
        return {
          providerItemId: c.providerItemId,
          providerUrlKey: c.providerUrlKey,
          matchedTitle: c.title,
          matchedYear: c.year,
          confidence: score,
          method: "titleSearch" as ProviderMapping["method"],
        };
      });

      return results
        .filter((r) => classifyConfidence(r.confidence) !== "REJECT")
        .sort((a, b) => b.confidence - a.confidence);
    },
  };
}
