import { useEffect } from 'react';
import type { LevelId } from '../../domain/iceberg.ts';
import type { ViewMode } from '../../domain/board-layout.ts';

export interface KeyboardShortcutsHandlers {
  hasModal: boolean;
  totalCards: number;
  onStep: (delta: number) => void;
  onGo: (index: number) => void;
  onTogglePlay: () => void;
  onToggleCinema: () => void;
  onToggleMotion: () => void;
  onChooseView: (view: ViewMode) => void;
  onChooseLevel: (level: LevelId) => void;
  onOpenSearch: () => void;
  onOpenDetails: () => void;
  onOpenHelp: () => void;
  onExitCinema: () => void;
  onResetManual: () => void;
}

export function useKeyboardShortcuts({
  hasModal,
  totalCards,
  onStep,
  onGo,
  onTogglePlay,
  onToggleCinema,
  onToggleMotion,
  onChooseView,
  onChooseLevel,
  onOpenSearch,
  onOpenDetails,
  onOpenHelp,
  onExitCinema,
  onResetManual,
}: KeyboardShortcutsHandlers) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || hasModal) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyK') {
        event.preventDefault();
        onOpenSearch();
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onStep(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onStep(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        onGo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        onGo(totalCards - 1);
      } else if (event.code === 'Space') {
        if (target instanceof HTMLElement && target.closest('button, a, [role="button"]')) return;
        event.preventDefault();
        onTogglePlay();
      } else if (event.key === '/') {
        event.preventDefault();
        onOpenSearch();
      } else if (event.code === 'KeyC') {
        onToggleCinema();
      } else if (event.code === 'KeyN') {
        onOpenDetails();
      } else if (event.code === 'KeyA') {
        onToggleMotion();
      } else if (event.code === 'KeyF') {
        onChooseView('card');
      } else if (event.code === 'KeyL') {
        onChooseView('level');
      } else if (event.code === 'KeyO') {
        onChooseView('all');
      } else if (event.key === 'Escape') {
        onExitCinema();
        onResetManual();
      } else if (/^[0-6]$/.test(event.key)) {
        onChooseLevel(Number(event.key) as LevelId);
      } else if (event.key === '?') {
        onOpenHelp();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    hasModal,
    totalCards,
    onStep,
    onGo,
    onTogglePlay,
    onToggleCinema,
    onToggleMotion,
    onChooseView,
    onChooseLevel,
    onOpenSearch,
    onOpenDetails,
    onOpenHelp,
    onExitCinema,
    onResetManual,
  ]);
}
