import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const CinematicMotorOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = (Math.sin(frame * 0.18) + 1) / 2;
  const tempVal = interpolate(frame, [0, 200, 390], [84.2, 91.5, 93.8], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* Reticle Target Over Drive Motor M01 */}
      <div
        style={{
          position: 'absolute',
          top: '54%',
          left: '74%',
          transform: 'translate(-50%, -50%)',
          width: 380,
          height: 270,
          border: '1px dashed rgba(255, 170, 0, 0.6)',
          borderRadius: 8,
          backgroundColor: 'rgba(255, 170, 0, 0.08)',
          boxShadow: `0 0 35px rgba(255, 170, 0, ${0.2 + pulse * 0.25})`,
        }}
      >
        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: -2, left: -2, width: 14, height: 14, borderTop: '3px solid #FFAA00', borderLeft: '3px solid #FFAA00' }} />
        <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderTop: '3px solid #FFAA00', borderRight: '3px solid #FFAA00' }} />
        <div style={{ position: 'absolute', bottom: -2, left: -2, width: 14, height: 14, borderBottom: '3px solid #FFAA00', borderLeft: '3px solid #FFAA00' }} />
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderBottom: '3px solid #FFAA00', borderRight: '3px solid #FFAA00' }} />

        {/* Target Header */}
        <div
          style={{
            position: 'absolute',
            top: -26,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#FFAA00',
            color: '#0B0F19',
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            borderRadius: 3,
          }}
        >
          <span>THERMOGRAPHY RETICLE</span>
          <span>//</span>
          <span>POWERTRAIN M01</span>
        </div>

        {/* Reticle Coordinates */}
        <div
          style={{
            position: 'absolute',
            bottom: -22,
            right: 0,
            fontSize: 9,
            color: '#FFCC66',
            letterSpacing: '0.05em',
          }}
        >
          DRIVE HEAD · 450 kW ABB INDUCTION
        </div>
      </div>

      {/* Non-Contact FLIR Thermography Box (Top Right) */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          right: 44,
          backgroundColor: 'rgba(10, 14, 23, 0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 170, 0, 0.35)',
          borderRadius: 12,
          padding: '16px 20px',
          width: 380,
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 170, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FFAA00', letterSpacing: '0.08em' }}>
            STATOR WINDING THERMOGRAPHY
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#FF3366' }}>
            {tempVal.toFixed(1)} °C
          </span>
        </div>

        {/* Thermal Bar */}
        <div style={{ position: 'relative', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #10B981 0%, #00F2FE 40%, #FFAA00 70%, #FF3366 100%)',
            }}
          />
          {/* Temp cursor */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${Math.min((tempVal / 110) * 100, 98)}%`,
              width: 3,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 6px #FFFFFF',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748B', marginBottom: 12 }}>
          <span>40 °C (AMBIENT)</span>
          <span style={{ color: '#FFAA00' }}>85 °C (WARNING)</span>
          <span style={{ color: '#FF3366', fontWeight: 700 }}>90 °C (TRIP LIMIT)</span>
        </div>

        {/* Diagnostic Telemetry Math */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 10,
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
            <span>STATOR CURRENT:</span>
            <span style={{ color: '#FFAA00', fontWeight: 700 }}>642 A (RATED 580 A)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
            <span>VIBRATION RMS:</span>
            <span style={{ color: '#FF3366', fontWeight: 700 }}>7.8 mm/s [ISO 10816 CLASS IV]</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
            <span>INSULATION BREAKDOWN:</span>
            <span style={{ color: '#FF3366', fontWeight: 700 }}>&lt; 2.4 HOURS REMAINING</span>
          </div>
        </div>
      </div>
    </div>
  );
};
