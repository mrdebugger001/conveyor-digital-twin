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
import { SaaSCalloutBadge } from './SaaSCalloutBadge';
import { SaaSChapterBar } from './SaaSChapterBar';
import { SaaSHookIntro } from './SaaSHookIntro';
import { SaaSEdgeHardwareScene } from './SaaSEdgeHardwareScene';
import { JointFailureCinematic } from './JointFailureCinematic';
import { MotorOverheatAndStop } from './MotorOverheatAndStop';
import { SaaSOutroCTA } from './SaaSOutroCTA';

export const ConveyorOrionFilm: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scene triggers (0 - 3600 frames @ 60 fps = exactly 60.0s)
  const isScene1Hook = frame < 420;
  const isScene2Hardware = frame >= 420 && frame < 960;
  const isScene3Twin = frame >= 960 && frame < 1560;
  const isScene4Failure = frame >= 1560 && frame < 2400;
  const isScene5MotorStop = frame >= 2400 && frame < 3000;
  const isScene6Outro = frame >= 3000;

  // Scene 3 Camera Motion (Subtle isometric orbit)
  const scene3Progress = (frame - 960) / 600;
  const scene3Zoom = interpolate(scene3Progress, [0, 1], [1.02, 1.12], { extrapolateRight: 'clamp' });
  const scene3PanX = interpolate(scene3Progress, [0, 1], [0, -25], { extrapolateRight: 'clamp' });
  const scene3TiltX = interpolate(scene3Progress, [0, 1], [0.5, -1.2], { extrapolateRight: 'clamp' });
  const scene3TiltY = interpolate(scene3Progress, [0, 1], [-1.0, 1.5], { extrapolateRight: 'clamp' });

  // Pure music soundtrack volume curve (zero voiceover, master synth soundtrack)
  const bgMusicVolume = (f: number) => {
    if (f < 30) {
      return interpolate(f, [0, 30], [0, 0.88], { extrapolateLeft: 'clamp' });
    }
    if (f > 3480) {
      return interpolate(f, [3480, 3600], [0.88, 0], { extrapolateRight: 'clamp' });
    }
    return 0.88;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#070A12',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 1. Master Modern SaaS Synth Soundtrack (124 BPM, Lossless Audio, Zero Narration) */}
      <Audio src={staticFile('video/saas-intro-master.wav')} volume={bgMusicVolume} />

      {/* 2. Scene 1: The Hook — Industrial Chaos vs. Downtime (Frames 0 - 420) */}
      {isScene1Hook && (
        <Sequence from={0} durationInFrames={420}>
          <SaaSHookIntro />
        </Sequence>
      )}

      {/* 3. Scene 2: Edge Hardware & Commodity Architecture (Frames 420 - 960) */}
      {isScene2Hardware && (
        <Sequence from={420} durationInFrames={540}>
          <SaaSEdgeHardwareScene />
        </Sequence>
      )}

      {/* 4. Scene 3: Live 3D Twin & Bulk Ore Flow (Frames 960 - 1560) */}
      {isScene3Twin && (
        <Sequence from={960} durationInFrames={600}>
          <SaaSDeviceFrame
            zoom={scene3Zoom}
            panX={scene3PanX}
            tiltX={scene3TiltX}
            tiltY={scene3TiltY}
          >
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <OffthreadVideo
                src={staticFile('video/take2_low_tracking.mp4')}
                startFrom={20}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scale(1.35) translate(-25px, -15px)',
                }}
              />
              <SaaSCalloutBadge
                badgeText="04 · 3D Digital Twin"
                title="1,480 TPH BULK ORE STREAM"
                description="Real-time Three.js granular ore physics synchronized with high-torque head and tail drive pulleys."
                position="bottom-left"
                stats={[
                  { label: 'THROUGHPUT', value: '1,480 TPH', color: '#00F0FF' },
                  { label: 'BELT SPEED', value: '3.20 M/S', color: '#4FACFE' },
                  { label: 'DRIVE POWER', value: '384 kW', color: '#10B981' },
                ]}
              />
            </div>
          </SaaSDeviceFrame>
        </Sequence>
      )}

      {/* 5. Scene 4: Cinematic Joint Failure Simulation [MAIN FOCUS] (Frames 1560 - 2400) */}
      {isScene4Failure && (
        <Sequence from={1560} durationInFrames={840}>
          <SaaSDeviceFrame zoom={1.0} panX={0} panY={0}>
            <JointFailureCinematic />
          </SaaSDeviceFrame>
        </Sequence>
      )}

      {/* 6. Scene 5: Motor Stator Overheat & Closed-Loop Stop (Frames 2400 - 3000) */}
      {isScene5MotorStop && (
        <Sequence from={2400} durationInFrames={600}>
          <SaaSDeviceFrame zoom={1.0} panX={0} panY={0}>
            <MotorOverheatAndStop />
          </SaaSDeviceFrame>
        </Sequence>
      )}

      {/* 7. Scene 6: Call To Action & Credits (Frames 3000 - 3600) */}
      {isScene6Outro && (
        <Sequence from={3000} durationInFrames={600}>
          <SaaSOutroCTA />
        </Sequence>
      )}

      {/* 8. Persistent Bottom Pill Navigator ([01 THE HOOK] ... [07 OPERATE]) */}
      <SaaSChapterBar />
    </div>
  );
};
