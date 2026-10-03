export interface LiveChannel {
  channelId: string;
  name: string;
  logo?: string;
  country: string;
  category?: string;
  sources: LiveSource[];
}

export interface LiveSource {
  providerId: string;
  sourceId: string;
  url: string;
  quality: string;
  audioTracks?: string[];
  health: string;
}

export interface LiveHealthState {
  channelId: string;
  sourceId: string;
  status: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  lastChecked: string;
  latencyMs?: number;
}

export interface MatchEvent {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  tournament: string;
  channels: string[];
  logoHome?: string;
  logoAway?: string;
}
