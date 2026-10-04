import { memo, type RefObject } from 'react';
import { ArrowDownToLine, CircleHelp } from 'lucide-react';
import { cards, chapterRange, levels, numberLabel, type LevelId } from '../../domain/iceberg.ts';
import { IcebergGlyph } from './IcebergGlyph.tsx';

export interface AppSidebarProps {
  activeLevel: LevelId;
  levelListRef: RefObject<HTMLElement | null>;
  onSelectLevel: (level: LevelId) => void;
  onDownloadPlan: () => void;
  onOpenHelp: () => void;
}

export const AppSidebar = memo(function AppSidebar({
  activeLevel,
  levelListRef,
  onSelectLevel,
  onDownloadPlan,
  onOpenHelp,
}: AppSidebarProps) {
  return (
    <aside className="sidebar" aria-label="Зміст айсберга">
      <div className="sidebar-heading">
        <p className="eyebrow">Від поверхні до витоків</p>
        <h1>
          Під поверхнею<span>.</span>
        </h1>
      </div>

      <div className="sidebar-hero">
        <IcebergGlyph level={activeLevel} />
        <div className="archive-count">
          <strong>{cards.length}</strong>
          <span>карток</span>
          <p>
            одна гра.<br />
            одна нитка.
          </p>
        </div>
      </div>

      <div className="contents-heading">
        <span>ГЛАВИ АЙСБЕРГА</span>
        <span>01–58</span>
      </div>

      <nav className="level-list" aria-label="Глави айсберга" ref={levelListRef}>
        {levels.map((level) => (
          <button
            key={level.id}
            type="button"
            data-level={level.id}
            className={`level-button${activeLevel === level.id ? ' is-selected' : ''}`}
            onClick={() => onSelectLevel(level.id)}
            aria-current={activeLevel === level.id ? 'step' : undefined}
            aria-label={`${level.heading}, картки ${chapterRange(level.id)}`}
            title={`${level.heading} · ${chapterRange(level.id)}`}
          >
            <span className="level-code">{level.id === 0 ? 'П' : numberLabel(level.id)}</span>
            <span className="level-copy">
              <strong>{level.title}</strong>
              <span>
                {level.label} · {chapterRange(level.id)}
              </span>
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="text-button"
          onClick={onDownloadPlan}
          title="Завантажити всі 6 колонок твого плану"
        >
          <ArrowDownToLine size={15} /> План .csv
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onOpenHelp}
          aria-label="Керування та гарячі клавіші"
          title="Керування · ?"
        >
          <CircleHelp size={19} />
        </button>
      </div>
    </aside>
  );
});
