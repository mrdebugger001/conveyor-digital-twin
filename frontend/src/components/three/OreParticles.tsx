import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTwinStore } from '../../store/twinStore'

const MAX_COAL_CHUNKS = 260
const BELT_LENGTH = 15.6
const TROUGH_SPREAD = 0.58 // concentrated in central troughed profile

export function OreParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dustRef = useRef<THREE.Points>(null)
  const conveyor = useTwinStore((s) => s.conveyor)

  // Pre-generate irregular polyhedral coal lump parameters
  const coalData = useMemo(() => {
    const data = []
    for (let i = 0; i < MAX_COAL_CHUNKS; i++) {
      // Gaussian distribution concentrated in bottom of troughed belt
      const u = Math.random() + Math.random() - 1 // -1 to 1 centered at 0
      const z = u * (TROUGH_SPREAD / 2)
      // Slight curvature: deeper in center, heaped crest
      const y = 0.05 + (1 - Math.abs(u)) * 0.045 + Math.random() * 0.05
      const x = -BELT_LENGTH / 2 + Math.random() * BELT_LENGTH
      const scale = 0.065 + Math.random() * 0.12
      const rot = [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ]
      data.push({ x, y, z, scale, rot })
    }
    return data
  }, [])

  // Dynamic particle positions array
  const currentPositions = useRef(coalData.map(d => ({ ...d })))

  // Anthracite coal color palette (deep carbon black with subtle graphite / bituminous sheen)
  useEffect(() => {
    if (!meshRef.current) return
    const coalColors = [
      new THREE.Color('#14171A'), // jet carbon
      new THREE.Color('#1E2228'), // lustrous anthracite
      new THREE.Color('#2A3038'), // crystalline cleavage face
      new THREE.Color('#0D0F12'), // deep bituminous core
      new THREE.Color('#353C47'), // specular graphite highlight
    ]
    for (let i = 0; i < MAX_COAL_CHUNKS; i++) {
      const col = coalColors[i % coalColors.length]
      meshRef.current.setColorAt(i, col)
    }
    meshRef.current.instanceColor!.needsUpdate = true
  }, [])

  // Coal dust particles at loading transfer chute
  const dustGeo = useMemo(() => {
    const count = 45
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = -BELT_LENGTH / 2 + 0.8 + (Math.random() - 0.5) * 1.2
      positions[i * 3 + 1] = 0.4 + Math.random() * 0.8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.9
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geom
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current || !conveyor) return
    const isRunning = conveyor.runState === 'RUNNING'
    const speed = isRunning ? (conveyor.speed ?? 0) : 0

    // Load fraction based on CEMA coal throughput (TPH) or load %
    const coalTph = conveyor.coalFlow ?? (conveyor.load ? conveyor.load * 12.0 : 1200)
    const loadFraction = Math.max(0.1, Math.min(1.0, coalTph / 1800.0))
    const activeLimit = Math.floor(MAX_COAL_CHUNKS * loadFraction)

    const dummy = new THREE.Object3D()

    for (let i = 0; i < MAX_COAL_CHUNKS; i++) {
      const lump = currentPositions.current[i]

      if (i >= activeLimit || (speed === 0 && conveyor.runState === 'STOPPED')) {
        if (i >= activeLimit) {
          dummy.scale.setScalar(0)
          dummy.position.set(0, -999, 0)
          dummy.updateMatrix()
          meshRef.current.setMatrixAt(i, dummy.matrix)
          continue
        }
      }

      // Advance coal along conveyor belt
      lump.x += speed * delta

      // Recycle at head discharge chute back to tail loading chute
      if (lump.x > BELT_LENGTH / 2 - 0.3) {
        lump.x = -BELT_LENGTH / 2 + 0.2 + Math.random() * 0.5
        const u = Math.random() + Math.random() - 1
        lump.z = u * (TROUGH_SPREAD / 2)
      }

      dummy.position.set(lump.x, lump.y, lump.z)
      dummy.rotation.set(lump.rot[0], lump.rot[1], lump.rot[2])
      dummy.scale.set(lump.scale * 1.1, lump.scale * 0.85, lump.scale * 1.15)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true

    // Animate subtle coal dust swirl near loading chute
    if (dustRef.current && isRunning) {
      const time = state.clock.elapsedTime
      dustRef.current.rotation.y = time * 0.2
      const posAttr = dustRef.current.geometry.attributes.position as THREE.BufferAttribute
      for (let j = 0; j < posAttr.count; j++) {
        let py = posAttr.getY(j)
        py += delta * 0.15
        if (py > 1.2) py = 0.4
        posAttr.setY(j, py)
      }
      posAttr.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Faceted Anthracite Coal Chunks */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, MAX_COAL_CHUNKS]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          roughness={0.62}
          metalness={0.45}
        />
      </instancedMesh>

      {/* Loading Chute Coal Dust Mist */}
      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial
          size={0.06}
          color="#4B5563"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
