import { memo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Focus,
  Layers3,
  Maximize,
  MoveUpRight,
  Pause,
  Play,
  Scan,
} from 'lucide-react';
import { cards, chapterRange, levels, numberLabel, type IcebergCard, type LevelId } from '../../domain/iceberg.ts';
import type { ViewMode } from '../../domain/board-layout.ts';

const viewOptions: { id: ViewMode; label: string; shortcut: string; icon: typeof Focus }[] = [
  { id: 'card', label: 'Картка', shortcut: 'F', icon: Focus },
  { id: 'level', label: 'Глава', shortcut: 'L', icon: Layers3 },
  { id: 'all', label: 'Уся дошка', shortcut: 'O', icon: Scan },
];

export interface AppControlsProps {
  activeCard: IcebergCard;
  activeIndex: number;
  view: ViewMode;
  playing: boolean;
  playMs: number;
  motionEnabled: boolean;
  onStep: (delta: number) => void;
  onOpenSearch: () => void;
  onChooseView: (view: ViewMode) => void;
  onChooseLevel: (level: LevelId) => void;
  onTogglePlay: () => void;
  onChangePlayMs: (ms: number) => void;
  onToggleMotion: () => void;
  onToggleCinema: () => void;
}

export const AppControls = memo(function AppControls({
  activeCard,
  activeIndex,
  view,
  playing,
  playMs,
  motionEnabled,
  onStep,
  onOpenSearch,
  onChooseView,
  onChooseLevel,
  onTogglePlay,
  onChangePlayMs,
  onToggleMotion,
  onToggleCinema,
}: AppControlsProps) {
  return (
    <footer className="controls">
      <div className="chapter-timeline" aria-label="Прогрес за главами">
        {levels.map((level) => {
          const progress = Math.max(
            0,
            Math.min(1, (activeCard.id - level.first + 1) / level.cards.length)
          );
          return (
            <button
              key={level.id}
              type="button"
              style={{ flex: level.cards.length }}
              onClick={() => onChooseLevel(level.id)}
              title={`${level.heading} · ${chapterRange(level.id)}`}
              aria-label={`Перейти: ${level.heading}`}
            >
              <span style={{ width: `${progress * 100}%` }} />
            </button>
          );
        })}
      </div>

      <div className="control-row">
        <div className="card-navigation" aria-label="Навігація картками">
          <button
            type="button"
            className="icon-button nav-arrow"
            onClick={() => onStep(-1)}
            disabled={activeIndex === 0}
            aria-label="Попередня картка"
            title="Попередня · ←"
          >
            <ChevronLeft size={21} />
          </button>
          <button
            type="button"
            className="card-counter"
            onClick={onOpenSearch}
            aria-label={`Картка ${activeCard.id} із ${cards.length}. Перейти до іншої`}
            title="Перейти до картки"
          >
            <strong>{numberLabel(activeCard.id)}</strong>
            <span>/ {cards.length}</span>
          </button>
          <button
            type="button"
            className="icon-button nav-arrow"
            onClick={() => onStep(1)}
            disabled={activeIndex === cards.length - 1}
            aria-label="Наступна картка"
            title="Наступна · →"
          >
            <ChevronRight size={21} />
          </button>
        </div>

        <div className="view-switch" role="group" aria-label="Вигляд дошки">
          {viewOptions.map(({ id, label, shortcut, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChooseView(id)}
              className={view === id ? 'is-selected' : ''}
              aria-pressed={view === id}
              aria-label={`Вигляд: ${label}`}
              title={`${label} · ${shortcut}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="play-controls">
          <button
            type="button"
            className={`play-button${playing ? ' is-playing' : ''}`}
            onClick={onTogglePlay}
            aria-label={playing ? 'Зупинити автоперегляд' : 'Увімкнути автоперегляд'}
            aria-pressed={playing}
            title={playing ? 'Пауза · Space' : 'Автоперегляд · Space'}
          >
            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            <span>{playing ? 'Пауза' : 'Перегляд'}</span>
          </button>

          <select
            className="duration-select"
            value={playMs}
            onChange={(event) => onChangePlayMs(Number(event.target.value))}
            aria-label="Тривалість показу картки"
            title="Секунд на картку"
          >
            {[4, 6, 8, 12].map((seconds) => (
              <option key={seconds} value={seconds * 1000}>
                {seconds} с
              </option>
            ))}
          </select>

          <span className="control-separator" />

          <button
            type="button"
            className={`icon-button transition-button${motionEnabled ? ' is-on' : ''}`}
            onClick={onToggleMotion}
            aria-label="Плавні переходи"
            aria-pressed={motionEnabled}
            title={`Плавні переходи: ${motionEnabled ? 'увімкнено' : 'вимкнено'} · A`}
          >
            <MoveUpRight size={17} />
          </button>

          <button
            type="button"
            className="icon-button cinema-button"
            onClick={onToggleCinema}
            aria-label="Увімкнути кінорежим"
            title="Кінорежим · C"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>

      <div className="control-footnote">
        <span>{activeCard.name}</span>
        <span>
          <kbd>←</kbd>
          <kbd>→</kbd> картки <i /> <kbd>C</kbd> кінорежим
        </span>
      </div>
    </footer>
  );
});
