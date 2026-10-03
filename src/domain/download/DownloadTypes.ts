export type DownloadState =
  | "QUEUED"
  | "DOWNLOADING"
  | "PAUSED"
  | "VERIFYING"
  | "MUXING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface DownloadJob {
  contentId: number;
  providerId: string;
  sourceId: string;
  quality: string;
  audio: string;
  subtitle?: string;
  downloadedBytes: number;
  totalBytes: number;
  progress: number;
  speed: number;
  resumable: boolean;
  tempFiles: string[];
  finalFile?: string;
  state: DownloadState;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceProfile {
  cpuClass: "low" | "mid" | "high";
  ramClass: "low" | "mid" | "high";
  storageClass: "low" | "mid" | "high";
  freeStorageBytes: number;
  thermalState: "nominal" | "fair" | "serious" | "critical";
  batteryLevel?: number;
  architecture: string;
  platform: string;
}

export interface MuxDecision {
  strategy: "mux" | "sidecar";
  reason: string;
  requiresTranscoding: boolean;
}
