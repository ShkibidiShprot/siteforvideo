import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { X } from 'lucide-react';
import corkImg from '../assets/cork-bg.jpg';
import {
  adjacentIndex,
  cards,
  levels,
  type LevelId,
} from '../domain/iceberg.ts';
import {
  fitCamera,
  manualFromCamera,
  viewBounds, zoomCamera,
  type Camera,
  type ViewMode,
} from '../domain/board-layout.ts';
import { downloadPlan } from '../application/download-plan.ts';
import { useMotionPreference } from '../application/use-motion-preference.ts';
import { BoardScene } from './components/BoardScene.tsx';
import { AppHeader } from './components/AppHeader.tsx';
import { AppSidebar } from './components/AppSidebar.tsx';
import { AppControls } from './components/AppControls.tsx';
import { StageOverlays } from './components/StageOverlays.tsx';
import { SearchDialog } from './dialogs/SearchDialog.tsx';
import { DetailsDialog } from './dialogs/DetailsDialog.tsx';
import { HelpDialog } from './dialogs/HelpDialog.tsx';
import { useStageGesture } from './hooks/useStageGesture.ts';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.ts';

type Modal = 'search' | 'details' | 'help' | null;

export default function App() {
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<ViewMode>('card');
  const [modal, setModal] = useState<Modal>(null);
  const [playing, setPlaying] = useState(false);
  const [playMs, setPlayMs] = useState(6000);
  const [cinema, setCinema] = useState(false);
  const [cinemaControls, setCinemaControls] = useState(false);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [travelling, setTravelling] = useState(false);

  const renderedCamera = useRef<Camera | null>(null);
  const zoomOutput = useRef<HTMLOutputElement>(null);
  const stage = useRef<HTMLElement>(null);
  const levelList = useRef<HTMLElement>(null);
  const cinemaTimer = useRef<number | undefined>(undefined);

  const motion = useMotionPreference();
  const active = cards[index];
  const chapter = levels[active.level];

  // Stage size measurement
  useLayoutEffect(() => {
    const element = stage.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [cinema]);

  const base = useMemo(
    () => fitCamera(viewBounds(view, index), size, view === 'card' ? 1.65 : 1.15),
    [view, index, size]
  );

  const stopAutoplay = useCallback(() => setPlaying(false), []);

  const {
    camera,
    isFreeCamera,
    dragging,
    resetManual,
    zoom,
    startDrag,
    moveDrag,
    endDrag,
    suppressClick,
    setManual,
  } = useStageGesture({
    baseCamera: base,
    size,
    renderedCameraRef: renderedCamera,
    onStopAutoplay: stopAutoplay,
  });

  useEffect(() => {
    resetManual();
  }, [size.width, size.height, resetManual]);

  // Mobile chapter scroll sync
  useEffect(() => {
    if (window.innerWidth <= 800) {
      levelList.current
        ?.querySelector(`[data-level="${active.level}"]`)
        ?.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: motion.enabled ? 'smooth' : 'instant',
        });
    }
  }, [active.level, motion.enabled, cinema]);

  // Navigation commands
  const go = useCallback(
    (nextIndex: number) => {
      setIndex(adjacentIndex(nextIndex, 0));
      setView('card');
      resetManual();
    },
    [resetManual]
  );

  const step = useCallback(
    (delta: number) => {
      setIndex((current) => adjacentIndex(current, delta));
      setView('card');
      resetManual();
    },
    [resetManual]
  );

  const chooseLevel = useCallback(
    (level: LevelId) => {
      setIndex(levels[level].first - 1);
      setView(window.innerWidth <= 800 ? 'card' : 'level');
      setPlaying(false);
      resetManual();
    },
    [resetManual]
  );

  const chooseView = useCallback(
    (nextView: ViewMode) => {
      setView(nextView);
      setPlaying(false);
      resetManual();
    },
    [resetManual]
  );

  const openModal = useCallback((nextModal: Modal) => {
    setPlaying(false);
    setModal(nextModal);
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  const selectCard = useCallback(
    (id: number) => {
      if (id === active.id && view === 'card') openModal('details');
      else go(id - 1);
    },
    [active.id, view, openModal, go]
  );

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false);
    } else {
      if (index === cards.length - 1) go(0);
      setView('card');
      resetManual();
      setPlaying(true);
    }
  }, [playing, index, go, resetManual]);

  // Autoplay progression
  useEffect(() => {
    if (!playing || travelling) return;
    const timer = window.setTimeout(() => {
      if (index === cards.length - 1) setPlaying(false);
      else step(1);
    }, playMs);
    return () => window.clearTimeout(timer);
  }, [playing, travelling, index, playMs, step]);

  // Pause on visibility change
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const toggleCinema = useCallback(() => {
    setCinema((current) => !current);
    setView('card');
    resetManual();
  }, [resetManual]);

  const exitCinema = useCallback(() => setCinema(false), []);

  // Cinema control visibility timer
  const wakeCinemaControls = useCallback(() => {
    if (!cinema) return;
    window.clearTimeout(cinemaTimer.current);
    setCinemaControls(true);
    cinemaTimer.current = window.setTimeout(() => setCinemaControls(false), 2000);
  }, [cinema]);

  useEffect(() => {
    wakeCinemaControls();
    return () => window.clearTimeout(cinemaTimer.current);
  }, [wakeCinemaControls]);

  // Keyboard navigation
  useKeyboardShortcuts({
    hasModal: modal !== null,
    totalCards: cards.length,
    onStep: step,
    onGo: go,
    onTogglePlay: togglePlay,
    onToggleCinema: toggleCinema,
    onToggleMotion: motion.toggle,
    onChooseView: chooseView,
    onChooseLevel: chooseLevel,
    onOpenSearch: () => openModal('search'),
    onOpenDetails: () => openModal('details'),
    onOpenHelp: () => openModal('help'),
    onExitCinema: exitCinema,
    onResetManual: resetManual,
  });

  // Wheel zoom
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        modal ||
        (event.target instanceof Element && event.target.closest('[data-board-ui]'))
      ) {
        return;
      }
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const factor = Math.exp(-Math.max(-120, Math.min(120, event.deltaY)) * 0.0025);
      setPlaying(false);
      const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      setManual((current) =>
        zoomCamera(
          base,
          renderedCamera.current ? manualFromCamera(base, renderedCamera.current, size) : current,
          size,
          factor,
          cursor
        )
      );
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [base, size, modal, setManual]);

  return (
    <div
      className={`app-shell${cinema ? ' is-cinema' : ''}${cinemaControls ? ' cinema-controls-visible' : ''}`}
      style={{ '--cork-image': `url(${corkImg})` } as CSSProperties}
      data-playing={playing}
      data-animations={motion.enabled}
      data-travelling={travelling}
    >
      {!cinema && (
        <>
          <AppHeader
            onGoHome={() => {
              go(0);
              setPlaying(false);
            }}
            onOpenSearch={() => openModal('search')}
            onOpenDetails={() => openModal('details')}
            onOpenHelp={() => openModal('help')}
          />

          <AppSidebar
            activeLevel={active.level}
            levelListRef={levelList}
            onSelectLevel={chooseLevel}
            onDownloadPlan={downloadPlan}
            onOpenHelp={() => openModal('help')}
          />
        </>
      )}

      <main
        ref={stage}
        className={`stage${dragging ? ' is-dragging' : ''}`}
        tabIndex={0}
        aria-label="Дошка айсберга Backrooms FPS"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        <BoardScene
          activeIndex={index}
          view={view}
          target={camera}
          viewport={size}
          immediate={dragging || isFreeCamera}
          animate={motion.enabled && modal === null}
          cameraRef={renderedCamera}
          zoomOutput={zoomOutput}
          onMovingChange={setTravelling}
          onSelect={selectCard}
          onLevel={chooseLevel}
        />

        {!cinema && (
          <StageOverlays
            view={view}
            chapter={chapter}
            activeCard={active}
            totalCards={cards.length}
            zoomOutputRef={zoomOutput}
            travelling={travelling}
            freeCamera={isFreeCamera}
            playing={playing}
            playMs={playMs}
            onZoom={zoom}
            onResetManual={resetManual}
          />
        )}
      </main>

      {!cinema && (
        <AppControls
          activeCard={active}
          activeIndex={index}
          view={view}
          playing={playing}
          playMs={playMs}
          motionEnabled={motion.enabled}
          onStep={step}
          onOpenSearch={() => openModal('search')}
          onChooseView={chooseView}
          onChooseLevel={chooseLevel}
          onTogglePlay={togglePlay}
          onChangePlayMs={setPlayMs}
          onToggleMotion={motion.toggle}
          onToggleCinema={toggleCinema}
        />
      )}

      {cinema && (
        <button
          type="button"
          className="cinema-exit"
          onClick={exitCinema}
          onFocus={() => setCinemaControls(true)}
          aria-label="Вийти з кінорежиму"
        >
          <X size={17} />
          <span>Повернути керування</span>
          <kbd>Esc</kbd>
        </button>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {chapter.heading}. Картка {active.id} із {cards.length}: {active.title}
      </span>

      {modal === 'search' && (
        <SearchDialog
          open
          onClose={closeModal}
          onSelect={(id) => {
            closeModal();
            go(id - 1);
          }}
        />
      )}

      {modal === 'details' && (
        <DetailsDialog open onClose={closeModal} card={active} onStep={step} />
      )}

      {modal === 'help' && (
        <HelpDialog
          open
          onClose={closeModal}
          motionPreference={motion.preference}
          onMotionPreference={motion.setPreference}
        />
      )}
    </div>
  );
}
