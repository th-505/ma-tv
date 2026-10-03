import type { ProviderManifest } from "../../domain/provider/ProviderManifest";
import type { ProviderRequestProfile, EffectiveRequestProfile, RequestProfileType } from "../../domain/provider/RequestProfile";
import { DEFAULT_PROFILES } from "../../domain/provider/RequestProfile";

export interface PlatformPolicyValidator {
  validate(
    manifest: ProviderManifest,
    profileType: RequestProfileType,
    platform: string
  ): EffectiveRequestProfile;
}

export function createPlatformPolicyValidator(): PlatformPolicyValidator {
  return {
    validate(manifest, profileType, platform) {
      const base: ProviderRequestProfile =
        DEFAULT_PROFILES[profileType] ?? DEFAULT_PROFILES.discovery;

      const notes: string[] = [];
      let adjusted = { ...base, headers: { ...base.headers } };
      let platformAdjusted = false;

      if (platform === "web") {
        if (base.refererPolicy !== "none") {
          notes.push("Web platform cannot set custom Referer headers");
          adjusted.refererPolicy = "none";
          adjusted.customReferer = undefined;
          platformAdjusted = true;
        }
        notes.push("Web sandbox enforces CORS — cross-origin requests may be blocked");
      }

      if (!manifest.platformSupport.includes(platform as any)) {
        notes.push(`Provider ${manifest.providerId} does not declare support for ${platform}`);
        platformAdjusted = true;
      }

      return {
        ...adjusted,
        platformAdjusted,
        platformNotes: notes,
      };
    },
  };
}
