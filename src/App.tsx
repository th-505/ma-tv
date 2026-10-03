import { useState, useCallback, useEffect, useRef } from "react";
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

type SearchMode = "mix" | "movie" | "series";
type View =
  | { type: "tab" }
  | { type: "details"; identity: ContentIdentity }
  | { type: "search"; mode: SearchMode }
  | { type: "player"; identity: ContentIdentity; source: PlaybackSource; allSources: RankedSource[]; episode?: EpisodeIdentity }
  | { type: "live"; name: string; url: string };

const VALID_TABS: TabId[] = ["home", "movies", "series", "live", "settings"];

function getInitialTab(): TabId {
  const saved = localStorage.getItem("matv_active_tab") as TabId | null;
  return saved && VALID_TABS.includes(saved) ? saved : "home";
}

function searchModeForTab(tab: TabId): SearchMode {
  return tab === "movies" ? "movie" : tab === "series" ? "series" : "mix";
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<TabId>(getInitialTab);
  const [view, setView] = useState<View>({ type: "tab" });
  const previousViewRef = useRef<View>({ type: "tab" });

  const setActiveTab = useCallback((tab: TabId) => {
    localStorage.setItem("matv_active_tab", tab);
    setActiveTabState(tab);
    setView({ type: "tab" });
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const savedTheme = localStorage.getItem("matv_theme") || "dark";
      const resolved = savedTheme === "system" ? (media.matches ? "dark" : "light") : savedTheme;
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.style.colorScheme = resolved;
    };

    applyTheme();
    media.addEventListener?.("change", applyTheme);
    return () => media.removeEventListener?.("change", applyTheme);
  }, []);

  const navigate = useCallback((next: View) => {
    setView((current) => {
      previousViewRef.current = current;
      return next;
    });
  }, []);

  const handleSelectContent = useCallback((identity: ContentIdentity) => {
    navigate({ type: "details", identity });
  }, [navigate]);

  const handleBack = useCallback(() => {
    setView((current) => {
      const previous = previousViewRef.current;

      if (current.type === "player" && previous.type === "details") {
        previousViewRef.current = { type: "tab" };
        return previous;
      }

      if (current.type === "details" && previous.type === "search") {
        previousViewRef.current = { type: "tab" };
        return previous;
      }

      previousViewRef.current = { type: "tab" };
      return { type: "tab" };
    });
  }, []);

  const handleSearchClick = useCallback((mode: SearchMode = "mix") => {
    navigate({ type: "search", mode });
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleSearchClick(searchModeForTab(activeTab));
      } else if (e.key === "/" && !isTyping && view.type !== "search") {
        e.preventDefault();
        handleSearchClick(searchModeForTab(activeTab));
      } else if (e.key === "Escape" && view.type !== "tab") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, view.type, handleSearchClick, handleBack]);

  const handlePlay = useCallback((
    identity: ContentIdentity,
    source: PlaybackSource,
    allSources: RankedSource[],
    episode?: EpisodeIdentity
  ) => {
    navigate({ type: "player", identity, source, allSources, episode });
  }, [navigate]);

  const handlePlayLive = useCallback((name: string, url: string) => {
    navigate({ type: "live", name, url });
  }, [navigate]);

  const shellSearch = () => handleSearchClick(searchModeForTab(activeTab));

  if (view.type === "player") {
    return <PlayerPage identity={view.identity} source={view.source} allSources={view.allSources} episode={view.episode} onBack={handleBack} />;
  }

  if (view.type === "live") {
    return (
      <PlayerPage
        identity={{ tmdbId: 0, mediaType: "movie", canonical: { title: view.name, overview: "", genres: [] } }}
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
    return <SearchPage onSelectContent={handleSelectContent} onClose={handleBack} initialMode={view.mode} />;
  }

  if (view.type === "details") {
    return (
      <AppShell activeTab={activeTab} onTabChange={setActiveTab} onSearchClick={shellSearch}>
        <DetailsPage identity={view.identity} onBack={handleBack} onPlay={handlePlay} onSelectContent={handleSelectContent} />
      </AppShell>
    );
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab} onSearchClick={shellSearch}>
      {activeTab === "home" && <HomePage onSelectContent={handleSelectContent} onSelectTab={setActiveTab} />}
      {activeTab === "movies" && <CatalogPage mediaType="movie" onSelectContent={handleSelectContent} />}
      {activeTab === "series" && <CatalogPage mediaType="series" onSelectContent={handleSelectContent} />}
      {activeTab === "live" && <LiveTvPage onPlayLive={handlePlayLive} />}
      {activeTab === "settings" && <SettingsPage onSelectContent={handleSelectContent} />}
    </AppShell>
  );
}
