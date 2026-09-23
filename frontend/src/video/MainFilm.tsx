import React from 'react';
import {
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { SaaSDeviceFrame } from './SaaSDeviceFrame';
import { SaaSCalloutBadge, SaaSCalloutProps } from './SaaSCalloutBadge';
import { SaaSChapterBar } from './SaaSChapterBar';
import { SaaSHookIntro } from './SaaSHookIntro';
import { SaaSEdgeHardwareScene } from './SaaSEdgeHardwareScene';
import { SaaSOutroCTA } from './SaaSOutroCTA';
import { CinematicJointOverlay } from './CinematicJointOverlay';
import { CinematicMotorOverlay } from './CinematicMotorOverlay';

interface VideoSceneItem {
  id: string;
  from: number;
  duration: number;
  videoSrc: string;
  startFrom?: number;
  zoomStart: number;
  zoomEnd: number;
  panX: number;
  panY: number;
  tiltX: number;
  tiltY: number;
  videoScale?: number;
  videoTranslateX?: number;
  videoTranslateY?: number;
  callout: SaaSCalloutProps;
}

const VIDEO_SCENES: VideoSceneItem[] = [
  // Scene 2: SaaS Reveal — Heavy Industry Meets Intelligence (Frames 450 - 930, 8.0s)
  {
    id: 'scene2_reveal',
    from: 450,
    duration: 480,
    videoSrc: 'video/take1_hero_orbit.mp4',
    startFrom: 20,
    zoomStart: 1.0,
    zoomEnd: 1.06,
    panX: 0,
    panY: 0,
    tiltX: 1.0,
    tiltY: -1.2,
    videoScale: 1.30,
    videoTranslateY: -15,
    callout: {
      badgeText: '02 · SaaS Reveal',
      title: 'HEAVY INDUSTRY MEETS REAL-TIME INTELLIGENCE',
      description: 'ORION: Sub-second 3D physics, predictive joint diagnostics, and autonomous safety control.',
      position: 'bottom-left',
      stats: [
        { label: '3D KINEMATICS', value: '60 FPS WEBGL', color: '#00F2FE' },
        { label: 'WS TELEMETRY', value: '< 20 ms', color: '#4FACFE' },
        { label: 'STATUS', value: 'NOMINAL', color: '#10B981' },
      ],
    },
  },
  // Scene 4: 3D Digital Twin & 1,480 TPH Dynamic Ore Stream (Frames 1650 - 2250, 10.0s)
  {
    id: 'scene4_digitaltwin',
    from: 1650,
    duration: 600,
    videoSrc: 'video/take2_low_tracking.mp4',
    startFrom: 20,
    zoomStart: 1.04,
    zoomEnd: 1.12,
    panX: -15,
    panY: 8,
    tiltX: -1.2,
    tiltY: 1.5,
    videoScale: 1.35,
    videoTranslateX: -25,
    videoTranslateY: -15,
    callout: {
      badgeText: '04 · 3D Digital Twin',
      title: '1,480 TPH BULK ORE STREAM',
      description: 'Granular bulk ore particle physics synchronized with high-torque head and tail drive pulleys.',
      position: 'bottom-left',
      stats: [
        { label: 'THROUGHPUT', value: '1,480 TPH', color: '#00F2FE' },
        { label: 'BELT SPEED', value: '3.20 m/s', color: '#4FACFE' },
        { label: 'DRIVE POWER', value: '384 kW', color: '#10B981' },
      ],
    },
  },
  // Scene 5A: Splice Damage Detected J023 (Frames 2250 - 2640, 6.5s)
  {
    id: 'scene5a_splice',
    from: 2250,
    duration: 390,
    videoSrc: 'video/take3_joint_j023.mp4',
    startFrom: 60,
    zoomStart: 1.08,
    zoomEnd: 1.22,
    panX: 25,
    panY: -10,
    tiltX: 1.4,
    tiltY: -1.8,
    videoScale: 1.45,
    videoTranslateX: -35,
    videoTranslateY: -20,
    callout: {
      badgeText: '05 · Predictive AI Alert',
      title: 'SPLICE DAMAGE DETECTED // J023',
      description: 'Sub-surface shear detected 18 hours in advance. Remaining Useful Life (RUL) via Miner’s Rule cumulative damage.',
      position: 'bottom-left',
      stats: [
        { label: 'JOINT HEALTH', value: '52.4% [CRITICAL]', color: '#FF3366' },
        { label: 'RUL HORIZON', value: '18 HOURS', color: '#F59E0B' },
        { label: 'FAILURE RISK', value: '89.2% PROBABILITY', color: '#FF3366' },
      ],
    },
  },
  // Scene 5B: Motor Stator Thermal Runaway (Frames 2640 - 3030, 6.5s)
  {
    id: 'scene5b_motor',
    from: 2640,
    duration: 390,
    videoSrc: 'video/take4_motor_thermal.mp4',
    startFrom: 60,
    zoomStart: 1.10,
    zoomEnd: 1.20,
    panX: -20,
    panY: 10,
    tiltX: 1.6,
    tiltY: 2.0,
    videoScale: 1.45,
    videoTranslateX: 35,
    videoTranslateY: -20,
    callout: {
      badgeText: '05 · Powertrain Diagnostics',
      title: 'MOTOR STATOR THERMAL RUNAWAY',
      description: 'Continuous non-contact IR thermography identifies winding hotspot before mechanical bearing seizure.',
      position: 'bottom-left',
      stats: [
        { label: 'MOTOR TEMP', value: '91.5°C [OVERHEAT]', color: '#FF3366' },
        { label: 'STATOR CURRENT', value: '642 A', color: '#F59E0B' },
        { label: 'THERMAL HORIZON', value: '< 2.4 HOURS', color: '#FF3366' },
      ],
    },
  },
  // Scene 6A: 24-Joint Fleet Health Matrix (Frames 3030 - 3420, 6.5s)
  {
    id: 'scene6a_fleet',
    from: 3030,
    duration: 390,
    videoSrc: 'video/take7_analytics.mp4',
    startFrom: 60,
    zoomStart: 1.0,
    zoomEnd: 1.05,
    panX: 0,
    panY: 0,
    tiltX: 0.0,
    tiltY: 0.0,
    videoScale: 1.08,
    callout: {
      badgeText: '06 · Enterprise Fleet Matrix',
      title: '24-JOINT HEALTH HEATMAP',
      description: 'Fleet-wide visibility across all joints, streaming fatigue accumulation and automated work orders.',
      position: 'bottom-left',
      stats: [
        { label: 'FLEET HEALTH', value: '91.2% AVERAGE', color: '#10B981' },
        { label: 'WORK ORDER', value: '#WO-9023 DISPATCHED', color: '#F59E0B' },
        { label: 'TELEMETRY', value: '100% RECONCILED', color: '#00F2FE' },
      ],
    },
  },
  // Scene 6B: Closed-Loop PLC Interlock & Controlled Stop (Frames 3420 - 3810, 6.5s)
  {
    id: 'scene6b_plc',
    from: 3420,
    duration: 390,
    videoSrc: 'video/take6_operator_stop.mp4',
    startFrom: 60,
    zoomStart: 1.02,
    zoomEnd: 1.0,
    panX: 0,
    panY: 0,
    tiltX: 0.0,
    tiltY: 0.0,
    videoScale: 1.18,
    videoTranslateY: -10,
    callout: {
      badgeText: '06 · Closed-Loop PLC Interlock',
      title: 'ONE-CLICK CONTROLLED SHUTDOWN',
      description: 'Direct Modbus TCP and OPC-UA PLC integration with fail-safe, independent emergency trips and zero spillage.',
      position: 'bottom-left',
      stats: [
        { label: 'RUN STATE', value: 'STOPPED (SAFE TRIP)', color: '#10B981' },
        { label: 'BELT SPEED', value: '0.00 m/s', color: '#10B981' },
        { label: 'PLC INTERLOCK', value: 'MODBUS / OPC-UA', color: '#00F2FE' },
      ],
    },
  },
];

export const MainFilm: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Active video scene
  const activeScene = VIDEO_SCENES.find((s) => frame >= s.from && frame < s.from + s.duration);

  // States
  const isScene1Hook = frame < 450;
  const isScene3Hardware = frame >= 930 && frame < 1650;
  const isScene7Outro = frame >= 3810;

  // Scene camera zoom & pan
  let currentZoom = 1.0;
  let currentPanX = 0;
  let currentPanY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;

  if (activeScene) {
    const progress = (frame - activeScene.from) / activeScene.duration;
    currentZoom = interpolate(progress, [0, 1], [activeScene.zoomStart, activeScene.zoomEnd], {
      extrapolateRight: 'clamp',
    });
    currentPanX = activeScene.panX;
    currentPanY = activeScene.panY;
    currentTiltX = activeScene.tiltX;
    currentTiltY = activeScene.tiltY;
  }

  // Pure music soundtrack volume curve (zero voiceover, full cinematic dynamics)
  const bgMusicVolume = (f: number) => {
    if (f < 30) {
      return interpolate(f, [0, 30], [0, 0.85], { extrapolateLeft: 'clamp' });
    }
    if (f > 4220) {
      return interpolate(f, [4220, 4380], [0.85, 0], { extrapolateRight: 'clamp' });
    }
    return 0.85;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0A0E17',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 1. Master Modern SaaS Synth Soundtrack (Zero Voiceover, Pure Sound Design) */}
      <Audio src={staticFile('video/saas-intro-master.wav')} volume={bgMusicVolume} />

      {/* 2. Hero SaaS Device Viewport for Real Live Video Takes */}
      {!isScene3Hardware && !isScene7Outro && !isScene1Hook && (
        <SaaSDeviceFrame
          zoom={currentZoom}
          panX={currentPanX}
          panY={currentPanY}
          tiltX={currentTiltX}
          tiltY={currentTiltY}
        >
          {VIDEO_SCENES.map((scene) => (
            <Sequence key={scene.id} from={scene.from} durationInFrames={scene.duration}>
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <OffthreadVideo
                  src={staticFile(scene.videoSrc)}
                  startFrom={scene.startFrom || 0}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scene.videoScale || 1.0}) translate(${scene.videoTranslateX || 0}px, ${scene.videoTranslateY || 0}px)`,
                    transformOrigin: 'center center',
                  }}
                />
                {/* Tactical HUD overlays for predictive diagnostics */}
                {scene.id === 'scene5a_splice' && <CinematicJointOverlay />}
                {scene.id === 'scene5b_motor' && <CinematicMotorOverlay />}
                <SaaSCalloutBadge {...scene.callout} />
              </div>
            </Sequence>
          ))}
        </SaaSDeviceFrame>
      )}

      {/* 3. Scene 1: The Hook — Industrial Chaos vs. Downtime (Frames 0 - 450) */}
      {isScene1Hook && <SaaSHookIntro />}

      {/* 4. Scene 3: Hardware & Multimodal Edge Sensing (Frames 930 - 1650) */}
      {isScene3Hardware && (
        <Sequence from={930} durationInFrames={720}>
          <SaaSEdgeHardwareScene />
        </Sequence>
      )}

      {/* 5. Scene 7: Outro & Call to Action (Frames 3810 - 4380, 570 frames = 9.5s) */}
      {isScene7Outro && (
        <Sequence from={3810} durationInFrames={570}>
          <SaaSOutroCTA />
        </Sequence>
      )}

      {/* 6. Floating Bottom Chapter Progress Tracker */}
      <SaaSChapterBar />
    </div>
  );
};
