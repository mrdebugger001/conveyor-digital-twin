Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices()
Write-Host "Installed Voices:"
foreach ($v in $voices) {
    Write-Host " - Name: $($v.VoiceInfo.Name), Culture: $($v.VoiceInfo.Culture)"
}

# Select best voice (prefer David or Zira if available)
$synth.Rate = 0
$synth.Volume = 100

$outDir = "d:\sih 2026\conveyor-digital-twin\frontend\public\audio"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$synth.SetOutputToWaveFile("$outDir\test_voice.wav")
$synth.Speak("Introducing ORION: The real-time Digital Twin and Predictive Intelligence Platform for high-capacity conveyors.")
$synth.Dispose()
Write-Host "Generated test voiceover successfully!"
