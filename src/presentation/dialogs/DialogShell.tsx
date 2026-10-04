import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface DialogShellProps {
  open: boolean;
  onClose: () => void;
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DialogShell({
  open,
  onClose,
  id,
  eyebrow,
  title,
  children,
  footer,
  className = '',
}: DialogShellProps) {
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
        const target = previousFocus.current?.isConnected
          ? previousFocus.current
          : document.querySelector<HTMLElement>('.stage');
        target?.focus({ preventScroll: true });
      });
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      id={id}
      className={`app-dialog ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="dialog-frame" onClick={(event) => event.stopPropagation()}>
        <header className="dialog-header">
          <div className="dialog-titles">
            <p className="dialog-eyebrow">{eyebrow}</p>
            <h2 className="dialog-title">{title}</h2>
          </div>
          <button
            type="button"
            className="icon-button dialog-close"
            onClick={onClose}
            aria-label="Закрити вікно"
            title="Закрити · Esc"
          >
            <X size={18} />
          </button>
        </header>
        <div className="dialog-body">{children}</div>
        {footer && <footer className="dialog-footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
