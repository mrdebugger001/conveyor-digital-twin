import React from 'react';
import { useCurrentFrame } from 'remotion';

interface Chapter {
  id: string;
  name: string;
  from: number;
  to: number;
}

export const CHAPTERS: Chapter[] = [
  { id: '01', name: 'THE HOOK', from: 0, to: 420 },
  { id: '02', name: 'PLATFORM', from: 420, to: 700 },
  { id: '03', name: 'EDGE AI', from: 700, to: 960 },
  { id: '04', name: '3D TWIN', from: 960, to: 1560 },
  { id: '05', name: 'JOINT FAILURE', from: 1560, to: 2400 },
  { id: '06', name: 'PLC INTERLOCK', from: 2400, to: 3000 },
  { id: '07', name: 'OPERATE', from: 3000, to: 3600 },
];

export const SaaSChapterBar: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 22,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(8, 12, 20, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 28,
        padding: '6px 18px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75), 0 0 30px rgba(0, 240, 255, 0.08)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {CHAPTERS.map((ch) => {
        const isActive = frame >= ch.from && frame < ch.to;
        return (
          <div
            key={ch.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              backgroundColor: isActive ? 'rgba(0, 240, 255, 0.16)' : 'transparent',
              border: isActive ? '1px solid rgba(0, 240, 255, 0.5)' : '1px solid transparent',
              boxShadow: isActive ? '0 0 16px rgba(0, 240, 255, 0.25)' : 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isActive ? '#00F0FF' : '#64748B',
                fontFamily: 'monospace',
              }}
            >
              {ch.id}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? '#FFFFFF' : '#64748B',
                letterSpacing: '0.04em',
              }}
            >
              {ch.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};
