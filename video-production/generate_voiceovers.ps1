Add-Type -AssemblyName System.Speech

$voiceLines = @(
    @{
        Id = "scene1_hook"
        Text = "In heavy mining, a single undetected conveyor joint rupture halts millions of tons of production."
    },
    @{
        Id = "scene2_reveal"
        Text = "Introducing ORION: The real-time Digital Twin and Predictive Intelligence Platform for high-capacity conveyors."
    },
    @{
        Id = "scene3_hardware"
        Text = "Powered by edge-intelligent hardware at just three thousand rupees per node, fusing multi-axis vibration, thermography, dynamic tension, and optical inspection."
    },
    @{
        Id = "scene4_digitaltwin"
        Text = "A physics-informed 3D Digital Twin rendered directly in the browser with sub-second WebSocket telemetry, mirroring every ton of material movement."
    },
    @{
        Id = "scene5_predictive"
        Text = "Predict failures before they happen. ORION's physics-informed models detect sub-surface shear up to eighteen hours in advance, calculating joint fatigue and remaining useful life."
    },
    @{
        Id = "scene6_matrix_plc"
        Text = "Fleet-wide visibility across all joints, integrated directly into existing SCADA and PLCs via Modbus and OPC-UA, with fail-safe, independent emergency trips."
    },
    @{
        Id = "scene7_outro"
        Text = "Predict. Prevent. Operate. The future of smart mining is here with Team ORION."
    }
)

$outDir = "d:\sih 2026\conveyor-digital-twin\frontend\public\audio"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

foreach ($item in $voiceLines) {
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    # Microsoft David is crisp and professional
    $synth.SelectVoice("Microsoft David Desktop")
    $synth.Rate = 0  # Natural conversational tech pace
    $synth.Volume = 100
    
    $outFile = "$outDir\$($item.Id).wav"
    Write-Host "Synthesizing $($item.Id)..."
    $synth.SetOutputToWaveFile($outFile)
    $synth.Speak($item.Text)
    $synth.Dispose()
    Write-Host "Saved: $outFile"
}

Write-Host "All 7 narration lines synthesized successfully!"
