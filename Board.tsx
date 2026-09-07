import { memo, useLayoutEffect, type CSSProperties, type RefObject } from 'react';
import { boardLevels, boardNotes, BOARD_H, BOARD_W, intersects, projectNote, threads, visibleNotes, visibleWorld, type BoardNote, type Camera, type ViewMode, type Viewport } from './board-layout.ts';
import { chapterRange, levels, numberLabel, type LevelId } from './iceberg.ts';
import { useCameraFlight } from './use-camera-flight';

function Pin({ id }: { id: number }) {
  return (
    <svg className="paper-pin" width="28" height="35" viewBox="0 0 30 38" aria-hidden="true">
      <defs>
        <radialGradient id={`pin-${id}`} cx="32%" cy="24%" r="80%">
          <stop offset="0" stopColor="#f9957f" />
          <stop offset="0.5" stopColor="#bc3d2e" />
          <stop offset="1" stopColor="#611e19" />
        </radialGradient>
      </defs>
      <ellipse cx="17" cy="33" rx="7" ry="3" fill="#160d0899" />
      <path d="M15 18v15" stroke="#3c3127" strokeWidth="2.5" />
      <circle cx="15" cy="14" r="10" fill={`url(#pin-${id})`} />
      <circle cx="12" cy="10" r="2.5" fill="#ffe5c985" />
    </svg>
  );
}

function Doodle({ kind }: { kind: number }) {
  return (
    <svg width="32" height="28" viewBox="0 0 32 28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 0 && <><circle cx="12" cy="11" r="7" /><path d="m17 16 9 9M9 9l2-2" /></>}
      {kind === 1 && <><path d="M7 24V4h16v20M4 24h24M11 24V8l12-4" /><circle cx="18" cy="16" r="1" /></>}
      {kind === 2 && <><path d="M3 14q13-17 26 0Q16 31 3 14Z" /><circle cx="16" cy="14" r="4" /></>}
      {kind === 3 && <><path d="m4 23 10-18 13 18ZM14 5l3 18M4 23l12-7 11 7" /><path d="M1 12h29" strokeDasharray="2 4" /></>}
      {kind === 4 && <><path d="M10 8q1-7 7-5 9 3 0 10v4" /><circle cx="17" cy="23" r="1" fill="currentColor" /></>}
    </svg>
  );
}

// No parent scale() or filter: dimensions and fonts are laid out at screen
// resolution. The focused title is also straightened for crisp video captures.
const PaperCard = memo(function PaperCard({ note, active, dimmed, scale, x, y, width, height, straighten, onSelect }: {
  note: BoardNote; active: boolean; dimmed: boolean; scale: number;
  x: number; y: number; width: number; height: number; straighten: boolean;
  onSelect: (id: number) => void;
}) {
  const mini = scale < 0.36;
  const tiny = scale < 0.095;
  return (
    <button
      type="button"
      className={`evidence-card${active ? ' is-active' : ''}${dimmed ? ' outside-level' : ''}${mini ? ' is-mini' : ''}${tiny ? ' is-tiny' : ''}`}
      style={{ left: x, top: y, width, height, '--note-scale': scale, '--rotation': `${straighten ? 0 : note.rotation}deg` } as CSSProperties}
      onClick={() => onSelect(note.id)}
      tabIndex={active ? 0 : -1}
      aria-current={active ? 'step' : undefined}
      aria-label={`Картка ${note.id}: ${note.title}`}
      data-card-id={note.id}
    >
      {mini ? <span className="mini-pin" aria-hidden="true" /> : <Pin id={note.id} />}
      {!mini && <span className="paper-fold" aria-hidden="true" />}
      <span className="paper-heading"><span className="paper-number">{mini ? numberLabel(note.id) : `№ ${numberLabel(note.id)}`}</span>{!mini && <span>{levels[note.level].label}</span>}</span>
      {!tiny && <span className={`paper-title${note.title.length > 26 ? ' paper-title-long' : note.title.length > 16 ? ' paper-title-medium' : ''}`}>{note.title}</span>}
      {!mini && <>
        <span className="paper-rule" aria-hidden="true" />
        <span className="paper-original">{note.name}</span>
        <span className="paper-footer"><span>КАРТКА У ВІДЕО / {numberLabel(note.id)}</span><Doodle kind={note.id % 5} /></span>
      </>}
    </button>
  );
});

export const BoardScene = memo(function BoardScene({ activeIndex, view, target, viewport, immediate, animate, cameraRef, zoomOutput, onMovingChange, onSelect, onLevel }: {
  activeIndex: number; view: ViewMode; target: Camera; viewport: Viewport;
  immediate: boolean; animate: boolean; cameraRef: RefObject<Camera | null>; zoomOutput: RefObject<HTMLOutputElement | null>;
  onMovingChange: (moving: boolean) => void;
  onSelect: (id: number) => void; onLevel: (level: LevelId) => void;
}) {
  const { camera, moving } = useCameraFlight(target, viewport, activeIndex, animate, immediate, onMovingChange);
  useLayoutEffect(() => {
    cameraRef.current = camera;
    // Update the live percentage without rerendering the entire toolbar per RAF.
    if (zoomOutput.current) zoomOutput.current.value = `${Math.round(camera.scale * 100)}%`;
  }, [camera, cameraRef, zoomOutput]);
  const active = boardNotes[activeIndex];
  const world = visibleWorld(camera, viewport);
  const visible = visibleNotes(camera, viewport);
  // Keep the active keyboard target mounted even during a long flight.
  const notes = visible.some((note) => note.id === active.id) ? visible : [...visible, active];
  const paths = threads.filter((thread) => intersects(thread.bounds, world));
  const miniMap = view === 'all' && viewport.width < 700;
  const snap = (value: number) => Math.round(value * devicePixelRatio) / devicePixelRatio;
  const scale = camera.scale;

  return (
    <div className={`board-scene view-${view}${moving ? ' is-travelling' : ''}`} data-scale={scale.toFixed(5)} data-moving={moving} data-rendered-cards={notes.length} data-rendered-threads={paths.length} data-total-cards={boardNotes.length}>
      <div className="board-surface" style={{ backgroundPosition: `${snap(camera.x)}px ${snap(camera.y)}px`, backgroundSize: `${980 * scale}px` }} aria-hidden="true" />
      <svg className="board-threads" width={viewport.width} height={viewport.height} aria-hidden="true">
        <g transform={`translate(${camera.x} ${camera.y}) scale(${scale})`}>
          <rect x="12" y="12" width={BOARD_W - 24} height={BOARD_H - 24} fill="none" stroke="#322315" strokeWidth="24" />
          <rect x="29" y="29" width={BOARD_W - 58} height={BOARD_H - 58} fill="none" stroke="#ad845047" strokeWidth="3" />
          {scale >= 0.45 && <g transform="translate(3 5)" fill="none" stroke="#1b0e0980" strokeWidth="5">
            {paths.map((thread) => <path key={thread.to} d={thread.path} />)}
          </g>}
          <g fill="none" strokeWidth={Math.max(3, 0.75 / scale)} strokeLinecap="round">
            {paths.map((thread) => <path key={thread.to} d={thread.path} stroke={thread.to <= active.id ? '#d96849' : '#8a402b'} opacity={thread.to <= active.id ? 0.98 : 0.72} />)}
          </g>
        </g>
      </svg>

      {view !== 'card' && boardLevels.filter((section) => intersects(section.bounds, world)).map((section) => {
        const chapter = levels[section.id];
        const width = miniMap ? 32 : Math.max(170, Math.min(680, (section.bounds.width - 200) * scale));
        return <button key={section.id} className={`chapter-heading${section.id === active.level ? ' is-current' : ''}${miniMap ? ' chapter-badge' : ''}${view === 'level' && section.id !== active.level ? ' is-dimmed' : ''}`}
          style={{ left: snap(camera.x + (section.bounds.x + section.bounds.width / 2) * scale - width / 2), top: snap(camera.y + (section.bounds.y + (view === 'all' ? section.id === 0 ? 0 : -140 : 40)) * scale), width, '--chapter-font-size': `${Math.max(11, Math.min(30, 46 * scale))}px` } as CSSProperties}
          onClick={() => onLevel(section.id)} tabIndex={-1} aria-label={`Огляд: ${chapter.heading}`} title={`${chapter.heading} · ${chapterRange(section.id)}`}>
          <span className="chapter-number">{section.id === 0 ? 'П' : `${section.id}.`}</span>
          {!miniMap && <span className="chapter-text"><strong>{chapter.title}</strong>{(view !== 'all' || section.id !== 0) && <small>{chapter.label} · {chapterRange(section.id)}</small>}</span>}
        </button>;
      })}

      {scale >= 0.3 && <svg className={`active-marker${moving ? ' marker-moving' : ' marker-ready'}`} key={active.id} style={{ left: snap(camera.x + (active.x - 213) * scale), top: snap(camera.y + (active.y - 30) * scale) }} width={426 * scale} height={310 * scale} viewBox="0 0 426 310" aria-hidden="true">
        <ellipse className="marker-stroke" cx="213" cy="155" rx="201" ry="145" pathLength="1" fill="none" stroke="#d64d36" strokeWidth="5" strokeLinecap="round" transform="rotate(-3 213 155)" />
        <ellipse cx="217" cy="154" rx="203" ry="147" fill="none" stroke="#d64d36" strokeWidth="1.8" opacity="0.3" transform="rotate(3 213 155)" />
      </svg>}
      {notes.map((note) => <PaperCard key={note.id} note={note} active={note.id === active.id} dimmed={view === 'level' && note.level !== active.level} scale={scale} {...projectNote(note, camera, moving ? 2 : devicePixelRatio)} straighten={view === 'card' && note.id === active.id} onSelect={onSelect} />)}
    </div>
  );
});

export function IcebergGlyph({ level }: { level: LevelId }) {
  const waterline = level === 0 ? 42 : 63 + level * 20;
  return (
    <svg className="iceberg-glyph" viewBox="0 0 216 220" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="iceberg-fill" x1="108" y1="12" x2="108" y2="210" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c2c6b7" stopOpacity="0.18" />
          <stop offset="1" stopColor="#c2c6b7" stopOpacity="0.025" />
        </linearGradient>
        <clipPath id="iceberg-clip"><path d="m106 10 31 42 36 19 14 29-21 29 8 25-43 48-22 11-21-23-27-41-29-35 12-35 35-25Z" /></clipPath>
      </defs>
      <path d="m106 10 31 42 36 19 14 29-21 29 8 25-43 48-22 11-21-23-27-41-29-35 12-35 35-25Z" fill="url(#iceberg-fill)" stroke="#b9bdae" strokeOpacity="0.48" />
      <g stroke="#b9bdae" strokeOpacity="0.2" strokeWidth="0.8">
        <path d="m106 10-6 57 37-15-15 58 51-39M100 67l-56 12 50 40-62-5 61 46 16 53 13-103 52 44-81 6M100 67l22 43-28 9-1 41" />
      </g>
      <path d="M8 66h200" stroke="#d1d4c5" strokeOpacity="0.45" strokeDasharray="3 5" />
      <g clipPath="url(#iceberg-clip)">
        <rect x="0" y={waterline - 12} width="216" height="25" fill="#e37453" fillOpacity="0.17" />
        <path d={`M0 ${waterline}h216`} stroke="#e37453" strokeWidth="1.6" />
      </g>
      <circle cx="198" cy={waterline} r="3" fill="#e37453" />
      <path d={`M184 ${waterline}h10`} stroke="#e37453" strokeOpacity="0.6" />
      <text x="4" y="60" fill="#868b7d" fontSize="8" fontFamily="monospace">0 м</text>
      <text x="5" y="204" fill="#686f61" fontSize="8" fontFamily="monospace">↓</text>
    </svg>
  );
}