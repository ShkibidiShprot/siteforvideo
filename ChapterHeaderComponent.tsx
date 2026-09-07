import React from 'react';
import { Film, Layers, Compass, ChevronDown } from 'lucide-react';
import type { ComputedChapter } from './boardLayout';

interface ChapterHeaderComponentProps {
  chapter: ComputedChapter;
  isCurrentChapter: boolean;
  onFocusChapter: (chapterId: number) => void;
}

export const ChapterHeaderComponent: React.FC<ChapterHeaderComponentProps> = ({
  chapter,
  isCurrentChapter,
  onFocusChapter,
}) => {
  return (
    <div
      className="absolute select-none pointer-events-auto"
      style={{
        left: chapter.x,
        top: chapter.y,
        width: chapter.width,
        height: 120,
        zIndex: 15,
      }}
    >
      <div
        className={`w-full h-full rounded-2xl p-5 flex items-center justify-between gap-6 transition-all duration-300 backdrop-blur-md bg-gradient-to-r ${
          chapter.bgGradient
        } border ${
          isCurrentChapter
            ? `border-slate-500 shadow-2xl shadow-black ring-1 ring-${chapter.accentColor}/40`
            : 'border-slate-800/80 shadow-lg shadow-black/60'
        }`}
        style={{
          borderTopWidth: '3px',
          borderTopColor: chapter.accentColor,
        }}
      >
        {/* Left Side: Chapter Number + Title + Subtitle */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Chapter Icon / Number Plaque */}
          <div
            className="w-14 h-14 rounded-xl flex flex-col items-center justify-center font-mono font-black shrink-0 border shadow-inner"
            style={{
              backgroundColor: `${chapter.accentColor}18`,
              borderColor: `${chapter.accentColor}40`,
              color: chapter.accentColor,
            }}
          >
            <span className="text-[10px] uppercase tracking-widest opacity-80 font-sans font-bold">ГЛАВА</span>
            <span className="text-xl leading-none font-extrabold">{chapter.id === 0 ? '00' : `0${chapter.id}`}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase ${chapter.badgeBg} ${chapter.badgeText} border border-current/20`}
              >
                {chapter.shortTitle}
              </span>

              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 text-[11px] font-mono border border-slate-700/60">
                <Layers className="w-3 h-3 text-slate-400" />
                {chapter.tierName}
              </span>

              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-400 text-[11px] font-mono border border-slate-800">
                <Film className="w-3 h-3 text-slate-500" />
                Картки {chapter.cardsRange} ({chapter.cardCount})
              </span>
            </div>

            <h2 className="font-display font-extrabold text-2xl tracking-tight text-white truncate drop-shadow">
              {chapter.title}
            </h2>

            <p className="text-xs text-slate-400 font-sans truncate max-w-2xl mt-0.5">
              {chapter.description}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Button */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={() => onFocusChapter(chapter.id)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700 text-xs font-mono font-medium transition-all hover:scale-105 shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-red-400" />
            <span>Огляд глави</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>
      </div>
    </div>
  );
};
