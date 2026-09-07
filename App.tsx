import { useEffect, useState, useMemo, useCallback, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Scan, Play, Pause, Eye, X } from 'lucide-react';
import corkImg from './cork-bg.jpg';
import evidenceImg from './evidence.jpg';

/* ================= board geometry ================= */
const BOARD_W = 2160;
const BOARD_H = 1440;
const PLAY_MS = 5200;

interface Note {
  id: number;
  title: string;
  sub: string;
  meta: string;
  x: number;
  y: number;
  rot: number;
  doodle: number;
}

const notes: Note[] = [
  { id: 1, title: 'Перша зачіпка', sub: 'дрібниця, з якої все почалося', meta: 'доказ №01 · 20:04', x: 315, y: 300, rot: -4, doodle: 0 },
  { id: 2, title: 'Слід у пітьмі', sub: 'хтось ішов попереду нас', meta: 'доказ №02 · 20:57', x: 1120, y: 195, rot: 3, doodle: 1 },
  { id: 3, title: 'Зниклий доказ', sub: 'остання сторінка відсутня', meta: 'доказ №03 · 21:36', x: 1860, y: 545, rot: -3, doodle: 2 },
  { id: 4, title: 'Покази свідка', sub: 'він бачив червону нитку', meta: 'доказ №04 · 22:10', x: 1510, y: 1150, rot: 4, doodle: 3 },
  { id: 5, title: 'Розв’язка', sub: 'усі нитки зводяться воєдино', meta: 'доказ №05 · 23:59', x: 520, y: 1060, rot: -5, doodle: 4 },
];

/* loose string leftovers on the board */
const loose = [
  { x1: 950, y1: 520, x2: 1085, y2: 588 },
  { x1: 120, y1: 660, x2: 275, y2: 720 },
  { x1: 1980, y1: 900, x2: 2092, y2: 980 },
];

/* ================= small visual parts ================= */

const Pin = ({ gid, size = 30 }: { gid: string; size?: number }) => (
  <svg
    width={size}
    height={size * 1.27}
    viewBox="0 0 30 38"
    style={{ filter: 'drop-shadow(2px 3px 2px rgba(0,0,0,0.5))' }}
  >
    <defs>
      <radialGradient id={gid} cx="35%" cy="28%" r="85%">
        <stop offset="0%" stopColor="#ff8b7c" />
        <stop offset="55%" stopColor="#c03025" />
        <stop offset="100%" stopColor="#701611" />
      </radialGradient>
    </defs>
    <ellipse cx="15" cy="34" rx="6.5" ry="2.4" fill="rgba(0,0,0,0.5)" />
    <line x1="15" y1="18" x2="15" y2="33" stroke="#2e2b26" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="15" cy="14" r="9.6" fill={`url(#${gid})`} />
    <circle cx="12" cy="11" r="2.6" fill="rgba(255,255,255,0.6)" />
  </svg>
);

const DecorPin = ({ x, y, gid }: { x: number; y: number; gid: string }) => (
  <div className="absolute z-[8]" style={{ left: x, top: y, transform: 'translate(-50%, -42%)' }}>
    <Pin gid={gid} size={26} />
  </div>
);

/* tiny pencil doodles on notes */
const Doodle = ({ kind }: { kind: number }) => {
  const common = {
    fill: 'none',
    stroke: '#4a3f30',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    opacity: 0.75,
  };
  return (
    <svg width="26" height="24" viewBox="0 0 26 24" className="shrink-0">
      {kind === 0 && (
        <g {...common}>
          <circle cx="10" cy="10" r="6.5" />
          <line x1="15" y1="15" x2="21" y2="21" />
        </g>
      )}
      {kind === 1 && (
        <g {...common}>
          <path d="M3 18 Q 10 8 20 13" />
          <path d="M16 10 L 21 13 L 16 16" />
        </g>
      )}
      {kind === 2 && (
        <g {...common}>
          <path d="M8 6 Q 8 2 12 2.5 Q 16 3 15.5 7 Q 15 10 12 11 L 12 13.5" />
          <circle cx="12" cy="18" r="1.3" fill="#4a3f30" stroke="none" />
        </g>
      )}
      {kind === 3 && (
        <g {...common}>
          <path d="M3 12 Q 13 3.5 23 12 Q 13 20.5 3 12 Z" />
          <circle cx="13" cy="12" r="3" />
        </g>
      )}
      {kind === 4 && (
        <g {...common}>
          <line x1="13" y1="3" x2="13" y2="21" />
          <line x1="4.5" y1="7.5" x2="21.5" y2="16.5" />
          <line x1="21.5" y1="7.5" x2="4.5" y2="16.5" />
        </g>
      )}
    </svg>
  );
};

/* ================= board paths ================= */

const segPath = (a: Note, b: Note) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const sag = dist * 0.1 + 26;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const PIN = 14; // pin dome center offset
  return `M ${a.x} ${a.y + PIN} C ${mx - dy * 0.05} ${my + sag}, ${mx + dy * 0.05} ${my + sag}, ${b.x} ${b.y + PIN}`;
};

const loosePath = (l: (typeof loose)[number]) => {
  const mx = (l.x1 + l.x2) / 2 + 10;
  const my = (l.y1 + l.y2) / 2 + 26;
  return `M ${l.x1} ${l.y1} Q ${mx} ${my} ${l.x2} ${l.y2} q -4 6 4 10`;
};

/* ================= main app ================= */

export default function App() {
  const [nav, setNav] = useState({ i: 0, dur: 1.7 });
  const [overview, setOverview] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cinema, setCinema] = useState(false);
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));

  const vw = size.w;
  const vh = size.h;

  /* lifecycle ------------------------------------------------ */
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  /* navigation ------------------------------------------------ */
  const go = useCallback(
    (j: number) => {
      const len = notes.length;
      let d = Math.abs(j - nav.i);
      d = Math.min(d, len - d);
      setNav({ i: j, dur: 1.15 + d * 0.35 });
      setOverview(false);
    },
    [nav.i]
  );

  const next = useCallback(() => go((nav.i + 1) % notes.length), [go, nav.i]);
  const prev = useCallback(() => go((nav.i - 1 + notes.length) % notes.length), [go, nav.i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'с' || e.key === 'С') setCinema((c) => !c);
      else if (e.key === 'o' || e.key === 'O' || e.key === 'щ' || e.key === 'Щ') setOverview((o) => !o);
      else if (e.key === 'Escape') setCinema(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => next(), PLAY_MS);
    return () => clearTimeout(t);
  }, [playing, next]);

  /* camera math ------------------------------------------------ */
  const focusScale = Math.min(vw * 0.86, 600) / 340;
  const baseScale = Math.min(vw / BOARD_W, vh / BOARD_H) * 0.97;

  const active = notes[nav.i];
  const showAll = overview || !introDone;

  const cam = showAll
    ? {
        scale: baseScale,
        x: (vw - BOARD_W * baseScale) / 2,
        y: (vh - BOARD_H * baseScale) / 2,
      }
    : {
        scale: focusScale,
        x: vw / 2 - active.x * focusScale,
        y: vh * 0.44 - (active.y + 124) * focusScale,
      };

  /* svg data ---------------------------------------------------- */
  const segPaths = useMemo(() => notes.slice(0, -1).map((n, i) => segPath(n, notes[i + 1])), []);

  const cx = active.x;
  const cy = active.y + 124;
  const rx = 196;
  const ry = 116;
  const circleD = `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 1 ${2 * rx} 0 a ${rx} ${ry} 0 1 1 ${-2 * rx} 0`;

  /* ================= render ================= */
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#100a06] select-none">
      {/* -------- the board (camera target) -------- */}
      <motion.div
        className="absolute top-0 left-0"
        style={{ width: BOARD_W, height: BOARD_H, transformOrigin: '0 0' }}
        animate={{ x: cam.x, y: cam.y, scale: cam.scale }}
        transition={{ duration: nav.dur, ease: [0.66, 0, 0.24, 1] }}
      >
        {/* cork background + frame shading */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${corkImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            boxShadow:
              'inset 0 0 0 26px rgba(40,26,14,0.9), inset 0 0 0 28px rgba(15,8,4,0.9), inset 0 0 260px 70px rgba(8,4,2,0.72)',
          }}
        />

        {/* -------- red threads -------- */}
        <svg
          className="absolute inset-0 z-[2]"
          width={BOARD_W}
          height={BOARD_H}
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          style={{ pointerEvents: 'none' }}
        >
          {/* string drop-shadows */}
          {[...segPaths, ...loose.map(loosePath)].map((d, i) => (
            <path
              key={`sh-${i}`}
              d={d}
              transform="translate(3 5)"
              fill="none"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
          ))}

          {/* base strings (all) */}
          {segPaths.map((d, i) => (
            <motion.path
              key={`base-${i}`}
              d={d}
              fill="none"
              stroke="#7c2a20"
              strokeWidth="3.4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.3, delay: 0.5 + i * 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}

          {/* bright strings up to current evidence */}
          {segPaths.map((d, i) => (
            <motion.path
              key={`hot-${i}`}
              d={d}
              fill="none"
              stroke="#d84331"
              strokeWidth="3.6"
              strokeLinecap="round"
              initial={false}
              animate={{ pathLength: nav.i > i ? 1.005 : 0.002, opacity: nav.i > i ? 1 : 0.001 }}
              transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}

          {/* leftover loose strings */}
          {loose.map((l, i) => (
            <motion.path
              key={`loose-${i}`}
              d={loosePath(l)}
              fill="none"
              stroke="#7c2a20"
              strokeWidth="2.6"
              strokeLinecap="round"
              opacity="0.85"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 1.6 + i * 0.3 }}
            />
          ))}
        </svg>

        {/* decorative pins for loose strings */}
        {loose.map((l, i) => (
          <div key={`loosepins-${i}`}>
            <DecorPin x={l.x1} y={l.y1} gid={`lp${i}a`} />
            <DecorPin x={l.x2} y={l.y2} gid={`lp${i}b`} />
          </div>
        ))}

        {/* -------- polaroid photo -------- */}
        <motion.div
          className="absolute z-[3]"
          style={{ left: 760, top: 730 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="sway" style={{ '--rot': '-4deg', animationDelay: '1.1s' } as CSSProperties}>
            <div className="flex justify-center relative z-20 -mb-4">
              <Pin gid="pinphoto" size={28} />
            </div>
            <div className="relative bg-[#f5f0e2] p-3 pb-10 w-[250px] shadow-[0_22px_40px_-12px_rgba(0,0,0,0.7)]">
              <div className="tape" style={{ top: -12, left: -30, transform: 'rotate(-38deg)' }} />
              <div className="tape" style={{ top: -12, right: -30, transform: 'rotate(38deg)' }} />
              <img
                src={evidenceImg}
                alt="документальне фото"
                className="w-full h-[210px] object-cover"
                style={{ filter: 'grayscale(1) contrast(1.08)' }}
              />
              <p className="font-hand text-[#39321f] text-center text-[22px] leading-none mt-3 rotate-[-1deg]">
                алея біля парку · 22:47
              </p>
            </div>
          </div>
        </motion.div>

        {/* -------- newspaper clipping -------- */}
        <motion.div
          className="absolute z-[3]"
          style={{ left: 1570, top: 150 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="sway" style={{ '--rot': '2deg', animationDelay: '2s' } as CSSProperties}>
            <div className="flex justify-center relative z-20 -mb-4">
              <Pin gid="pinnews" size={28} />
            </div>
            <div
              className="relative bg-[#e7e1cf] p-5 pt-7 w-[360px] text-[#333026]"
              style={{ boxShadow: '0 22px 42px -12px rgba(0,0,0,0.68)' }}
            >
              <div className="tape" style={{ top: -13, right: 34, transform: 'rotate(24deg)' }} />
              <p className="font-type text-[10px] tracking-[0.3em] uppercase opacity-60">вечірня хроніка · вип. 41</p>
              <h4 className="font-type font-bold text-[19px] leading-tight uppercase tracking-wide mt-1">
                Хто натягнув <span className="bg-[#d8c76a]/80 px-1">нитку</span> першим?
              </h4>
              <div className="border-t border-[#333026]/40 my-2.5" />
              <p className="font-type text-[11.5px] leading-relaxed text-justify opacity-85">
                Свідки стверджують: на дошці щоночі з’являється новий вузол. Джерело нитки досі не знайдено —
                слідчі не виключають, що всі події пов’язані…
              </p>
              <p className="font-hand text-[19px] text-[#7a2018] mt-2 rotate-[-2deg]">перевірити до ранку!</p>
            </div>
          </div>
        </motion.div>

        {/* -------- sticky notes -------- */}
        {[
          { x: 2065, y: 1065, rot: -6, text: 'АЛІБІ\nПІД ПИТАННЯМ!', gid: 'st1' },
          { x: 152, y: 1225, rot: 5, text: 'подивитись →\n№05', gid: 'st2' },
        ].map((s, i) => (
          <motion.div
            key={s.gid}
            className="absolute z-[3]"
            style={{ left: s.x, top: s.y }}
            initial={{ opacity: 0, scale: 0.6, rotate: s.rot * 3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.25 + i * 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="sway"
              style={{ '--rot': `${s.rot}deg`, animationDelay: `${i * 1.3 + 0.5}s` } as CSSProperties}
            >
              <div className="flex justify-center relative z-20 -mb-4">
                <Pin gid={`pin-${s.gid}`} size={24} />
              </div>
              <div
                className="w-[150px] h-[140px] bg-[#f0dd5e] p-4 pt-7 flex items-center justify-center text-center"
                style={{ boxShadow: '0 16px 30px -10px rgba(0,0,0,0.6)' }}
              >
                <p className="font-hand text-[#4a3a10] text-[24px] leading-[1.05] whitespace-pre-line font-semibold">
                  {s.text}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* -------- evidence notes -------- */}
        {notes.map((n, i) => {
          const isActive = i === nav.i;
          return (
            <motion.div
              key={n.id}
              className="absolute"
              style={{ left: n.x, top: n.y, zIndex: isActive ? 30 : 10 }}
              initial={{ opacity: 0, y: 46, rotate: n.rot * 2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.25 + i * 0.14, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="sway"
                style={{ '--rot': `${n.rot}deg`, animationDelay: `${i * 0.8}s` } as CSSProperties}
              >
                <button
                  onClick={() => {
                    if (!isActive) go(i);
                  }}
                  className="block cursor-pointer focus:outline-none"
                  aria-label={`Доказ: ${n.title}`}
                >
                  <div className="flex justify-center relative z-20 -mb-4">
                    <motion.div animate={{ scale: isActive ? 1.22 : 1, y: isActive ? -2 : 0 }} transition={{ duration: 0.6 }}>
                      <Pin gid={`pn${i}`} />
                    </motion.div>
                  </div>
                  <motion.div
                    className="note-card"
                    animate={{
                      scale: isActive ? 1.055 : 1,
                      filter: isActive
                        ? 'brightness(1.07) saturate(1)'
                        : 'brightness(0.88) saturate(0.82)',
                    }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="px-7 pt-8 pb-5">
                      <h3 className="font-hand font-bold text-[40px] leading-[0.95] text-[#2c2419]">
                        {n.title}
                      </h3>
                      <svg viewBox="0 0 240 12" className="w-[210px] h-[9px] mt-1.5">
                        <path
                          d="M3 8 Q 60 3 120 7 T 237 6"
                          stroke="#c13c2f"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                          opacity="0.72"
                        />
                      </svg>
                      <p className="font-type text-[13px] tracking-[0.14em] uppercase text-[#6d5f47] mt-2.5">
                        {n.sub}
                      </p>
                      <div className="flex items-end justify-between mt-4">
                        <span className="font-type text-[10px] tracking-[0.24em] uppercase text-[#8f7c5c]">
                          {n.meta}
                        </span>
                        <Doodle kind={n.doodle} />
                      </div>
                    </div>
                  </motion.div>
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* -------- red marker circle around active note -------- */}
        <svg
          className="absolute inset-0 z-[25]"
          width={BOARD_W}
          height={BOARD_H}
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          style={{ pointerEvents: 'none' }}
        >
          <g transform={`rotate(-3 ${cx} ${cy})`}>
            <motion.path
              key={`circle-a-${nav.i}`}
              d={circleD}
              fill="none"
              stroke="#d43d2d"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.88"
              initial={{ pathLength: 0.001 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.05,
                delay: showAll ? nav.dur + 0.2 : nav.dur * 0.55,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </g>
          <g transform={`rotate(2 ${cx} ${cy})`}>
            <motion.path
              key={`circle-b-${nav.i}`}
              d={circleD}
              fill="none"
              stroke="#d43d2d"
              strokeWidth="2.6"
              strokeLinecap="round"
              opacity="0.34"
              transform="translate(6 4)"
              initial={{ pathLength: 0.001 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 0.9,
                delay: (showAll ? nav.dur + 0.2 : nav.dur * 0.55) + 0.22,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </g>
        </svg>
      </motion.div>

      {/* -------- HUD -------- */}
      <AnimatePresence>
        {!cinema && (
          <motion.div
            className="fixed top-6 left-6 z-40 pointer-events-none"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-type text-[11px] tracking-[0.34em] uppercase text-[#e4d3ac]/70">
              Справa №7 — «Нитки»
            </p>
            <p className="font-type text-[10px] tracking-[0.24em] uppercase text-[#e4d3ac]/35 mt-1">
              дошка підсумків · 5 доказів
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!cinema && (
          <motion.div
            className="fixed top-6 right-6 z-40 pointer-events-none"
            initial={{ opacity: 0, rotate: 14 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.5 }}
          >
            <div className="stamp flex items-center gap-2">
              <span className="rec-dot inline-block w-2 h-2 rounded-full bg-[#d4432f]" />
              Таємно
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------- bottom controls -------- */}
      <AnimatePresence>
        {!cinema && (
          <motion.div
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative flex items-center gap-4 sm:gap-5 rounded-full border border-[#c8b183]/15 bg-[#160f08]/85 px-5 py-3 shadow-[0_18px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <button
                onClick={prev}
                className="group p-1.5 text-[#d8c9a3]/70 hover:text-[#f2e6c8] transition-colors"
                aria-label="Попередній доказ"
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
              </button>

              <span className="font-type text-[11px] tracking-[0.3em] text-[#d8c9a3]/60 w-[54px] text-center">
                {String(nav.i + 1).padStart(2, '0')}/{String(notes.length).padStart(2, '0')}
              </span>

              <div className="flex items-center gap-2.5">
                {notes.map((n, i) => (
                  <button
                    key={n.id}
                    onClick={() => i !== nav.i && go(i)}
                    aria-label={`Перейти: ${n.title}`}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      i === nav.i
                        ? 'w-6 bg-[#d84331] shadow-[0_0_8px_rgba(216,67,49,0.6)]'
                        : 'w-2 bg-[#d8c9a3]/25 hover:bg-[#d8c9a3]/60'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="group p-1.5 text-[#d8c9a3]/70 hover:text-[#f2e6c8] transition-colors"
                aria-label="Наступний доказ"
              >
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </button>

              <span className="w-px h-5 bg-[#d8c9a3]/15" />

              <button
                onClick={() => setOverview((o) => !o)}
                className={`p-1.5 transition-colors ${
                  overview ? 'text-[#d84331]' : 'text-[#d8c9a3]/70 hover:text-[#f2e6c8]'
                }`}
                aria-label="Огляд усієї дошки"
                title="Огляд дошки (O)"
              >
                <Scan className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={() => setPlaying((p) => !p)}
                className={`p-1.5 transition-colors ${
                  playing ? 'text-[#d84331]' : 'text-[#d8c9a3]/70 hover:text-[#f2e6c8]'
                }`}
                aria-label="Автопоказ"
                title="Автопоказ (пробіл)"
              >
                {playing ? <Pause className="w-[18px] h-[18px]" /> : <Play className="w-[18px] h-[18px]" />}
              </button>

              <button
                onClick={() => setCinema(true)}
                className="p-1.5 text-[#d8c9a3]/70 hover:text-[#f2e6c8] transition-colors"
                aria-label="Режим кіно — сховати інтерфейс"
                title="Режим кіно (C)"
              >
                <Eye className="w-[18px] h-[18px]" />
              </button>

              {/* autoplay progress */}
              {playing && (
                <div className="absolute -bottom-[3px] left-10 right-10 h-[2px] overflow-hidden rounded-full bg-[#d8c9a3]/10">
                  <motion.div
                    key={`prog-${nav.i}`}
                    className="h-full bg-[#d84331]"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: PLAY_MS / 1000, ease: 'linear' }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* hint */}
      <AnimatePresence>
        {!cinema && (
          <motion.p
            className="fixed bottom-7 right-6 z-40 hidden lg:block font-type text-[10px] tracking-[0.22em] uppercase text-[#d8c9a3]/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
          >
            ← → кроки · пробіл — автопоказ · C — кіно
          </motion.p>
        )}
      </AnimatePresence>

      {/* -------- cinema exit -------- */}
      <AnimatePresence>
        {cinema && (
          <motion.button
            onClick={() => setCinema(false)}
            className="fixed bottom-6 right-6 z-50 rounded-full border border-[#e4d3ac]/20 bg-black/50 p-3 text-[#e4d3ac]/60 opacity-40 hover:opacity-100 transition-opacity backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            aria-label="Вийти з режиму кіно"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* -------- cinematic overlays -------- */}
      <div className="vignette pointer-events-none fixed inset-0 z-[55]" />
      <div className="grain pointer-events-none fixed inset-0 z-[56]" />
    </div>
  );
}
