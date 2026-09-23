Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.Rate = -1
$s.Volume = 92
$s.SetOutputToWaveFile('D:\\sih 2026\\conveyor-digital-twin\\video-production\\renders\\narration.wav')
$s.Speak(@'
Iron Ore Conveyor Digital Twin. A real-time operational view of conveyor C01. Live telemetry, a three-dimensional conveyor, operator controls, and alarm status come together in one focused workspace. The simulator safely models conditions such as joint damage, overheat, vibration, belt tear, and conveyor jams. Asset diagnostics surface component health, failure probability, and contributing factors. Streaming analytics tracks operating metrics and a 24-joint health matrix. Alarm and maintenance workflows turn risk signals into practical action. Built with React, TypeScript, Three.js, FastAPI, WebSockets, Zustand, Recharts, and SQLite.
'@)
$s.Dispose()
