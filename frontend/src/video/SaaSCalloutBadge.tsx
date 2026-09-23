import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SaaSCalloutProps {
  badgeText: string;
  title: string;
  description: string;
  stats?: { label: string; value: string; color?: string }[];
  position?: 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left';
}

export const SaaSCalloutBadge: React.FC<SaaSCalloutProps> = ({
  badgeText,
  title,
  description,
  stats = [],
  position = 'bottom-left',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth SaaS spring reveal
  const anim = spring({
    frame,
    fps,
    config: {
      damping: 14,
      mass: 0.8,
      stiffness: 110,
    },
  });

  const translateY = interpolate(anim, [0, 1], [30, 0]);
  const opacity = interpolate(anim, [0, 1], [0, 1]);

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 50,
    ...(position === 'bottom-left' ? { bottom: 40, left: 44 } : {}),
    ...(position === 'bottom-right' ? { bottom: 40, right: 44 } : {}),
    ...(position === 'top-right' ? { top: 70, right: 44 } : {}),
    ...(position === 'top-left' ? { top: 70, left: 44 } : {}),
  };

  return (
    <div
      style={{
        ...posStyle,
        opacity,
        transform: `translate3d(0, ${translateY}px, 0)`,
        maxWidth: 720,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(11, 17, 32, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 16,
          padding: '20px 26px',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(56, 189, 248, 0.15)',
        }}
      >
        {/* Category Badge Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38BDF8',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#38BDF8',
                boxShadow: '0 0 8px #38BDF8',
              }}
            />
            {badgeText}
          </div>
        </div>

        {/* Big SaaS Title */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 6,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>

        {/* Subtitle Description */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: '#94A3B8',
            lineHeight: 1.45,
            marginBottom: stats.length > 0 ? 16 : 0,
          }}
        >
          {description}
        </div>

        {/* Quantitative Metrics Bar */}
        {stats.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              paddingTop: 12,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 8,
                  padding: '6px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: s.color || '#38BDF8', fontFamily: 'monospace' }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
