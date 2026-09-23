import React from 'react';
import { interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const MotorOverheatAndStop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Switch between Motor Overheat (0-280) and Operator Stop (280-600)
  const isOverheatPhase = frame < 280;

  // Motor thermal pulse
  const thermalPulse = (Math.sin(frame * 0.2) + 1) / 2;
  const tempVal = interpolate(frame, [0, 180, 280], [86.4, 91.5, 92.8], {
    extrapolateRight: 'clamp',
  });

  // Inertia Deceleration Curve (Frames 300 to 480)
  const stopProgress = interpolate(frame, [300, 460], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Smooth non-linear S-curve deceleration for heavy industrial mass
  const easedStop = stopProgress < 0.5
    ? 2 * stopProgress * stopProgress
    : 1 - Math.pow(-2 * stopProgress + 2, 2) / 2;

  const currentSpeed = (3.20 * (1 - easedStop)).toFixed(2);
  const currentTension = (142.5 - easedStop * 108.5).toFixed(1);
  const currentVib = (7.8 - easedStop * 7.6).toFixed(1);

  // Status pill text
  let statusText = 'RUNNING (FAULT DETECTED)';
  let statusColor = '#FF3B5C';
  if (frame >= 300 && frame < 460) {
    statusText = 'CONTROLLED DECELERATION // INERTIA BRAKE ACTIVE';
    statusColor = '#FFAA00';
  } else if (frame >= 460) {
    statusText = 'STOPPED (SAFE TRIP) // MODBUS TCP INTEGRATED // HARDWIRED SAFETY INDEPENDENT';
    statusColor = '#10B981';
  }

  // 24-joint matrix state
  const joints = Array.from({ length: 24 }, (_, i) => {
    const id = `J${String(i + 1).padStart(3, '0')}`;
    const isJ23 = id === 'J023';
    return { id, isJ23, health: isJ23 ? 52.4 : 94 + (i % 5) };
  });

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
      {/* Video Stream: Motor Thermal in Part A, Controlled Stop in Part B */}
      {isOverheatPhase ? (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <OffthreadVideo
            src={staticFile('video/take4_motor_thermal.mp4')}
            startFrom={60}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.35) translate(30px, -20px)',
            }}
          />

          {/* Motor M01 Thermography Reticle */}
          <div
            style={{
              position: 'absolute',
              top: '54%',
              left: '74%',
              transform: 'translate(-50%, -50%)',
              width: 380,
              height: 270,
              border: '2px dashed rgba(255, 170, 0, 0.8)',
              borderRadius: 12,
              backgroundColor: 'rgba(255, 170, 0, 0.08)',
              boxShadow: `0 0 45px rgba(255, 170, 0, ${0.25 + thermalPulse * 0.3})`,
              pointerEvents: 'none',
            }}
          >
            {/* Header Badge */}
            <div
              style={{
                position: 'absolute',
                top: -28,
                left: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#FFAA00',
                color: '#070A12',
                padding: '3px 10px',
                fontSize: 10,
                fontWeight: 800,
                fontFamily: 'monospace',
                borderRadius: 4,
              }}
            >
              <span>STATOR THERMAL RUNAWAY</span>
              <span>//</span>
              <span>91.5°C // 642 A</span>
            </div>
          </div>

          {/* FLIR Thermography Callout Card (Bottom Left) */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 44,
              backgroundColor: 'rgba(11, 16, 30, 0.92)',
              border: '1px solid rgba(255, 170, 0, 0.35)',
              borderRadius: 16,
              padding: '20px 24px',
              maxWidth: 580,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, backgroundColor: 'rgba(255, 170, 0, 0.15)', border: '1px solid rgba(255, 170, 0, 0.4)', color: '#FFAA00', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FFAA00', boxShadow: '0 0 6px #FFAA00' }} />
              POWERTRAIN THERMAL RUNAWAY // MOTOR M01
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
              DRIVE MOTOR WINDING OVERHEAT
            </div>
            <div style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.45, marginBottom: 12 }}>
              Non-contact infrared matrix detects rapid stator insulation rise to {tempVal.toFixed(1)}°C under continuous 642 A load.
            </div>
            <div style={{ display: 'flex', gap: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 10 }}>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>STATOR TEMP</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FF3B5C', fontFamily: 'monospace' }}>{tempVal.toFixed(1)}°C</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>CURRENT</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFAA00', fontFamily: 'monospace' }}>642 A</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>TRIP HORIZON</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FF3B5C', fontFamily: 'monospace' }}>&lt; 2.4 HOURS</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Part B: Closed-Loop Operator Stop & Telemetry Deceleration */
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <OffthreadVideo
            src={staticFile('video/take6_operator_stop.mp4')}
            startFrom={40}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.18) translateY(-10px)',
            }}
          />

          {/* Top Status Banner */}
          <div
            style={{
              position: 'absolute',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 24px',
              borderRadius: 30,
              backgroundColor: 'rgba(11, 16, 30, 0.94)',
              border: `1px solid ${statusColor}`,
              boxShadow: `0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px ${statusColor}40`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backdropFilter: 'blur(16px)',
              zIndex: 60,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
            <span style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
              {statusText}
            </span>
          </div>

          {/* 4 Live Telemetry Deceleration Cards (Bottom Left) */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 44,
              backgroundColor: 'rgba(11, 16, 30, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 16,
              padding: '18px 22px',
              maxWidth: 580,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.85)',
              zIndex: 60,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00F0FF', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4 }}>
              ONE-CLICK CONTROLLED SHUTDOWN
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Dynamic Inertia Ramp-Down Active
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>SPEED</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#00F0FF', fontFamily: 'monospace' }}>{currentSpeed}</span>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>m/s</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>TENSION</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>{currentTension}</span>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>kN</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>VIB RMS</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#FFAA00', fontFamily: 'monospace' }}>{currentVib}</span>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>mm/s</span>
              </div>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>STATOR</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#FF3B5C', fontFamily: 'monospace' }}>76.0</span>
                <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>°C</span>
              </div>
            </div>
          </div>

          {/* 24-Joint Splice Health Matrix (Top Right) */}
          <div
            style={{
              position: 'absolute',
              top: 70,
              right: 44,
              backgroundColor: 'rgba(11, 16, 30, 0.94)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 14,
              padding: '14px 18px',
              width: 320,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              zIndex: 60,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 10, fontFamily: 'monospace' }}>
              <span style={{ color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>24-JOINT HEALTH MATRIX</span>
              <span style={{ color: '#FFAA00', fontWeight: 800 }}>J023 ALERT</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
              {joints.map((j) => (
                <div
                  key={j.id}
                  style={{
                    padding: '4px 0',
                    textAlign: 'center',
                    fontSize: 9,
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    borderRadius: 4,
                    backgroundColor: j.isJ23 ? 'rgba(255, 170, 0, 0.25)' : 'rgba(16, 185, 129, 0.15)',
                    color: j.isJ23 ? '#FFAA00' : '#10B981',
                    border: j.isJ23 ? '1px solid #FFAA00' : '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: j.isJ23 ? `0 0 10px rgba(255, 170, 0, ${0.4 + thermalPulse * 0.4})` : 'none',
                  }}
                >
                  {j.id}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
