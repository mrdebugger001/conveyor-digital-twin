import React, { Suspense, useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei'
import { Conveyor } from './Conveyor'
import { OreParticles } from './OreParticles'
import { CameraRig } from './CameraRig'
import { useTwinStore } from '../../store/twinStore'
import { api } from '../../api/client'
import { Camera, Layers } from 'lucide-react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

function SceneLighting({ isDark }: { isDark: boolean }) {
  return (
    <>
      {/* Ambient / Hemisphere Fill */}
      <hemisphereLight
        color={isDark ? '#8ECDFF' : '#FFFFFF'}
        groundColor={isDark ? '#1B1F24' : '#E2E8F0'}
        intensity={isDark ? 0.65 : 0.85}
      />

      {/* Main Directional Key Light */}
      <directionalLight
        position={[14, 18, 10]}
        intensity={isDark ? 1.8 : 1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0003}
        color={isDark ? '#FFFFFF' : '#FFFDF7'}
      />

      {/* Industrial Rim Light */}
      <directionalLight
        position={[-10, 12, -12]}
        intensity={isDark ? 1.1 : 0.7}
        color={isDark ? '#8ECDFF' : '#94A3B8'}
      />

      {/* Accent Point Lights */}
      <pointLight
        position={[7.5, 2.0, 2.5]}
        intensity={0.6}
        color="#F59E0B"
        distance={10}
      />
      <pointLight
        position={[9.0, 1.5, -2.0]}
        intensity={isDark ? 0.7 : 0.4}
        color="#38BDF8"
        distance={8}
      />
    </>
  )
}

export function ConveyorScene() {
  const setSelected = useTwinStore((s) => s.setSelectedAsset)
  const theme = useTwinStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [viewMode, setViewMode] = useState<'realistic' | 'heatmap' | 'wireframe'>('realistic')
  const controlsRef = useRef<OrbitControlsImpl>(null)

  // Camera presets
  const setCameraPreset = (name: 'iso' | 'side' | 'drive' | 'tail' | 'j023') => {
    if (!controlsRef.current) return
    if (name === 'iso') {
      controlsRef.current.object.position.set(0, 4.2, 13.0)
      controlsRef.current.target.set(0, 0.2, 0)
    } else if (name === 'side') {
      controlsRef.current.object.position.set(0, 1.2, 14.5)
      controlsRef.current.target.set(0, 0.2, 0)
    } else if (name === 'drive') {
      controlsRef.current.object.position.set(8.5, 3.2, 5.5)
      controlsRef.current.target.set(8.0, 0.4, 0.5)
      setSelected('motor-M01')
    } else if (name === 'tail') {
      controlsRef.current.object.position.set(-8.0, 3.0, 5.5)
      controlsRef.current.target.set(-7.5, 0.4, 0)
      setSelected('pulley-TP01')
    } else if (name === 'j023') {
      controlsRef.current.object.position.set(5.5, 2.2, 3.8)
      controlsRef.current.target.set(5.5, 0.6, 0)
      setSelected('joint-J023')
    }
    controlsRef.current.update()
  }

  useEffect(() => {
    const appControl = {
      setPreset: (name: 'iso' | 'side' | 'drive' | 'tail' | 'j023') => setCameraPreset(name),
      setViewMode: (mode: 'realistic' | 'heatmap' | 'wireframe') => setViewMode(mode),
      setTheme: (t: 'dark' | 'light') => useTwinStore.getState().setTheme(t),
      startConveyor: () => api.startConveyor(),
      stopConveyor: () => api.stopConveyor(),
      estop: () => api.estop(),
      setSpeed: (spd: number) => api.setSpeed(spd),
      setFault: (key: string, enabled: boolean, extra = {}) =>
        api.setFaults({ [key]: enabled, ...extra }),
      resetFaults: () =>
        api.setFaults({
          misalignment: false,
          high_tension: false,
          high_vibration: false,
          motor_overheat: false,
          bearing_failure: false,
          joint_damage_enabled: false,
          joint_damage_id: null,
          belt_tear: false,
          conveyor_jam: false,
        }),
      acknowledgeAlarm: (id: string, by = 'Operator') => api.acknowledgeAlarm(id, by),
      setSelectedAsset: (id: string | null) => setSelected(id),
    }

    ;(window as any).__APP_CONTROL__ = appControl
    return () => {
      delete (window as any).__APP_CONTROL__
    }
  }, [setSelected])

  const handleClick = (e: any) => {
    if (e.object?.userData?.assetId) {
      setSelected(e.object.userData.assetId)
      e.stopPropagation()
    }
  }

  const canvasBackground = isDark ? '#12151A' : '#F1F5F9'
  const gridCellColor = isDark ? '#262E3B' : '#CBD5E1'
  const gridSectionColor = isDark ? '#3B4758' : '#94A3B8'

  return (
    <div className="flex-1 bg-surface relative overflow-hidden flex flex-col min-h-0 transition-colors">
      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: canvasBackground, width: '100%', height: '100%' }}
        onClick={handleClick}
      >
        <PerspectiveCamera makeDefault position={[0, 4.2, 13.0]} fov={42} />
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          minDistance={4}
          maxDistance={35}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0.2, 0]}
        />
        <CameraRig controlsRef={controlsRef} onSelectAsset={setSelected} />
        <SceneLighting isDark={isDark} />

        {/* Industrial Ground Platform Grid */}
        <Grid
          args={[50, 50]}
          cellSize={1.0}
          cellThickness={0.6}
          cellColor={gridCellColor}
          sectionSize={5.0}
          sectionThickness={1.2}
          sectionColor={gridSectionColor}
          fadeDistance={32}
          position={[0, -1.9, 0]}
        />

        {/* Conveyor Assembly and Particles */}
        <Suspense fallback={null}>
          <Conveyor viewMode={viewMode} />
          <OreParticles />
        </Suspense>
      </Canvas>

      {/* Top-Left Viewport HUD: Camera Presets */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-surface-container/90 backdrop-blur-md border border-outline-variant px-2.5 py-1.5 rounded-lg shadow-lg">
        <Camera size={13} className="text-primary mr-1" />
        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mr-1.5">View</span>
        {[
          { id: 'iso', label: '3D Iso' },
          { id: 'side', label: 'Side' },
          { id: 'drive', label: 'Drive M01' },
          { id: 'tail', label: 'Tail Chute' },
          { id: 'j023', label: 'Splice J023' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setCameraPreset(p.id as any)}
            className="text-[11px] px-2 py-0.5 rounded bg-surface-high text-on-surface-variant hover:text-on-surface hover:bg-primary-container/40 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Top-Right Viewport HUD: Render Mode Selector */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-surface-container/90 backdrop-blur-md border border-outline-variant px-2.5 py-1.5 rounded-lg shadow-lg">
        <Layers size={13} className="text-primary mr-1" />
        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mr-1.5">Render</span>
        {[
          { id: 'realistic', label: 'Twin' },
          { id: 'heatmap', label: 'Stress Heatmap' },
          { id: 'wireframe', label: 'Wireframe' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id as any)}
            className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
              viewMode === m.id
                ? 'bg-primary-container text-primary font-semibold'
                : 'bg-surface-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
