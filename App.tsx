import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CHAPTERS } from './cardsData';
import {
  computeBoardLayout,
  type ComputedCard,
} from './boardLayout';
import { CardComponent } from './CardComponent';
import { ChapterHeaderComponent } from './ChapterHeaderComponent';
import { TimelineSpineComponent } from './TimelineSpineComponent';
import { TimelineHUD } from './TimelineHUD';
import { TimelineControls } from './TimelineControls';
import { CardModal } from './CardModal';
import { ScriptTableView } from './ScriptTableView';

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'card' | 'chapter' | 'overview'>('card');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playDurationMs, setPlayDurationMs] = useState(4500);
  const [isCinema, setIsCinema] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [modalCard, setModalCard] = useState<ComputedCard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [windowSize, setWindowSize] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1920,
    h: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }));

  // Compute Layout
  const layout = useMemo(() => computeBoardLayout(), []);
  const activeCard = layout.computedCards[currentIndex] || layout.computedCards[0];
  const activeChapter =
    layout.computedChapters.find((ch) => ch.id === activeCard.chapterId) ||
    layout.computedChapters[0];

  // Window resize handler
  useEffect(() => {
    const onResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Navigation handlers
  const goToCard = useCallback((cardId: number) => {
    const idx = layout.computedCards.findIndex((c) => c.id === cardId);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setViewMode('card');
    }
  }, [layout.computedCards]);

  const nextCard = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % layout.computedCards.length);
  }, [layout.computedCards.length]);

  const prevCard = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + layout.computedCards.length) % layout.computedCards.length);
  }, [layout.computedCards.length]);

  const selectChapter = useCallback((chapterId: number) => {
    const firstCardInCh = layout.computedCards.find((c) => c.chapterId === chapterId);
    if (firstCardInCh) {
      const idx = layout.computedCards.findIndex((c) => c.id === firstCardInCh.id);
      if (idx !== -1) setCurrentIndex(idx);
    }
    setViewMode('chapter');
  }, [layout.computedCards]);

  // Autoplay loop
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      nextCard();
    }, playDurationMs);
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, playDurationMs, nextCard]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextCard();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevCard();
          break;
        case 'ArrowDown':
          e.preventDefault();
          {
            const nextChId = (activeCard.chapterId + 1) % CHAPTERS.length;
            selectChapter(nextChId);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          {
            const prevChId = (activeCard.chapterId - 1 + CHAPTERS.length) % CHAPTERS.length;
            selectChapter(prevChId);
          }
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case 'o':
        case 'O':
        case 'о':
        case 'О':
        case 'щ':
        case 'Щ':
          e.preventDefault();
          setViewMode((m) => (m === 'overview' ? 'card' : 'overview'));
          break;
        case 'z':
        case 'Z':
        case 'я':
        case 'Я':
          e.preventDefault();
          setViewMode((m) => (m === 'chapter' ? 'card' : 'chapter'));
          break;
        case 't':
        case 'T':
        case 'е':
        case 'Е':
          e.preventDefault();
          setIsTableOpen((o) => !o);
          break;
        case 'c':
        case 'C':
        case 'с':
        case 'С':
          e.preventDefault();
          setIsCinema((c) => !c);
          break;
        case 'Escape':
          setModalCard(null);
          setIsTableOpen(false);
          setIsCinema(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard, activeCard.chapterId, selectChapter]);

  // Camera Coordinate Math
  const { camX, camY, camScale, transitionDur } = useMemo(() => {
    const vw = windowSize.w;
    const vh = windowSize.h;

    if (viewMode === 'overview') {
      const scale = Math.min((vw * 0.94) / layout.BOARD_WIDTH, (vh * 0.94) / layout.BOARD_HEIGHT);
      return {
        camX: (vw - layout.BOARD_WIDTH * scale) / 2,
        camY: 40,
        camScale: Math.max(0.18, scale),
        transitionDur: 1.1,
      };
    }

    if (viewMode === 'chapter') {
      const ch = activeChapter;
      const scale = Math.min(
        (vw * 0.88) / ch.width,
        (vh * 0.78) / ch.height
      );
      const clampedScale = Math.min(Math.max(scale, 0.42), 1.05);
      return {
        camX: vw / 2 - ch.centerX * clampedScale,
        camY: vh / 2 - ch.centerY * clampedScale,
        camScale: clampedScale,
        transitionDur: 0.9,
      };
    }

    // Default: Focus Card Mode
    const focusScale = Math.min(Math.max((vw * 0.85) / activeCard.width, 0.75), 1.28);
    return {
      camX: vw / 2 - activeCard.centerX * focusScale,
      camY: vh * 0.44 - activeCard.centerY * focusScale,
      camScale: focusScale,
      transitionDur: 0.75,
    };
  }, [viewMode, windowSize, activeCard, activeChapter, layout]);

  // Search filter matches
  const searchMatchedIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<number>();
    const q = searchQuery.toLowerCase();
    const matches = new Set<number>();
    layout.computedCards.forEach((c) => {
      if (
        c.numStr.includes(q) ||
        c.photoTitle.toLowerCase().includes(q) ||
        c.voiceover.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.backupTitle.toLowerCase().includes(q)
      ) {
        matches.add(c.id);
      }
    });
    return matches;
  }, [searchQuery, layout.computedCards]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0c10] select-none text-slate-100 font-sans">
      {/* Background Archival Grid Pattern */}
      <div className="absolute inset-0 bg-archival-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-archival-dots opacity-30 pointer-events-none" />

      {/* Top HUD */}
      <AnimatePresence>
        {!isCinema && (
          <TimelineHUD
            currentChapterId={activeCard.chapterId}
            currentCardId={activeCard.id}
            viewMode={viewMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectChapter={selectChapter}
            onToggleOverview={() =>
              setViewMode((m) => (m === 'overview' ? 'card' : 'overview'))
            }
            onToggleTableView={() => setIsTableOpen(true)}
            onToggleCinema={() => setIsCinema(true)}
            onFocusCurrentCard={() => setViewMode('card')}
          />
        )}
      </AnimatePresence>

      {/* 2D Infinite Canvas with Camera Transitions */}
      <motion.div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: layout.BOARD_WIDTH,
          height: layout.BOARD_HEIGHT,
        }}
        animate={{
          x: camX,
          y: camY,
          scale: camScale,
        }}
        transition={{
          duration: transitionDur,
          ease: [0.25, 1, 0.35, 1],
        }}
      >
        {/* SVG Timeline Path (Laser Cable) */}
        <TimelineSpineComponent
          boardWidth={layout.BOARD_WIDTH}
          boardHeight={layout.BOARD_HEIGHT}
          segments={layout.segments}
          activeCardId={activeCard.id}
          activeCard={activeCard}
        />

        {/* Chapter Headers */}
        {layout.computedChapters.map((chapter) => (
          <ChapterHeaderComponent
            key={chapter.id}
            chapter={chapter}
            isCurrentChapter={activeCard.chapterId === chapter.id}
            onFocusChapter={selectChapter}
          />
        ))}

        {/* All 58 Cards */}
        {layout.computedCards.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            isActive={card.id === activeCard.id}
            isPast={card.id < activeCard.id}
            searchMatch={searchMatchedIds.has(card.id)}
            onSelect={(id) => {
              goToCard(id);
              setViewMode('card');
            }}
            onOpenDetails={(c) => setModalCard(c)}
          />
        ))}
      </motion.div>

      {/* Bottom Floating Control Dock */}
      <AnimatePresence>
        {!isCinema && (
          <TimelineControls
            currentCard={activeCard}
            currentIndex={currentIndex}
            totalCards={layout.computedCards.length}
            isPlaying={isPlaying}
            playDurationMs={playDurationMs}
            viewMode={viewMode}
            onPrev={prevCard}
            onNext={nextCard}
            onSelectIndex={(idx) => {
              setCurrentIndex(idx);
              setViewMode('card');
            }}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onChangePlaySpeed={setPlayDurationMs}
            onToggleOverview={() =>
              setViewMode((m) => (m === 'overview' ? 'card' : 'overview'))
            }
            onToggleChapterView={() =>
              setViewMode((m) => (m === 'chapter' ? 'card' : 'chapter'))
            }
            onOpenDetails={() => setModalCard(activeCard)}
          />
        )}
      </AnimatePresence>

      {/* Cinema Mode Exit Button */}
      <AnimatePresence>
        {isCinema && (
          <motion.button
            onClick={() => setIsCinema(false)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-6 right-6 z-50 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow-2xl backdrop-blur-md transition-all"
            title="Вийти з режиму кіно (Esc або C)"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Detail Modal / Script Inspector */}
      <CardModal
        card={modalCard}
        onClose={() => setModalCard(null)}
        onSelectNext={() => {
          if (!modalCard) return;
          const nextIdx = modalCard.id % layout.computedCards.length;
          setModalCard(layout.computedCards[nextIdx]);
          setCurrentIndex(nextIdx);
        }}
        onSelectPrev={() => {
          if (!modalCard) return;
          const prevIdx =
            (modalCard.id - 2 + layout.computedCards.length) % layout.computedCards.length;
          setModalCard(layout.computedCards[prevIdx]);
          setCurrentIndex(prevIdx);
        }}
      />

      {/* Spreadsheet / Table View */}
      <ScriptTableView
        isOpen={isTableOpen}
        onClose={() => setIsTableOpen(false)}
        onSelectCard={(id) => {
          goToCard(id);
        }}
      />

      {/* Film Grain & Cinematic Vignette */}
      <div className="grain-overlay pointer-events-none fixed inset-0 z-30" />
      <div className="vignette-overlay pointer-events-none fixed inset-0 z-30" />
    </div>
  );
}
