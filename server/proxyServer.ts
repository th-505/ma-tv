import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type { Plugin } from 'vite';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  MA-TV Proxy & Stream Relay Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 *  High-performance reverse proxy for media streaming and HTML scraping:
 *  - HLS manifest (.m3u8) dynamic rewriting (routes segments and keys through proxy)
 *  - MP4 & MPEG-TS video streaming with HTTP 206 Partial Content (Range request) support
 *  - Arbitrary Referer & User-Agent header spoofing to bypass hotlinking protection
 *  - HTML scraping endpoint to bypass CORS and anti-bot headers
 *  - Full compatibility with Vite dev/preview server and standalone Node.js execution
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization, X-Requested-With, Referer, User-Agent',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, Content-Type',
};

/**
 * Applies global permissive CORS headers to response.
 */
function applyCorsHeaders(res: ServerResponse): void {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }
}

/**
 * Builds a proxied stream URL for a segment or variant playlist.
 */
export function buildProxyUrl(
  urlOrPath: string,
  baseUrl: string,
  referer?: string,
  proxyEndpoint: string = '/api/proxy/stream'
): string {
  try {
    const trimmed = urlOrPath.trim();
    if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return urlOrPath;
    }
    if (trimmed.startsWith('/api/proxy/stream') || trimmed.includes('/api/proxy/stream?')) {
      return trimmed;
    }

    const resolvedUrl = new URL(trimmed, baseUrl).href;
    const params = new URLSearchParams();
    params.set('url', resolvedUrl);
    if (referer) {
      params.set('referer', referer);
    }
    return `${proxyEndpoint}?${params.toString()}`;
  } catch {
    return urlOrPath;
  }
}

/**
 * Rewrites an HLS M3U8 manifest so all nested playlists, media segments,
 * encryption keys, and subtitles route through the MA-TV Proxy Relay.
 */
export function rewriteM3u8Manifest(
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

    // Preserve blank lines
    if (!trimmed) {
      rewrittenLines.push(line);
      continue;
    }

    // Process comment or tag line
    if (trimmed.startsWith('#')) {
      // Tags that contain URIs:
      // #EXT-X-KEY:METHOD=...,URI="..."
      // #EXT-X-MAP:URI="..."
      // #EXT-X-MEDIA:TYPE=...,URI="..."
      // #EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=...,URI="..."
      if (trimmed.includes('URI=')) {
        const rewrittenTagLine = line.replace(/URI=(["']?)([^"',\s]+)\1/g, (_match, quote, uri) => {
          const proxied = buildProxyUrl(uri, manifestBaseUrl, referer, proxyEndpoint);
          return `URI=${quote}${proxied}${quote}`;
        });
        rewrittenLines.push(rewrittenTagLine);
      } else {
        rewrittenLines.push(line);
      }
      continue;
    }

    // Non-comment line is a segment URI or variant playlist URI
    const proxied = buildProxyUrl(trimmed, manifestBaseUrl, referer, proxyEndpoint);
    rewrittenLines.push(proxied);
  }

  return rewrittenLines.join('\n');
}

/**
 * Helper to safely read request body for POST scraping requests.
 */
function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer | string) => {
      body += chunk.toString();
      // Safeguard against memory abuse (max 10MB)
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Request payload too large (>10MB)'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

/**
 * Handler for GET /api/proxy/ping health check.
 */
function handlePing(res: ServerResponse): void {
  applyCorsHeaders(res);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      status: 'ok',
      engine: 'MA-TV Proxy & Stream Relay Engine',
      version: '1.0.0',
      timestamp: Date.now(),
    })
  );
}

/**
 * Handler for /api/proxy/stream:
 * - Spoofs Referer & User-Agent
 * - Handles Range requests for MP4 video scrubbing
 * - Detects and rewrites M3U8 playlists
 * - Streams MPEG-TS and binary video chunks directly with backpressure
 */
async function handleStream(req: IncomingMessage, res: ServerResponse, parsedUrl: URL): Promise<void> {
  applyCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const targetUrl = parsedUrl.searchParams.get('url');
  if (!targetUrl) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing required query parameter: url' }));
    return;
  }

  // Validate target URL scheme
  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetUrl);
    if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
      throw new Error('Unsupported protocol');
    }
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid target URL format', url: targetUrl }));
    return;
  }

  const refererParam = parsedUrl.searchParams.get('referer');
  const userAgentParam = parsedUrl.searchParams.get('userAgent');
  const originParam = parsedUrl.searchParams.get('origin');

  // Construct upstream request headers
  const upstreamHeaders = new Headers();
  upstreamHeaders.set('User-Agent', userAgentParam || DEFAULT_USER_AGENT);
  upstreamHeaders.set('Accept', '*/*');
  upstreamHeaders.set('Accept-Language', 'en-US,en;q=0.9,ar;q=0.8');
  upstreamHeaders.set('Sec-Fetch-Mode', 'cors');
  upstreamHeaders.set('Sec-Fetch-Site', 'cross-site');
  upstreamHeaders.set('Sec-Fetch-Dest', 'empty');

  const effectiveReferer = refererParam || `${parsedTarget.origin}/`;
  upstreamHeaders.set('Referer', effectiveReferer);
  upstreamHeaders.set('Origin', originParam || refererParam ? new URL(effectiveReferer).origin : parsedTarget.origin);

  // Forward Range header for partial content (essential for MP4 seeking)
  if (req.headers.range) {
    upstreamHeaders.set('Range', req.headers.range);
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: upstreamHeaders,
      redirect: 'follow',
    });

    // Handle HEAD request
    if (req.method === 'HEAD') {
      res.statusCode = upstreamRes.status;
      const contentType = upstreamRes.headers.get('content-type');
      const contentLength = upstreamRes.headers.get('content-length');
      const acceptRanges = upstreamRes.headers.get('accept-ranges');
      if (contentType) res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
      res.end();
      return;
    }

    if (!upstreamRes.ok && upstreamRes.status >= 400 && upstreamRes.status !== 416) {
      res.statusCode = upstreamRes.status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const errText = await upstreamRes.text().catch(() => '');
      res.end(
        JSON.stringify({
          error: `Upstream server returned HTTP ${upstreamRes.status}`,
          url: targetUrl,
          details: errText.slice(0, 500),
        })
      );
      return;
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    const cleanPath = parsedTarget.pathname.toLowerCase();
    const isM3u8Extension = cleanPath.endsWith('.m3u8') || targetUrl.includes('.m3u8');
    const isM3u8ContentType =
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl') ||
      contentType.includes('vnd.apple.mpegurl') ||
      contentType.includes('audio/mpegurl');

    // If candidate M3U8, check or rewrite
    if (isM3u8Extension || isM3u8ContentType) {
      const manifestText = await upstreamRes.text();

      // Check if it's truly an HLS manifest starting with #EXTM3U
      if (manifestText.trim().startsWith('#EXTM3U') || isM3u8Extension) {
        const finalBaseUrl = upstreamRes.url || targetUrl;
        const rewritten = rewriteM3u8Manifest(manifestText, finalBaseUrl, effectiveReferer, '/api/proxy/stream');

        res.statusCode = upstreamRes.status;
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Content-Length', Buffer.byteLength(rewritten, 'utf-8'));
        res.end(rewritten);
        return;
      }

      // If not starting with #EXTM3U, output as text
      res.statusCode = upstreamRes.status;
      res.setHeader('Content-Type', contentType || 'text/plain; charset=utf-8');
      res.end(manifestText);
      return;
    }

    // Binary stream (MP4, MPEG-TS segment, Key, Subtitle, etc.)
    res.statusCode = upstreamRes.status;

    // Forward crucial media headers
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else if (cleanPath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
    } else if (cleanPath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    }

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) res.setHeader('Content-Range', contentRange);

    const acceptRanges = upstreamRes.headers.get('accept-ranges');
    res.setHeader('Accept-Ranges', acceptRanges || 'bytes');

    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Stream chunks directly with Node stream piping
    if (upstreamRes.body) {
      const nodeStream = Readable.fromWeb(upstreamRes.body as any);
      nodeStream.pipe(res);

      req.on('close', () => {
        nodeStream.destroy();
      });
    } else {
      res.end();
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Failed to proxy media stream from upstream',
          message: error?.message || 'Network error',
          url: targetUrl,
        })
      );
    }
  }
}

/**
 * Handler for /api/proxy/scrape:
 * - Fetches HTML from protected sites without CORS restrictions
 * - Injects custom referer, user-agent, and headers
 * - Supports GET and POST methods
 */
async function handleScrape(req: IncomingMessage, res: ServerResponse, parsedUrl: URL): Promise<void> {
  applyCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  let targetUrl = parsedUrl.searchParams.get('url');
  let referer = parsedUrl.searchParams.get('referer');
  let format = parsedUrl.searchParams.get('format') || 'html';
  let customHeaders: Record<string, string> | undefined;

  // Read POST JSON body if provided
  if (req.method === 'POST') {
    try {
      const rawBody = await readRequestBody(req);
      if (rawBody.trim()) {
        const parsedBody = JSON.parse(rawBody);
        if (parsedBody.url) targetUrl = parsedBody.url;
        if (parsedBody.referer) referer = parsedBody.referer;
        if (parsedBody.format) format = parsedBody.format;
        if (parsedBody.headers && typeof parsedBody.headers === 'object') {
          customHeaders = parsedBody.headers;
        }
      }
    } catch (parseErr: any) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON request body', details: parseErr?.message }));
      return;
    }
  }

  if (!targetUrl) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing required parameter: url' }));
    return;
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid URL format', url: targetUrl }));
    return;
  }

  const upstreamHeaders = new Headers();
  upstreamHeaders.set('User-Agent', DEFAULT_USER_AGENT);
  upstreamHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8');
  upstreamHeaders.set('Accept-Language', 'ar,en-US;q=0.9,en;q=0.8');
  upstreamHeaders.set('Referer', referer || `${parsedTarget.origin}/`);
  upstreamHeaders.set('Cache-Control', 'no-cache');

  if (customHeaders) {
    for (const [k, v] of Object.entries(customHeaders)) {
      upstreamHeaders.set(k, v);
    }
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: upstreamHeaders,
      redirect: 'follow',
    });

    const html = await upstreamRes.text();

    if (format === 'json') {
      res.statusCode = upstreamRes.status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: upstreamRes.ok,
          status: upstreamRes.status,
          url: upstreamRes.url,
          html,
        })
      );
    } else {
      res.statusCode = upstreamRes.status;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Failed to scrape target URL',
          message: error?.message || 'Network error',
          url: targetUrl,
        })
      );
    }
  }
}

/**
 * Universal Connect / Node middleware that intercepts `/api/proxy/*` endpoints.
 */
export function proxyMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next?: (err?: unknown) => void
): void {
  const reqUrl = req.url || '/';
  if (!reqUrl.startsWith('/api/proxy')) {
    if (next) next();
    return;
  }

  const host = req.headers.host || 'localhost';
  const protocol = (req.socket as any)?.encrypted ? 'https' : 'http';
  const parsedUrl = new URL(reqUrl, `${protocol}://${host}`);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/proxy/ping' || pathname === '/api/proxy/health') {
    handlePing(res);
    return;
  }

  if (pathname === '/api/proxy/stream') {
    handleStream(req, res, parsedUrl).catch((err) => {
      console.error('[MA-TV Proxy Stream Error]', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Stream Relay Error' }));
      }
    });
    return;
  }

  if (pathname === '/api/proxy/scrape') {
    handleScrape(req, res, parsedUrl).catch((err) => {
      console.error('[MA-TV Proxy Scrape Error]', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Scraping Error' }));
      }
    });
    return;
  }

  // Not handled under /api/proxy
  if (next) {
    next();
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Endpoint not found', path: pathname }));
  }
}

/**
 * Vite Plugin that injects the MA-TV Proxy & Stream Relay engine into
 * Vite's development and preview servers.
 */
export function proxyRelayPlugin(): Plugin {
  return {
    name: 'matv-proxy-relay',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        proxyMiddleware(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        proxyMiddleware(req, res, next);
      });
    },
  };
}

/**
 * Starts a standalone HTTP proxy server on the specified port.
 */
export function startProxyServer(port: number = 3001): http.Server {
  const server = http.createServer((req, res) => {
    proxyMiddleware(req, res, () => {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Endpoint not found', path: req.url }));
    });
  });

  server.listen(port, () => {
    console.log(`\n📺 [MA-TV Proxy] Stream Relay Engine listening on http://localhost:${port}`);
    console.log(`   - Stream Endpoint: http://localhost:${port}/api/proxy/stream?url=...&referer=...`);
    console.log(`   - Scrape Endpoint: http://localhost:${port}/api/proxy/scrape?url=...`);
    console.log(`   - Ping Endpoint:   http://localhost:${port}/api/proxy/ping\n`);
  });

  return server;
}

// Auto-run if executed directly via Node / CLI
if (typeof process !== 'undefined' && process.argv && process.argv[1]) {
  const currentFilePath = process.argv[1].replace(/\\/g, '/');
  if (currentFilePath.endsWith('proxyServer.ts') || currentFilePath.endsWith('proxyServer.js')) {
    const port = parseInt(process.env.PORT || '3001', 10);
    startProxyServer(port);
  }
}
