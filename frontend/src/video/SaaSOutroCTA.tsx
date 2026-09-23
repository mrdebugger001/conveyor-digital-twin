import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const SaaSOutroCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });

  const scale = interpolate(anim, [0, 1], [0.92, 1.0]);
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Subtle aurora pulse
  const auroraPulse = (Math.sin(frame * 0.08) + 1) / 2;

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
      {/* Deep Ambient Aurora */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(0, 242, 254, ${0.16 + auroraPulse * 0.08}) 0%, rgba(79, 172, 254, 0.12) 35%, transparent 70%)`,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Cybernetic Grid Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 242, 254, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 242, 254, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: 0.6,
        }}
      />

      {/* Hackathon Badge Pill */}
      <div
        style={{
          padding: '8px 22px',
          borderRadius: 30,
          background: 'rgba(0, 242, 254, 0.12)',
          border: '1px solid rgba(0, 242, 254, 0.4)',
          color: '#00F2FE',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transform: `scale(${scale})`,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#00F2FE',
            boxShadow: '0 0 10px #00F2FE',
          }}
        />
        TEAM ORION · SMART INDIA HACKATHON 2026
      </div>

      {/* Brand Icon / Logo */}
      <div
        style={{
          padding: '12px 32px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 172, 254, 0.2))',
          border: '2px solid rgba(0, 242, 254, 0.6)',
          boxShadow: '0 0 40px rgba(0, 242, 254, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          transform: `scale(${scale})`,
        }}
      >
        <span
          style={{
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: '0.15em',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #00F2FE 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ORION
        </span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 58,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          maxWidth: 1000,
          marginBottom: 16,
          transform: `scale(${scale})`,
        }}
      >
        ZERO UNPLANNED DOWNTIME. <br />
        <span
          style={{
            background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 50%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PREDICT. PREVENT. OPERATE.
        </span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 400,
          color: '#94A3B8',
          maxWidth: 780,
          lineHeight: 1.5,
          marginBottom: 36,
        }}
      >
        The real-time Digital Twin and Predictive Intelligence Platform for high-capacity conveyors.
      </div>

      {/* Modern SaaS CTA Button */}
      <div
        style={{
          padding: '16px 40px',
          borderRadius: 36,
          background: 'linear-gradient(135deg, #00F2FE, #0284C7)',
          boxShadow: '0 12px 36px -6px rgba(0, 242, 254, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
          color: '#060B14',
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          transform: `scale(${scale})`,
          marginBottom: 36,
        }}
      >
        <span>LAUNCH CONVEYOR DIGITAL TWIN HMI</span>
        <span style={{ fontSize: 20 }}>→</span>
      </div>

      {/* Tech Stack Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          color: '#64748B',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontFamily: 'monospace',
        }}
      >
        <span style={{ color: '#E2E8F0' }}>REACT 18</span>
        <span style={{ color: '#00F0FF' }}>•</span>
        <span style={{ color: '#E2E8F0' }}>THREE.JS</span>
        <span style={{ color: '#00F0FF' }}>•</span>
        <span style={{ color: '#E2E8F0' }}>FASTAPI</span>
        <span style={{ color: '#00F0FF' }}>•</span>
        <span style={{ color: '#E2E8F0' }}>WEBSOCKETS</span>
        <span style={{ color: '#00F0FF' }}>•</span>
        <span style={{ color: '#00F0FF' }}>ESP32-S3 TINYML</span>
      </div>
    </div>
  );
};
