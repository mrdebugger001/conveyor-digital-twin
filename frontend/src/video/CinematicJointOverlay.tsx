import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const CinematicJointOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scanline and pulse
  const scanProgress = (frame % 90) / 90;
  const pulse = (Math.sin(frame * 0.15) + 1) / 2;
  const stressVal = interpolate(frame, [0, 180, 390], [185, 248, 262], {
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
      {/* Reticle Target Over Joint J023 */}
      <div
        style={{
          position: 'absolute',
          top: '36%',
          left: '52%',
          transform: 'translate(-50%, -50%)',
          width: 320,
          height: 180,
          border: '1px dashed rgba(255, 51, 102, 0.6)',
          borderRadius: 8,
          backgroundColor: 'rgba(255, 51, 102, 0.08)',
          boxShadow: `0 0 30px rgba(255, 51, 102, ${0.2 + pulse * 0.2})`,
        }}
      >
        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: -2, left: -2, width: 14, height: 14, borderTop: '3px solid #FF3366', borderLeft: '3px solid #FF3366' }} />
        <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderTop: '3px solid #FF3366', borderRight: '3px solid #FF3366' }} />
        <div style={{ position: 'absolute', bottom: -2, left: -2, width: 14, height: 14, borderBottom: '3px solid #FF3366', borderLeft: '3px solid #FF3366' }} />
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderBottom: '3px solid #FF3366', borderRight: '3px solid #FF3366' }} />

        {/* Laser Sweep Line */}
        <div
          style={{
            position: 'absolute',
            top: `${scanProgress * 100}%`,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #FF3366, #FF99AA, #FF3366, transparent)',
            boxShadow: '0 0 12px #FF3366',
          }}
        />

        {/* Target Header */}
        <div
          style={{
            position: 'absolute',
            top: -26,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#FF3366',
            color: '#FFFFFF',
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            borderRadius: 3,
          }}
        >
          <span>TARGET LOCKED</span>
          <span>//</span>
          <span>JOINT J023 SPLICE</span>
        </div>

        {/* Reticle Coordinates */}
        <div
          style={{
            position: 'absolute',
            bottom: -22,
            right: 0,
            fontSize: 9,
            color: '#FF99AA',
            letterSpacing: '0.05em',
          }}
        >
          LOC: STA 142+50 · LAT: +4.2mm
        </div>
      </div>

      {/* Finite Element Rainbow Stress Heatmap Callout (Top Right) */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          right: 44,
          backgroundColor: 'rgba(10, 14, 23, 0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 51, 102, 0.35)',
          borderRadius: 12,
          padding: '16px 20px',
          width: 380,
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 51, 102, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FF3366', letterSpacing: '0.08em' }}>
            FEA VON MISES STRESS TENSOR
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>
            {stressVal.toFixed(1)} MPa
          </span>
        </div>

        {/* Rainbow Heatmap Spectrum Bar */}
        <div style={{ position: 'relative', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #0055ff 0%, #00ffff 25%, #00ff66 50%, #ffee00 75%, #ff0044 100%)',
            }}
          />
          {/* Stress indicator cursor */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${Math.min((stressVal / 300) * 100, 98)}%`,
              width: 3,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 6px #FFFFFF',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748B', marginBottom: 12 }}>
          <span>0 MPa (NOMINAL)</span>
          <span>150 MPa (YIELD)</span>
          <span style={{ color: '#FF3366', fontWeight: 700 }}>220 MPa (SHEAR CRIT)</span>
        </div>

        {/* Miner's Rule & 1D-CNN Math Box */}
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
            <span>MINER'S FATIGUE:</span>
            <span style={{ color: '#FF3366', fontWeight: 700 }}>D = Σ (nᵢ/Nᵢ) = 0.892</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
            <span>1D-CNN ANOMALY CONF:</span>
            <span style={{ color: '#00F2FE', fontWeight: 700 }}>98.4% [CONV-LSTM]</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
            <span>CRITICAL RUL HORIZON:</span>
            <span style={{ color: '#F59E0B', fontWeight: 700 }}>18.2 HOURS TO TEAR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
