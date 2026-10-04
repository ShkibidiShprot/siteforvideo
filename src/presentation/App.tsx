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
import corkTexture from '../assets/cork-texture.jpg';
import { adjacentIndex, cards, levels, type LevelId } from '../domain/iceberg.ts';
import {
  fitCamera,
  manualFromCamera,
  viewBounds,
  zoomCamera,
  type Camera,
  type ViewMode,
} from '../domain/board-layout.ts';
import { useMotionPreference } from '../application/use-motion-preference.ts';
import { BoardScene } from './components/BoardScene.tsx';
import { AppControls } from './components/AppControls.tsx';
import { StageOverlays } from './components/StageOverlays.tsx';
import { useStageGesture } from './hooks/useStageGesture.ts';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.ts';

export default function App() {
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<ViewMode>('card');
  const [cinema, setCinema] = useState(false);
  const [cinemaControls, setCinemaControls] = useState(false);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [travelling, setTravelling] = useState(false);

  const renderedCamera = useRef<Camera | null>(null);
  const zoomOutput = useRef<HTMLOutputElement>(null);
  const stage = useRef<HTMLElement>(null);
  const cinemaTimer = useRef<number | undefined>(undefined);

  const motion = useMotionPreference();
  const active = cards[index];
  const chapter = levels[active.level];

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
  });

  useEffect(() => {
    resetManual();
  }, [size.width, size.height, resetManual]);

  const go = useCallback((nextIndex: number) => {
    setIndex(adjacentIndex(nextIndex, 0));
    setView('card');
    resetManual();
  }, [resetManual]);

  const step = useCallback((delta: number) => {
    setIndex((current) => adjacentIndex(current, delta));
    setView('card');
    resetManual();
  }, [resetManual]);

  const chooseLevel = useCallback((level: LevelId) => {
    setIndex(levels[level].first - 1);
    setView(window.innerWidth <= 800 ? 'card' : 'level');
    resetManual();
  }, [resetManual]);

  const chooseView = useCallback((nextView: ViewMode) => {
    setView(nextView);
    resetManual();
  }, [resetManual]);

  const selectCard = useCallback((id: number) => {
    if (id !== active.id || view !== 'card') go(id - 1);
  }, [active.id, view, go]);

  const toggleCinema = useCallback(() => {
    setCinema((current) => !current);
    setView('card');
    resetManual();
  }, [resetManual]);

  const exitCinema = useCallback(() => setCinema(false), []);

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

  useKeyboardShortcuts({
    totalCards: cards.length,
    onStep: step,
    onGo: go,
    onToggleCinema: toggleCinema,
    onToggleMotion: motion.toggle,
    onChooseView: chooseView,
    onChooseLevel: chooseLevel,
    onExitCinema: exitCinema,
    onResetManual: resetManual,
  });

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || (event.target instanceof Element && event.target.closest('[data-board-ui]'))) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const factor = Math.exp(-Math.max(-120, Math.min(120, event.deltaY)) * 0.0025);
      const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      setManual((current) => zoomCamera(
        base,
        renderedCamera.current ? manualFromCamera(base, renderedCamera.current, size) : current,
        size,
        factor,
        cursor
      ));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [base, size, setManual]);

  return (
    <div
      className={`app-shell${cinema ? ' is-cinema' : ''}${cinemaControls ? ' cinema-controls-visible' : ''}`}
      style={{
        '--cork-image': `url(${corkImg})`,
        '--cork-texture': `url(${corkTexture})`,
      } as CSSProperties}
      data-animations={motion.enabled}
      data-travelling={travelling}
    >
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
          animate={motion.enabled}
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
          motionEnabled={motion.enabled}
          onStep={step}
          onChooseView={chooseView}
          onChooseLevel={chooseLevel}
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
    </div>
  );
}
