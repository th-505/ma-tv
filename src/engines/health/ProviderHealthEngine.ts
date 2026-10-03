import type { HealthStatus } from "../../domain/provider/ProviderManifest";
import type { ProviderCapability } from "../../domain/provider/ProviderManifest";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerEntry {
  providerId: string;
  capability: ProviderCapability;
  state: CircuitState;
  failureCount: number;
  lastFailureAt?: string;
  cooldownUntil?: string;
}

export interface ProviderHealthEntry {
  providerId: string;
  capabilities: Record<string, HealthStatus>;
  lastUpdated: string;
}

export interface ProviderHealthEngine {
  getHealth(providerId: string): ProviderHealthEntry | undefined;
  updateHealth(providerId: string, capability: string, status: HealthStatus): void;
  getCircuitState(providerId: string, capability: ProviderCapability): CircuitState;
  recordFailure(providerId: string, capability: ProviderCapability): void;
  recordSuccess(providerId: string, capability: ProviderCapability): void;
}

export function createProviderHealthEngine(
  failureThreshold = 3,
  cooldownMs = 30000
): ProviderHealthEngine {
  const healthMap = new Map<string, ProviderHealthEntry>();
  const circuitMap = new Map<string, CircuitBreakerEntry>();

  function key(providerId: string, capability: string): string {
    return `${providerId}:${capability}`;
  }

  return {
    getHealth(providerId) {
      return healthMap.get(providerId);
    },
    updateHealth(providerId, capability, status) {
      let entry = healthMap.get(providerId);
      if (!entry) {
        entry = {
          providerId,
          capabilities: {},
          lastUpdated: new Date().toISOString(),
        };
        healthMap.set(providerId, entry);
      }
      entry.capabilities[capability] = status;
      entry.lastUpdated = new Date().toISOString();
    },
    getCircuitState(providerId, capability) {
      const entry = circuitMap.get(key(providerId, capability));
      if (!entry) return "CLOSED";
      if (entry.state === "OPEN") {
        if (entry.cooldownUntil && new Date() > new Date(entry.cooldownUntil)) {
          entry.state = "HALF_OPEN";
          return "HALF_OPEN";
        }
        return "OPEN";
      }
      return entry.state;
    },
    recordFailure(providerId, capability) {
      const k = key(providerId, capability);
      let entry = circuitMap.get(k);
      if (!entry) {
        entry = {
          providerId,
          capability,
          state: "CLOSED",
          failureCount: 0,
        };
        circuitMap.set(k, entry);
      }
      entry.failureCount++;
      entry.lastFailureAt = new Date().toISOString();
      if (entry.failureCount >= failureThreshold) {
        entry.state = "OPEN";
        entry.cooldownUntil = new Date(Date.now() + cooldownMs).toISOString();
      }
    },
    recordSuccess(providerId, capability) {
      const k = key(providerId, capability);
      const entry = circuitMap.get(k);
      if (entry) {
        entry.state = "CLOSED";
        entry.failureCount = 0;
        entry.cooldownUntil = undefined;
      }
    },
  };
}
