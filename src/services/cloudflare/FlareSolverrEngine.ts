/**
 * Cloudflare & Anti-Bot Resolution Engine
 * FlareSolverr v1/v2 API Client & Stealth Fallback Engine for MA-TV
 * 
 * Supports:
 * - Cloudflare Turnstile, JavaScript challenges (Under Attack Mode), 503/403 challenges
 * - DDOS-Guard protection
 * - 30-minute session & cookie caching (cf_clearance, user-agent, tokens)
 * - Fallback stealth request builder with realistic browser headers & TLS fingerprints
 */

export interface FlareSolverrCookie {
  name: string;
  value: string;
  domain: string;
  path?: string;
  expires?: number;
  size?: number;
  httpOnly?: boolean;
  secure?: boolean;
  session?: boolean;
  sameSite?: string;
}

export interface FlareSolverrSolution {
  url: string;
  status: number;
  headers?: Record<string, string>;
  response: string;
  cookies: FlareSolverrCookie[];
  userAgent: string;
}

export interface FlareSolverrResponse {
  status: "ok" | "error";
  message: string;
  startTimestamp: number;
  endTimestamp: number;
  version?: string;
  solution?: FlareSolverrSolution;
  sessions?: string[];
  session?: string;
}

export interface CachedDomainSession {
  domain: string;
  cfClearance?: string;
  cookies: FlareSolverrCookie[];
  cookieString: string;
  userAgent: string;
  createdAt: number;
  expiresAt: number;
}

export interface ResolveChallengeOptions {
  method?: "GET" | "POST";
  postData?: string | Record<string, unknown>;
  headers?: Record<string, string>;
  maxTimeout?: number;
  sessionId?: string;
  proxy?: { url: string };
  forceRefresh?: boolean;
  returnOnlyCookies?: boolean;
}

export interface ResolveResult {
  success: boolean;
  status: number;
  html: string;
  cookies: FlareSolverrCookie[];
  cookieString: string;
  userAgent: string;
  cfClearance?: string;
  solvedBy: "cache" | "flaresolverr" | "stealth_fallback";
  error?: string;
  executionTimeMs: number;
}

export interface FlareSolverrHealthResult {
  online: boolean;
  endpoint: string;
  version?: string;
  latencyMs: number;
  error?: string;
}

export interface StealthHeaderOptions {
  referrer?: string;
  origin?: string;
  customHeaders?: Record<string, string>;
  includeCachedCookies?: boolean;
  userAgent?: string;
}

// Storage keys & constants
const STORAGE_KEY_URL = "matv_flaresolverr_url";
const STORAGE_KEY_CACHE = "matv_cf_session_cache";
export const DEFAULT_FLARESOLVERR_URL = "http://localhost:8191/v1";
export const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const DEFAULT_STEALTH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

export const DEFAULT_SEC_CH_UA =
  '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"';

/**
 * Normalizes a URL or host into a clean domain name for cache matching.
 */
export function extractDomain(urlOrDomain: string): string {
  if (!urlOrDomain) return "";
  try {
    let raw = urlOrDomain.trim();
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const parsed = new URL(raw);
      return parsed.hostname.toLowerCase();
    }
    // Remove protocol if present without slashes
    raw = raw.replace(/^https?:\/\//i, "");
    // Extract domain before path or port
    const firstSlash = raw.indexOf("/");
    if (firstSlash !== -1) raw = raw.substring(0, firstSlash);
    const firstColon = raw.indexOf(":");
    if (firstColon !== -1) raw = raw.substring(0, firstColon);
    return raw.toLowerCase();
  } catch {
    return urlOrDomain.toLowerCase().trim();
  }
}

/**
 * Serializes cookie array into a standard Cookie header string.
 */
export function serializeCookies(cookies: FlareSolverrCookie[]): string {
  if (!cookies || cookies.length === 0) return "";
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

/**
 * Parses raw Cookie string into FlareSolverrCookie objects.
 */
export function parseCookieString(cookieStr: string, domain = ""): FlareSolverrCookie[] {
  if (!cookieStr) return [];
  return cookieStr
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eqIdx = part.indexOf("=");
      const name = eqIdx !== -1 ? part.substring(0, eqIdx).trim() : part;
      const value = eqIdx !== -1 ? part.substring(eqIdx + 1).trim() : "";
      return {
        name,
        value,
        domain,
        path: "/",
      };
    });
}

/**
 * Detects if a response or HTML content represents a Cloudflare or DDoS-Guard challenge.
 * Handles both status code detection (403/503/429) and signature analysis.
 */
export function isCloudflareBlocked(
  htmlOrStatus: string | number,
  statusCode?: number
): boolean {
  const status: number | undefined =
    typeof htmlOrStatus === "number" ? htmlOrStatus : statusCode;
  const html: string = typeof htmlOrStatus === "string" ? htmlOrStatus : "";

  const isChallengeStatus = status === 403 || status === 503 || status === 429;

  // If status indicates blocking and no HTML is available to check
  if (!html && isChallengeStatus) {
    return true;
  }

  if (!html) {
    return false;
  }

  const lower = html.toLowerCase();

  // Cloudflare Turnstile, Managed Challenge, JS Challenge signatures
  const cfSignatures = [
    "cf-browser-verification",
    "cf_chl_",
    "cf-chl-widget",
    "challenges.cloudflare.com",
    "turnstile",
    "just a moment...",
    "checking your browser before accessing",
    "attention required! | cloudflare",
    "cloudflare ray id",
    "ray id:",
    "cf-error-details",
    "enable javascript and cookies to continue",
    "managed_challenge",
    "interactive_challenge",
    "cf-mitigated",
    "data-sitekey",
    "__cf_chl_tk",
    "challenge-running",
    "challenge-stage",
  ];

  // DDoS-Guard signatures
  const ddosGuardSignatures = [
    "ddos-guard",
    "check.ddos-guard.net",
    "ddg-captcha",
    "ddos protection by ddos-guard",
  ];

  const hasCfSignature = cfSignatures.some((sig) => lower.includes(sig));
  const hasDdosGuardSignature = ddosGuardSignatures.some((sig) => lower.includes(sig));

  if (hasCfSignature || hasDdosGuardSignature) {
    return true;
  }

  // If status is 403/503 and page mentions Cloudflare or DDoS-Guard
  if (isChallengeStatus && (lower.includes("cloudflare") || lower.includes("ddos-guard"))) {
    return true;
  }

  return false;
}

/**
 * Builds realistic browser headers simulating Google Chrome on Windows 10/11
 * with TLS fingerprinting alignment (HTTP/2 Sec-* headers and modern priority).
 */
export function buildStealthHeaders(
  urlOrDomain: string,
  options: StealthHeaderOptions = {}
): Record<string, string> {
  const domain = extractDomain(urlOrDomain);
  const ua = options.userAgent || DEFAULT_STEALTH_USER_AGENT;

  const headers: Record<string, string> = {
    "User-Agent": ua,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Sec-Ch-Ua": DEFAULT_SEC_CH_UA,
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": options.referrer ? "same-origin" : "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    Priority: "u=0, i",
    "Cache-Control": "max-age=0",
  };

  if (options.referrer) {
    headers["Referer"] = options.referrer;
  } else if (domain) {
    headers["Referer"] = `https://${domain}/`;
  }

  if (options.origin) {
    headers["Origin"] = options.origin;
  }

  // Include cached cookies if requested or by default
  if (options.includeCachedCookies !== false && domain) {
    const cached = flareSolverrEngine.getCachedSession(domain);
    if (cached && cached.cookieString) {
      headers["Cookie"] = cached.cookieString;
    }
  }

  // Merge any custom user-provided headers
  if (options.customHeaders) {
    Object.assign(headers, options.customHeaders);
  }

  return headers;
}

/**
 * FlareSolverrEngine Singleton Class
 */
export class FlareSolverrEngine {
  private memoryCache: Map<string, CachedDomainSession> = new Map();
  private isStorageLoaded = false;

  constructor() {
    this.loadCacheFromStorage();
  }

  // ==========================================
  // CONFIGURATION
  // ==========================================

  /**
   * Retrieves configured FlareSolverr API URL from localStorage or default.
   */
  public getApiUrl(): string {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY_URL);
        if (saved && saved.trim()) {
          return saved.trim().replace(/\/+$/, "");
        }
      }
    } catch {
      // Ignore localStorage access failures
    }
    return DEFAULT_FLARESOLVERR_URL;
  }

  /**
   * Sets custom FlareSolverr API URL in localStorage.
   */
  public setApiUrl(url: string): void {
    const sanitized = url.trim().replace(/\/+$/, "");
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_URL, sanitized);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Resets FlareSolverr API URL to default.
   */
  public resetApiUrl(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY_URL);
      }
    } catch {
      // Ignore
    }
  }

  // ==========================================
  // HEALTH & CONNECTIVITY CHECK
  // ==========================================

  /**
   * Tests connectivity to the FlareSolverr API endpoint.
   */
  public async testConnection(): Promise<FlareSolverrHealthResult> {
    const endpoint = this.getApiUrl();
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      // FlareSolverr v1/v2 accepts POST requests with cmd
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: "sessions.list" }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        return {
          online: false,
          endpoint,
          latencyMs,
          error: `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const data = (await res.json()) as FlareSolverrResponse;
      return {
        online: data.status === "ok",
        endpoint,
        version: data.version || "Active",
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      const message = err instanceof Error ? err.message : String(err);
      return {
        online: false,
        endpoint,
        latencyMs,
        error: message.includes("abort") ? "تجاوز مهلة الرد (Timeout 6s)" : message,
      };
    }
  }

  // ==========================================
  // SESSION & COOKIE CACHE (30-MIN TTL)
  // ==========================================

  private loadCacheFromStorage(): void {
    if (this.isStorageLoaded) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY_CACHE);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, CachedDomainSession>;
          const now = Date.now();
          for (const [domain, session] of Object.entries(parsed)) {
            if (session.expiresAt && session.expiresAt > now) {
              this.memoryCache.set(domain, session);
            }
          }
        }
      }
      this.isStorageLoaded = true;
    } catch {
      this.isStorageLoaded = true;
    }
  }

  private persistCacheToStorage(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const now = Date.now();
        const obj: Record<string, CachedDomainSession> = {};
        for (const [domain, session] of this.memoryCache.entries()) {
          if (session.expiresAt > now) {
            obj[domain] = session;
          }
        }
        window.localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(obj));
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Retrieves cached session for domain if valid and unexpired (30 minutes).
   */
  public getCachedSession(domainOrUrl: string): CachedDomainSession | null {
    this.loadCacheFromStorage();
    const domain = extractDomain(domainOrUrl);
    if (!domain) return null;

    // Check direct domain match
    let session = this.memoryCache.get(domain);

    // Fallback: match root domain if sub-domain provided
    if (!session) {
      for (const [key, val] of this.memoryCache.entries()) {
        if (domain === key || domain.endsWith("." + key) || key.endsWith("." + domain)) {
          session = val;
          break;
        }
      }
    }

    if (!session) return null;

    // Validate expiration
    if (Date.now() > session.expiresAt) {
      this.memoryCache.delete(domain);
      this.persistCacheToStorage();
      return null;
    }

    return session;
  }

  /**
   * Caches resolved cookies and user-agent for a domain with 30-minute expiration.
   */
  public setCachedSession(
    domainOrUrl: string,
    data: {
      cookies: FlareSolverrCookie[];
      userAgent?: string;
      cfClearance?: string;
    }
  ): void {
    this.loadCacheFromStorage();
    const domain = extractDomain(domainOrUrl);
    if (!domain) return;

    const cfClearance =
      data.cfClearance ||
      data.cookies.find((c) => c.name.toLowerCase() === "cf_clearance")?.value;

    const now = Date.now();
    const session: CachedDomainSession = {
      domain,
      cfClearance,
      cookies: data.cookies,
      cookieString: serializeCookies(data.cookies),
      userAgent: data.userAgent || DEFAULT_STEALTH_USER_AGENT,
      createdAt: now,
      expiresAt: now + CACHE_TTL_MS,
    };

    this.memoryCache.set(domain, session);
    this.persistCacheToStorage();
  }

  /**
   * Gets cached Cookie header string for domain.
   */
  public getCookies(domainOrUrl: string): string {
    const session = this.getCachedSession(domainOrUrl);
    return session ? session.cookieString : "";
  }

  /**
   * Gets cached cookie list for domain.
   */
  public getCookieList(domainOrUrl: string): FlareSolverrCookie[] {
    const session = this.getCachedSession(domainOrUrl);
    return session ? session.cookies : [];
  }

  /**
   * Returns all active cached domain sessions.
   */
  public getAllCachedDomains(): CachedDomainSession[] {
    this.loadCacheFromStorage();
    const now = Date.now();
    const result: CachedDomainSession[] = [];
    for (const session of this.memoryCache.values()) {
      if (session.expiresAt > now) {
        result.push(session);
      }
    }
    return result;
  }

  /**
   * Clears cached session for a single domain.
   */
  public clearDomainCache(domainOrUrl: string): void {
    const domain = extractDomain(domainOrUrl);
    if (domain) {
      this.memoryCache.delete(domain);
      this.persistCacheToStorage();
    }
  }

  /**
   * Clears all cached sessions.
   */
  public clearCache(): void {
    this.memoryCache.clear();
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY_CACHE);
      }
    } catch {
      // Ignore
    }
  }

  // ==========================================
  // FLARESOLVERR SESSION MANAGEMENT
  // ==========================================

  /**
   * Creates a dedicated browser session in FlareSolverr.
   */
  public async createSession(sessionId?: string): Promise<string> {
    const endpoint = this.getApiUrl();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cmd: "sessions.create",
        session: sessionId,
      }),
    });

    const data = (await res.json()) as FlareSolverrResponse;
    if (data.status === "ok" && data.session) {
      return data.session;
    }
    throw new Error(data.message || "Failed to create FlareSolverr session");
  }

  /**
   * Destroys an existing FlareSolverr browser session.
   */
  public async destroySession(sessionId: string): Promise<boolean> {
    const endpoint = this.getApiUrl();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cmd: "sessions.destroy",
        session: sessionId,
      }),
    });

    const data = (await res.json()) as FlareSolverrResponse;
    return data.status === "ok";
  }

  /**
   * Lists active FlareSolverr browser sessions.
   */
  public async listSessions(): Promise<string[]> {
    const endpoint = this.getApiUrl();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "sessions.list" }),
    });

    const data = (await res.json()) as FlareSolverrResponse;
    return data.sessions || [];
  }

  // ==========================================
  // CHALLENGE RESOLUTION & STEALTH FALLBACK
  // ==========================================

  /**
   * Detects if response HTML or status code is blocked by Cloudflare or DDoS-Guard.
   */
  public isCloudflareBlocked(htmlOrStatus: string | number, statusCode?: number): boolean {
    return isCloudflareBlocked(htmlOrStatus, statusCode);
  }

  /**
   * Builds realistic browser headers for stealth requests.
   */
  public buildStealthHeaders(
    urlOrDomain: string,
    options?: StealthHeaderOptions
  ): Record<string, string> {
    return buildStealthHeaders(urlOrDomain, options);
  }

  /**
   * Performs an HTTP fetch with realistic stealth headers and cached credentials.
   */
  public async stealthFetch(
    url: string,
    init: RequestInit = {}
  ): Promise<Response> {
    const stealthHeaders = buildStealthHeaders(url);
    const mergedHeaders: Record<string, string> = {
      ...stealthHeaders,
      ...(init.headers as Record<string, string> || {}),
    };

    return fetch(url, {
      ...init,
      headers: mergedHeaders,
    });
  }

  /**
   * Resolves Cloudflare Turnstile, JavaScript challenges, or DDOS-Guard.
   * 
   * Flow:
   * 1. Check if 30-minute cached `cf_clearance` & `User-Agent` exist for domain.
   * 2. If valid, attempts stealth fetch with cached cookies. If cleared, returns immediately.
   * 3. If no cache or challenge is renewed, calls FlareSolverr API (`request.get`/`request.post`).
   * 4. Upon FlareSolverr resolution, caches cookies & User-Agent for 30 minutes.
   * 5. If FlareSolverr server is offline, triggers fallback stealth request builder.
   */
  public async resolveChallenge(
    url: string,
    options: ResolveChallengeOptions = {}
  ): Promise<ResolveResult> {
    const startTime = performance.now();
    const domain = extractDomain(url);

    // 1. Check 30-min session cache
    if (!options.forceRefresh && domain) {
      const cached = this.getCachedSession(domain);
      if (cached && cached.cfClearance) {
        try {
          const stealthHeaders = buildStealthHeaders(url, {
            userAgent: cached.userAgent,
            customHeaders: options.headers,
          });

          const stealthRes = await fetch(url, {
            method: options.method || "GET",
            headers: stealthHeaders,
            body: options.postData
              ? typeof options.postData === "string"
                ? options.postData
                : JSON.stringify(options.postData)
              : undefined,
          });

          const text = await stealthRes.text();

          // Check if cached cookies successfully bypassed challenge
          if (!this.isCloudflareBlocked(text, stealthRes.status)) {
            return {
              success: true,
              status: stealthRes.status,
              html: text,
              cookies: cached.cookies,
              cookieString: cached.cookieString,
              userAgent: cached.userAgent,
              cfClearance: cached.cfClearance,
              solvedBy: "cache",
              executionTimeMs: Math.round(performance.now() - startTime),
            };
          }
        } catch {
          // In browser, CORS might prevent direct reading of text; proceed to FlareSolverr
        }
      }
    }

    // 2. Call FlareSolverr API
    const endpoint = this.getApiUrl();
    const cmd = options.method === "POST" ? "request.post" : "request.get";

    try {
      const controller = new AbortController();
      const timeoutMs = options.maxTimeout || 60000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs + 2000);

      const payload: Record<string, unknown> = {
        cmd,
        url,
        maxTimeout: timeoutMs,
      };

      if (options.sessionId) {
        payload.session = options.sessionId;
      }

      if (options.postData) {
        payload.postData =
          typeof options.postData === "string"
            ? options.postData
            : JSON.stringify(options.postData);
      }

      if (options.proxy) {
        payload.proxy = options.proxy;
      }

      if (options.returnOnlyCookies) {
        payload.returnOnlyCookies = options.returnOnlyCookies;
      }

      // Pass existing cookies if available
      if (domain) {
        const cached = this.getCachedSession(domain);
        if (cached && cached.cookies.length > 0) {
          payload.cookies = cached.cookies;
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as FlareSolverrResponse;

        if (data.status === "ok" && data.solution) {
          const solution = data.solution;
          const cookies = solution.cookies || [];
          const userAgent = solution.userAgent || DEFAULT_STEALTH_USER_AGENT;
          const cookieString = serializeCookies(cookies);
          const cfClearance = cookies.find(
            (c) => c.name.toLowerCase() === "cf_clearance"
          )?.value;

          // Cache in session store for 30 minutes
          if (domain) {
            this.setCachedSession(domain, {
              cookies,
              userAgent,
              cfClearance,
            });
          }

          return {
            success: true,
            status: solution.status || 200,
            html: solution.response || "",
            cookies,
            cookieString,
            userAgent,
            cfClearance,
            solvedBy: "flaresolverr",
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        } else {
          // FlareSolverr reported an error during solve
          const errMsg = data.message || "FlareSolverr failed to solve challenge";
          return this.handleFallback(url, options, startTime, errMsg);
        }
      } else {
        // FlareSolverr returned non-200 HTTP status
        return this.handleFallback(
          url,
          options,
          startTime,
          `FlareSolverr API returned status ${res.status}`
        );
      }
    } catch (err: unknown) {
      // FlareSolverr is OFFLINE or unreachable -> Fallback stealth request builder
      const errMsg = err instanceof Error ? err.message : String(err);
      return this.handleFallback(url, options, startTime, `FlareSolverr offline: ${errMsg}`);
    }
  }

  /**
   * Fallback stealth request builder invoked when FlareSolverr server is offline or fails.
   */
  private async handleFallback(
    url: string,
    options: ResolveChallengeOptions,
    startTime: number,
    originalError: string
  ): Promise<ResolveResult> {
    const domain = extractDomain(url);
    const cached = domain ? this.getCachedSession(domain) : null;
    const userAgent = cached?.userAgent || DEFAULT_STEALTH_USER_AGENT;

    const stealthHeaders = buildStealthHeaders(url, {
      userAgent,
      customHeaders: options.headers,
    });

    try {
      const res = await fetch(url, {
        method: options.method || "GET",
        headers: stealthHeaders,
        body: options.postData
          ? typeof options.postData === "string"
            ? options.postData
            : JSON.stringify(options.postData)
          : undefined,
      });

      const text = await res.text();
      const blocked = this.isCloudflareBlocked(text, res.status);

      return {
        success: !blocked,
        status: res.status,
        html: text,
        cookies: cached?.cookies || [],
        cookieString: cached?.cookieString || "",
        userAgent,
        cfClearance: cached?.cfClearance,
        solvedBy: "stealth_fallback",
        error: blocked
          ? `الموقع محمي بواسطة Cloudflare و FlareSolverr غير متصل: ${originalError}`
          : undefined,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    } catch (err: unknown) {
      const fetchError = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        status: 0,
        html: "",
        cookies: cached?.cookies || [],
        cookieString: cached?.cookieString || "",
        userAgent,
        cfClearance: cached?.cfClearance,
        solvedBy: "stealth_fallback",
        error: `تعذر الاتصال بخادم FlareSolverr وفشل الطلب المباشر: ${originalError} | ${fetchError}`,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }
}

// Global engine singleton export
export const flareSolverrEngine = new FlareSolverrEngine();
