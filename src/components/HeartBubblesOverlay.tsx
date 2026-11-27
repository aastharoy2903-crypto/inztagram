import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

interface BubbleParticle {
  id: string;
  leftPct: number;
  topPct: number;
  sizePx: number;
  durationMs: number;
  delayMs: number;
  risePx: number;
  driftMidPx: number;
  driftEndPx: number;
  color: string;
  ringColor: string;
}

const HEART_COLORS = [
  { color: '#D10A6E', ring: 'rgba(209, 10, 110, 0.28)' },
  { color: '#FF64AE', ring: 'rgba(255, 100, 174, 0.30)' },
  { color: '#E05297', ring: 'rgba(224, 82, 151, 0.25)' },
  { color: '#A74695', ring: 'rgba(167, 70, 149, 0.25)' },
  { color: '#6E95FF', ring: 'rgba(110, 149, 255, 0.25)' },
];

export const HeartBubblesOverlay: React.FC = () => {
  const { heartBurstTick } = useApp();
  const [bubbles, setBubbles] = useState<BubbleParticle[]>([]);

  useEffect(() => {
    if (heartBurstTick <= 0) return;

    const batchId = `${heartBurstTick}_${Date.now()}`;
    const count = 34;
    const spawned: BubbleParticle[] = Array.from({ length: count }, (_, idx) => {
      const palette = HEART_COLORS[idx % HEART_COLORS.length];
      return {
        id: `${batchId}_${idx}`,
        leftPct: 3 + Math.random() * 94,
        topPct: 12 + Math.random() * 82,
        sizePx: 14 + Math.round(Math.random() * 9), // Small bubbles (14px-23px)
        durationMs: 1250 + Math.round(Math.random() * 700),
        delayMs: Math.round(Math.random() * 260),
        risePx: -(95 + Math.round(Math.random() * 130)),
        driftMidPx: Math.round((Math.random() - 0.5) * 26),
        driftEndPx: Math.round((Math.random() - 0.5) * 44),
        color: palette.color,
        ringColor: palette.ring,
      };
    });

    setBubbles((prev) => [...prev.slice(-68), ...spawned]);

    const timer = window.setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => !b.id.startsWith(`${batchId}_`)));
    }, 2300);

    return () => window.clearTimeout(timer);
  }, [heartBurstTick]);

  if (bubbles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
    >
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="animate-heart-bubble absolute flex items-center justify-center rounded-full"
          style={
            {
              left: `${b.leftPct}%`,
              top: `${b.topPct}%`,
              width: `${b.sizePx}px`,
              height: `${b.sizePx}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              border: `1px solid ${b.ringColor}`,
              boxShadow: `0 2px 8px ${b.ringColor}`,
              animationDuration: `${b.durationMs}ms`,
              animationDelay: `${b.delayMs}ms`,
              '--rise-y': `${b.risePx}px`,
              '--drift-mid': `${b.driftMidPx}px`,
              '--drift-end': `${b.driftEndPx}px`,
            } as React.CSSProperties
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill={b.color}
            style={{
              width: Math.round(b.sizePx * 0.62),
              height: Math.round(b.sizePx * 0.62),
            }}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </span>
      ))}
    </div>
  );
};
