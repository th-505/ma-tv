import type { ProviderManifest } from "../domain/provider/ProviderManifest";
import { createProviderRegistry, type ProviderRegistry } from "../providers/registry/ProviderRegistry";
import { RealProviderAdapter, type ProviderAdapter } from "../providers/adapters/RealProviderAdapter";
import { generateProviderCatalog } from "../providers/ProviderCatalog";

let registry: ProviderRegistry | null = null;
let adapters: Map<string, ProviderAdapter> | null = null;
let manifests: ProviderManifest[] | null = null;

function getManifests(): ProviderManifest[] {
  if (!manifests) {
    manifests = generateProviderCatalog();
  }
  return manifests;
}

export function getProviderRegistry(): ProviderRegistry {
  if (!registry) {
    registry = createProviderRegistry();
    for (const manifest of getManifests()) {
      registry.register(manifest);
    }
  }
  return registry;
}

export function getProviderAdapters(): Map<string, ProviderAdapter> {
  if (!adapters) {
    adapters = new Map();
    for (const manifest of getManifests()) {
      adapters.set(manifest.providerId, new RealProviderAdapter(manifest));
    }
  }
  return adapters;
}

export function getProviderCount(): number {
  return getManifests().length;
}
