export function PaperPin({ id }: { id: number }) {
  return (
    <svg className="paper-pin" width="28" height="35" viewBox="0 0 30 38" aria-hidden="true">
      <defs>
        <radialGradient id={`pin-${id}`} cx="32%" cy="24%" r="80%">
          <stop offset="0" stopColor="#f9957f" />
          <stop offset="0.5" stopColor="#bc3d2e" />
          <stop offset="1" stopColor="#611e19" />
        </radialGradient>
      </defs>
      <ellipse cx="17" cy="33" rx="7" ry="3" fill="#160d0899" />
      <path d="M15 18v15" stroke="#3c3127" strokeWidth="2.5" />
      <circle cx="15" cy="14" r="10" fill={`url(#pin-${id})`} />
      <circle cx="12" cy="10" r="2.5" fill="#ffe5c985" />
    </svg>
  );
}
