import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SceneMeta {
  kicker: string;
  title: string;
  subtitle: string;
  metrics: { label: string; value: string; status?: 'normal' | 'warning' | 'critical' }[];
  tag?: string;
}

interface MonospaceHUDProps {
  meta: SceneMeta;
  isTransientHit: boolean;
  transientStrength: number;
}

export const MonospaceHUD: React.FC<MonospaceHUDProps> = ({
  meta,
  isTransientHit,
  transientStrength,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulse effect on transient hits
  const pulseScale = isTransientHit ? 1.0 + Math.min(transientStrength * 0.05, 0.12) : 1.0;
  const pulseOpacity = isTransientHit ? 0.95 : 0.85;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 32px',
        fontFamily: 'monospace',
      }}
    >
      {/* Top HUD: Tactical Reticles & Sector Data */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        {/* Top Left Tag */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 6,
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              backgroundColor: isTransientHit ? '#38BDF8' : '#0EA5E9',
              boxShadow: isTransientHit ? '0 0 10px #38BDF8' : 'none',
              borderRadius: 2,
            }}
          />
          <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#F1F5F9', fontWeight: 600 }}>
            {meta.tag || 'TELEMETRY STREAM // ACTIVE'}
          </span>
        </div>

        {/* Top Right Live Metrics Tray */}
        <div style={{ display: 'flex', gap: 10 }}>
          {meta.metrics.map((m, idx) => {
            const isWarn = m.status === 'warning';
            const isCrit = m.status === 'critical';
            const borderCol = isCrit
              ? 'rgba(239, 68, 68, 0.6)'
              : isWarn
              ? 'rgba(245, 158, 11, 0.6)'
              : 'rgba(255, 255, 255, 0.12)';
            const bgCol = isCrit
              ? 'rgba(239, 68, 68, 0.18)'
              : isWarn
              ? 'rgba(245, 158, 11, 0.14)'
              : 'rgba(15, 23, 42, 0.82)';
            const valCol = isCrit ? '#F87171' : isWarn ? '#FBBF24' : '#38BDF8';

            return (
              <div
                key={idx}
                style={{
                  backgroundColor: bgCol,
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${borderCol}`,
                  borderRadius: 6,
                  padding: '6px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  transform: `scale(${pulseScale})`,
                  transition: 'transform 0.08s ease-out',
                }}
              >
                <span style={{ fontSize: 9, color: '#94A3B8', letterSpacing: '0.08em' }}>
                  {m.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: valCol, letterSpacing: '0.04em' }}>
                  {m.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Viewport Crosshair & Corner Marks */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 80,
          height: 80,
          border: '1px solid rgba(56, 189, 248, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: 10, height: 1, backgroundColor: 'rgba(56, 189, 248, 0.35)' }} />
        <div style={{ height: 10, width: 1, backgroundColor: 'rgba(56, 189, 248, 0.35)' }} />
      </div>

      {/* Bottom HUD: Typography Card */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        {/* Headline & Kicker Box */}
        <div
          style={{
            backgroundColor: 'rgba(10, 15, 24, 0.90)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderLeft: '4px solid #38BDF8',
            borderRadius: '0 8px 8px 0',
            padding: '16px 24px',
            maxWidth: 820,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
          }}
        >
          {/* Kicker */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#38BDF8',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>[SEC // {String(Math.floor(frame / 60)).padStart(2, '0')}]</span>
            <span>{meta.kicker}</span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#F8FAFC',
              lineHeight: 1.15,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {meta.title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: '0.02em',
              color: '#94A3B8',
              lineHeight: 1.4,
            }}
          >
            {meta.subtitle}
          </div>
        </div>

        {/* Bottom Right System Watermark */}
        <div
          style={{
            textAlign: 'right',
            color: '#64748B',
            fontSize: 11,
            letterSpacing: '0.08em',
          }}
        >
          <div style={{ color: '#E2E8F0', fontWeight: 600 }}>SIH 2026 // INDUSTRIAL TWIN</div>
          <div>REACT 18 · THREE.JS · FASTAPI · PLAYWRIGHT</div>
        </div>
      </div>
    </div>
  );
};
