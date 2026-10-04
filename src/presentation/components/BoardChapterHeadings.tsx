import { memo, type CSSProperties } from 'react';
import { intersects, type BoardLevel, type Bounds } from '../../domain/board-layout.ts';
import { chapterRange, levels, type LevelId } from '../../domain/iceberg.ts';

export interface BoardChapterHeadingsProps {
  boardLevels: readonly BoardLevel[];
  worldBounds: Bounds;
  cameraX: number;
  cameraY: number;
  scale: number;
  view: 'card' | 'level' | 'all';
  activeLevel: LevelId;
  miniMap: boolean;
  snap: (v: number) => number;
  onLevel: (level: LevelId) => void;
}

export const BoardChapterHeadings = memo(function BoardChapterHeadings({
  boardLevels,
  worldBounds,
  cameraX,
  cameraY,
  scale,
  view,
  activeLevel,
  miniMap,
  snap,
  onLevel,
}: BoardChapterHeadingsProps) {
  if (view === 'card') return null;

  return (
    <>
      {boardLevels
        .filter((section) => intersects(section.bounds, worldBounds))
        .map((section) => {
          const chapter = levels[section.id];
          const width = miniMap ? 32 : Math.max(170, Math.min(680, (section.bounds.width - 200) * scale));
          const topOffset = view === 'all' ? (section.id === 0 ? 0 : -140) : 40;
          const left = snap(cameraX + (section.bounds.x + section.bounds.width / 2) * scale - width / 2);
          const top = snap(cameraY + (section.bounds.y + topOffset) * scale);

          return (
            <button
              key={section.id}
              className={`chapter-heading${section.id === activeLevel ? ' is-current' : ''}${miniMap ? ' chapter-badge' : ''}${view === 'level' && section.id !== activeLevel ? ' is-dimmed' : ''}`}
              style={{
                left,
                top,
                width,
                '--chapter-font-size': `${Math.max(11, Math.min(30, 46 * scale))}px`,
              } as CSSProperties}
              onClick={() => onLevel(section.id)}
              tabIndex={-1}
              aria-label={`Огляд: ${chapter.heading}`}
              title={`${chapter.heading} · ${chapterRange(section.id)}`}
            >
              <span className="chapter-number">{section.id === 0 ? 'П' : `${section.id}.`}</span>
              {!miniMap && (
                <span className="chapter-text">
                  <strong>{chapter.title}</strong>
                  {(view !== 'all' || section.id !== 0) && (
                    <small>
                      {chapter.label} · {chapterRange(section.id)}
                    </small>
                  )}
                </span>
              )}
            </button>
          );
        })}
    </>
  );
});
