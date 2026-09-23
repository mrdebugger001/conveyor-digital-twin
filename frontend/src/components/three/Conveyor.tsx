import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useTwinStore } from '../../store/twinStore'
import { Rollers } from './Rollers'
import { Belt } from './Belt'

const CONVEYOR_LENGTH = 16.0
const FRAME_WIDTH = 1.6
const CONVEYOR_Y = 0

interface ConveyorProps {
  viewMode?: 'realistic' | 'heatmap' | 'wireframe'
}

// Drive Motor M01 with realistic thermal overload, bearing vibration shake, and status alerts
function MotorDriveStation({ rpm }: { rpm: number }) {
  const couplingRef = useRef<THREE.Group>(null)
  const motorGroupRef = useRef<THREE.Group>(null)
  const heatAuraRef = useRef<THREE.Mesh>(null)
  const conveyor = useTwinStore((s) => s.conveyor)
  const setSelected = useTwinStore((s) => s.setSelectedAsset)

  const motor = conveyor?.motor
  const temp = motor?.temperature ?? 58
  const vib = motor?.vibration ?? 1.2
  const motorStatus = motor?.status ?? 'NORMAL'

  const isOverheating = temp >= 85 || motorStatus === 'CRITICAL'
  const isWarning = temp >= 70 || vib >= 3.0 || motorStatus === 'WARNING'
  const isSevereVib = vib >= 5.0

  useFrame((state, delta) => {
    // Shaft rotation
    if (couplingRef.current && rpm > 0 && conveyor?.runState === 'RUNNING') {
      couplingRef.current.rotation.x += (rpm / 60) * Math.PI * 2 * delta * 0.1
    }

    // Dynamic mechanical vibration shake when motor is in distress
    if (motorGroupRef.current) {
      if (isSevereVib || isOverheating) {
        const shakeIntensity = Math.min(0.04, (vib / 10) * 0.035)
        const clock = state.clock.elapsedTime
        motorGroupRef.current.position.y = (CONVEYOR_Y - 0.15) + Math.sin(clock * 50) * shakeIntensity
        motorGroupRef.current.position.z = 1.45 + Math.cos(clock * 45) * shakeIntensity * 0.8
      } else {
        motorGroupRef.current.position.y = CONVEYOR_Y - 0.15
        motorGroupRef.current.position.z = 1.45
      }
    }

    // Pulsating thermal heat aura
    if (heatAuraRef.current) {
      const clock = state.clock.elapsedTime
      if (isOverheating) {
        heatAuraRef.current.visible = true
        const s = 1.0 + Math.sin(clock * 6) * 0.15
        heatAuraRef.current.scale.set(s, s, s)
        const mat = heatAuraRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = 0.35 + Math.sin(clock * 6) * 0.15
      } else if (isWarning) {
        heatAuraRef.current.visible = true
        const s = 1.0 + Math.sin(clock * 4) * 0.08
        heatAuraRef.current.scale.set(s, s, s)
        const mat = heatAuraRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = 0.18 + Math.sin(clock * 4) * 0.08
      } else {
        heatAuraRef.current.visible = false
      }
    }
  })

  // Dynamic motor stator body color based on thermal/electrical load
  const motorColor = isOverheating ? '#DC2626' : isWarning ? '#D97706' : '#1E6CB8'
  const emissiveColor = isOverheating ? '#EF4444' : isWarning ? '#F59E0B' : '#000000'
  const emissiveIntensity = isOverheating ? 0.75 : isWarning ? 0.35 : 0

  return (
    <group ref={motorGroupRef} position={[CONVEYOR_LENGTH / 2 + 1.1, CONVEYOR_Y - 0.15, 1.45]}>
      {/* Structural Steel Drive Skid Base */}
      <mesh position={[0, -0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.2, 1.4]} />
        <meshStandardMaterial color="#2B3440" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 450 kW Industrial AC Induction Motor */}
      <group
        userData={{ assetId: 'motor-M01' }}
        onClick={(e) => { e.stopPropagation(); setSelected('motor-M01') }}
      >
        {/* Thermal Overheat Smoke/Aura Sphere (shows when overloaded/overheated) */}
        <mesh ref={heatAuraRef} position={[0, 0.1, 0]} visible={false}>
          <sphereGeometry args={[0.75, 16, 16]} />
          <meshBasicMaterial
            color={isOverheating ? '#EF4444' : '#F59E0B'}
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>

        {/* Motor cylindrical stator body with thermal emissive color */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.42, 0.42, 1.2, 24]} />
          <meshStandardMaterial
            color={motorColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
            metalness={0.65}
            roughness={0.35}
          />
        </mesh>

        {/* Longitudinal Cooling Fins on Motor Body */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 12
          return (
            <mesh
              key={i}
              position={[0, Math.cos(angle) * 0.44, Math.sin(angle) * 0.44]}
              rotation={[angle, 0, 0]}
              castShadow
            >
              <boxGeometry args={[1.18, 0.05, 0.015]} />
              <meshStandardMaterial
                color={motorColor}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity * 0.8}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
          )
        })}

        {/* End Bell Fan Shroud */}
        <mesh position={[0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.43, 0.38, 0.18, 24]} />
          <meshStandardMaterial color={isOverheating ? '#991B1B' : '#154B80'} metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Electrical Terminal Box on Top */}
        <mesh position={[0.1, 0.48, 0]} castShadow>
          <boxGeometry args={[0.32, 0.18, 0.28]} />
          <meshStandardMaterial color={isOverheating ? '#B91C1C' : '#175694'} metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Dynamic Material 3 Status Chip for M01 with overload indicator */}
        <Html position={[0, 0.95, 0]} center distanceFactor={14}>
          <button
            onClick={(e) => { e.stopPropagation(); setSelected('motor-M01') }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md text-[11px] font-medium shadow-xl transition-all whitespace-nowrap cursor-pointer ${
              isOverheating
                ? 'bg-status-red/25 text-status-red border border-status-red animate-pulse'
                : isWarning
                ? 'bg-status-amber/25 text-status-amber border border-status-amber'
                : 'bg-surface-high/95 border border-outline-variant text-on-surface hover:border-primary'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOverheating ? 'bg-status-red animate-pulse' : isWarning ? 'bg-status-amber' : 'bg-status-green'
              }`}
            />
            <span className="font-bold">
              M01 · {temp.toFixed(0)}°C
              {isOverheating ? ' · OVERLOAD' : isWarning ? ' · HIGH VIB' : ''}
            </span>
          </button>
        </Html>
      </group>

      {/* Heavy Planetary / Helical Bevel Gearbox GB01 */}
      <group position={[-0.95, -0.05, -0.45]} userData={{ assetId: 'gearbox-GB01' }}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.75, 0.9, 0.75]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Flexible Drive Coupling (between motor & gearbox) */}
      <group ref={couplingRef} position={[-0.68, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.18, 16]} />
          <meshStandardMaterial color={isOverheating ? '#EF4444' : '#F59E0B'} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Drive Shaft into Head Pulley */}
      <mesh position={[-0.95, 0, -1.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.85, 16]} />
        <meshStandardMaterial color="#9CA3AF" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  )
}

// Head Drive Pulley and Tail Pulley
function Pulley({ position, isHead }: { position: [number, number, number]; isHead: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const conveyor = useTwinStore((s) => s.conveyor)
  const setSelected = useTwinStore((s) => s.setSelectedAsset)

  useFrame((_, delta) => {
    if (ref.current && conveyor?.runState === 'RUNNING') {
      const angVel = conveyor.speed / 0.5
      ref.current.rotation.z -= angVel * delta
    }
  })

  return (
    <group position={position}>
      {/* Heavy-duty Steel Pulley Drum */}
      <mesh
        ref={ref}
        rotation={[Math.PI / 2, 0, 0]}
        userData={{ assetId: isHead ? 'pulley-HP01' : 'pulley-TP01' }}
        onClick={(e) => { e.stopPropagation(); setSelected(isHead ? 'pulley-HP01' : 'pulley-TP01') }}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.48, 0.48, 1.48, 36]} />
        <meshStandardMaterial
          color={isHead ? '#2E3540' : '#374151'}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Pulley Shaft and Heavy Pillow Block Spherical Bearings */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1.9, 16]} />
        <meshStandardMaterial color="#9CA3AF" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Bearing Housing Left */}
      <mesh position={[0, 0, 0.88]} castShadow>
        <boxGeometry args={[0.3, 0.35, 0.22]} />
        <meshStandardMaterial color="#1F2937" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Bearing Housing Right */}
      <mesh position={[0, 0, -0.88]} castShadow>
        <boxGeometry args={[0.3, 0.35, 0.22]} />
        <meshStandardMaterial color="#1F2937" metalness={0.8} roughness={0.4} />
      </mesh>
    </group>
  )
}

// Industrial Steel Modular Warren Truss & Support Stanchions
function ConveyorStructuralTruss() {
  const trussHalfLength = CONVEYOR_LENGTH / 2
  const bays = 12
  const bayWidth = CONVEYOR_LENGTH / bays

  return (
    <group>
      {/* Top Stringer Channels (Left & Right) */}
      <mesh position={[0, -0.22, FRAME_WIDTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[CONVEYOR_LENGTH + 0.8, 0.12, 0.08]} />
        <meshStandardMaterial color="#3E4756" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.22, -FRAME_WIDTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[CONVEYOR_LENGTH + 0.8, 0.12, 0.08]} />
        <meshStandardMaterial color="#3E4756" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Bottom Stringer Channels (Left & Right) */}
      <mesh position={[0, -0.85, FRAME_WIDTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[CONVEYOR_LENGTH + 0.8, 0.12, 0.08]} />
        <meshStandardMaterial color="#3E4756" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.85, -FRAME_WIDTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[CONVEYOR_LENGTH + 0.8, 0.12, 0.08]} />
        <meshStandardMaterial color="#3E4756" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Vertical & Diagonal Warren Truss Web Bracing along both sides */}
      {Array.from({ length: bays }, (_, i) => {
        const xStart = -trussHalfLength + i * bayWidth
        const xMid = xStart + bayWidth / 2

        return (
          <group key={`truss-bay-${i}`}>
            {/* Front side diagonal web */}
            <mesh position={[xMid, -0.53, FRAME_WIDTH / 2]} rotation={[0, 0, (i % 2 === 0 ? 1 : -1) * 0.44]} castShadow>
              <boxGeometry args={[0.78, 0.05, 0.04]} />
              <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.35} />
            </mesh>
            {/* Back side diagonal web */}
            <mesh position={[xMid, -0.53, -FRAME_WIDTH / 2]} rotation={[0, 0, (i % 2 === 0 ? 1 : -1) * 0.44]} castShadow>
              <boxGeometry args={[0.78, 0.05, 0.04]} />
              <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.35} />
            </mesh>
            {/* Cross tie beam connecting left and right */}
            <mesh position={[xStart, -0.85, 0]} castShadow>
              <boxGeometry args={[0.08, 0.08, FRAME_WIDTH]} />
              <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.35} />
            </mesh>
          </group>
        )
      })}

      {/* Heavy Support Stanchions (Columns) to ground */}
      {[-6.0, -2.0, 2.0, 6.0].map((x, idx) => (
        <group key={`support-${idx}`} position={[x, -1.4, 0]}>
          <mesh position={[0, 0, FRAME_WIDTH / 2]} castShadow receiveShadow>
            <boxGeometry args={[0.15, 1.1, 0.15]} />
            <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -FRAME_WIDTH / 2]} castShadow receiveShadow>
            <boxGeometry args={[0.15, 1.1, 0.15]} />
            <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.15, 0]} castShadow>
            <boxGeometry args={[0.08, 0.1, FRAME_WIDTH]} />
            <meshStandardMaterial color="#4B5563" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.6, FRAME_WIDTH / 2]} receiveShadow>
            <boxGeometry args={[0.5, 0.2, 0.5]} />
            <meshStandardMaterial color="#6B7280" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.6, -FRAME_WIDTH / 2]} receiveShadow>
            <boxGeometry args={[0.5, 0.2, 0.5]} />
            <meshStandardMaterial color="#6B7280" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Safety Emergency Pull-Wire Cable along the front walkway */}
      <mesh position={[0, -0.05, FRAME_WIDTH / 2 + 0.12]}>
        <boxGeometry args={[CONVEYOR_LENGTH + 0.4, 0.015, 0.015]} />
        <meshStandardMaterial color="#EF4444" roughness={0.5} />
      </mesh>
    </group>
  )
}

// Chutes: Head Discharge Chute & Tail Transfer Hopper
function ChutesAndHoppers() {
  return (
    <group>
      {/* 1. Tail Feed Hopper */}
      <group position={[-CONVEYOR_LENGTH / 2 + 0.8, 0.65, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.9, 0.55, 1.0, 4]} />
          <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.55, 0.62]} castShadow>
          <boxGeometry args={[1.2, 0.15, 0.02]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>

      {/* 2. Head Discharge Hood & Chute */}
      <group position={[CONVEYOR_LENGTH / 2 - 0.2, 0.1, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.2, 1.6]} />
          <meshStandardMaterial color="#2B3440" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[0.4, -1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 1.2, 1.2]} />
          <meshStandardMaterial color="#1F2937" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

// Belt Joints / Splices with realistic crack/shear defect, vibration jitter, and glowing callout beacon
function BeltSplices() {
  const conveyor = useTwinStore((s) => s.conveyor)
  const setSelected = useTwinStore((s) => s.setSelectedAsset)
  if (!conveyor) return null

  // 8 monitored mechanical splices
  const VISIBLE_JOINTS = ['J003', 'J006', 'J009', 'J012', 'J015', 'J018', 'J021', 'J023']

  return (
    <>
      {VISIBLE_JOINTS.map((jid, i) => {
        const x = -CONVEYOR_LENGTH / 2 + 1.8 + i * (CONVEYOR_LENGTH - 3.6) / (VISIBLE_JOINTS.length - 1)
        const jState = conveyor.jointHealth[jid]
        const isDegraded = jState?.status === 'WARNING' || jState?.status === 'CRITICAL' || (jState?.health ?? 100) < 75
        const isCritical = jState?.status === 'CRITICAL' || (jState?.health ?? 100) < 55

        const color = isCritical ? '#EF4444' : isDegraded ? '#F59E0B' : '#3A4454'

        return (
          <JointItem
            key={jid}
            jid={jid}
            x={x}
            jState={jState}
            isDegraded={isDegraded}
            isCritical={isCritical}
            color={color}
            onSelect={() => setSelected(`joint-${jid}`)}
          />
        )
      })}
    </>
  )
}

function JointItem({
  jid,
  x,
  jState,
  isDegraded,
  isCritical,
  color,
  onSelect,
}: {
  jid: string
  x: number
  jState: any
  isDegraded: boolean
  isCritical: boolean
  color: string
  onSelect: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const beaconRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const clock = state.clock.elapsedTime

    // When joint is defective, apply mechanical vibration jitter to the splice
    if (groupRef.current && isDegraded) {
      const shake = Math.sin(clock * 45) * 0.015
      groupRef.current.position.y = 0.06 + shake
      groupRef.current.position.x = x + Math.cos(clock * 30) * 0.01
    } else if (groupRef.current) {
      groupRef.current.position.y = 0.06
      groupRef.current.position.x = x
    }

    // Pulsing beacon ring animation
    if (beaconRef.current && isDegraded) {
      const scale = 1.0 + Math.sin(clock * 7) * 0.25
      beaconRef.current.scale.set(scale, 1, scale)
      const mat = beaconRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.4 + Math.sin(clock * 7) * 0.25
    }
  })

  return (
    <group ref={groupRef} position={[x, 0.06, 0]}>
      {/* If degraded, render a REALISTIC CRACKED / SHEARED JOINT with gap and exposed steel cords */}
      {isDegraded ? (
        <group onClick={(e) => { e.stopPropagation(); onSelect() }}>
          {/* Left cracked half */}
          <mesh position={[-0.04, 0, 0.35]} rotation={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.16, 0.045, 0.65]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isCritical ? 0.85 : 0.45}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {/* Right cracked half (shifted with shear gap) */}
          <mesh position={[0.04, 0, -0.35]} rotation={[0, -0.08, 0]} castShadow>
            <boxGeometry args={[0.16, 0.045, 0.65]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isCritical ? 0.85 : 0.45}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {/* Ruptured Fissure Gap with Glowing Heat/Spark Emissive Line */}
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.08, 0.02, 1.3]} />
            <meshBasicMaterial color={isCritical ? '#FF0000' : '#FFB300'} />
          </mesh>

          {/* Pulsing Warning Ground Ring Indicator */}
          <mesh ref={beaconRef} position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.75, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>

          {/* Vertical Guide Line to the Status Chip */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.9, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
          </mesh>
        </group>
      ) : (
        /* Normal Nominal Splice Plate */
        <mesh
          userData={{ assetId: `joint-${jid}` }}
          onClick={(e) => { e.stopPropagation(); onSelect() }}
          castShadow
        >
          <boxGeometry args={[0.18, 0.04, 1.35]} />
          <meshStandardMaterial
            color="#3A4454"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      )}

      {/* Rivet row */}
      {[-0.45, -0.15, 0.15, 0.45].map((zPos, rIdx) => (
        <mesh key={`rivet-${rIdx}`} position={[0, 0.025, zPos]}>
          <cylinderGeometry args={[0.02, 0.02, 0.015, 8]} />
          <meshStandardMaterial color={isDegraded ? '#FFD54F' : '#E5E7EB'} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Floating Status Badge above Joint (Prominent when degraded) */}
      {isDegraded && (
        <Html position={[0, 1.05, 0]} center distanceFactor={14}>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect() }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md text-[11px] font-bold shadow-2xl transition-all whitespace-nowrap cursor-pointer border ${
              isCritical
                ? 'bg-status-red/30 text-status-red border-status-red animate-pulse'
                : 'bg-status-amber/30 text-status-amber border-status-amber'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-status-red animate-ping' : 'bg-status-amber'}`} />
            <span>
              {jid} · {isCritical ? 'CRITICAL DEFECT' : 'WARNING'}
              {jState ? ` (${jState.vibration.toFixed(1)} mm/s)` : ''}
            </span>
          </button>
        </Html>
      )}
    </group>
  )
}

export function Conveyor({ viewMode = 'realistic' }: ConveyorProps) {
  const conveyor = useTwinStore((s) => s.conveyor)

  return (
    <group position={[0, 0.6, 0]}>
      {/* Structural Steel Modular Truss Frame & Stanchions */}
      <ConveyorStructuralTruss />

      {/* Troughed Belt Assembly */}
      <Belt viewMode={viewMode} />

      {/* 3-Roll Troughing Idlers & Return Rollers */}
      <Rollers />

      {/* Head Drive Pulley */}
      <Pulley position={[CONVEYOR_LENGTH / 2, 0, 0]} isHead={true} />

      {/* Tail Loading Pulley */}
      <Pulley position={[-CONVEYOR_LENGTH / 2, 0, 0]} isHead={false} />

      {/* Motor M01 Drive Station */}
      <MotorDriveStation rpm={conveyor?.motor.rpm ?? 0} />

      {/* Transfer Chutes & Hoppers */}
      <ChutesAndHoppers />

      {/* Mechanical Belt Joints / Splices */}
      <BeltSplices />
    </group>
  )
}
