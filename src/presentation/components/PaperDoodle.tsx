export function PaperDoodle({ kind }: { kind: number }) {
  return (
    <svg width="32" height="28" viewBox="0 0 32 28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 0 && <><circle cx="12" cy="11" r="7" /><path d="m17 16 9 9M9 9l2-2" /></>}
      {kind === 1 && <><path d="M7 24V4h16v20M4 24h24M11 24V8l12-4" /><circle cx="18" cy="16" r="1" /></>}
      {kind === 2 && <><path d="M3 14q13-17 26 0Q16 31 3 14Z" /><circle cx="16" cy="14" r="4" /></>}
      {kind === 3 && <><path d="m4 23 10-18 13 18ZM14 5l3 18M4 23l12-7 11 7" /><path d="M1 12h29" strokeDasharray="2 4" /></>}
      {kind === 4 && <><path d="M10 8q1-7 7-5 9 3 0 10v4" /><circle cx="17" cy="23" r="1" fill="currentColor" /></>}
    </svg>
  );
}
