import { memo } from 'react';
import { BOARD_H, BOARD_W } from '../../domain/board-layout.ts';

export interface ThreadItem {
  to: number;
  path: string;
}

export interface BoardThreadsProps {
  viewportWidth: number;
  viewportHeight: number;
  cameraX: number;
  cameraY: number;
  scale: number;
  paths: readonly ThreadItem[];
  activeCardId: number;
}

export const BoardThreads = memo(function BoardThreads({
  viewportWidth,
  viewportHeight,
  cameraX,
  cameraY,
  scale,
  paths,
  activeCardId,
}: BoardThreadsProps) {
  return (
    <svg className="board-threads" width={viewportWidth} height={viewportHeight} aria-hidden="true">
      <g transform={`translate(${cameraX} ${cameraY}) scale(${scale})`}>
        <rect x="12" y="12" width={BOARD_W - 24} height={BOARD_H - 24} fill="none" stroke="#322315" strokeWidth="24" />
        <rect x="29" y="29" width={BOARD_W - 58} height={BOARD_H - 58} fill="none" stroke="#ad845047" strokeWidth="3" />
        {scale >= 0.45 && (
          <g transform="translate(3 5)" fill="none" stroke="#1b0e0980" strokeWidth="5">
            {paths.map((thread) => (
              <path key={thread.to} d={thread.path} />
            ))}
          </g>
        )}
        <g fill="none" strokeWidth={Math.max(3, 0.75 / scale)} strokeLinecap="round">
          {paths.map((thread) => (
            <path
              key={thread.to}
              d={thread.path}
              stroke={thread.to <= activeCardId ? '#d96849' : '#8a402b'}
              opacity={thread.to <= activeCardId ? 0.98 : 0.72}
            />
          ))}
        </g>
      </g>
    </svg>
  );
});
