import { useState, useCallback, useEffect } from "react";
import { AppShell, type TabId } from "./design_system/AppShell";
import { HomePage } from "./features/home/HomePage";
import { CatalogPage } from "./features/movies/CatalogPage";
import { LiveTvPage } from "./features/live_tv/LiveTvPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { DetailsPage } from "./features/details/DetailsPage";
import { SearchPage } from "./features/search/SearchPage";
import { PlayerPage } from "./features/player/PlayerPage";
import type { ContentIdentity, EpisodeIdentity } from "./domain/content/ContentIdentity";
import type { RankedSource, PlaybackSource } from "./domain/playback/PlaybackSource";

type View =
  | { type: "tab" }
  | { type: "details"; identity: ContentIdentity }
  | { type: "search"; mode: "mix" | "movie" | "series" }
  | { type: "player"; identity: ContentIdentity; source: PlaybackSource; allSources: RankedSource[]; episode?: EpisodeIdentity }
  | { type: "live"; name: string; url: string };

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [view, setView] = useState<View>({ type: "tab" });

  // Initialize and synchronize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("matv_theme") || "dark";
    if (savedTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const handleSelectContent = useCallback((identity: ContentIdentity) => {
    setView({ type: "details", identity });
  }, []);

  const handleBack = useCallback(() => {
    setView({ type: "tab" });
  }, []);

  const handleSearchClick = useCallback((mode: "mix" | "movie" | "series" = "mix") => {
    setView({ type: "search", mode });
  }, []);

  // Keyboard Shortcuts (Ctrl+K or / for Search, Escape for Back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleSearchClick("mix");
      } else if (e.key === "Escape") {
        if (view.type !== "tab") {
          handleBack();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, handleSearchClick, handleBack]);

  const handlePlay = useCallback((
    identity: ContentIdentity,
    source: PlaybackSource,
    allSources: RankedSource[],
    episode?: EpisodeIdentity
  ) => {
    setView({ type: "player", identity, source, allSources, episode });
  }, []);

  const handlePlayLive = useCallback((name: string, url: string) => {
    setView({ type: "live", name, url });
  }, []);

  if (view.type === "player") {
    return (
      <PlayerPage
        identity={view.identity}
        source={view.source}
        allSources={view.allSources}
        episode={view.episode}
        onBack={handleBack}
      />
    );
  }

  if (view.type === "live") {
    return (
      <PlayerPage
        identity={{
          tmdbId: 0,
          mediaType: "movie",
          canonical: { title: view.name, overview: "", genres: [] },
        }}
        source={{
          providerId: "live-hls",
          sourceId: "live",
          url: view.url,
          quality: "unknown",
          audioLanguage: "ar",
          hasSubtitles: false,
          resolvedAt: new Date().toISOString(),
          qualityConfidence: "UNVERIFIED",
        }}
        onBack={handleBack}
      />
    );
  }

  if (view.type === "search") {
    return (
      <SearchPage
        onSelectContent={handleSelectContent}
        onClose={handleBack}
        initialMode={view.mode}
      />
    );
  }

  if (view.type === "details") {
    return (
      <AppShell activeTab={activeTab} onTabChange={setActiveTab} onSearchClick={() => handleSearchClick(activeTab === "movies" ? "movie" : activeTab === "series" ? "series" : "mix")}>
        <DetailsPage
          identity={view.identity}
          onBack={handleBack}
          onPlay={handlePlay}
          onSelectContent={handleSelectContent}
        />
      </AppShell>
    );
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab} onSearchClick={() => handleSearchClick(activeTab === "movies" ? "movie" : activeTab === "series" ? "series" : "mix")}>
      {activeTab === "home" && <HomePage onSelectContent={handleSelectContent} onSelectTab={setActiveTab} />}
      {activeTab === "movies" && <CatalogPage mediaType="movie" onSelectContent={handleSelectContent} />}
      {activeTab === "series" && <CatalogPage mediaType="series" onSelectContent={handleSelectContent} />}
      {activeTab === "live" && <LiveTvPage onPlayLive={handlePlayLive} />}
      {activeTab === "settings" && <SettingsPage onSelectContent={handleSelectContent} />}
    </AppShell>
  );
}
