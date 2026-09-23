import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTwinStore } from '../../store/twinStore'

const MAX_ORE_CHUNKS = 220
const BELT_LENGTH = 15.6
const TROUGH_SPREAD = 0.55 // concentrated in the central trough

export function OreParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const conveyor = useTwinStore((s) => s.conveyor)

  // Pre-generate individual rock properties (offset, size, rotation speed, color index)
  const rockData = useMemo(() => {
    const data = []
    for (let i = 0; i < MAX_ORE_CHUNKS; i++) {
      // Gaussian-like concentration in center of trough
      const u = Math.random() + Math.random() - 1 // -1 to 1, centered at 0
      const z = u * (TROUGH_SPREAD / 2)
      // Slight curvature adjustment: deeper in center
      const y = 0.05 + (1 - Math.abs(u)) * 0.03 + Math.random() * 0.04
      const x = -BELT_LENGTH / 2 + Math.random() * BELT_LENGTH
      const scale = 0.07 + Math.random() * 0.11
      const rot = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
      data.push({ x, y, z, scale, rot })
    }
    return data
  }, [])

  // Dynamic particle positions array
  const currentPositions = useRef(rockData.map(d => ({ ...d })))

  // Color variations for hematite iron ore
  useEffect(() => {
    if (!meshRef.current) return
    const colors = [
      new THREE.Color('#8D3B2B'), // rich hematite red-brown
      new THREE.Color('#6E271D'), // dark iron oxide
      new THREE.Color('#A84332'), // weathered surface
      new THREE.Color('#4A221B'), // deep raw ore
      new THREE.Color('#783428'), // metallic lustrous ore
    ]
    for (let i = 0; i < MAX_ORE_CHUNKS; i++) {
      const col = colors[i % colors.length]
      meshRef.current.setColorAt(i, col)
    }
    meshRef.current.instanceColor!.needsUpdate = true
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current || !conveyor) return
    const isRunning = conveyor.runState === 'RUNNING'
    const speed = isRunning ? (conveyor.speed ?? 0) : 0
    const loadFraction = Math.max(0.05, (conveyor.load ?? 75) / 100)
    const activeLimit = Math.floor(MAX_ORE_CHUNKS * loadFraction)

    const dummy = new THREE.Object3D()

    for (let i = 0; i < MAX_ORE_CHUNKS; i++) {
      const rock = currentPositions.current[i]

      if (i >= activeLimit || (speed === 0 && conveyor.runState === 'STOPPED')) {
        // Still display resting rocks if loaded, or hide if beyond load
        if (i >= activeLimit) {
          dummy.scale.setScalar(0)
          dummy.position.set(0, -999, 0)
          dummy.updateMatrix()
          meshRef.current.setMatrixAt(i, dummy.matrix)
          continue
        }
      }

      // Advance rock along belt
      rock.x += speed * delta

      // Recycle at head pulley (discharge end) back to tail hopper
      if (rock.x > BELT_LENGTH / 2 - 0.2) {
        rock.x = -BELT_LENGTH / 2 + 0.3 + Math.random() * 0.4
        const u = Math.random() + Math.random() - 1
        rock.z = u * (TROUGH_SPREAD / 2)
      }

      dummy.position.set(rock.x, rock.y, rock.z)
      dummy.rotation.set(rock.rot[0], rock.rot[1], rock.rot[2])
      dummy.scale.set(rock.scale, rock.scale * 0.8, rock.scale * 1.1)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_ORE_CHUNKS]}
      castShadow
      receiveShadow
    >
      {/* Polyhedral irregular ore lump geometry */}
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        roughness={0.88}
        metalness={0.28}
      />
    </instancedMesh>
  )
}
