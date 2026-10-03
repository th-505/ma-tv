import type { ProviderManifest, ProviderCapability, PlatformSupport } from "../../domain/provider/ProviderManifest";

export interface ProviderRegistry {
  register(manifest: ProviderManifest): void;
  unregister(providerId: string): void;
  get(providerId: string): ProviderManifest | undefined;
  getAll(): ProviderManifest[];
  getByCapability(capability: ProviderCapability): ProviderManifest[];
  getByPlatform(platform: PlatformSupport): ProviderManifest[];
}

export function createProviderRegistry(): ProviderRegistry {
  const registry = new Map<string, ProviderManifest>();

  return {
    register(manifest: ProviderManifest) {
      registry.set(manifest.providerId, manifest);
    },
    unregister(providerId: string) {
      registry.delete(providerId);
    },
    get(providerId: string) {
      return registry.get(providerId);
    },
    getAll() {
      return Array.from(registry.values());
    },
    getByCapability(capability: ProviderCapability) {
      return Array.from(registry.values()).filter((m) =>
        m.capabilities.includes(capability)
      );
    },
    getByPlatform(platform: PlatformSupport) {
      return Array.from(registry.values()).filter((m) =>
        m.platformSupport.includes(platform)
      );
    },
  };
}
