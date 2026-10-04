import { memo } from 'react';
import { Search, FileText, CircleHelp } from 'lucide-react';

export interface AppHeaderProps {
  onGoHome: () => void;
  onOpenSearch: () => void;
  onOpenDetails: () => void;
  onOpenHelp: () => void;
}

export const AppHeader = memo(function AppHeader({
  onGoHome,
  onOpenSearch,
  onOpenDetails,
  onOpenHelp,
}: AppHeaderProps) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="brand"
        onClick={onGoHome}
        aria-label="Повернутися до прологу"
      >
        <svg width="35" height="38" viewBox="0 0 35 38" fill="none" aria-hidden="true">
          <path d="m7 8 21 6L11 30 7 8Z" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 8q15 2 21 6M11 30q5-12 17-16" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="7" cy="8" r="3" fill="currentColor" />
          <circle cx="28" cy="14" r="3" fill="currentColor" />
          <circle cx="11" cy="30" r="3" fill="currentColor" />
        </svg>
        <span className="brand-copy">
          <strong>НИТКИ</strong>
          <span>BACKROOMS FPS</span>
        </span>
      </button>

      <div className="project-label">
        <span>МОНТАЖНА ДОШКА</span>
        <span className="project-slash">/</span>
        <span>АЙСБЕРГ</span>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="search-trigger"
          onClick={onOpenSearch}
          aria-label="Відкрити пошук карток"
          title="Знайти картку · /"
        >
          <Search size={17} />
          <span>Пошук</span>
          <kbd>/</kbd>
        </button>

        <button
          type="button"
          className="script-trigger"
          onClick={onOpenDetails}
          aria-label="Відкрити аркуш начитки"
          title="Аркуш начитки · N"
        >
          <FileText size={16} />
          <span>Начитка</span>
        </button>

        <button
          type="button"
          className="icon-button mobile-help"
          onClick={onOpenHelp}
          aria-label="Керування та гарячі клавіші"
          title="Керування"
        >
          <CircleHelp size={18} />
        </button>
      </div>
    </header>
  );
});
