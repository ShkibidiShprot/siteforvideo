import { memo } from 'react';

export interface BoardActiveMarkerProps {
  activeId: number;
  activeX: number;
  activeY: number;
  cameraX: number;
  cameraY: number;
  scale: number;
  moving: boolean;
  snap: (v: number) => number;
}

export const BoardActiveMarker = memo(function BoardActiveMarker({
  activeId,
  activeX,
  activeY,
  cameraX,
  cameraY,
  scale,
  moving,
  snap,
}: BoardActiveMarkerProps) {
  if (scale < 0.3) return null;

  return (
    <svg
      className={`active-marker${moving ? ' marker-moving' : ' marker-ready'}`}
      key={activeId}
      style={{
        left: snap(cameraX + (activeX - 213) * scale),
        top: snap(cameraY + (activeY - 30) * scale),
      }}
      width={426 * scale}
      height={310 * scale}
      viewBox="0 0 426 310"
      aria-hidden="true"
    >
      <ellipse
        className="marker-stroke"
        cx="213"
        cy="155"
        rx="201"
        ry="145"
        pathLength="1"
        fill="none"
        stroke="#d64d36"
        strokeWidth="5"
        strokeLinecap="round"
        transform="rotate(-3 213 155)"
      />
      <ellipse
        cx="217"
        cy="154"
        rx="203"
        ry="147"
        fill="none"
        stroke="#d64d36"
        strokeWidth="1.8"
        opacity="0.3"
        transform="rotate(3 213 155)"
      />
    </svg>
  );
});
