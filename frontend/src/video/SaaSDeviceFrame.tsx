import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface SaaSDeviceFrameProps {
  children: React.ReactNode;
  zoom?: number;
  panX?: number;
  panY?: number;
  tiltX?: number;
  tiltY?: number;
}

export const SaaSDeviceFrame: React.FC<SaaSDeviceFrameProps> = ({
  children,
  zoom = 1.0,
  panX = 0,
  panY = 0,
  tiltX = 0,
  tiltY = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Subtle organic floating drift for high-end SaaS feel
  const t = frame / fps;
  const floatY = Math.sin(t * 1.1) * 3;
  const floatX = Math.cos(t * 0.9) * 2;

  // Animated gradient positions for luxury SaaS ambient backdrop
  const auroraX = 50 + Math.sin(t * 0.4) * 15;
  const auroraY = 35 + Math.cos(t * 0.5) * 12;

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#060911',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1400px',
      }}
    >
      {/* Luxury SaaS Aurora Glow Mesh Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at ${auroraX}% ${auroraY}%, rgba(14, 165, 233, 0.16) 0%, transparent 55%),
            radial-gradient(circle at ${100 - auroraX}% ${90 - auroraY}%, rgba(139, 92, 246, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 64px 64px, 64px 64px',
          pointerEvents: 'none',
        }}
      />



      {/* Main Studio Display / SaaS Frame */}
      <div
        style={{
          width: 1780,
          height: 980,
          transform: `
            translate3d(${panX + floatX}px, ${panY + floatY}px, 0)
            scale(${zoom})
            rotateX(${tiltX}deg)
            rotateY(${tiltY}deg)
          `,
          transformOrigin: 'center center',
          transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
          borderRadius: 18,
          backgroundColor: '#0B0F17',
          boxShadow: `
            0 30px 90px -20px rgba(0, 0, 0, 0.85),
            0 0 0 1px rgba(255, 255, 255, 0.10),
            0 0 80px rgba(56, 189, 248, 0.12)
          `,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Sleek MacOS / SaaS Chrome Header Bar */}
        <div
          style={{
            height: 42,
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            userSelect: 'none',
            zIndex: 30,
          }}
        >
          {/* Traffic lights */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#FF5F56' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#27C93F' }} />
            <div
              style={{
                marginLeft: 16,
                padding: '3px 12px',
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }} />
              <span style={{ color: '#E2E8F0', fontWeight: 600 }}>twin.c01.industrial.ai</span>
            </div>
          </div>

          {/* Center Title */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#94A3B8',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            ORION INDUSTRIAL AI — CONVEYOR C01 DIGITAL TWIN
          </div>

          {/* Right Live Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
            <span style={{ color: '#00F0FF', fontWeight: 700, letterSpacing: '0.04em' }}>60 FPS // 1-2 MS WS // v1.4 PROD</span>
          </div>
        </div>

        {/* Viewport Content */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
