import { memo, useLayoutEffect, type RefObject } from 'react';
import {
  boardLevels,
  boardNotes,
  intersects,
  projectNote,
  threads,
  visibleNotes,
  visibleWorld,
  type Camera,
  type ViewMode,
  type Viewport,
} from '../../domain/board-layout.ts';
import type { LevelId } from '../../domain/iceberg.ts';
import { useCameraFlight } from '../../application/use-camera-flight.ts';
import { PaperCard } from './PaperCard.tsx';
import { BoardThreads } from './BoardThreads.tsx';
import { BoardChapterHeadings } from './BoardChapterHeadings.tsx';
import { BoardActiveMarker } from './BoardActiveMarker.tsx';

export interface BoardSceneProps {
  activeIndex: number;
  view: ViewMode;
  target: Camera;
  viewport: Viewport;
  immediate: boolean;
  animate: boolean;
  cameraRef: RefObject<Camera | null>;
  zoomOutput: RefObject<HTMLOutputElement | null>;
  onMovingChange: (moving: boolean) => void;
  onSelect: (id: number) => void;
  onLevel: (level: LevelId) => void;
}

export const BoardScene = memo(function BoardScene({
  activeIndex,
  view,
  target,
  viewport,
  immediate,
  animate,
  cameraRef,
  zoomOutput,
  onMovingChange,
  onSelect,
  onLevel,
}: BoardSceneProps) {
  const { camera, moving } = useCameraFlight(target, viewport, activeIndex, animate, immediate, onMovingChange);

  useLayoutEffect(() => {
    cameraRef.current = camera;
    if (zoomOutput.current) zoomOutput.current.value = `${Math.round(camera.scale * 100)}%`;
  }, [camera, cameraRef, zoomOutput]);

  const active = boardNotes[activeIndex];
  const world = visibleWorld(camera, viewport);
  const visible = visibleNotes(camera, viewport);
  const notes = visible.some((note) => note.id === active.id) ? visible : [...visible, active];
  const paths = threads.filter((thread) => intersects(thread.bounds, world));
  const miniMap = view === 'all' && viewport.width < 700;
  const snap = (value: number) => Math.round(value * devicePixelRatio) / devicePixelRatio;
  const scale = camera.scale;

  return (
    <div
      className={`board-scene view-${view}${moving ? ' is-travelling' : ''}`}
      data-scale={scale.toFixed(5)}
      data-moving={moving}
      data-rendered-cards={notes.length}
      data-rendered-threads={paths.length}
      data-total-cards={boardNotes.length}
    >
      <div
        className="board-surface"
        style={{
          backgroundPosition: `${snap(camera.x)}px ${snap(camera.y)}px`,
          backgroundSize: `${980 * scale}px`,
        }}
        aria-hidden="true"
      />

      <BoardThreads
        viewportWidth={viewport.width}
        viewportHeight={viewport.height}
        cameraX={camera.x}
        cameraY={camera.y}
        scale={scale}
        paths={paths}
        activeCardId={active.id}
      />

      <BoardChapterHeadings
        boardLevels={boardLevels}
        worldBounds={world}
        cameraX={camera.x}
        cameraY={camera.y}
        scale={scale}
        view={view}
        activeLevel={active.level}
        miniMap={miniMap}
        snap={snap}
        onLevel={onLevel}
      />

      <BoardActiveMarker
        activeId={active.id}
        activeX={active.x}
        activeY={active.y}
        cameraX={camera.x}
        cameraY={camera.y}
        scale={scale}
        moving={moving}
        snap={snap}
      />

      {notes.map((note) => (
        <PaperCard
          key={note.id}
          note={note}
          active={note.id === active.id}
          dimmed={view === 'level' && note.level !== active.level}
          scale={scale}
          {...projectNote(note, camera, moving ? 2 : devicePixelRatio)}
          straighten={view === 'card' && note.id === active.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
});
