import { useState } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { chapterHeading, numberLabel, type IcebergCard } from '../../domain/iceberg.ts';
import { DialogShell } from './DialogShell.tsx';

function CopyBlock({
  label,
  value,
  large = false,
  badge = '',
}: {
  label: string;
  value: string;
  large?: boolean;
  badge?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  return (
    <div className={`copy-block${large ? ' is-large' : ''}`}>
      <div className="copy-header">
        <span>
          {label} {badge && <small>{badge}</small>}
        </span>
        <button
          type="button"
          className="text-button copy-action"
          onClick={copy}
          aria-label={`Скопіювати ${label.toLowerCase()}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Скопійовано' : 'Скопіювати'}</span>
        </button>
      </div>
      <p className="copy-value">{value}</p>
    </div>
  );
}

export interface DetailsDialogProps {
  open: boolean;
  onClose: () => void;
  card: IcebergCard;
  onStep: (delta: number) => void;
}

export function DetailsDialog({ open, onClose, card, onStep }: DetailsDialogProps) {
  const footer = (
    <div className="details-nav">
      <button
        type="button"
        className="icon-button"
        onClick={() => onStep(-1)}
        disabled={card.id === 1}
        aria-label="Попередня картка"
        title="Попередня"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="details-counter">
        Картка <strong>{numberLabel(card.id)}</strong> із 58
      </span>
      <button
        type="button"
        className="icon-button"
        onClick={() => onStep(1)}
        disabled={card.id === 58}
        aria-label="Наступна картка"
        title="Наступна"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      id="dialog-details"
      eyebrow={chapterHeading(card.level)}
      title={`Картка № ${numberLabel(card.id)}`}
      className="dialog-details"
      footer={footer}
    >
      <CopyBlock label="Назва для фото" badge="Великий заголовок" value={card.title} large />
      <CopyBlock label="Текст для начитки" badge="Голос за кадром" value={card.narration} large />
      <div className="details-grid">
        <CopyBlock label="Звичайна назва" value={card.name} />
        <CopyBlock label="Запасна назва" value={card.alternateTitle} />
      </div>
    </DialogShell>
  );
}
