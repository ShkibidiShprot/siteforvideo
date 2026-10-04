import type { LevelId } from '../../domain/iceberg.ts';

export function IcebergGlyph({ level }: { level: LevelId }) {
  const waterline = level === 0 ? 42 : 63 + level * 20;
  return (
    <svg className="iceberg-glyph" viewBox="0 0 216 220" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="iceberg-fill" x1="108" y1="12" x2="108" y2="210" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c2c6b7" stopOpacity="0.18" />
          <stop offset="1" stopColor="#c2c6b7" stopOpacity="0.025" />
        </linearGradient>
        <clipPath id="iceberg-clip"><path d="m106 10 31 42 36 19 14 29-21 29 8 25-43 48-22 11-21-23-27-41-29-35 12-35 35-25Z" /></clipPath>
      </defs>
      <path d="m106 10 31 42 36 19 14 29-21 29 8 25-43 48-22 11-21-23-27-41-29-35 12-35 35-25Z" fill="url(#iceberg-fill)" stroke="#b9bdae" strokeOpacity="0.48" />
      <g stroke="#b9bdae" strokeOpacity="0.2" strokeWidth="0.8">
        <path d="m106 10-6 57 37-15-15 58 51-39M100 67l-56 12 50 40-62-5 61 46 16 53 13-103 52 44-81 6M100 67l22 43-28 9-1 41" />
      </g>
      <path d="M8 66h200" stroke="#d1d4c5" strokeOpacity="0.45" strokeDasharray="3 5" />
      <g clipPath="url(#iceberg-clip)">
        <rect x="0" y={waterline - 12} width="216" height="25" fill="#e37453" fillOpacity="0.17" />
        <path d={`M0 ${waterline}h216`} stroke="#e37453" strokeWidth="1.6" />
      </g>
      <circle cx="198" cy={waterline} r="3" fill="#e37453" />
      <path d={`M184 ${waterline}h10`} stroke="#e37453" strokeOpacity="0.6" />
      <text x="4" y="60" fill="#868b7d" fontSize="8" fontFamily="monospace">0 м</text>
      <text x="5" y="204" fill="#686f61" fontSize="8" fontFamily="monospace">↓</text>
    </svg>
  );
}
