import { memo, type RefObject } from 'react';
import { ZoomIn, ZoomOut, Scan } from 'lucide-react';
import { chapterRange, numberLabel, type IcebergCard, type LevelInfo } from '../../domain/iceberg.ts';
import type { ViewMode } from '../../domain/board-layout.ts';

export interface StageOverlaysProps {
  view: ViewMode;
  chapter: LevelInfo;
  activeCard: IcebergCard;
  totalCards: number;
  zoomOutputRef: RefObject<HTMLOutputElement | null>;
  travelling: boolean;
  freeCamera: boolean;
  onZoom: (factor: number) => void;
  onResetManual: () => void;
}

export const StageOverlays = memo(function StageOverlays({
  view,
  chapter,
  activeCard,
  totalCards,
  zoomOutputRef,
  travelling,
  freeCamera,
  onZoom,
  onResetManual,
}: StageOverlaysProps) {
  const headingText = view === 'all' ? 'Уся дошка' : chapter.heading;
  const subText =
    view === 'all'
      ? `Усі картки · 01–${numberLabel(totalCards)}`
      : view === 'level'
      ? `Картки ${chapterRange(chapter.id)}`
      : `Картка ${numberLabel(activeCard.id)} з ${totalCards} · ${activeCard.title}`;

  const hintText = travelling
    ? 'Камера плавно перелітає до наступної картки'
    : freeCamera
    ? 'Вільний огляд · перетягуй дошку'
    : 'Клік по записці — переліт до картки';

  return (
    <>
      <div className="stage-vignette" aria-hidden="true" />

      <div className="stage-caption" data-board-ui>
        <span className="caption-dot" />
        <div>
          <span>{headingText}</span>
          <strong>{subText}</strong>
        </div>
      </div>

      <div className="zoom-controls" data-board-ui aria-label="Масштаб дошки">
        <button
          type="button"
          className="icon-button"
          onClick={() => onZoom(1.25)}
          aria-label="Збільшити дошку"
          title="Збільшити"
        >
          <ZoomIn size={17} />
        </button>
        <output ref={zoomOutputRef} aria-label="Поточний масштаб" />
        <button
          type="button"
          className="icon-button"
          onClick={() => onZoom(0.8)}
          aria-label="Зменшити дошку"
          title="Зменшити"
        >
          <ZoomOut size={17} />
        </button>
        <span className="zoom-divider" />
        <button
          type="button"
          className="icon-button"
          onClick={onResetManual}
          aria-label="Центрувати поточний вигляд"
          title="Центрувати"
        >
          <Scan size={16} />
        </button>
      </div>

      <p className="stage-hint">
        {hintText}
        <span>← → картки · колесо — масштаб</span>
      </p>
    </>
  );
});
