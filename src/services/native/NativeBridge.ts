import { Capacitor, CapacitorHttp, SystemBars } from '@capacitor/core';
import type { HttpOptions, HttpResponse } from '@capacitor/core';

export type NativePlatform = 'android_tv' | 'android' | 'ios' | 'electron' | 'web';

export interface NativeFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  data?: any;
  body?: any;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  connectTimeout?: number;
  readTimeout?: number;
  timeout?: number;
  signal?: AbortSignal;
  useProxyOnWeb?: boolean;
  corsProxyUrl?: string;
}

export interface NativeFetchResponse<T = any> {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  url: string;
  json: () => Promise<T>;
  text: () => Promise<string>;
  blob: () => Promise<Blob>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export interface NativeStorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getJSON<T>(key: string, fallback: T): Promise<T>;
  setJSON<T>(key: string, value: T): Promise<void>;
}

export interface FullscreenService {
  requestFullscreen(): Promise<boolean>;
  exitFullscreen(): Promise<boolean>;
  toggleFullscreen(): Promise<boolean>;
  isFullscreen(): boolean;
  keepScreenAwake(enable: boolean): Promise<boolean>;
}

const TV_OVERRIDE_KEY = 'matv_tv_mode_override';
const DEFAULT_CORS_PROXY = 'https://corsproxy.io/?';

const memoryStorage = new Map<string, string>();
let wakeLockSentinel: any = null;

function checkIsAndroidTv(): boolean {
  if (typeof window === 'undefined') return false;

  const override = getTvModeOverride();
  if (override !== null) return override;

  const ua = (window.navigator?.userAgent || '').toLowerCase();
  const tvKeywords = [
    'android tv',
    'androidtv',
    'smart-tv',
    'smarttv',
    'googletv',
    'google tv',
    'large screen',
    'mibox',
    'shield android tv',
    'firetv',
    'aftt',
    'aftm',
    'aftb',
    'afts',
    'bravia',
    'hbbtv',
    'appletv',
  ];

  const hasTvKeyword = tvKeywords.some((kw) => ua.includes(kw));
  const isAndroid = ua.includes('android');

  if (isAndroid && (hasTvKeyword || ua.includes('tv') || ua.includes('box'))) {
    return true;
  }

  return hasTvKeyword;
}

function checkIsElectron(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  if (w.electron || w.electronAPI || w.process?.versions?.electron) {
    return true;
  }
  const ua = (window.navigator?.userAgent || '').toLowerCase();
  return ua.includes('electron');
}

export function getTvModeOverride(): boolean | null {
  try {
    if (typeof window === 'undefined') return null;
    const val = window.localStorage.getItem(TV_OVERRIDE_KEY);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

export function setTvModeOverride(enable: boolean | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (enable === null) {
      window.localStorage.removeItem(TV_OVERRIDE_KEY);
    } else {
      window.localStorage.setItem(TV_OVERRIDE_KEY, enable ? 'true' : 'false');
    }
  } catch {
    // ignore
  }
}

export function getPlatform(): NativePlatform {
  if (checkIsAndroidTv()) return 'android_tv';
  if (checkIsElectron()) return 'electron';

  if (Capacitor.isNativePlatform()) {
    const capPlatform = Capacitor.getPlatform();
    if (capPlatform === 'android') return 'android';
    if (capPlatform === 'ios') return 'ios';
  }

  return 'web';
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform() || checkIsElectron();
}

export function isCapacitor(): boolean {
  return Capacitor.isPluginAvailable('CapacitorHttp') || Capacitor.isNativePlatform();
}

export function isAndroid(): boolean {
  const p = getPlatform();
  return p === 'android' || p === 'android_tv';
}

export function isAndroidTv(): boolean {
  return getPlatform() === 'android_tv';
}

export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

export function isElectron(): boolean {
  return getPlatform() === 'electron';
}

export function isWeb(): boolean {
  return getPlatform() === 'web';
}

function filterForbiddenWebHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) return {};
  const forbidden = new Set([
    'referer',
    'user-agent',
    'origin',
    'host',
    'cookie',
    'cookie2',
    'connection',
    'keep-alive',
    'content-length',
    'date',
    'expect',
  ]);

  const safe: Record<string, string> = {};
  for (const [key, val] of Object.entries(headers)) {
    if (!forbidden.has(key.toLowerCase())) {
      safe[key] = val;
    }
  }
  return safe;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

export async function nativeFetch<T = any>(
  url: string,
  options: NativeFetchOptions = {}
): Promise<NativeFetchResponse<T>> {
  const method = (options.method || 'GET').toUpperCase();
  const requestBody = options.data ?? options.body;
  const timeoutMs = options.timeout ?? options.connectTimeout ?? options.readTimeout ?? 15000;

  if (Capacitor.isNativePlatform()) {
    try {
      const httpOptions: HttpOptions = {
        url,
        method,
        headers: options.headers || {},
        params: options.params,
        data: requestBody,
        responseType: options.responseType || 'text',
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      };

      const res: HttpResponse = await CapacitorHttp.request(httpOptions);
      const isOk = res.status >= 200 && res.status < 300;

      const rawData = res.data;
      const headersMap: Record<string, string> = {};
      if (res.headers) {
        for (const [k, v] of Object.entries(res.headers)) {
          headersMap[k.toLowerCase()] = String(v);
        }
      }

      return {
        ok: isOk,
        status: res.status,
        statusText: isOk ? 'OK' : `Status ${res.status}`,
        headers: headersMap,
        data: rawData as T,
        url: res.url || url,
        json: async () => {
          if (typeof rawData === 'string') {
            try {
              return JSON.parse(rawData);
            } catch {
              return rawData as any;
            }
          }
          return rawData as T;
        },
        text: async () => {
          if (typeof rawData === 'string') return rawData;
          return JSON.stringify(rawData);
        },
        blob: async () => {
          const str = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
          return new Blob([str]);
        },
        arrayBuffer: async () => {
          if (rawData instanceof ArrayBuffer) return rawData;
          const str = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
          const encoder = new TextEncoder();
          return encoder.encode(str).buffer;
        },
      };
    } catch (err: any) {
      console.warn('[NativeBridge] CapacitorHttp failed, attempting fallback:', err);
    }
  }

  if (checkIsElectron()) {
    const w = window as any;
    if (typeof w.electron?.nativeFetch === 'function') {
      try {
        const electronRes = await w.electron.nativeFetch(url, options);
        return electronRes;
      } catch (err) {
        console.warn('[NativeBridge] Electron bridge failed, falling back:', err);
      }
    }
  }

  let targetUrl = url;
  let requestHeaders = filterForbiddenWebHeaders(options.headers);

  if (options.params && Object.keys(options.params).length > 0) {
    const parsedUrl = new URL(targetUrl, window.location.href);
    for (const [k, v] of Object.entries(options.params)) {
      parsedUrl.searchParams.set(k, v);
    }
    targetUrl = parsedUrl.toString();
  }

  if (options.useProxyOnWeb) {
    const proxy = options.corsProxyUrl || DEFAULT_CORS_PROXY;
    targetUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    let bodyPayload: BodyInit | undefined = undefined;
    if (requestBody !== undefined && method !== 'GET' && method !== 'HEAD') {
      if (typeof requestBody === 'string' || requestBody instanceof FormData || requestBody instanceof Blob) {
        bodyPayload = requestBody;
      } else {
        bodyPayload = JSON.stringify(requestBody);
        if (!requestHeaders['content-type']) {
          requestHeaders['content-type'] = 'application/json';
        }
      }
    }

    const webRes = await fetch(targetUrl, {
      method,
      headers: requestHeaders,
      body: bodyPayload,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const textContent = await webRes.text();
    let parsedData: any = textContent;

    if (options.responseType === 'json') {
      try {
        parsedData = JSON.parse(textContent);
      } catch {
        parsedData = textContent;
      }
    }

    return {
      ok: webRes.ok,
      status: webRes.status,
      statusText: webRes.statusText,
      headers: headersToRecord(webRes.headers),
      data: parsedData as T,
      url: webRes.url || targetUrl,
      json: async () => {
        try {
          return JSON.parse(textContent);
        } catch {
          return textContent as any;
        }
      },
      text: async () => textContent,
      blob: async () => new Blob([textContent]),
      arrayBuffer: async () => {
        const encoder = new TextEncoder();
        return encoder.encode(textContent).buffer;
      },
    };
  } catch (err: any) {
    clearTimeout(timer);
    throw new Error(`[NativeBridge WebFetch Error]: ${err?.message || 'Network request failed'}`);
  }
}

export const nativeStorage: NativeStorageService = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // ignore
    }
    return memoryStorage.get(key) ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // ignore
    }
    memoryStorage.set(key, value);
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    memoryStorage.delete(key);
  },

  async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // ignore
    }
    memoryStorage.clear();
  },

  async getJSON<T>(key: string, fallback: T): Promise<T> {
    const raw = await this.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  async setJSON<T>(key: string, value: T): Promise<void> {
    const raw = JSON.stringify(value);
    await this.setItem(key, raw);
  },
};

export const nativeFullscreen: FullscreenService = {
  async requestFullscreen(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await SystemBars.hide();
        } catch (e) {
          console.debug('[NativeBridge] SystemBars.hide error:', e);
        }
      }

      if (typeof document !== 'undefined') {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
          return true;
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
          return true;
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
          return true;
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn('[NativeBridge] Fullscreen request failed:', err);
      return false;
    }
  },

  async exitFullscreen(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await SystemBars.show();
        } catch (e) {
          console.debug('[NativeBridge] SystemBars.show error:', e);
        }
      }

      if (typeof document !== 'undefined' && document.fullscreenElement) {
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
          return true;
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
          return true;
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
          return true;
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn('[NativeBridge] Fullscreen exit failed:', err);
      return false;
    }
  },

  async toggleFullscreen(): Promise<boolean> {
    if (this.isFullscreen()) {
      return this.exitFullscreen();
    }
    return this.requestFullscreen();
  },

  isFullscreen(): boolean {
    if (typeof document === 'undefined') return false;
    const doc = document as any;
    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  },

  async keepScreenAwake(enable: boolean): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }
    try {
      if (enable) {
        if (!wakeLockSentinel) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          wakeLockSentinel.addEventListener('release', () => {
            wakeLockSentinel = null;
          });
        }
        return true;
      } else {
        if (wakeLockSentinel) {
          await wakeLockSentinel.release();
          wakeLockSentinel = null;
        }
        return true;
      }
    } catch (err) {
      console.warn('[NativeBridge] WakeLock request failed:', err);
      return false;
    }
  },
};

export const NativeBridge = {
  getPlatform,
  isNative,
  isCapacitor,
  isAndroid,
  isAndroidTv,
  isIOS,
  isElectron,
  isWeb,
  getTvModeOverride,
  setTvModeOverride,
  fetch: nativeFetch,
  storage: nativeStorage,
  fullscreen: nativeFullscreen,
};

export default NativeBridge;
