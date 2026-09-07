import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Copy, Check, Hash, Layers, RefreshCw, Bookmark } from 'lucide-react';
import type { ComputedCard } from './boardLayout';
import { CHAPTERS } from './cardsData';

interface CardComponentProps {
  card: ComputedCard;
  isActive: boolean;
  isPast: boolean;
  searchMatch?: boolean;
  onSelect: (cardId: number) => void;
  onOpenDetails: (card: ComputedCard) => void;
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  isActive,
  isPast,
  searchMatch,
  onSelect,
  onOpenDetails,
}) => {
  const [copied, setCopied] = useState(false);
  const chapter = CHAPTERS.find((ch) => ch.id === card.chapterId) || CHAPTERS[0];

  const handleCopyVO = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(card.voiceover);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{
        left: card.x,
        top: card.y,
        width: card.width,
        height: card.height,
        zIndex: isActive ? 40 : 10,
      }}
      initial={false}
      animate={{
        scale: isActive ? 1.03 : 1,
        filter: isActive
          ? 'brightness(1.1) contrast(1.05)'
          : isPast
          ? 'brightness(0.95)'
          : 'brightness(0.85)',
      }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      onClick={() => onSelect(card.id)}
      onDoubleClick={() => onOpenDetails(card)}
    >
      {/* Top Pin / Cable connector dot */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-6 h-6 rounded-full border border-slate-700 bg-slate-900 shadow-md"
        style={{
          boxShadow: isActive ? `0 0 12px ${chapter.accentColor}` : undefined,
        }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
          style={{
            backgroundColor: isActive ? chapter.accentColor : isPast ? '#ef4444' : '#475569',
          }}
        />
      </div>

      {/* Main Card Surface */}
      <div
        className={`w-full h-full rounded-xl p-4 flex flex-col justify-between transition-all duration-300 ${
          isActive
            ? 'storyboard-card active-card ring-2 ring-red-500/80 bg-slate-900/95'
            : searchMatch
            ? 'storyboard-card ring-2 ring-amber-400 bg-slate-900/90'
            : 'storyboard-card hover:border-slate-600/80 bg-slate-950/80'
        }`}
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: chapter.accentColor,
        }}
      >
        {/* Row 1: Header (Number Badge + Tier Badge + Chapter Tag + Quick Copy) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Card Number */}
            <div
              className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-md font-mono text-xs font-black tracking-wider uppercase shadow-sm"
              style={{
                backgroundColor: `${chapter.accentColor}25`,
                color: chapter.accentColor,
                border: `1px solid ${chapter.accentColor}50`,
              }}
            >
              <Hash className="w-3 h-3 -mr-0.5 opacity-80" />
              <span>{card.numStr}</span>
            </div>

            {/* Iceberg Tier */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/60 text-[10.5px] font-mono text-slate-300">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>{card.tier}</span>
            </div>
          </div>

          {/* VO Copy Action Button */}
          <button
            onClick={handleCopyVO}
            title="Копіювати текст начитки"
            className="group/copy flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Скопійовано</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 opacity-60 group-hover/copy:opacity-100" />
                <span className="hidden sm:inline opacity-75">Начитка</span>
              </>
            )}
          </button>
        </div>

        {/* Row 2: Photo Title (Головний заголовок / Назва для фото) - LARGEST & HIGHEST CONTRAST */}
        <div className="my-auto py-1">
          <h4 className="font-sans font-black text-[16.5px] leading-snug tracking-tight text-white line-clamp-2 uppercase drop-shadow-sm">
            «{card.photoTitle}»
          </h4>

          {/* Working Title (Звичайна назва) */}
          <div className="flex items-center gap-1.5 mt-1 text-[11.5px] text-slate-400 font-medium">
            <Bookmark className="w-3 h-3 shrink-0 text-slate-500" />
            <span className="truncate">
              <span className="text-slate-500">Назва:</span> {card.name}
            </span>
          </div>
        </div>

        {/* Row 3: Voiceover Block (Текст для начитки) - PROMINENT CALLOUT */}
        <div className="rounded-lg bg-slate-800/70 border border-slate-700/60 p-2.5 shadow-inner">
          <div className="flex items-start gap-1.5">
            <div className="p-1 rounded bg-red-500/15 text-red-400 shrink-0 mt-0.5">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <p className="font-sans font-semibold text-[13px] leading-snug text-amber-100/95 tracking-wide italic">
              «{card.voiceover}»
            </p>
          </div>
        </div>

        {/* Row 4: Footer (Запасна назва) */}
        <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] text-slate-400 font-mono">
          <div className="flex items-center gap-1 truncate pr-2">
            <RefreshCw className="w-2.5 h-2.5 text-slate-500 shrink-0" />
            <span className="text-slate-500">Запасна:</span>
            <span className="text-slate-300 truncate">«{card.backupTitle}»</span>
          </div>

          <span className="text-[10px] text-slate-600 uppercase shrink-0 font-sans">
            {chapter.shortTitle}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
