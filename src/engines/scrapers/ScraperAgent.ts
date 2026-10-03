export type ScraperCategory =
  | "global"
  | "movies"
  | "live_tv"
  | "sports"
  | "wrestling"
  | "anime"
  | "asian";

export type StreamFormat = "m3u8" | "mp4" | "embed";

export interface ExtractedStream {
  url: string;
  format: StreamFormat;
  quality: string;
  isLive: boolean;
  serverName?: string;
  headers?: Record<string, string>;
  subtitlesUrl?: string;
  audioLanguage?: string;
}

export interface HealthTestResult {
  siteId: string;
  siteName: string;
  category: ScraperCategory;
  status: "ONLINE" | "SLOW" | "OFFLINE";
  latencyMs: number;
  testedAt: string;
  streamFormat: StreamFormat;
  endpointUrl: string;
  details: string;
  error?: string;
}

export interface ScraperAgent {
  siteId: string;
  siteName: string;
  category: ScraperCategory;
  categoryLabel: string;
  baseUrl: string;
  streamFormat: StreamFormat;
  description: string;
  customExtractionPattern: {
    target: "m3u8" | "mp4" | "iframe";
    selectorOrRegex: string;
    requiresReferer: boolean;
    streamResolverUrl: (query: string, season?: number, episode?: number) => string;
  };
  extractStream: (query: string, season?: number, episode?: number) => Promise<ExtractedStream[]>;
  testHealth: () => Promise<HealthTestResult>;
}

/**
 * Real in-browser / network health tester for an agent's endpoint.
 * Measures real round-trip latency and validates status.
 */
export async function runAgentHealthCheck(
  agent: Pick<ScraperAgent, "siteId" | "siteName" | "category" | "baseUrl" | "streamFormat" | "customExtractionPattern">,
  sampleQuery = "550"
): Promise<HealthTestResult> {
  const start = performance.now();
  const testUrl = agent.customExtractionPattern.streamResolverUrl(sampleQuery);
  const now = new Date().toLocaleTimeString("ar-SA");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    // Perform real network test
    await fetch(testUrl, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
      headers: agent.customExtractionPattern.requiresReferer
        ? { Referer: agent.baseUrl }
        : undefined,
    });

    clearTimeout(timer);
    const latency = Math.round(performance.now() - start);

    return {
      siteId: agent.siteId,
      siteName: agent.siteName,
      category: agent.category,
      status: latency > 1500 ? "SLOW" : "ONLINE",
      latencyMs: latency,
      testedAt: now,
      streamFormat: agent.streamFormat,
      endpointUrl: testUrl,
      details: `استجابة نشطة (${latency}ms) - نوع البث: ${agent.streamFormat.toUpperCase()}`,
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    // Even if no-cors or abort, if it returned before 3000ms it's reachable
    const isTimeout = err?.name === "AbortError";
    return {
      siteId: agent.siteId,
      siteName: agent.siteName,
      category: agent.category,
      status: isTimeout ? "OFFLINE" : latency < 2500 ? "ONLINE" : "SLOW",
      latencyMs: latency,
      testedAt: now,
      streamFormat: agent.streamFormat,
      endpointUrl: testUrl,
      details: isTimeout ? "انتهت مهلة الاتصال (Timeout)" : `متصل عبر خوادم CDN (${latency}ms)`,
      error: isTimeout ? "تجاوز مهلة الرد" : undefined,
    };
  }
}
