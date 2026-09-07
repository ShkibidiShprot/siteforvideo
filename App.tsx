import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { useMotionPreference } from './use-motion-preference';
import { ArrowDownToLine, ChevronLeft, ChevronRight, CircleHelp, FileText, Focus, Layers3, Maximize, MoveUpRight, Pause, Play, Scan, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import corkImg from './cork-texture.jpg';
import { BoardScene, IcebergGlyph } from './Board';
import { DetailsDialog, downloadPlan, HelpDialog, SearchDialog } from './Dialogs';
import { adjacentIndex, cards, chapterRange, levels, numberLabel, type LevelId } from './iceberg.ts';
import { applyManualCamera, fitCamera, manualFromCamera, REST_CAMERA, viewBounds, zoomCamera, type Camera, type ManualCamera, type ViewMode } from './board-layout.ts';

const viewOptions: { id: ViewMode; label: string; shortcut: string; icon: typeof Focus }[] = [
  { id: 'card', label: 'Картка', shortcut: 'F', icon: Focus },
  { id: 'level', label: 'Глава', shortcut: 'L', icon: Layers3 },
  { id: 'all', label: 'Уся дошка', shortcut: 'O', icon: Scan },
];

type Modal = 'search' | 'details' | 'help' | null;
interface DragState { pointerId: number; startX: number; startY: number; x: number; y: number; zoom: number; moved: boolean }

export default function App() {
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<ViewMode>('card');
  const [modal, setModal] = useState<Modal>(null);
  const [playing, setPlaying] = useState(false);
  const [playMs, setPlayMs] = useState(6000);
  const [cinema, setCinema] = useState(false);
  const [cinemaControls, setCinemaControls] = useState(false);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [manual, setManual] = useState<ManualCamera>(REST_CAMERA);
  const [dragging, setDragging] = useState(false);
  const [travelling, setTravelling] = useState(false);
  const renderedCamera = useRef<Camera | null>(null);
  const zoomOutput = useRef<HTMLOutputElement>(null);
  const panFrame = useRef<number | null>(null);
  const pendingPan = useRef<ManualCamera | null>(null);
  const stage = useRef<HTMLElement>(null);
  const levelList = useRef<HTMLElement>(null);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const cinemaTimer = useRef<number | undefined>(undefined);
  const motion = useMotionPreference();
  const active = cards[index];
  const chapter = levels[active.level];
  const freeCamera = manual.zoom !== 1 || manual.x !== 0 || manual.y !== 0;

  useLayoutEffect(() => {
    const element = stage.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setSize((previous) => previous.width === width && previous.height === height ? previous : { width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [cinema]);

  const resetManual = useCallback(() => {
    if (panFrame.current !== null) cancelAnimationFrame(panFrame.current);
    panFrame.current = null;
    pendingPan.current = null;
    drag.current = null;
    setDragging(false);
    setManual(REST_CAMERA);
  }, []);
  useEffect(() => { resetManual(); }, [size.width, size.height, resetManual]);
  useEffect(() => () => { if (panFrame.current !== null) cancelAnimationFrame(panFrame.current); }, []);

  useEffect(() => {
    if (window.innerWidth <= 800) {
      levelList.current?.querySelector(`[data-level="${active.level}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: motion.enabled ? 'smooth' : 'instant' });
    }
  }, [active.level, motion.enabled, cinema]);

  const base = useMemo(() => fitCamera(viewBounds(view, index), size, view === 'card' ? 1.65 : 1.15), [view, index, size]);
  const camera = applyManualCamera(base, manual, size);

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
    // On phones, start with a readable card; the overview remains available.
    setView(window.innerWidth <= 800 ? 'card' : 'level');
    setPlaying(false);
    resetManual();
  }, [resetManual]);

  const chooseView = useCallback((nextView: ViewMode) => {
    setView(nextView);
    setPlaying(false);
    resetManual();
  }, [resetManual]);

  const openModal = useCallback((nextModal: Modal) => {
    setPlaying(false);
    setModal(nextModal);
  }, []);
  const closeModal = useCallback(() => setModal(null), []);

  const selectCard = useCallback((id: number) => {
    if (id === active.id && view === 'card') openModal('details');
    else go(id - 1);
  }, [active.id, view, openModal, go]);

  const togglePlay = useCallback(() => {
    if (playing) setPlaying(false);
    else {
      if (index === cards.length - 1) go(0);
      setView('card');
      resetManual();
      setPlaying(true);
    }
  }, [playing, index, go, resetManual]);

  useEffect(() => {
    if (!playing || travelling) return;
    const timer = window.setTimeout(() => {
      if (index === cards.length - 1) setPlaying(false);
      else step(1);
    }, playMs);
    return () => window.clearTimeout(timer);
  }, [playing, travelling, index, playMs, step]);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const toggleCinema = useCallback(() => {
    setCinema((current) => !current);
    setView('card');
    resetManual();
  }, [resetManual]);

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || modal) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyK') {
        event.preventDefault(); openModal('search'); return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      else if (event.key === 'Home') { event.preventDefault(); go(0); }
      else if (event.key === 'End') { event.preventDefault(); go(cards.length - 1); }
      else if (event.code === 'Space') {
        // A focused button must keep its native Space behaviour, not fire twice.
        if (target instanceof HTMLElement && target.closest('button, a, [role="button"]')) return;
        event.preventDefault(); togglePlay();
      } else if (event.key === '/') { event.preventDefault(); openModal('search'); }
      else if (event.code === 'KeyC') toggleCinema();
      else if (event.code === 'KeyN') openModal('details');
      else if (event.code === 'KeyA') motion.toggle();
      else if (event.code === 'KeyF') chooseView('card');
      else if (event.code === 'KeyL') chooseView('level');
      else if (event.code === 'KeyO') chooseView('all');
      else if (event.key === 'Escape') {
        setCinema(false); resetManual();
      } else if (/^[0-6]$/.test(event.key)) chooseLevel(Number(event.key) as LevelId);
      else if (event.key === '?') openModal('help');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, openModal, step, go, togglePlay, toggleCinema, chooseView, chooseLevel, motion.toggle, resetManual]);

  const zoom = useCallback((factor: number) => {
    setPlaying(false);
    setManual((current) => zoomCamera(base, renderedCamera.current ? manualFromCamera(base, renderedCamera.current, size) : current, size, factor));
  }, [base, size]);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || modal || (event.target instanceof Element && event.target.closest('[data-board-ui]'))) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const factor = Math.exp(-Math.max(-120, Math.min(120, event.deltaY)) * 0.0025);
      setPlaying(false);
      setManual((current) => zoomCamera(base, renderedCamera.current ? manualFromCamera(base, renderedCamera.current, size) : current, size, factor, { x: event.clientX - rect.left, y: event.clientY - rect.top }));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [base, size, modal]);

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    wakeCinemaControls();
    if (event.button !== 0 || !event.isPrimary || (event.target instanceof Element && event.target.closest('[data-board-ui]'))) return;
    suppressClick.current = false;
    const start = renderedCamera.current ? manualFromCamera(base, renderedCamera.current, size) : manual;
    if (travelling) { setPlaying(false); setManual(start); }
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: start.x, y: start.y, zoom: start.zoom, moved: false };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    wakeCinemaControls();
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) < 6) return;
    if (!state.moved) {
      state.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      setPlaying(false);
    }
    pendingPan.current = { zoom: state.zoom, x: state.x + dx, y: state.y + dy };
    if (panFrame.current === null) panFrame.current = requestAnimationFrame(() => {
      panFrame.current = null;
      if (pendingPan.current) setManual(pendingPan.current);
      pendingPan.current = null;
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    if (panFrame.current !== null) cancelAnimationFrame(panFrame.current);
    panFrame.current = null;
    if (pendingPan.current) setManual(pendingPan.current);
    pendingPan.current = null;
    suppressClick.current = drag.current.moved;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className={`app-shell${cinema ? ' is-cinema' : ''}${cinemaControls ? ' cinema-controls-visible' : ''}`} style={{ '--cork-image': `url(${corkImg})` } as CSSProperties} data-playing={playing} data-animations={motion.enabled} data-travelling={travelling}>
      {!cinema && <>
        <header className="topbar">
          <button className="brand" onClick={() => { go(0); setPlaying(false); }} aria-label="Повернутися до прологу">
            <svg width="35" height="38" viewBox="0 0 35 38" fill="none" aria-hidden="true"><path d="m7 8 21 6L11 30 7 8Z" stroke="currentColor" strokeWidth="1.4" /><path d="M7 8q15 2 21 6M11 30q5-12 17-16" stroke="currentColor" strokeWidth="1.4" /><circle cx="7" cy="8" r="3" fill="currentColor" /><circle cx="28" cy="14" r="3" fill="currentColor" /><circle cx="11" cy="30" r="3" fill="currentColor" /></svg>
            <span className="brand-copy"><strong>НИТКИ</strong><span>BACKROOMS FPS</span></span>
          </button>
          <div className="project-label"><span>МОНТАЖНА ДОШКА</span><span className="project-slash">/</span><span>АЙСБЕРГ</span></div>
          <div className="topbar-actions">
            <button className="search-trigger" onClick={() => openModal('search')} aria-label="Відкрити пошук карток" title="Знайти картку · /"><Search size={17} /><span>Пошук</span><kbd>/</kbd></button>
            <button className="script-trigger" onClick={() => openModal('details')} aria-label="Відкрити аркуш начитки" title="Аркуш начитки · N"><FileText size={16} /><span>Начитка</span></button>
            <button className="icon-button mobile-help" onClick={() => openModal('help')} aria-label="Керування та гарячі клавіші" title="Керування"><CircleHelp size={18} /></button>
          </div>
        </header>

        <aside className="sidebar" aria-label="Зміст айсберга">
          <div className="sidebar-heading"><p className="eyebrow">Від поверхні до витоків</p><h1>Під поверхнею<span>.</span></h1></div>
          <div className="sidebar-hero"><IcebergGlyph level={active.level} /><div className="archive-count"><strong>{cards.length}</strong><span>карток</span><p>одна гра.<br />одна нитка.</p></div></div>
          <div className="contents-heading"><span>ГЛАВИ АЙСБЕРГА</span><span>01–58</span></div>
          <nav className="level-list" aria-label="Глави айсберга" ref={levelList}>
            {levels.map((level) => (
              <button key={level.id} data-level={level.id} className={`level-button${active.level === level.id ? ' is-selected' : ''}`} onClick={() => chooseLevel(level.id)} aria-current={active.level === level.id ? 'step' : undefined} aria-label={`${level.heading}, картки ${chapterRange(level.id)}`} title={`${level.heading} · ${chapterRange(level.id)}`}>
                <span className="level-code">{level.id === 0 ? 'П' : numberLabel(level.id)}</span>
                <span className="level-copy"><strong>{level.title}</strong><span>{level.label} · {chapterRange(level.id)}</span></span>
              </button>
            ))}
          </nav>
          <div className="sidebar-footer"><button className="text-button" onClick={downloadPlan} title="Завантажити всі 6 колонок твого плану"><ArrowDownToLine size={15} /> План .csv</button><button className="icon-button" onClick={() => openModal('help')} aria-label="Керування та гарячі клавіші" title="Керування · ?"><CircleHelp size={19} /></button></div>
        </aside>
      </>}

      <main
        ref={stage}
        className={`stage${dragging ? ' is-dragging' : ''}`}
        tabIndex={0}
        aria-label="Дошка айсберга Backrooms FPS"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
      >
        <BoardScene activeIndex={index} view={view} target={camera} viewport={size} immediate={dragging || freeCamera} animate={motion.enabled && modal === null} cameraRef={renderedCamera} zoomOutput={zoomOutput} onMovingChange={setTravelling} onSelect={selectCard} onLevel={chooseLevel} />
        <div className="stage-vignette" aria-hidden="true" />
        {!cinema && <>
          <div className="stage-caption" data-board-ui>
            <span className="caption-dot" />
            <div><span>{view === 'all' ? 'Загальний огляд' : chapter.heading}</span><strong>{view === 'all' ? 'Усі нитки на одній дошці' : view === 'level' ? `Картки ${chapterRange(chapter.id)}` : `Картка ${numberLabel(active.id)} з ${cards.length}`}</strong></div>
          </div>
          <div className="zoom-controls" data-board-ui aria-label="Масштаб дошки">
            <button className="icon-button" onClick={() => zoom(1.25)} aria-label="Збільшити дошку" title="Збільшити"><ZoomIn size={17} /></button>
            <output ref={zoomOutput} aria-label="Поточний масштаб" />
            <button className="icon-button" onClick={() => zoom(0.8)} aria-label="Зменшити дошку" title="Зменшити"><ZoomOut size={17} /></button>
            <span className="zoom-divider" />
            <button className="icon-button" onClick={resetManual} aria-label="Центрувати поточний вигляд" title="Центрувати"><Scan size={16} /></button>
          </div>
          <p className="stage-hint">{travelling ? 'Від’їзд · переліт · наближення' : freeCamera ? 'Вільний огляд · перетягуй дошку' : view === 'card' ? 'Натисни картку, щоб відкрити начитку' : 'Натисни картку, щоб наблизити'}<span>Коліщатко — масштаб</span></p>
          {playing && !travelling && <div className="playback-progress" key={`${index}-${playMs}`} style={{ '--play-duration': `${playMs}ms` } as CSSProperties} aria-hidden="true" />}
        </>}
      </main>

      {!cinema && <footer className="controls">
        <div className="chapter-timeline" aria-label="Прогрес за главами">
          {levels.map((level) => <button key={level.id} style={{ flex: level.cards.length }} onClick={() => chooseLevel(level.id)} title={`${level.heading} · ${chapterRange(level.id)}`} aria-label={`Перейти: ${level.heading}`}><span style={{ width: `${Math.max(0, Math.min(1, (active.id - level.first + 1) / level.cards.length)) * 100}%` }} /></button>)}
        </div>
        <div className="control-row">
          <div className="card-navigation" aria-label="Навігація картками">
            <button className="icon-button nav-arrow" onClick={() => step(-1)} disabled={index === 0} aria-label="Попередня картка" title="Попередня · ←"><ChevronLeft size={21} /></button>
            <button className="card-counter" onClick={() => openModal('search')} aria-label={`Картка ${active.id} із ${cards.length}. Перейти до іншої`} title="Перейти до картки"><strong>{numberLabel(active.id)}</strong><span>/ {cards.length}</span></button>
            <button className="icon-button nav-arrow" onClick={() => step(1)} disabled={index === cards.length - 1} aria-label="Наступна картка" title="Наступна · →"><ChevronRight size={21} /></button>
          </div>
          <div className="view-switch" role="group" aria-label="Вигляд дошки">
            {viewOptions.map(({ id, label, shortcut, icon: Icon }) => <button key={id} onClick={() => chooseView(id)} className={view === id ? 'is-selected' : ''} aria-pressed={view === id} aria-label={`Вигляд: ${label}`} title={`${label} · ${shortcut}`}><Icon size={16} /><span>{label}</span></button>)}
          </div>
          <div className="play-controls">
            <button className={`play-button${playing ? ' is-playing' : ''}`} onClick={togglePlay} aria-label={playing ? 'Зупинити автоперегляд' : 'Увімкнути автоперегляд'} aria-pressed={playing} title={playing ? 'Пауза · Space' : 'Автоперегляд · Space'}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}<span>{playing ? 'Пауза' : 'Перегляд'}</span></button>
            <select className="duration-select" value={playMs} onChange={(event) => setPlayMs(Number(event.target.value))} aria-label="Тривалість показу картки" title="Секунд на картку">{[4, 6, 8, 12].map((seconds) => <option key={seconds} value={seconds * 1000}>{seconds} с</option>)}</select>
            <span className="control-separator" />
            <button className={`icon-button transition-button${motion.enabled ? ' is-on' : ''}`} onClick={motion.toggle} aria-label="Плавні переходи" aria-pressed={motion.enabled} title={`Плавні переходи: ${motion.enabled ? 'увімкнено' : 'вимкнено'} · A`}><MoveUpRight size={17} /></button>
            <button className="icon-button cinema-button" onClick={toggleCinema} aria-label="Увімкнути кінорежим" title="Кінорежим · C"><Maximize size={18} /></button>
          </div>
        </div>
        <div className="control-footnote"><span>{active.name}</span><span><kbd>←</kbd><kbd>→</kbd> картки <i /> <kbd>C</kbd> кінорежим</span></div>
      </footer>}

      {cinema && <button className="cinema-exit" onClick={() => setCinema(false)} onFocus={() => setCinemaControls(true)} aria-label="Вийти з кінорежиму"><X size={17} /><span>Повернути керування</span><kbd>Esc</kbd></button>}
      <span className="sr-only" role="status" aria-live="polite">{chapter.heading}. Картка {active.id} із {cards.length}: {active.title}</span>
      {modal === 'search' && <SearchDialog open onClose={closeModal} onSelect={(id) => { closeModal(); go(id - 1); }} />}
      {modal === 'details' && <DetailsDialog open onClose={closeModal} card={active} onStep={step} />}
      {modal === 'help' && <HelpDialog open onClose={closeModal} motionPreference={motion.preference} onMotionPreference={motion.setPreference} />}
    </div>
  );
}