import React from 'react';
import type { TimelineSegment, ComputedCard } from './boardLayout';

interface TimelineSpineComponentProps {
  boardWidth: number;
  boardHeight: number;
  segments: TimelineSegment[];
  activeCardId: number;
  activeCard: ComputedCard;
}

export const TimelineSpineComponent: React.FC<TimelineSpineComponentProps> = ({
  boardWidth,
  boardHeight,
  segments,
  activeCardId,
  activeCard,
}) => {
  return (
    <svg
      className="absolute inset-0 pointer-events-none z-[8]"
      width={boardWidth}
      height={boardHeight}
      viewBox={`0 0 ${boardWidth} ${boardHeight}`}
    >
      <defs>
        {/* Glowing laser filter */}
        <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <linearGradient id="active-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* 1. Base Inactive Connection Lines */}
      {segments.map((seg, idx) => (
        <path
          key={`base-seg-${idx}`}
          d={seg.d}
          fill="none"
          stroke="rgba(71, 85, 105, 0.45)"
          strokeWidth={seg.isChapterJump ? '3' : '2'}
          strokeDasharray={seg.isChapterJump ? '6 6' : undefined}
          strokeLinecap="round"
        />
      ))}

      {/* 2. Illuminated Active Progression Lines */}
      {segments.map((seg, idx) => {
        const isPassed = seg.toId <= activeCardId;
        if (!isPassed) return null;

        return (
          <g key={`active-seg-${idx}`}>
            {/* Soft Glow Underlay */}
            <path
              d={seg.d}
              fill="none"
              stroke="#ef4444"
              strokeWidth={seg.isChapterJump ? '7' : '5'}
              strokeOpacity="0.35"
              strokeLinecap="round"
              filter="url(#laser-glow)"
            />
            {/* Crisp Foreground Core */}
            <path
              d={seg.d}
              fill="none"
              stroke="url(#active-line-grad)"
              strokeWidth={seg.isChapterJump ? '3.5' : '2.8'}
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {/* 3. Glowing Pulse Beacon on Active Card Pin */}
      {activeCard && (
        <g transform={`translate(${activeCard.centerX}, ${activeCard.y + 12})`}>
          <circle r="18" fill="#ef4444" fillOpacity="0.2" className="animate-ping" />
          <circle r="10" fill="#ef4444" fillOpacity="0.4" />
          <circle r="5" fill="#fef08a" />
        </g>
      )}
    </svg>
  );
};
