import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const RAW_DIR = 'D:/sih 2026/conveyor-digital-twin/video-production/raw';
const takes = [
  'take1_hero_orbit',
  'take2_low_tracking',
  'take3_joint_j023',
  'take4_motor_thermal',
  'take5_misalignment',
  'take6_operator_stop',
  'take7_analytics',
];

for (const t of takes) {
  const inPath = path.join(RAW_DIR, `${t}.webm`);
  const outPath = path.join(RAW_DIR, `${t}.mp4`);
  console.log(`[TRANSCODING] ${inPath} -> ${outPath}`);
  const cmd = `npx remotion ffmpeg -y -i "${inPath}" -r 60 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "${outPath}"`;
  execSync(cmd, { stdio: 'inherit', cwd: 'D:/sih 2026/conveyor-digital-twin/frontend' });
}

console.log('[COMPLETED] All 7 takes transcoded to 1080p60 H.264 MP4');
