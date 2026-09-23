import React from 'react';
import { Composition } from 'remotion';
import { ConveyorOrionFilm } from './ConveyorOrionFilm';
import { MainFilm } from './MainFilm';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 60-Second Master: Root / Conveyor-ORION-SaaS-Reveal */}
      <Composition
        id="Root"
        component={ConveyorOrionFilm}
        durationInFrames={3600} // Exactly 60.0 seconds @ 60 fps
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="Conveyor-ORION-SaaS-Reveal"
        component={ConveyorOrionFilm}
        durationInFrames={3600} // Exactly 60.0 seconds @ 60 fps
        fps={60}
        width={1920}
        height={1080}
      />
      {/* 73-Second Extended Master */}
      <Composition
        id="ConveyorCinematic"
        component={MainFilm}
        durationInFrames={4380} // 73.0 seconds @ 60 fps
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
};
