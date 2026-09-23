import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const SaaSHookIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleAnim = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });

  const scale = interpolate(titleAnim, [0, 1], [0.92, 1.0]);
  const opacity = interpolate(frame, [0, 15, 410, 440], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Red danger flash pulse
  const dangerPulse = (Math.sin(frame * 0.18) + 1) / 2;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 80,
        backgroundColor: '#0A0E17',
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: '0 40px',
        overflow: 'hidden',
      }}
    >
      {/* Background Volumetric Warning Glow */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255, 51, 102, ${0.18 + dangerPulse * 0.12}) 0%, transparent 65%)`,
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      {/* Cybernetic Grid Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 51, 102, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 51, 102, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: 0.8,
        }}
      />

      {/* Warning Status Pill */}
      <div
        style={{
          padding: '8px 22px',
          borderRadius: 30,
          background: 'linear-gradient(135deg, rgba(255, 51, 102, 0.18), rgba(245, 158, 11, 0.15))',
          border: '1px solid rgba(255, 51, 102, 0.5)',
          color: '#FF3366',
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          transform: `scale(${scale})`,
          boxShadow: '0 0 25px rgba(255, 51, 102, 0.3)',
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            backgroundColor: '#FF3366',
            boxShadow: '0 0 12px #FF3366',
          }}
        />
        CRITICAL INDUSTRY FAILURE POINT // BULK MATERIALS
      </div>

      {/* Hero Impact Headline */}
      <div
        style={{
          fontSize: 68,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 60%, #94A3B8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          maxWidth: 1200,
          marginBottom: 20,
          transform: `scale(${scale})`,
        }}
      >
        UNPLANNED DOWNTIME <br />
        <span
          style={{
            background: 'linear-gradient(135deg, #FF3366 0%, #F43F5E 50%, #FB7185 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          COSTS MILLIONS.
        </span>
      </div>

      {/* Narration Subtitle */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 400,
          color: '#94A3B8',
          maxWidth: 900,
          lineHeight: 1.55,
          letterSpacing: '0.01em',
          marginBottom: 40,
        }}
      >
        In heavy mining, a single undetected conveyor joint rupture halts millions of tons of production.
      </div>

      {/* High-Impact Stat Badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            padding: '14px 24px',
            borderRadius: 14,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em' }}>
            SPLICE FAILURE RATE
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FF3366', marginTop: 2 }}>
            78% OF BELT TEARS
          </div>
        </div>

        <div
          style={{
            padding: '14px 24px',
            borderRadius: 14,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em' }}>
            AVERAGE INCIDENT COST
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>
            $2.4M / FACILITY / YR
          </div>
        </div>

        <div
          style={{
            padding: '14px 24px',
            borderRadius: 14,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em' }}>
            CONVENTIONAL DETECTION
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#00F2FE', marginTop: 2 }}>
            POST-RUPTURE CATASTROPHE
          </div>
        </div>
      </div>
    </div>
  );
};
