import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDownToLine, ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, FileText, Search, X } from 'lucide-react';
import { cards, chapterHeading, levels, levelLabel, numberLabel, planCsv, searchCards, type IcebergCard, type LevelId } from './iceberg.ts';
import type { MotionPreference } from './use-motion-preference';

export function downloadPlan() {
  const url = URL.createObjectURL(new Blob(['\uFEFF', planCsv()], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'backrooms-fps-iceberg.csv';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DialogShell({ open, onClose, id, eyebrow, title, children, footer, className = '' }: {
  open: boolean;
  onClose: () => void;
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!element.open) element.showModal();
    return () => {
      if (element.open) element.close();
      queueMicrotask(() => {
        if (document.querySelector('dialog[open]')) return;
        const target = previousFocus.current?.isConnected ? previousFocus.current : document.querySelector<HTMLElement>('.stage');
        target?.focus({ preventScroll: true });
      });
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={`archive-dialog ${className}`}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClose={() => {
        // StrictMode can close/reopen during effect replay. Ignore that queued
        // close event if the current dialog has already been opened again.
        if (dialog.current && !dialog.current.open) onClose();
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="dialog-sheet">
        <header className="dialog-heading">
          <div><p className="eyebrow">{eyebrow}</p><h2 id={`${id}-title`}>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Закрити вікно" title="Закрити · Esc"><X size={20} /></button>
        </header>
        {children}
        {footer && <footer className="dialog-footer">{footer}</footer>}
      </div>
    </dialog>
  );
}

export function SearchDialog({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (id: number) => void }) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<LevelId | 'all'>('all');
  const input = useRef<HTMLInputElement>(null);
  const results = searchCards(query, level);

  useEffect(() => {
    if (open) {
      setQuery('');
      setLevel('all');
      input.current?.focus();
    }
  }, [open]);

  return (
    <DialogShell open={open} onClose={onClose} id="search" eyebrow="Усі матеріали справи" title="Знайти свою нитку" className="search-dialog"
      footer={<><span>{cards.length} карток · 7 розділів</span><button className="text-button" onClick={downloadPlan}><ArrowDownToLine size={15} /> План .csv</button></>}
    >
      <form className="archive-search" role="search" onSubmit={(event) => { event.preventDefault(); if (results[0]) onSelect(results[0].id); }}>
        <Search size={19} aria-hidden="true" />
        <input ref={input} autoFocus aria-label="Пошук карток" placeholder="Назва, № картки або код…" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
        {query && <button type="button" className="icon-button" onClick={() => { setQuery(''); input.current?.focus(); }} aria-label="Очистити пошук"><X size={17} /></button>}
      </form>
      <div className="search-tools">
        <span role="status">Знайдено: {results.length} / {cards.length}</span>
        <select aria-label="Фільтр за главою" value={level} onChange={(event) => setLevel(event.target.value === 'all' ? 'all' : Number(event.target.value) as LevelId)}>
          <option value="all">Усі глави</option>
          {levels.map((item) => <option key={item.id} value={item.id}>{item.heading}</option>)}
        </select>
      </div>
      <div className="search-results">
        {results.length === 0 ? <div className="empty-results"><Search size={26} /><p>Тут нитка обривається.</p><span>Спробуй іншу назву або вибери всі глави.</span></div> :
          results.map((card) => (
            <button key={card.id} className="search-result" onClick={() => onSelect(card.id)}>
              <span className="result-number">{numberLabel(card.id)}</span>
              <span className="result-copy"><strong>{card.title}</strong><span>{card.name}</span></span>
              <span className="result-level" title={chapterHeading(card.level)}>{levelLabel(card.level)}</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          ))}
      </div>
    </DialogShell>
  );
}

export function DetailsDialog({ open, onClose, card, onStep }: { open: boolean; onClose: () => void; card: IcebergCard; onStep: (delta: number) => void }) {
  const [copyState, setCopyState] = useState<{ field: string; success: boolean } | null>(null);
  useEffect(() => { setCopyState(null); }, [card.id, open]);
  useEffect(() => {
    if (!copyState) return;
    const timer = window.setTimeout(() => setCopyState(null), 3000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const copy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState({ field, success: true });
    } catch {
      setCopyState({ field, success: false });
    }
  };

  return (
    <DialogShell open={open} onClose={onClose} id="details" eyebrow={`${chapterHeading(card.level)} / картка ${numberLabel(card.id)} з ${cards.length}`} title="Аркуш начитки" className="details-dialog"
      footer={<>
        <button className="text-button" onClick={() => onStep(-1)} disabled={card.id === 1}><ChevronLeft size={17} /> Попередня</button>
        <span>{numberLabel(card.id)} / {cards.length}</span>
        <button className="text-button" onClick={() => onStep(1)} disabled={card.id === cards.length}>Наступна <ChevronRight size={17} /></button>
      </>}
    >
      <dl className="script-fields">
        <div className="script-field photo-title-field">
          <dt><span>Назва для фото</span><button className="copy-button" onClick={() => void copy(card.title, 'title')} aria-label="Копіювати назву для фото" title="Копіювати назву">{copyState?.success && copyState.field === 'title' ? <Check size={16} /> : <Copy size={16} />}</button></dt>
          <dd className="script-photo-title">{card.title}</dd>
        </div>
        <div className="script-field"><dt>Звичайна назва</dt><dd>{card.name}</dd></div>
        <div className="script-field narration-field">
          <dt><span><FileText size={14} /> Текст для начитки</span><button className="copy-button" onClick={() => void copy(card.narration, 'narration')} aria-label="Копіювати текст для начитки" title="Копіювати начитку">{copyState?.success && copyState.field === 'narration' ? <Check size={16} /> : <Copy size={16} />}</button></dt>
          <dd className="narration-text">{card.narration}</dd>
        </div>
        <div className="script-field alternate-field"><dt>Запасна назва з попереднього плану</dt><dd>{card.alternateTitle}</dd></div>
      </dl>
      <p className={`copy-status${copyState && !copyState.success ? ' is-error' : ''}`} role="status">
        {copyState ? (copyState.success ? 'Скопійовано в буфер обміну.' : 'Не вдалося скопіювати. Можна виділити й скопіювати текст вручну.') : 'Усі формулювання з твого плану збережено.'}
      </p>
    </DialogShell>
  );
}

export function HelpDialog({ open, onClose, motionPreference, onMotionPreference }: { open: boolean; onClose: () => void; motionPreference: MotionPreference; onMotionPreference: (preference: MotionPreference) => void }) {
  const shortcuts = [
    ['← / →', 'Попередня / наступна картка'],
    ['Space', 'Увімкнути / зупинити автоперегляд'],
    ['0 — 6', 'Пролог / відповідна глава'],
    ['F / L / O', 'Картка / глава / уся дошка'],
    ['A', 'Увімкнути / вимкнути плавні перельоти'],
    ['C / Esc', 'Кінорежим / повернути інтерфейс'],
    ['N', 'Аркуш начитки'],
    ['/ або Ctrl K', 'Пошук за назвою чи номером'],
    ['Home / End', 'Перша / остання картка'],
  ];
  return (
    <DialogShell open={open} onClose={onClose} id="help" eyebrow="Невелика інструкція" title="Дошка під рукою" className="help-dialog">
      <p className="help-intro">Натисни картку, щоб наблизити її. Повторне натискання відкриє текст для начитки. Дошку можна перетягувати, а коліщатком або кнопками + / − — змінювати масштаб.</p>
      <div className="motion-setting">
        <label htmlFor="motion-preference">Анімація переходів<small>Від’їзд → переліт → наближення</small></label>
        <select id="motion-preference" aria-label="Анімація переходів" value={motionPreference} onChange={(event) => onMotionPreference(event.target.value as MotionPreference)}>
          <option value="auto">За системою</option><option value="on">Увімкнено</option><option value="off">Вимкнено</option>
        </select>
      </div>
      <dl className="shortcut-list">{shortcuts.map(([key, label]) => <div key={key}><dt><kbd>{key}</kbd></dt><dd>{label}</dd></div>)}</dl>
      <p className="help-footnote">У кінорежимі інтерфейс приховано — залишаються дошка та переходи. Час автоперегляду відраховується після завершення перельоту. Перегляд іде за номерами й зупиняється на картці 58. Звук не відтворюється: текст начитки можна скопіювати з аркуша.</p>
    </DialogShell>
  );
}