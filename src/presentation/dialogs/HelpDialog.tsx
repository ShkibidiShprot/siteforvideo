import { ArrowUpRight, Check } from 'lucide-react';
import type { MotionPreference } from '../../application/use-motion-preference.ts';
import { DialogShell } from './DialogShell.tsx';

export interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
  motionPreference: MotionPreference;
  onMotionPreference: (pref: MotionPreference) => void;
}

export function HelpDialog({
  open,
  onClose,
  motionPreference,
  onMotionPreference,
}: HelpDialogProps) {
  const preferences: { id: MotionPreference; label: string; desc: string }[] = [
    { id: 'auto', label: 'За системою', desc: 'Враховує налаштування операційної системи' },
    { id: 'on', label: 'Увімкнено', desc: 'Плавні польоти камери між картками' },
    { id: 'off', label: 'Вимкнено', desc: 'Миттєве перемикання без руху' },
  ];

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      id="dialog-help"
      eyebrow="Інструкція та налаштування"
      title="Керування дошкою"
      className="dialog-help"
    >
      <div className="help-section">
        <h3>Анімація перельоту камери</h3>
        <p className="help-note">
          Якщо система має ввімкнений «Зменшений рух», можна форсувати плавні польоти камери вручну.
        </p>
        <div className="preference-group" role="radiogroup" aria-label="Режим переходів">
          {preferences.map((item) => (
            <button
              type="button"
              key={item.id}
              role="radio"
              aria-checked={motionPreference === item.id}
              className={`preference-card${motionPreference === item.id ? ' is-selected' : ''}`}
              onClick={() => onMotionPreference(item.id)}
            >
              <span className="radio-dot">{motionPreference === item.id && <Check size={12} />}</span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.desc}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="help-section">
        <h3>Гарячі клавіші</h3>
        <dl className="shortcut-table">
          <div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Попередня / наступна картка</dd></div>
          <div><dt><kbd>Home</kbd> <kbd>End</kbd></dt><dd>Перша / остання картка</dd></div>
          <div><dt><kbd>0</kbd> .. <kbd>6</kbd></dt><dd>Перехід до вибраної глави айсберга</dd></div>
          <div><dt><kbd>Space</kbd></dt><dd>Автоперегляд / пауза</dd></div>
          <div><dt><kbd>F</kbd> <kbd>L</kbd> <kbd>O</kbd></dt><dd>Вигляд: картка / глава / уся дошка</dd></div>
          <div><dt><kbd>C</kbd> / <kbd>Esc</kbd></dt><dd>Кінорежим (для зйомки екрана) / вихід</dd></div>
          <div><dt><kbd>N</kbd></dt><dd>Аркуш начитки поточної картки</dd></div>
          <div><dt><kbd>/</kbd> або <kbd>Ctrl</kbd>+<kbd>K</kbd></dt><dd>Пошук за назвами та дикторським текстом</dd></div>
          <div><dt><kbd>A</kbd></dt><dd>Перемикання анімації переходів</dd></div>
        </dl>
      </div>

      <div className="help-section help-links">
        <a
          href="https://github.com/ShkibidiShprot/siteforvideo"
          target="_blank"
          rel="noreferrer"
          className="external-link"
        >
          <span>Репозиторій на GitHub</span>
          <ArrowUpRight size={14} />
        </a>
      </div>
    </DialogShell>
  );
}
