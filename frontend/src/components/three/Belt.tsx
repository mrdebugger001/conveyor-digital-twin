import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTwinStore } from '../../store/twinStore'

const BELT_LENGTH = 16.0
const BELT_WIDTH = 1.4
const TROUGH_DEPTH = 0.12

interface BeltProps {
  viewMode?: 'realistic' | 'heatmap' | 'wireframe'
}

export function Belt({ viewMode = 'realistic' }: BeltProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const frictionGlowRef = useRef<THREE.Mesh>(null)
  const conveyor = useTwinStore((s) => s.conveyor)

  // Procedural industrial multi-ply rubber texture with wear ribs and tracking markers
  const { rubberTexture, heatmapTexture } = useMemo(() => {
    // 1. Rubber Texture
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#16191E'
    ctx.fillRect(0, 0, 1024, 256)

    const centerGrad = ctx.createLinearGradient(0, 0, 0, 256)
    centerGrad.addColorStop(0, 'rgba(26, 30, 36, 0.9)')
    centerGrad.addColorStop(0.3, 'rgba(36, 42, 50, 0.95)')
    centerGrad.addColorStop(0.5, 'rgba(44, 50, 60, 1.0)')
    centerGrad.addColorStop(0.7, 'rgba(36, 42, 50, 0.95)')
    centerGrad.addColorStop(1, 'rgba(26, 30, 36, 0.9)')
    ctx.fillStyle = centerGrad
    ctx.fillRect(0, 30, 1024, 196)

    ctx.strokeStyle = 'rgba(55, 62, 74, 0.4)'
    ctx.lineWidth = 4
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 40)
      ctx.lineTo(x + 16, 128)
      ctx.lineTo(x, 216)
      ctx.stroke()
    }

    // High-visibility yellow safety edge stripes
    ctx.fillStyle = '#E5A93C'
    ctx.fillRect(0, 16, 1024, 5)
    ctx.fillRect(0, 235, 1024, 5)

    // Steel cord indicator edge bead
    ctx.fillStyle = '#8B949E'
    ctx.fillRect(0, 0, 1024, 4)
    ctx.fillRect(0, 252, 1024, 4)

    const rTex = new THREE.CanvasTexture(canvas)
    rTex.wrapS = THREE.RepeatWrapping
    rTex.wrapT = THREE.ClampToEdgeWrapping
    rTex.repeat.set(4, 1)

    // 2. CEMA DIN 22101 Multi-Spectral FEA Stress Heatmap Texture
    const hCanvas = document.createElement('canvas')
    hCanvas.width = 1024
    hCanvas.height = 256
    const hCtx = hCanvas.getContext('2d')!
    const hGrad = hCtx.createLinearGradient(0, 0, 1024, 0)
    hGrad.addColorStop(0.0, '#1E88E5')  // Deep Blue (Low stress <8.5 MPa)
    hGrad.addColorStop(0.25, '#00E5FF') // Electric Cyan (Nominal 10.5 MPa)
    hGrad.addColorStop(0.55, '#00E676') // Operational Green (12.5 MPa)
    hGrad.addColorStop(0.80, '#FFD600') // Warning Amber (13.8 - 14.5 MPa)
    hGrad.addColorStop(1.0, '#FF1744')  // Critical Crimson (>15.0 MPa Peeling)
    hCtx.fillStyle = hGrad
    hCtx.fillRect(0, 0, 1024, 256)

    // Add isobar FEA stress contour lines
    hCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    hCtx.lineWidth = 2
    for (let c = 100; c < 1024; c += 120) {
      hCtx.beginPath()
      hCtx.moveTo(c, 0)
      hCtx.lineTo(c, 256)
      hCtx.stroke()
    }

    const hTex = new THREE.CanvasTexture(hCanvas)
    hTex.wrapS = THREE.RepeatWrapping
    hTex.wrapT = THREE.ClampToEdgeWrapping
    hTex.repeat.set(3, 1)

    return { rubberTexture: rTex, heatmapTexture: hTex }
  }, [])

  // Troughed belt geometry
  const troughedGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    const w = BELT_WIDTH / 2
    const wingW = w * 0.45
    const centerW = w - wingW
    const d = TROUGH_DEPTH
    const t = 0.025

    shape.moveTo(-w, d)
    shape.lineTo(-centerW, 0)
    shape.lineTo(centerW, 0)
    shape.lineTo(w, d)

    shape.lineTo(w, d - t)
    shape.lineTo(centerW, -t)
    shape.lineTo(-centerW, -t)
    shape.lineTo(-w, d - t)
    shape.closePath()

    const extrudeSettings = {
      steps: 48,
      depth: BELT_LENGTH,
      bevelEnabled: false,
    }
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geom.center()
    geom.rotateY(Math.PI / 2)
    return geom
  }, [])

  const returnBeltGeometry = useMemo(() => {
    return new THREE.BoxGeometry(BELT_LENGTH, 0.02, BELT_WIDTH * 0.95)
  }, [])

  // Dynamic catenary sag calculation (mm converted to Three.js world Y offset)
  const dynamicSagMm = conveyor?.beltSagMm ?? 14.0
  const sagYOffset = -(dynamicSagMm / 1000.0) * 0.8 // subtle visible droop under heavy tonnage

  // Live texture scrolling
  useFrame((state, delta) => {
    const speed = conveyor?.runState === 'RUNNING' ? (conveyor.speed ?? 0) : 0
    if (rubberTexture) rubberTexture.offset.x += speed * delta * 0.12
    if (heatmapTexture) heatmapTexture.offset.x += speed * delta * 0.12

    // Friction rub light animation when misaligned
    if (frictionGlowRef.current) {
      const clock = state.clock.elapsedTime
      const isMisaligned = Math.abs(conveyor?.tracking ?? 0) >= 2.5
      if (isMisaligned) {
        frictionGlowRef.current.visible = true
        const mat = frictionGlowRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = 0.5 + Math.sin(clock * 12) * 0.3
      } else {
        frictionGlowRef.current.visible = false
      }
    }
  })

  // Dynamic tracking lateral offset
  const tracking = conveyor?.tracking ?? 0
  const lateralZ = tracking * 0.065
  const isMisaligned = Math.abs(tracking) >= 2.5
  const rubSide = tracking > 0 ? 1 : -1

  // Belt tear state
  const hasBeltTear = (conveyor?.beltHealth ?? 100) < 80

  const currentTexture = viewMode === 'heatmap' ? heatmapTexture : rubberTexture

  return (
    <group position={[0, sagYOffset, lateralZ]}>
      {/* Upper Carry Belt (Troughed with Catenary Sag) */}
      <mesh
        ref={meshRef}
        geometry={troughedGeometry}
        position={[0, 0.02, 0]}
        userData={{ assetId: 'belt-B01' }}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          ref={matRef}
          map={currentTexture}
          color={viewMode === 'wireframe' ? '#8ECDFF' : '#FFFFFF'}
          roughness={viewMode === 'heatmap' ? 0.35 : 0.7}
          metalness={viewMode === 'heatmap' ? 0.4 : 0.15}
          wireframe={viewMode === 'wireframe'}
        />
      </mesh>

      {/* Misalignment Frame Friction Rubbing Alert Bar */}
      {isMisaligned && (
        <mesh
          ref={frictionGlowRef}
          position={[0, 0.12, rubSide * (BELT_WIDTH / 2 + 0.04)]}
        >
          <boxGeometry args={[BELT_LENGTH, 0.05, 0.03]} />
          <meshBasicMaterial color={Math.abs(tracking) > 5 ? '#EF4444' : '#F59E0B'} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Belt Tear Rip Mesh (visible when belt damage is injected) */}
      {hasBeltTear && (
        <group position={[2.5, 0.04, 0.1]}>
          <mesh rotation={[0, 0.3, 0]}>
            <boxGeometry args={[1.6, 0.03, 0.15]} />
            <meshStandardMaterial
              color="#DC2626"
              emissive="#EF4444"
              emissiveIntensity={0.8}
              roughness={0.9}
            />
          </mesh>
          {/* Exposed frayed steel cord wires */}
          <mesh position={[0, 0.02, 0]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[1.2, 0.02, 0.06]} />
            <meshBasicMaterial color="#FEF08A" />
          </mesh>
        </group>
      )}

      {/* Lower Return Belt (Flat) */}
      <mesh
        geometry={returnBeltGeometry}
        position={[0, -0.62, 0]}
        userData={{ assetId: 'belt-B01' }}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={rubberTexture}
          color="#1C2128"
          roughness={0.8}
          metalness={0.1}
          wireframe={viewMode === 'wireframe'}
        />
      </mesh>
    </group>
  )
}
