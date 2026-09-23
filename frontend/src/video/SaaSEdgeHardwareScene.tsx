import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const SaaSEdgeHardwareScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const anim = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 90 },
  });

  const scale = interpolate(anim, [0, 1], [0.94, 1.0]);
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Pulsing scan line
  const scanY = (frame * 4) % 400;

  // Sensor node pulses
  const pulse1 = (Math.sin(frame * 0.1) + 1) / 2;
  const pulse2 = (Math.cos(frame * 0.12) + 1) / 2;
  const pulse3 = (Math.sin(frame * 0.15 + 1.5) + 1) / 2;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#070B14',
        backgroundImage: `
          radial-gradient(circle at 75% 50%, rgba(0, 242, 254, 0.12) 0%, transparent 60%),
          radial-gradient(circle at 25% 70%, rgba(79, 172, 254, 0.08) 0%, transparent 50%),
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 100px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: '#FFFFFF',
        opacity,
        overflow: 'hidden',
      }}
    >
      {/* Left Column: Spec Badges & Architecture */}
      <div style={{ maxWidth: 720, zIndex: 10, transform: `scale(${scale})` }}>
        {/* Category Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 18px',
            borderRadius: 30,
            background: 'rgba(0, 242, 254, 0.12)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            color: '#00F2FE',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#00F2FE',
              boxShadow: '0 0 12px #00F2FE',
            }}
          />
          SCENE 03 · EDGE HARDWARE ARCHITECTURE
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 16,
          }}
        >
          COMMODITY EDGE AI <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AT ~₹3,000 PER NODE.
          </span>
        </div>

        <div
          style={{
            fontSize: 18,
            color: '#94A3B8',
            lineHeight: 1.5,
            marginBottom: 32,
            maxWidth: 620,
          }}
        >
          Replace prohibitive legacy $3,000 DAQs with ruggedized ESP32-S3 multimodal edge nodes running on-device 1D-CNN anomaly models.
        </div>

        {/* Spec Grid Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {/* Card 1 */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: '18px 22px',
              borderLeft: '4px solid #00F2FE',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em' }}>
              BILL OF MATERIALS
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#00F2FE', marginTop: 4 }}>
              ₹3,000 <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>/ Sensor Node</span>
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              90% lower CAPEX vs proprietary DAQ
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: '18px 22px',
              borderLeft: '4px solid #10B981',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em' }}>
              ON-DEVICE INFERENCE
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              1D-CNN + Autoencoder
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              Sub-surface fatigue & vibration anomaly
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: '18px 22px',
              borderLeft: '4px solid #818CF8',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em' }}>
              MULTIMODAL FUSION
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
              Vibration · Temp · Tension
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              Motor current + optical splice camera
            </div>
          </div>

          {/* Card 4 */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: '18px 22px',
              borderLeft: '4px solid #F59E0B',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em' }}>
              INDUSTRIAL BUS
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
              RS-485 / Modbus / LoRa
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
              IP67 rated harsh mining enclosure
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: High-Tech Exploded PCB / Schematic View */}
      <div
        style={{
          width: 580,
          height: 620,
          position: 'relative',
          background: 'rgba(10, 16, 28, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1px solid rgba(0, 242, 254, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(0, 242, 254, 0.2)',
          padding: 30,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transform: `scale(${scale})`,
        }}
      >
        {/* Schematic Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#00F2FE', letterSpacing: '0.1em' }}>
              ORION-NODE-S3 // SCHEMATIC
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>
              ESP32-S3 Edge Compute Unit
            </div>
          </div>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              color: '#10B981',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ACTIVE · 10 kHz
          </div>
        </div>

        {/* Central Microcontroller Block */}
        <div style={{ position: 'relative', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Glowing Center Chip */}
          <div
            style={{
              width: 190,
              height: 190,
              borderRadius: 16,
              background: 'linear-gradient(145deg, #0F172A, #020617)',
              border: '2px solid #00F2FE',
              boxShadow: `0 0 ${20 + pulse1 * 20}px rgba(0, 242, 254, 0.5)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.12em' }}>
              ESPRESSIF
            </div>
            <div style={{ fontSize: 22, color: '#FFFFFF', fontWeight: 900, marginTop: 4 }}>
              ESP32-S3
            </div>
            <div style={{ fontSize: 11, color: '#00F2FE', fontWeight: 600, marginTop: 2 }}>
              Dual-Core Xtensa LX7
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 10, fontFamily: 'monospace' }}>
              240 MHz · 8MB PSRAM
            </div>
          </div>

          {/* Connected Sensor Callout 1: Top Left */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 10,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              fontSize: 12,
              fontWeight: 600,
              color: '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00F2FE' }} />
            <span>3-Axis Vibration (10 kHz)</span>
          </div>

          {/* Connected Sensor Callout 2: Top Right */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 10,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              fontSize: 12,
              fontWeight: 600,
              color: '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F43F5E' }} />
            <span>IR Stator Thermography</span>
          </div>

          {/* Connected Sensor Callout 3: Bottom Left */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 10,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontSize: 12,
              fontWeight: 600,
              color: '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            <span>Dynamic Belt Tension</span>
          </div>

          {/* Connected Sensor Callout 4: Bottom Right */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 10,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              fontSize: 12,
              fontWeight: 600,
              color: '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
            <span>Optical Splice Vision</span>
          </div>
        </div>

        {/* Live Telemetry Stream Bar */}
        <div
          style={{
            background: 'rgba(2, 6, 23, 0.8)',
            borderRadius: 12,
            padding: '12px 18px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        >
          <div style={{ color: '#64748B' }}>
            PAYLOAD: <span style={{ color: '#00F2FE' }}>64 BYTES / 100ms</span>
          </div>
          <div style={{ color: '#64748B' }}>
            LATENCY: <span style={{ color: '#10B981' }}>12 ms</span>
          </div>
          <div style={{ color: '#64748B' }}>
            PROTOCOL: <span style={{ color: '#A855F7' }}>WEBSOCKET / MQTT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
