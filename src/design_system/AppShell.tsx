import { type ReactNode } from "react";
import { Home, Film, Tv, Radio, Settings, Search } from "lucide-react";

export type TabId = "home" | "movies" | "series" | "live" | "settings";

interface TabConfig {
  id: TabId;
  label: string;
  labelAr: string;
  icon: typeof Home;
}

export const TABS: TabConfig[] = [
  { id: "home", label: "Home", labelAr: "الرئيسية", icon: Home },
  { id: "movies", label: "Movies", labelAr: "الأفلام", icon: Film },
  { id: "series", label: "Series", labelAr: "المسلسلات", icon: Tv },
  { id: "live", label: "Live TV", labelAr: "البث المباشر", icon: Radio },
  { id: "settings", label: "Settings", labelAr: "الإعدادات", icon: Settings },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="app-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--nav-height)",
        background: "rgba(10,10,11,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              transition: "all var(--transition-fast)",
              color: isActive ? "var(--gold-400)" : "var(--text-tertiary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 2}
              style={{
                filter: isActive ? "drop-shadow(0 0 8px rgba(212,175,55,0.4))" : "none",
                transition: "all var(--transition-fast)",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: isActive ? 600 : 500,
                fontFamily: "var(--font-arabic)",
              }}
            >
              {tab.labelAr}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function SidebarNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <aside
      className="app-sidebar-nav"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "80px",
        background: "rgba(10,10,11,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderLeft: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "20px",
        paddingBottom: "20px",
        gap: "18px",
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: "var(--gold-400)",
          fontFamily: "var(--font-display)",
          marginBottom: "16px",
          letterSpacing: "-0.5px",
        }}
      >
        4BA
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", alignItems: "center" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                width: "64px",
                padding: "10px 4px",
                borderRadius: "var(--radius-lg)",
                transition: "all var(--transition-fast)",
                color: isActive ? "var(--gold-400)" : "var(--text-tertiary)",
                background: isActive ? "rgba(212,175,55,0.12)" : "transparent",
                border: isActive ? "1px solid rgba(212,175,55,0.25)" : "1px solid transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                style={{
                  filter: isActive ? "drop-shadow(0 0 8px rgba(212,175,55,0.5))" : "none",
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: "var(--font-arabic)",
                  textAlign: "center",
                }}
              >
                {tab.labelAr}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

interface AppShellProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onSearchClick?: () => void;
}

export function AppShell({ children, activeTab, onTabChange, onSearchClick }: AppShellProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Top search bar */}
      {onSearchClick && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(10,10,11,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--gold-400)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.5px",
            }}
          >
            4BA
          </div>
          <button
            onClick={onSearchClick}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-tertiary)",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              textAlign: "right",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-gold)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            <Search size={18} />
            <span style={{ fontFamily: "var(--font-arabic)" }}>ابحث عن فيلم أو مسلسل... (Ctrl+K)</span>
          </button>
        </div>
      )}
      <main
        className="app-main-content"
        style={{
          maxWidth: "var(--content-max-width)",
          margin: "0 auto",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      <SidebarNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
