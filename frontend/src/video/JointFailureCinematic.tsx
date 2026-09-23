import React from 'react';
import { interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const JointFailureCinematic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Cinematic Roll-In & 350% Macro Zoom onto Joint J023 (Local frames 0 to 180)
  // Pull-Out back to wide at frames 700 to 840
  const rollInProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 16, mass: 1.0, stiffness: 60 },
  });

  const pullOutProgress = spring({
    frame: frame - 700,
    fps,
    config: { damping: 16, mass: 1.0, stiffness: 70 },
  });

  // Effective camera transforms: 1.0 -> 3.5 -> 1.0
  const zoomIn = interpolate(rollInProgress, [0, 1], [1.0, 3.2]);
  const zoomOut = interpolate(pullOutProgress, [0, 1], [0, 2.2]);
  const currentScale = Math.max(1.0, zoomIn - zoomOut);

  // Bank angle: 0deg -> -28deg -> 0deg
  const rollInBank = interpolate(rollInProgress, [0, 1], [0, -28]);
  const pullOutBank = interpolate(pullOutProgress, [0, 1], [0, -28]);
  const currentRollZ = rollInBank - pullOutBank;

  // Camera pan translation targeting J023 in the video
  const panInX = interpolate(rollInProgress, [0, 1], [0, -180]);
  const panOutX = interpolate(pullOutProgress, [0, 1], [0, -180]);
  const currentPanX = panInX - panOutX;

  const panInY = interpolate(rollInProgress, [0, 1], [0, -110]);
  const panOutY = interpolate(pullOutProgress, [0, 1], [0, -110]);
  const currentPanY = panInY - panOutY;

  // 2. Heatmap Rollout Animation (Frames 140 to 240)
  const heatmapSpread = interpolate(frame, [140, 220], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 3. HUD Callout Spring Animation (Enters frame 180, exits frame 720)
  const hudEnterSpring = spring({
    frame: frame - 180,
    fps,
    config: { damping: 14, stiffness: 85 },
  });
  const hudExit = interpolate(frame, [700, 740], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const hudOpacity = interpolate(hudEnterSpring, [0, 1], [0, 1]) * hudExit;
  const hudScale = interpolate(hudEnterSpring, [0, 1], [0.88, 1.0]);

  // Dashoffset animation for SVG leader line
  const dashOffset = interpolate(frame, [190, 260], [280, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Dynamic stress value rollout
  const stressVal = interpolate(frame, [140, 320], [140, 248.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = (Math.sin(frame * 0.16) + 1) / 2;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#070A12',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* 3D High-DPI Conveyor Viewport with Cinematic Roll-In & 350% Macro Zoom */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `
            translate3d(${currentPanX}px, ${currentPanY}px, 0)
            scale(${currentScale})
            rotateZ(${currentRollZ}deg)
          `,
          transformOrigin: '52% 44%',
          transition: 'transform 0.08s ease-out',
        }}
      >
        <OffthreadVideo
          src={staticFile('video/take3_joint_j023.mp4')}
          startFrom={30}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Multi-Spectral Rainbow Stress Heatmap Shader Overlay on Splice Joint J023 */}
        {frame > 130 && (
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '46%',
              transform: 'translate(-50%, -50%)',
              width: 190,
              height: 48,
              opacity: heatmapSpread * 0.85,
              borderRadius: 4,
              background: `linear-gradient(90deg, 
                rgba(0, 85, 255, 0.2) 0%, 
                rgba(0, 240, 255, 0.6) 25%, 
                rgba(34, 197, 94, 0.8) 50%, 
                rgba(255, 170, 0, 0.95) 75%, 
                rgba(255, 59, 92, 1.0) 100%
              )`,
              boxShadow: `0 0 35px rgba(255, 59, 92, ${0.4 + pulse * 0.3})`,
              mixBlendMode: 'screen',
              filter: 'blur(1px)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Frame-Synced Animated SVG Leader Line & HUD Diagnostics (Apple / Google Antigravity Level) */}
      {frame > 175 && (
        <div
          style={{
            position: 'absolute',
            top: '32%',
            left: '42%',
            opacity: hudOpacity,
            transform: `scale(${hudScale})`,
            pointerEvents: 'none',
            zIndex: 60,
          }}
        >
          {/* Neon Target Reticle */}
          <div
            style={{
              width: 260,
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #FF3B5C',
              backgroundColor: 'rgba(255, 59, 92, 0.16)',
              backdropFilter: 'blur(16px)',
              boxShadow: `0 0 45px rgba(255, 59, 92, ${0.35 + pulse * 0.25})`,
              position: 'relative',
            }}
          >
            {/* Corner Brackets */}
            <div style={{ position: 'absolute', top: -3, left: -3, width: 12, height: 12, borderTop: '3px solid #FF3B5C', borderLeft: '3px solid #FF3B5C' }} />
            <div style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderTop: '3px solid #FF3B5C', borderRight: '3px solid #FF3B5C' }} />
            <div style={{ position: 'absolute', bottom: -3, left: -3, width: 12, height: 12, borderBottom: '3px solid #FF3B5C', borderLeft: '3px solid #FF3B5C' }} />
            <div style={{ position: 'absolute', bottom: -3, right: -3, width: 12, height: 12, borderBottom: '3px solid #FF3B5C', borderRight: '3px solid #FF3B5C' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontFamily: 'monospace', fontWeight: 800, color: '#FF3B5C' }}>
              <span>FAULT DETECTED // J023</span>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  backgroundColor: '#FF3B5C',
                  boxShadow: '0 0 10px #FF3B5C',
                }}
              />
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', marginTop: 4 }}>
              SPLICE SHEAR TEAR
            </div>
            <div style={{ color: '#FFAA00', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
              Micro-Crack Propagation // FEA: {stressVal.toFixed(1)} MPa
            </div>
          </div>

          {/* Animated SVG Connecting Leader Line */}
          <svg
            style={{
              width: 320,
              height: 110,
              marginTop: -8,
              overflow: 'visible',
              position: 'relative',
              zIndex: 65,
            }}
          >
            <polyline
              points="20,0 70,60 260,60"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="2.5"
              strokeDasharray="280"
              strokeDashoffset={dashOffset}
              style={{ filter: 'drop-shadow(0 0 8px #00F0FF)' }}
            />
            {dashOffset < 20 && (
              <circle cx="260" cy="60" r="5" fill="#00F0FF" style={{ filter: 'drop-shadow(0 0 10px #00F0FF)' }} />
            )}
          </svg>

          {/* Floating Diagnostic Specification Card */}
          <div
            style={{
              marginLeft: 220,
              marginTop: -60,
              width: 360,
              backgroundColor: 'rgba(11, 16, 30, 0.94)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: 16,
              padding: '20px 24px',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(0, 240, 255, 0.15)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Predictive Horizon
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 59, 92, 0.2)',
                  color: '#FF3B5C',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                }}
              >
                CRITICAL
              </span>
            </div>

            <div style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 10 }}>
              18 Hours to Rupture
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 14 }}>
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: 10, color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Joint Health:
                </span>
                <span style={{ color: '#FF3B5C', fontWeight: 800, fontSize: 15, fontFamily: 'monospace' }}>
                  52.4% [CRIT]
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: 10, color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Failure Risk:
                </span>
                <span style={{ color: '#FFAA00', fontWeight: 800, fontSize: 15, fontFamily: 'monospace' }}>
                  89.2%
                </span>
              </div>
            </div>

            {/* Physics Engine & Anomaly Tags */}
            <div
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: 11,
                fontFamily: 'monospace',
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: '#00F0FF' }}>
                Miner's Fatigue Model: D = ∑(nᵢ/Nᵢ) = 0.892 &gt; 0.85
              </div>
              <div style={{ color: '#94A3B8', fontSize: 10 }}>
                1D-CNN Micro-Shear Signature Confirmed (98.4%)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
