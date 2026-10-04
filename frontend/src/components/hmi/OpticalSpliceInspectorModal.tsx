import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Camera,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Wrench,
  Scan,
  Layers,
} from 'lucide-react'
import { useTwinStore } from '../../store/twinStore'

interface DefectBox {
  id: string
  label: string
  confidence: number
  x: number // percent 0-100
  y: number // percent 0-100
  width: number
  height: number
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  metric: string
}

const SPLICE_DEFECT_PROFILES: Record<string, DefectBox[]> = {
  J023: [
    {
      id: 'd1',
      label: 'Steel Cord Pullout / Core Separation',
      confidence: 0.942,
      x: 38,
      y: 28,
      width: 24,
      height: 36,
      severity: 'CRITICAL',
      metric: 'Gap: 6.2 mm · 3 cords exposed',
    },
    {
      id: 'd2',
      label: 'Transverse Splice Micro-Crack',
      confidence: 0.897,
      x: 64,
      y: 42,
      width: 18,
      height: 22,
      severity: 'CRITICAL',
      metric: 'Length: 42 mm · Shear strain',
    },
    {
      id: 'd3',
      label: 'Edge Cover Rubber Fraying',
      confidence: 0.918,
      x: 8,
      y: 68,
      width: 22,
      height: 18,
      severity: 'WARNING',
      metric: 'Depth: 3.5 mm · Friction wear',
    },
  ],
  J012: [
    {
      id: 'd4',
      label: 'Surface Gouge / Scraper Chatter',
      confidence: 0.884,
      x: 45,
      y: 35,
      width: 20,
      height: 25,
      severity: 'WARNING',
      metric: 'Depth: 1.8 mm · Minor abrasion',
    },
  ],
  J003: [],
  J018: [
    {
      id: 'd5',
      label: 'Fastener Micro-Fatigue Dislocation',
      confidence: 0.825,
      x: 52,
      y: 50,
      width: 15,
      height: 20,
      severity: 'WARNING',
      metric: 'Displacement: 0.8 mm',
    },
  ],
}

export function OpticalSpliceInspectorModal() {
  const { isOpticalInspectorOpen, setOpticalInspectorOpen, conveyor, openSapModal } = useTwinStore()
  const [selectedSplice, setSelectedSplice] = useState<string>('J023')
  const [isFrozen, setIsFrozen] = useState<boolean>(false)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0)
  const [exposureUs, setExposureUs] = useState<number>(185)
  const [showOverlays, setShowOverlays] = useState<boolean>(true)
  const [activeDefectId, setActiveDefectId] = useState<string | null>('d1')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const scrollOffsetRef = useRef<number>(0)

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpticalInspectorOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setOpticalInspectorOpen])

  // Real-time Line-Scan Camera Surface Simulation
  useEffect(() => {
    if (!isOpticalInspectorOpen) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = performance.now()

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000
      lastTime = time

      const speed = conveyor?.runState === 'RUNNING' && !isFrozen ? (conveyor.speed || 3.2) : 0
      scrollOffsetRef.current = (scrollOffsetRef.current + speed * dt * 80) % 800

      const width = canvas.width
      const height = canvas.height

      // Background rubber texture
      ctx.fillStyle = '#111418'
      ctx.fillRect(0, 0, width, height)

      // Longitudinal belt cord striations (steel cord ribs)
      ctx.strokeStyle = '#1E232B'
      ctx.lineWidth = 1.5
      for (let y = 15; y < height; y += 12) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Scrolling surface texture noise and splice seam
      const seamX = (width * 0.48 - (scrollOffsetRef.current % width) + width) % width

      // Splice joint step-down interface
      ctx.fillStyle = '#222834'
      ctx.fillRect(seamX - 40, 20, 80, height - 40)

      // Splice diagonal overlap angle (typical 22-degree bias hot splice)
      ctx.strokeStyle = '#384252'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(seamX - 30, 20)
      ctx.lineTo(seamX + 30, height - 20)
      ctx.stroke()

      // Splice vulcanized finger joint pattern
      ctx.strokeStyle = '#2B3545'
      ctx.lineWidth = 2
      for (let y = 30; y < height - 30; y += 24) {
        ctx.beginPath()
        ctx.moveTo(seamX - 35, y)
        ctx.lineTo(seamX + 5, y + 10)
        ctx.lineTo(seamX - 35, y + 20)
        ctx.stroke()
      }

      // If splice J023, draw the acute shear crack and exposed cord filaments
      if (selectedSplice === 'J023') {
        const crackX = (seamX - 10 + width) % width

        // Dark crack fissure
        ctx.strokeStyle = '#05070A'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(crackX - 15, height * 0.3)
        ctx.lineTo(crackX + 10, height * 0.45)
        ctx.lineTo(crackX - 5, height * 0.6)
        ctx.stroke()

        // Core frayed steel cord filaments (shiny metallic glint under line laser)
        ctx.strokeStyle = '#E2E8F0'
        ctx.lineWidth = 1.5
        for (let i = -10; i <= 10; i += 4) {
          ctx.beginPath()
          ctx.moveTo(crackX + i, height * 0.38)
          ctx.lineTo(crackX + i + 8, height * 0.42)
          ctx.stroke()
        }

        // Fraying along top edge
        ctx.fillStyle = '#2A1810'
        ctx.fillRect(crackX - 80, 20, 120, 15)
      }

      // High-intensity Line-Scan Laser illumination slit (vertical cyan-white scan line)
      const laserX = width * 0.5
      const laserGrad = ctx.createLinearGradient(laserX - 8, 0, laserX + 8, 0)
      laserGrad.addColorStop(0, 'rgba(0, 229, 255, 0.0)')
      laserGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.45)')
      laserGrad.addColorStop(1, 'rgba(0, 229, 255, 0.0)')
      ctx.fillStyle = laserGrad
      ctx.fillRect(laserX - 8, 0, 16, height)

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(laserX, 0)
      ctx.lineTo(laserX, height)
      ctx.stroke()

      // Sensor scanline noise
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1)
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isOpticalInspectorOpen, isFrozen, conveyor?.runState, conveyor?.speed, selectedSplice])

  if (!isOpticalInspectorOpen) return null

  const defects = SPLICE_DEFECT_PROFILES[selectedSplice] || []
  const hasCritical = defects.some((d) => d.severity === 'CRITICAL')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-surface-container border border-outline-variant rounded-xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-high flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-container/40 border border-primary/40 flex items-center justify-center text-primary">
              <Camera size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface">Edge AI Optical Splice Inspector</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary-container text-primary border border-primary/30">
                  YOLOv8-NANO · 120 FPS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface border border-outline-variant text-status-green flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
                  SENSOR ONLINE
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                4096-Pixel Line-Scan Cam · 24 kHz Scan Frequency · Hot Vulcanized Splice Diagnostics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Splice Selector Tabs */}
            <div className="flex items-center bg-surface border border-outline-variant rounded-lg p-0.5">
              {['J023', 'J012', 'J003', 'J018'].map((jid) => {
                const isFatigued = jid === 'J023'
                const isSelected = selectedSplice === jid
                return (
                  <button
                    key={jid}
                    onClick={() => {
                      setSelectedSplice(jid)
                      setActiveDefectId(jid === 'J023' ? 'd1' : jid === 'J012' ? 'd4' : null)
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-surface shadow'
                        : isFatigued
                        ? 'text-status-red hover:bg-surface-high'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {jid} {isFatigued && '⚠'}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setOpticalInspectorOpen(false)}
              className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-high transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center Canvas Viewport */}
          <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
            {/* Camera Overlay HUD Stats */}
            <div className="absolute top-3 left-4 z-10 flex items-center gap-3 text-[11px] font-mono text-cyan-400 bg-black/60 px-3 py-1.5 rounded-md border border-cyan-500/30 backdrop-blur-sm pointer-events-none">
              <span>FOV: 1400 mm</span>
              <span>•</span>
              <span>EXP: {exposureUs} μs</span>
              <span>•</span>
              <span>RES: 0.34 mm/px</span>
              <span>•</span>
              <span>LINE RATE: 24.2 kHz</span>
            </div>

            {/* Viewport Zoom & Freeze Controls */}
            <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5 bg-surface-high/80 border border-outline-variant/80 p-1 rounded-lg backdrop-blur-sm">
              <button
                onClick={() => setIsFrozen(!isFrozen)}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  isFrozen ? 'bg-status-amber text-surface font-bold' : 'text-on-surface hover:bg-surface'
                }`}
                title={isFrozen ? 'Resume live camera' : 'Freeze frame'}
              >
                {isFrozen ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.5))}
                className="p-1.5 text-on-surface hover:bg-surface rounded transition-colors cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(1.0, z - 0.5))}
                className="p-1.5 text-on-surface hover:bg-surface rounded transition-colors cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => setShowOverlays(!showOverlays)}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  showOverlays ? 'bg-primary-container text-primary' : 'text-on-surface-variant'
                }`}
                title="Toggle YOLO Bounding Boxes"
              >
                <Layers size={14} />
              </button>
            </div>

            {/* Live Canvas Feed */}
            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.2s ease-out',
                }}
                className="relative w-[780px] h-[460px] shadow-2xl rounded border border-outline-variant/40 overflow-hidden"
              >
                <canvas
                  ref={canvasRef}
                  width={780}
                  height={460}
                  className="w-full h-full block bg-surface"
                />

                {/* YOLOv8 AI Defect Bounding Boxes */}
                {showOverlays &&
                  defects.map((d) => {
                    const isSelected = activeDefectId === d.id
                    const borderColor =
                      d.severity === 'CRITICAL' ? 'border-status-red' : 'border-status-amber'
                    const textColor =
                      d.severity === 'CRITICAL' ? 'text-status-red' : 'text-status-amber'
                    const bgColor =
                      d.severity === 'CRITICAL' ? 'bg-status-red/20' : 'bg-status-amber/20'

                    return (
                      <div
                        key={d.id}
                        onClick={() => setActiveDefectId(d.id)}
                        style={{
                          left: `${d.x}%`,
                          top: `${d.y}%`,
                          width: `${d.width}%`,
                          height: `${d.height}%`,
                        }}
                        className={`absolute border-2 ${borderColor} ${bgColor} rounded cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-white ring-offset-1' : ''
                        }`}
                      >
                        {/* YOLO Tag Chip */}
                        <div
                          className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-md bg-black/85 ${textColor} border ${borderColor} flex items-center gap-1.5`}
                        >
                          <Scan size={10} />
                          <span>
                            {d.label.split(' ')[0]} {(d.confidence * 100).toFixed(1)}%
                          </span>
                        </div>

                        {/* Corner Target Marks */}
                        <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Bottom Camera Toolbar */}
            <div className="h-10 bg-surface-high border-t border-outline-variant px-5 flex items-center justify-between text-xs text-on-surface-variant font-mono">
              <div className="flex items-center gap-4">
                <span>INSPECTING: SPLICE {selectedSplice}</span>
                <span>STATUS: {isFrozen ? 'FRAME FROZEN' : 'STREAMING 120 FPS'}</span>
                <span>DETECTED: {defects.length} ANOMALIES</span>
              </div>
              <div className="flex items-center gap-3">
                <span>ZOOM: {zoomLevel.toFixed(1)}x</span>
                <span>EXPOSURE:</span>
                <input
                  type="range"
                  min={80}
                  max={350}
                  value={exposureUs}
                  onChange={(e) => setExposureUs(Number(e.target.value))}
                  className="w-24 accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Right AI Diagnostics Sidebar */}
          <div className="w-96 bg-surface-container border-l border-outline-variant flex flex-col justify-between overflow-y-auto p-5">
            <div className="flex flex-col gap-4">
              {/* Splice Overview Card */}
              <div className="p-3.5 rounded-lg bg-surface-high border border-outline-variant">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Splice {selectedSplice} Profile
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      hasCritical
                        ? 'bg-status-red/15 text-status-red border-status-red/50 animate-pulse'
                        : defects.length > 0
                        ? 'bg-status-amber/15 text-status-amber border-status-amber/50'
                        : 'bg-status-green/15 text-status-green border-status-green/50'
                    }`}
                  >
                    {hasCritical ? 'CRITICAL DEFECT' : defects.length > 0 ? 'WARNING' : 'HEALTHY'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-surface/60 p-2 rounded">
                    <span className="text-[10px] text-on-surface-variant block">Joint Type</span>
                    <span className="text-on-surface font-semibold">ST2500 Vulcanized</span>
                  </div>
                  <div className="bg-surface/60 p-2 rounded">
                    <span className="text-[10px] text-on-surface-variant block">Cumulative Cycles</span>
                    <span className="text-on-surface font-semibold">842,500 revs</span>
                  </div>
                </div>
              </div>

              {/* Detected YOLO Defects List */}
              <div>
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2.5">
                  AI Detections ({defects.length})
                </span>

                {defects.length === 0 ? (
                  <div className="p-4 rounded-lg bg-surface-high/50 border border-outline-variant/60 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 size={28} className="text-status-green mb-2" />
                    <span className="text-xs font-semibold text-on-surface">No Splice Defects</span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">
                      Surface rubber and steel cords intact.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {defects.map((d) => {
                      const isSelected = activeDefectId === d.id
                      return (
                        <div
                          key={d.id}
                          onClick={() => setActiveDefectId(d.id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-surface-high border-primary shadow-md'
                              : 'bg-surface-high/40 border-outline-variant hover:border-outline-variant/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-on-surface leading-tight">
                              {d.label}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                d.severity === 'CRITICAL'
                                  ? 'bg-status-red/20 text-status-red'
                                  : 'bg-status-amber/20 text-status-amber'
                              }`}
                            >
                              {(d.confidence * 100).toFixed(1)}% conf
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-on-surface-variant block">
                            {d.metric}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Edge AI Model Inference Card */}
              <div className="p-3 rounded-lg bg-surface-high/30 border border-outline-variant/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary-container/30 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
                  <Cpu size={16} />
                </div>
                <div className="text-[11px] text-on-surface-variant font-mono">
                  <div>Model: YOLOv8n-Seg (TensorRT FP16)</div>
                  <div>Latency: 4.8 ms · 208 FPS throughput</div>
                </div>
              </div>
            </div>

            {/* Bottom Action: SAP Work Order Dispatch */}
            <div className="pt-4 border-t border-outline-variant flex flex-col gap-2">
              <button
                onClick={() => {
                  setOpticalInspectorOpen(false)
                  openSapModal(`joint-${selectedSplice}`)
                }}
                className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  hasCritical
                    ? 'bg-status-red text-white hover:bg-red-700 animate-pulse'
                    : 'bg-primary-container text-primary hover:bg-primary hover:text-surface'
                }`}
              >
                <Wrench size={14} />
                <span>Dispatch SAP PM Work Order for {selectedSplice}</span>
              </button>
              <button
                onClick={() => setOpticalInspectorOpen(false)}
                className="w-full py-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer text-center"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
