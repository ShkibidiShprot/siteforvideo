import React, { useState } from 'react';
import { Search, Table, Scan, Eye, X } from 'lucide-react';
import { CHAPTERS } from './cardsData';

interface TimelineHUDProps {
  currentChapterId: number;
  currentCardId: number;
  viewMode: 'card' | 'chapter' | 'overview';
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectChapter: (chapterId: number) => void;
  onToggleOverview: () => void;
  onToggleTableView: () => void;
  onToggleCinema: () => void;
  onFocusCurrentCard: () => void;
}

export const TimelineHUD: React.FC<TimelineHUDProps> = ({
  currentChapterId,
  viewMode,
  searchQuery,
  onSearchChange,
  onSelectChapter,
  onToggleOverview,
  onToggleTableView,
  onToggleCinema,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3 max-w-[1920px] mx-auto w-full pointer-events-auto">
        {/* Left: Project Branding */}
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-sm tracking-wider text-white uppercase">
                BACKROOMS FPS
              </h1>
              <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-[10px] font-mono font-bold text-red-400 uppercase">
                Монтажна карта
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              58 карток · 6 глав + пролог · Айсберг
            </p>
          </div>
        </div>

        {/* Center: Chapter Fast-Jump Pills */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-xl">
          {CHAPTERS.map((ch) => {
            const isSelected = ch.id === currentChapterId;
            return (
              <button
                key={ch.id}
                onClick={() => onSelectChapter(ch.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs transition-all ${
                  isSelected
                    ? `${ch.badgeBg} ${ch.badgeText} font-bold shadow-sm border border-current/30 scale-105`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{ch.shortTitle}</span>
                <span className="text-[10px] opacity-60">({ch.cardsRange})</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-xl">
          {/* Search Trigger / Input */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center bg-slate-800 rounded-xl px-2.5 py-1 border border-slate-700">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Швидкий пошук..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none w-36 sm:w-48 font-sans"
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    onSearchChange('');
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                title="Пошук (Натисніть /)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 text-xs font-mono transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Пошук</span>
                <kbd className="hidden md:inline px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                  /
                </kbd>
              </button>
            )}
          </div>

          {/* Table Mode */}
          <button
            onClick={onToggleTableView}
            title="Табличний план (T)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 text-xs font-mono transition-colors"
          >
            <Table className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Таблиця</span>
          </button>

          {/* Overview Toggle */}
          <button
            onClick={onToggleOverview}
            title="Огляд усієї дошки (O)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors ${
              viewMode === 'overview'
                ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Огляд</span>
          </button>

          {/* Cinema Mode */}
          <button
            onClick={onToggleCinema}
            title="Режим кіно (C)"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
