import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Download } from 'lucide-react';
import { CARDS_DATA, CHAPTERS } from './cardsData';

interface ScriptTableViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (cardId: number) => void;
}

export const ScriptTableView: React.FC<ScriptTableViewProps> = ({
  isOpen,
  onClose,
  onSelectCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<number | 'all'>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const filteredCards = useMemo(() => {
    return CARDS_DATA.filter((card) => {
      const matchChapter = selectedChapter === 'all' || card.chapterId === selectedChapter;
      if (!matchChapter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        card.numStr.includes(q) ||
        card.photoTitle.toLowerCase().includes(q) ||
        card.voiceover.toLowerCase().includes(q) ||
        card.name.toLowerCase().includes(q) ||
        card.backupTitle.toLowerCase().includes(q) ||
        card.tier.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedChapter]);

  const handleCopyOne = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportMarkdown = () => {
    let md = `# ПЛАН МОНТАЖУ ТА НАЧИТКИ — BACKROOMS FPS\n\n`;
    CHAPTERS.forEach((ch) => {
      md += `## ${ch.title} (${ch.cardsRange})\n\n`;
      const chCards = CARDS_DATA.filter((c) => c.chapterId === ch.id);
      chCards.forEach((c) => {
        md += `### [ #${c.numStr} ] «${c.photoTitle}»\n`;
        md += `- **Рівень айсберга:** ${c.tier}\n`;
        md += `- **Робоча назва:** ${c.name}\n`;
        md += `- **Текст для начитки:** «${c.voiceover}»\n`;
        md += `- **Запасна назва:** «${c.backupTitle}»\n\n`;
      });
    });

    navigator.clipboard.writeText(md);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          className="relative w-full max-w-6xl h-[90vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap bg-slate-950">
            <div>
              <h3 className="font-display font-black text-xl text-white">
                Табличний план монтажу та начитки (58 карток)
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Повний структурований реєстр усіх матеріалів з Прологу по Главу 6
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportMarkdown}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Сценарій скопійовано!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Копіювати весь сценарій (.MD)</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Пошук за номером, назвою, начиткою чи рівнем..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-sans text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Chapter Pill Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedChapter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 ${
                  selectedChapter === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Усі (58)
              </button>
              {CHAPTERS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapter(ch.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                    selectedChapter === ch.id
                      ? 'bg-slate-700 text-white font-bold border border-slate-500'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ch.shortTitle}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider z-10">
                <tr>
                  <th className="py-3 px-4 w-16">№</th>
                  <th className="py-3 px-4 w-32">Рівень</th>
                  <th className="py-3 px-4 w-60">Назва для фото (Кадр)</th>
                  <th className="py-3 px-4 min-w-[280px]">Текст для начитки</th>
                  <th className="py-3 px-4 w-48">Звичайна назва</th>
                  <th className="py-3 px-4 w-48">Запасна назва</th>
                  <th className="py-3 px-4 w-24 text-right">Дія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredCards.map((card) => {
                  const ch = CHAPTERS.find((c) => c.id === card.chapterId) || CHAPTERS[0];
                  return (
                    <tr
                      key={card.id}
                      onClick={() => {
                        onSelectCard(card.id);
                        onClose();
                      }}
                      className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                    >
                      {/* № */}
                      <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded text-[11px]"
                          style={{
                            backgroundColor: `${ch.accentColor}20`,
                            color: ch.accentColor,
                          }}
                        >
                          #{card.numStr}
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {card.tier}
                      </td>

                      {/* Photo Title */}
                      <td className="py-3 px-4 font-bold text-slate-100 text-[13px] uppercase">
                        «{card.photoTitle}»
                      </td>

                      {/* Voiceover */}
                      <td className="py-3 px-4 font-semibold text-amber-200/90 italic">
                        «{card.voiceover}»
                      </td>

                      {/* Working Name */}
                      <td className="py-3 px-4 text-slate-400 font-medium">
                        {card.name}
                      </td>

                      {/* Backup Title */}
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        «{card.backupTitle}»
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyOne(card.id, card.voiceover);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[10px] transition-colors"
                        >
                          {copiedId === card.id ? (
                            <span className="text-emerald-400 font-bold">ОК</span>
                          ) : (
                            <span>Копіювати</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Відображено {filteredCards.length} з 58 карток</span>
            <span>Натисніть на рядок для переходу камери на дошці</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
