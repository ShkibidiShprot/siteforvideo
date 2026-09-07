import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Scan,
  Layers,
  FileText,
} from 'lucide-react';
import type { ComputedCard } from './boardLayout';
import { CHAPTERS, CARDS_DATA } from './cardsData';

interface TimelineControlsProps {
  currentCard: ComputedCard;
  currentIndex: number;
  totalCards: number;
  isPlaying: boolean;
  playDurationMs: number;
  viewMode: 'card' | 'chapter' | 'overview';
  onPrev: () => void;
  onNext: () => void;
  onSelectIndex: (idx: number) => void;
  onTogglePlay: () => void;
  onChangePlaySpeed: (ms: number) => void;
  onToggleOverview: () => void;
  onOpenDetails: () => void;
  onToggleChapterView: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentCard,
  currentIndex,
  totalCards,
  isPlaying,
  playDurationMs,
  viewMode,
  onPrev,
  onNext,
  onSelectIndex,
  onTogglePlay,
  onChangePlaySpeed,
  onToggleOverview,
  onOpenDetails,
  onToggleChapterView,
}) => {
  const currentChapter = CHAPTERS.find((ch) => ch.id === currentCard.chapterId) || CHAPTERS[0];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl select-none pointer-events-auto">
      <div className="relative rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-3 sm:p-4 shadow-2xl shadow-black/80 flex flex-col gap-3">
        {/* Top Mini Scrubber / All 58 Pips */}
        <div className="flex items-center gap-1 sm:gap-1.5 justify-between px-1 overflow-x-auto py-1">
          {CARDS_DATA.map((card, idx) => {
            const ch = CHAPTERS.find((c) => c.id === card.chapterId) || CHAPTERS[0];
            const isCurrent = idx === currentIndex;
            const isPassed = idx < currentIndex;

            return (
              <button
                key={card.id}
                onClick={() => onSelectIndex(idx)}
                title={`#${card.numStr}: ${card.photoTitle}`}
                className={`group relative h-4 transition-all duration-300 rounded-full flex items-center justify-center ${
                  isCurrent
                    ? 'w-6 sm:w-8 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                    : 'w-2 sm:w-2.5 hover:w-4 bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isCurrent
                      ? 'bg-white'
                      : isPassed
                      ? 'bg-slate-400'
                      : 'bg-slate-600'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? '#ffffff' : isPassed ? ch.accentColor : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {/* Left: Previous / Next Stepper & Counter */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 active:scale-95"
              aria-label="Попередня картка"
              title="Попередня картка (Стрілка вліво)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={onNext}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 active:scale-95"
              aria-label="Наступна картка"
              title="Наступна картка (Стрілка вправо)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Counter Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
              <span className="font-bold text-white">#{currentCard.numStr}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{String(totalCards).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Center: Current Card Info Callout */}
          <div
            onClick={onOpenDetails}
            className="flex-1 min-w-[200px] cursor-pointer group px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-between gap-3"
          >
            <div className="truncate text-left">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: currentChapter.accentColor }}
                />
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider truncate">
                  {currentChapter.shortTitle} · {currentCard.tier}
                </span>
              </div>
              <p className="text-xs font-bold text-white uppercase truncate group-hover:text-red-400 transition-colors">
                «{currentCard.photoTitle}»
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-slate-400 group-hover:text-white">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Деталі</span>
            </div>
          </div>

          {/* Right: Autoplay & View Modes */}
          <div className="flex items-center gap-2">
            {/* Autoplay Play/Pause */}
            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-md active:scale-95 ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
              title="Автопоказ таймлайну (Пробіл)"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{isPlaying ? 'Пауза' : 'Автопоказ'}</span>
            </button>

            {/* Autoplay Speed Switcher */}
            <button
              onClick={() => {
                const speeds = [3000, 5000, 7500];
                const nextSpeed = speeds[(speeds.indexOf(playDurationMs) + 1) % speeds.length];
                onChangePlaySpeed(nextSpeed);
              }}
              title="Швидкість автопоказу"
              className="px-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-colors border border-slate-700"
            >
              {(playDurationMs / 1000).toFixed(0)}с
            </button>

            {/* Chapter Zoom View Toggle */}
            <button
              onClick={onToggleChapterView}
              title="Фокус на главі (Z)"
              className={`p-2 rounded-xl border text-xs font-mono transition-colors ${
                viewMode === 'chapter'
                  ? 'bg-slate-700 border-slate-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Full Overview Toggle */}
            <button
              onClick={onToggleOverview}
              title="Огляд усієї дошки (O)"
              className={`p-2 rounded-xl border text-xs font-mono transition-colors ${
                viewMode === 'overview'
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Scan className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Autoplay Animated Progress Bar */}
        {isPlaying && (
          <div className="absolute -bottom-1 left-4 right-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              key={`play-prog-${currentIndex}`}
              className="h-full bg-gradient-to-r from-red-500 to-amber-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: playDurationMs / 1000, ease: 'linear' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
