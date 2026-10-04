import { memo, type CSSProperties } from 'react';
import { CARD_SCALE, type BoardNote } from '../../domain/board-layout.ts';
import { levels, numberLabel } from '../../domain/iceberg.ts';
import { PaperPin } from './PaperPin.tsx';
import { PaperDoodle } from './PaperDoodle.tsx';

export interface PaperCardProps {
  note: BoardNote;
  active: boolean;
  dimmed: boolean;
  scale: number;
  x: number;
  y: number;
  width: number;
  height: number;
  straighten: boolean;
  onSelect: (id: number) => void;
}

export const PaperCard = memo(function PaperCard({
  note,
  active,
  dimmed,
  scale,
  x,
  y,
  width,
  height,
  straighten,
  onSelect,
}: PaperCardProps) {
  const paperScale = scale * CARD_SCALE;
  const mini = paperScale < 0.36;
  const tiny = paperScale < 0.095;

  return (
    <button
      type="button"
      className={`evidence-card${active ? ' is-active' : ''}${dimmed ? ' outside-level' : ''}${mini ? ' is-mini' : ''}${tiny ? ' is-tiny' : ''}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        '--note-scale': paperScale,
        '--rotation': `${straighten ? 0 : note.rotation}deg`,
      } as CSSProperties}
      onClick={() => onSelect(note.id)}
      tabIndex={active ? 0 : -1}
      aria-current={active ? 'step' : undefined}
      aria-label={`Картка ${note.id}: ${note.title}`}
      data-card-id={note.id}
    >
      {mini ? <span className="mini-pin" aria-hidden="true" /> : <PaperPin id={note.id} />}
      {!mini && <span className="paper-fold" aria-hidden="true" />}
      <span className="paper-heading">
        <span className="paper-number">{mini ? numberLabel(note.id) : `№ ${numberLabel(note.id)}`}</span>
        {!mini && <span>{levels[note.level].label}</span>}
      </span>
      {!tiny && (
        <span className={`paper-title${note.title.length > 26 ? ' paper-title-long' : note.title.length > 16 ? ' paper-title-medium' : ''}`}>
          {note.title}
        </span>
      )}
      {!mini && (
        <>
          <span className="paper-rule" aria-hidden="true" />
          <span className="paper-original">{note.name}</span>
          <span className="paper-footer">
            <span>КАРТКА У ВІДЕО / {numberLabel(note.id)}</span>
            <PaperDoodle kind={note.id % 5} />
          </span>
        </>
      )}
    </button>
  );
});
