/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  MA-TV Client Proxy & Stream Relay Service
 * ═══════════════════════════════════════════════════════════════════════════════
 *  Client-side helper providing seamless access to the proxy engine with:
 *  - Stream URL construction for M3U8 and MP4 with Referer bypass
 *  - Intelligent cascading fetch (Local Proxy -> corsproxy.io -> allorigins -> codetabs)
 *  - Client-side HLS manifest rewriting fallback
 *  - Health checks and proxy status probing
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type CorsProxyProvider = 'local' | 'corsproxy' | 'allorigins' | 'codetabs';

export interface ProxyFetchOptions extends RequestInit {
  referer?: string;
  format?: 'html' | 'json' | 'raw';
  timeoutMs?: number;
  useFallbackOnly?: boolean;
  preferredFallback?: CorsProxyProvider;
}

export interface ProxyHealthStatus {
  online: boolean;
  latencyMs: number;
  engine: string;
  timestamp?: number;
}

/**
 * Public CORS proxy fallback definitions.
 */
const PUBLIC_CORS_PROXIES = {
  corsproxy: (targetUrl: string) => `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
  allorigins: (targetUrl: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
  codetabs: (targetUrl: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
};

/**
 * Generates a public CORS proxy URL using one of the reliable providers.
 */
export function getPublicCorsProxyUrl(
  targetUrl: string,
  provider: 'corsproxy' | 'allorigins' | 'codetabs' = 'corsproxy'
): string {
  if (!targetUrl) return '';
  const resolver = PUBLIC_CORS_PROXIES[provider] || PUBLIC_CORS_PROXIES.corsproxy;
  return resolver(targetUrl);
}

/**
 * Rewrites an HLS M3U8 manifest client-side.
 * Resolves all relative URIs and wraps them in proxy stream URLs.
 */
export function rewriteClientM3u8(
  manifestContent: string,
  manifestBaseUrl: string,
  referer?: string,
  proxyEndpoint: string = '/api/proxy/stream'
): string {
  const lines = manifestContent.split(/\r?\n/);
  const rewrittenLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      rewrittenLines.push(line);
      continue;
    }

    if (trimmed.startsWith('#')) {
      if (trimmed.includes('URI=')) {
        const rewritten = line.replace(/URI=(["']?)([^"',\s]+)\1/g, (_match, quote, uri) => {
          const proxied = getProxiedStreamUrl(new URL(uri, manifestBaseUrl).href, referer, proxyEndpoint);
          return `URI=${quote}${proxied}${quote}`;
        });
        rewrittenLines.push(rewritten);
      } else {
        rewrittenLines.push(line);
      }
      continue;
    }

    const proxied = getProxiedStreamUrl(new URL(trimmed, manifestBaseUrl).href, referer, proxyEndpoint);
    rewrittenLines.push(proxied);
  }

  return rewrittenLines.join('\n');
}

/**
 * Transforms any media stream URL (.m3u8 or .mp4) to route through the MA-TV Proxy Relay.
 * Injects custom Referer to bypass anti-hotlinking.
 *
 * @param targetUrl The direct stream URL (e.g., https://stream.example.com/live.m3u8)
 * @param referer Optional Referer header string to bypass anti-hotlinking protections
 * @param proxyEndpoint Optional custom proxy endpoint (defaults to /api/proxy/stream)
 */
export function getProxiedStreamUrl(
  targetUrl: string,
  referer?: string,
  proxyEndpoint: string = '/api/proxy/stream'
): string {
  if (!targetUrl || typeof targetUrl !== 'string') return '';
  const trimmed = targetUrl.trim();
  if (!trimmed) return '';

  // If already proxied or browser-local, avoid double proxying
  if (
    trimmed.startsWith('/api/proxy/stream') ||
    trimmed.includes('/api/proxy/stream?') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const params = new URLSearchParams();
  params.set('url', trimmed);
  if (referer) {
    params.set('referer', referer);
  }

  return `${proxyEndpoint}?${params.toString()}`;
}

/**
 * Checks whether the local proxy server is active and reachable.
 */
export async function checkProxyHealth(timeoutMs: number = 2000): Promise<ProxyHealthStatus> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch('/api/proxy/ping', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);

    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        online: true,
        latencyMs,
        engine: data.engine || 'MA-TV Proxy & Relay',
        timestamp: data.timestamp,
      };
    }

    return {
      online: false,
      latencyMs,
      engine: 'MA-TV Proxy (HTTP ' + res.status + ')',
    };
  } catch {
    return {
      online: false,
      latencyMs: Math.round(performance.now() - start),
      engine: 'Proxy offline (using public CORS fallbacks)',
    };
  }
}

/**
 * Performs a fetch request using intelligent proxy cascade:
 * 1. Primary: Local Proxy (/api/proxy/scrape)
 * 2. Fallback 1: corsproxy.io
 * 3. Fallback 2: api.allorigins.win
 * 4. Fallback 3: api.codetabs.com
 *
 * @param targetUrl The URL of the web page or resource to fetch
 * @param options Fetch options including referer, format, timeout, etc.
 */
export async function fetchWithProxy(
  targetUrl: string,
  options: ProxyFetchOptions = {}
): Promise<Response> {
  const {
    referer,
    format = 'html',
    timeoutMs = 4500,
    useFallbackOnly = false,
    ...fetchInit
  } = options;

  const errors: string[] = [];

  // 1. Try local proxy first (unless forced to use public fallback)
  if (!useFallbackOnly) {
    try {
      const localParams = new URLSearchParams();
      localParams.set('url', targetUrl);
      if (referer) localParams.set('referer', referer);
      if (format) localParams.set('format', format);

      const localEndpoint = `/api/proxy/scrape?${localParams.toString()}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(localEndpoint, {
        ...fetchInit,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        return response;
      }

      errors.push(`Local proxy returned HTTP ${response.status}`);
    } catch (err: any) {
      errors.push(`Local proxy failed: ${err?.message || 'Connection error'}`);
    }
  }

  // 2. Cascade through public CORS proxy fallbacks
  const fallbackProviders: ('corsproxy' | 'allorigins' | 'codetabs')[] = ['corsproxy', 'allorigins', 'codetabs'];

  for (const provider of fallbackProviders) {
    try {
      const fallbackUrl = getPublicCorsProxyUrl(targetUrl, provider);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(fallbackUrl, {
        ...fetchInit,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        return response;
      }
      errors.push(`${provider} returned HTTP ${response.status}`);
    } catch (err: any) {
      errors.push(`${provider} failed: ${err?.message || 'Connection error'}`);
    }
  }

  throw new Error(`All proxy relays failed for "${targetUrl}". Errors: ${errors.join(' | ')}`);
}

/**
 * Convenience helper to scrape HTML text from a protected URL.
 */
export async function scrapeHtml(targetUrl: string, referer?: string): Promise<string> {
  const response = await fetchWithProxy(targetUrl, { referer, format: 'html' });
  return await response.text();
}

/**
 * Convenience helper to scrape JSON data from a protected API.
 */
export async function scrapeJson<T = unknown>(targetUrl: string, referer?: string): Promise<T> {
  const response = await fetchWithProxy(targetUrl, { referer, format: 'json' });
  return (await response.json()) as T;
}

/**
 * Proxy Service Class for object-oriented or DI usage.
 */
export class ProxyService {
  public getProxiedStreamUrl = getProxiedStreamUrl;
  public fetchWithProxy = fetchWithProxy;
  public checkProxyHealth = checkProxyHealth;
  public getPublicCorsProxyUrl = getPublicCorsProxyUrl;
  public rewriteClientM3u8 = rewriteClientM3u8;
  public scrapeHtml = scrapeHtml;
  public scrapeJson = scrapeJson;
}

export const proxyService = new ProxyService();
