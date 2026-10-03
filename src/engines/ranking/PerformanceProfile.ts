export interface ProviderPerformanceProfile {
  providerId: string;
  successRateEMA: number;
  startupLatencyEMA: number;
  bufferingRateEMA: number;
  qualitySuccess: number;
  subtitleSuccess: number;
  contentClass: string;
  deviceClass: string;
  networkClass: string;
  lastUpdated: string;
}

export function createPerformanceProfile(providerId: string): ProviderPerformanceProfile {
  return {
    providerId,
    successRateEMA: 0.8,
    startupLatencyEMA: 1000,
    bufferingRateEMA: 1,
    qualitySuccess: 0.75,
    subtitleSuccess: 0.7,
    contentClass: "movie",
    deviceClass: "web",
    networkClass: "wifi",
    lastUpdated: new Date().toISOString(),
  };
}

export function updateEMA(current: number, newValue: number, alpha = 0.3): number {
  return current * (1 - alpha) + newValue * alpha;
}
