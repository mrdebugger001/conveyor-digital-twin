import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface AntigravityViewportProps {
  children: React.ReactNode;
  rotX?: number;
  rotY?: number;
  scale?: number;
  isGlitch?: boolean;
}

export const AntigravityViewport: React.FC<AntigravityViewportProps> = ({
  children,
  rotX = 0,
  rotY = 0,
  scale = 1.0,
  isGlitch = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gentle organic floating drift
  const time = frame / fps;
  const floatX = Math.sin(time * 1.2) * 0.8;
  const floatY = Math.cos(time * 0.9) * 0.6;
  const breathe = Math.sin(time * 1.5) * 0.005;

  const currentRotX = rotX + floatY;
  const currentRotY = rotY + floatX;
  const currentScale = scale + breathe;

  // Glitch jitter on transient
  const jitterX = isGlitch ? (Math.random() - 0.5) * 8 : 0;
  const jitterY = isGlitch ? (Math.random() - 0.5) * 6 : 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',
        backgroundColor: '#07090D',
        backgroundImage: `
          radial-gradient(circle at 50% 25%, rgba(14, 165, 233, 0.08) 0%, transparent 65%),
          radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.04) 0%, transparent 50%),
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
        overflow: 'hidden',
      }}
    >
      {/* 3D Floating Window Rig */}
      <div
        style={{
          width: 1720,
          height: 940,
          transform: `
            translate3d(${jitterX}px, ${jitterY}px, 0)
            rotateX(${currentRotX}deg)
            rotateY(${currentRotY}deg)
            scale(${currentScale})
          `,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.1s ease-out',
          borderRadius: 16,
          boxShadow: `
            0 45px 120px -25px rgba(0, 0, 0, 0.92),
            0 0 0 1px rgba(255, 255, 255, 0.10),
            0 0 50px rgba(14, 165, 233, 0.18)
          `,
          backgroundColor: '#0E131A',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Antigravity High-Tech Window Bar */}
        <div
          style={{
            height: 38,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            fontFamily: 'monospace',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: '#94A3B8',
            userSelect: 'none',
            zIndex: 10,
          }}
        >
          {/* Window dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#EF4444' }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span style={{ marginLeft: 10, color: '#38BDF8', fontWeight: 600 }}>
              CONVEYOR C01 // TWIN ENGINE v2.4
            </span>
          </div>

          {/* Central status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
              STREAM: 60 FPS [HARDWARE WEBGL]
            </span>
            <span>·</span>
            <span>PORT: 8000/WS</span>
            <span>·</span>
            <span style={{ color: '#F1F5F9' }}>MODE: LIVE SIMULATION</span>
          </div>

          {/* Timestamp counter */}
          <div style={{ color: '#E2E8F0', fontWeight: 600 }}>
            FRAME: {String(frame).padStart(5, '0')} // TC: 00:{String(Math.floor(frame / 60)).padStart(2, '0')}:{String(frame % 60).padStart(2, '0')}
          </div>
        </div>

        {/* Viewport content */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
