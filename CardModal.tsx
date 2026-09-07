import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Mic, Layers, Bookmark, RefreshCw, ChevronLeft, ChevronRight, Clock, FileText } from 'lucide-react';
import type { ComputedCard } from './boardLayout';
import { CHAPTERS } from './cardsData';

interface CardModalProps {
  card: ComputedCard | null;
  onClose: () => void;
  onSelectNext: () => void;
  onSelectPrev: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  card,
  onClose,
  onSelectNext,
  onSelectPrev,
}) => {
  const [copied, setCopied] = useState(false);
  const [recorded, setRecorded] = useState<Record<number, boolean>>({});

  if (!card) return null;

  const chapter = CHAPTERS.find((c) => c.id === card.chapterId) || CHAPTERS[0];

  const wordCount = card.voiceover.trim().split(/\s+/).length;
  const charCount = card.voiceover.length;
  const estSeconds = Math.max(1.2, Number((wordCount / 2.2).toFixed(1)));

  const handleCopyVO = () => {
    navigator.clipboard.writeText(card.voiceover);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRecorded = recorded[card.id] || false;
  const toggleRecorded = () => {
    setRecorded((prev) => ({ ...prev, [card.id]: !prev[card.id] }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Container */}
        <motion.div
          className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-red-950/20 overflow-hidden z-10 flex flex-col"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25 }}
        >
          {/* Top Bar with Chapter Accent */}
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: chapter.accentColor }}
          />

          {/* Modal Header */}
          <div className="p-6 pb-4 border-b border-slate-800 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-xl border shadow-inner"
                style={{
                  backgroundColor: `${chapter.accentColor}20`,
                  borderColor: `${chapter.accentColor}50`,
                  color: chapter.accentColor,
                }}
              >
                #{card.numStr}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${chapter.badgeBg} ${chapter.badgeText} border border-current/20`}
                  >
                    {chapter.shortTitle}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                    <Layers className="w-3 h-3 text-slate-400" />
                    {card.tier}
                  </span>
                </div>
                <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">
                  «{card.photoTitle}»
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
            {/* 1. Voiceover Box (Prominent Teleprompter view) */}
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-5 relative group">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Точний текст для начитки у відео</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    ~{estSeconds} сек
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    {wordCount} слів ({charCount} симв.)
                  </span>
                </div>
              </div>

              <p className="font-sans font-bold text-xl sm:text-2xl text-amber-100 leading-relaxed tracking-wide italic my-2">
                «{card.voiceover}»
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                <button
                  onClick={handleCopyVO}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Текст скопійовано в буфер!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Скопіювати для диктора</span>
                    </>
                  )}
                </button>

                <button
                  onClick={toggleRecorded}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${
                    isRecorded
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${isRecorded ? 'text-emerald-400' : 'opacity-40'}`} />
                  <span>{isRecorded ? 'Озвучено (Готово)' : 'Позначити як озвучене'}</span>
                </button>
              </div>
            </div>

            {/* 2. Structured Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Working Name */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-700/60 text-slate-300 shrink-0">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Звичайна / Робоча назва:
                  </span>
                  <span className="font-sans font-bold text-slate-100 text-sm mt-0.5 block truncate">
                    {card.name}
                  </span>
                </div>
              </div>

              {/* Backup Title */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-700/60 text-slate-300 shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Запасна назва з плану:
                  </span>
                  <span className="font-sans font-bold text-slate-100 text-sm mt-0.5 block truncate">
                    «{card.backupTitle}»
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Production Context Info */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="truncate">
                Розділ: <span className="text-slate-200 font-semibold">{chapter.title}</span>
              </span>
              <span className="shrink-0 text-slate-500">
                Картка {card.id} з 58
              </span>
            </div>
          </div>

          {/* Modal Footer (Prev / Next Quick Stepper) */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onSelectPrev}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Попередня картка</span>
            </button>

            <span className="font-mono text-xs text-slate-500">
              {card.id} / 58
            </span>

            <button
              onClick={onSelectNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-colors"
            >
              <span>Наступна картка</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
