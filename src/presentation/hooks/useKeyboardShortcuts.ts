import { useEffect } from 'react';
import type { LevelId } from '../../domain/iceberg.ts';
import type { ViewMode } from '../../domain/board-layout.ts';

export interface KeyboardShortcutsHandlers {
  totalCards: number;
  onStep: (delta: number) => void;
  onGo: (index: number) => void;
  onToggleCinema: () => void;
  onToggleMotion: () => void;
  onChooseView: (view: ViewMode) => void;
  onChooseLevel: (level: LevelId) => void;
  onExitCinema: () => void;
  onResetManual: () => void;
}

export function useKeyboardShortcuts({
  totalCards,
  onStep,
  onGo,
  onToggleCinema,
  onToggleMotion,
  onChooseView,
  onChooseLevel,
  onExitCinema,
  onResetManual,
}: KeyboardShortcutsHandlers) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
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
      } else if (event.code === 'KeyC') {
        onToggleCinema();
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
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    totalCards,
    onStep,
    onGo,
    onToggleCinema,
    onToggleMotion,
    onChooseView,
    onChooseLevel,
    onExitCinema,
    onResetManual,
  ]);
}
