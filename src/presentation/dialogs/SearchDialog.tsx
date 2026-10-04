import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { levels, levelLabel, numberLabel, searchCards, type LevelId } from '../../domain/iceberg.ts';
import { DialogShell } from './DialogShell.tsx';

export interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
}

export function SearchDialog({ open, onClose, onSelect }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | LevelId>('all');
  const levelFilter = filter === 'all' ? undefined : filter;
  const results = useMemo(() => searchCards(query, levelFilter), [query, levelFilter]);

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      id="dialog-search"
      eyebrow="Швидкий перехід"
      title="Пошук за картотекою"
      className="dialog-search"
    >
      <div className="search-field">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          autoFocus
          placeholder="Назва, код (4445), фраза з начитки, №..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Пошуковий запит"
        />
        {query && (
          <button type="button" className="text-button" onClick={() => setQuery('')}>
            Очистити
          </button>
        )}
      </div>

      <div className="search-tags" role="toolbar" aria-label="Фільтр за главою">
        <button
          type="button"
          className={filter === 'all' ? 'is-active' : ''}
          onClick={() => setFilter('all')}
        >
          Усі
        </button>
        {levels.map((level) => (
          <button
            key={level.id}
            type="button"
            className={filter === level.id ? 'is-active' : ''}
            onClick={() => setFilter(level.id)}
          >
            {level.id === 0 ? 'П' : level.id}
          </button>
        ))}
      </div>

      <div className="search-results" role="listbox" aria-label="Результати пошуку">
        {results.length === 0 ? (
          <p className="empty-results">Нічого не знайдено за цим запитом.</p>
        ) : (
          results.map((card) => (
            <button
              type="button"
              key={card.id}
              className="search-row"
              onClick={() => onSelect(card.id)}
            >
              <span className="search-code">{numberLabel(card.id)}</span>
              <span className="search-copy">
                <strong>{card.title}</strong>
                <span>
                  {card.name} · {levelLabel(card.level)}
                </span>
                <small>«{card.narration}»</small>
              </span>
            </button>
          ))
        )}
      </div>
    </DialogShell>
  );
}
