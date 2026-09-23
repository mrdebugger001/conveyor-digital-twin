import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTwinStore } from '../../store/twinStore'

const NUM_SETS = 16
const CONVEYOR_LENGTH = 16.0
const ROLLER_RADIUS = 0.08
const CENTER_ROLLER_LEN = 0.45
const WING_ROLLER_LEN = 0.45
const WING_ANGLE = 30 * (Math.PI / 180) // 30 degrees

export function Rollers() {
  const centerRollersRef = useRef<THREE.InstancedMesh>(null)
  const leftWingRollersRef = useRef<THREE.InstancedMesh>(null)
  const rightWingRollersRef = useRef<THREE.InstancedMesh>(null)
  const returnRollersRef = useRef<THREE.InstancedMesh>(null)
  const conveyor = useTwinStore((s) => s.conveyor)

  // Positions of the 16 idler stations along the conveyor
  const stationX = useMemo(() => {
    const arr: number[] = []
    const spacing = (CONVEYOR_LENGTH - 2.0) / (NUM_SETS - 1)
    for (let i = 0; i < NUM_SETS; i++) {
      arr.push(-CONVEYOR_LENGTH / 2 + 1.0 + i * spacing)
    }
    return arr
  }, [])

  // 6 Return roller stations along bottom
  const returnStationX = useMemo(() => {
    const arr: number[] = []
    const spacing = (CONVEYOR_LENGTH - 2.0) / 5
    for (let i = 0; i < 6; i++) {
      arr.push(-CONVEYOR_LENGTH / 2 + 1.0 + i * spacing)
    }
    return arr
  }, [])

  // Initialize initial instance matrices
  useEffect(() => {
    const dummy = new THREE.Object3D()

    // 1. Center Carry Rollers (horizontal)
    if (centerRollersRef.current) {
      stationX.forEach((x, i) => {
        dummy.position.set(x, -0.06, 0)
        dummy.rotation.set(0, 0, Math.PI / 2)
        dummy.updateMatrix()
        centerRollersRef.current!.setMatrixAt(i, dummy.matrix)
      })
      centerRollersRef.current.instanceMatrix.needsUpdate = true
    }

    // 2. Left Wing Rollers (+Z side, angled upward)
    if (leftWingRollersRef.current) {
      stationX.forEach((x, i) => {
        const offsetZ = CENTER_ROLLER_LEN / 2 + (WING_ROLLER_LEN / 2) * Math.cos(WING_ANGLE)
        const offsetY = -0.06 + (WING_ROLLER_LEN / 2) * Math.sin(WING_ANGLE)
        dummy.position.set(x, offsetY, offsetZ)
        dummy.rotation.set(WING_ANGLE, 0, Math.PI / 2)
        dummy.updateMatrix()
        leftWingRollersRef.current!.setMatrixAt(i, dummy.matrix)
      })
      leftWingRollersRef.current.instanceMatrix.needsUpdate = true
    }

    // 3. Right Wing Rollers (-Z side, angled upward)
    if (rightWingRollersRef.current) {
      stationX.forEach((x, i) => {
        const offsetZ = -(CENTER_ROLLER_LEN / 2 + (WING_ROLLER_LEN / 2) * Math.cos(WING_ANGLE))
        const offsetY = -0.06 + (WING_ROLLER_LEN / 2) * Math.sin(WING_ANGLE)
        dummy.position.set(x, offsetY, offsetZ)
        dummy.rotation.set(-WING_ANGLE, 0, Math.PI / 2)
        dummy.updateMatrix()
        rightWingRollersRef.current!.setMatrixAt(i, dummy.matrix)
      })
      rightWingRollersRef.current.instanceMatrix.needsUpdate = true
    }

    // 4. Return Rollers (underneath, single long roller)
    if (returnRollersRef.current) {
      returnStationX.forEach((x, i) => {
        dummy.position.set(x, -0.70, 0)
        dummy.rotation.set(0, 0, Math.PI / 2)
        dummy.updateMatrix()
        returnRollersRef.current!.setMatrixAt(i, dummy.matrix)
      })
      returnRollersRef.current.instanceMatrix.needsUpdate = true
    }
  }, [stationX, returnStationX])

  // Real-time roller rotation driven by belt linear velocity
  const rotationAngle = useRef(0)
  useFrame((_, delta) => {
    if (!conveyor || conveyor.runState !== 'RUNNING') return
    const speed = conveyor.speed ?? 0
    const angularSpeed = speed / ROLLER_RADIUS
    rotationAngle.current -= angularSpeed * delta

    const dummy = new THREE.Object3D()

    // Rotate center rollers
    if (centerRollersRef.current) {
      stationX.forEach((x, i) => {
        dummy.position.set(x, -0.06, 0)
        dummy.rotation.set(rotationAngle.current, 0, Math.PI / 2)
        dummy.updateMatrix()
        centerRollersRef.current!.setMatrixAt(i, dummy.matrix)
      })
      centerRollersRef.current.instanceMatrix.needsUpdate = true
    }

    // Rotate left wings
    if (leftWingRollersRef.current) {
      stationX.forEach((x, i) => {
        const offsetZ = CENTER_ROLLER_LEN / 2 + (WING_ROLLER_LEN / 2) * Math.cos(WING_ANGLE)
        const offsetY = -0.06 + (WING_ROLLER_LEN / 2) * Math.sin(WING_ANGLE)
        dummy.position.set(x, offsetY, offsetZ)
        dummy.rotation.set(WING_ANGLE, rotationAngle.current, Math.PI / 2)
        dummy.updateMatrix()
        leftWingRollersRef.current!.setMatrixAt(i, dummy.matrix)
      })
      leftWingRollersRef.current.instanceMatrix.needsUpdate = true
    }

    // Rotate right wings
    if (rightWingRollersRef.current) {
      stationX.forEach((x, i) => {
        const offsetZ = -(CENTER_ROLLER_LEN / 2 + (WING_ROLLER_LEN / 2) * Math.cos(WING_ANGLE))
        const offsetY = -0.06 + (WING_ROLLER_LEN / 2) * Math.sin(WING_ANGLE)
        dummy.position.set(x, offsetY, offsetZ)
        dummy.rotation.set(-WING_ANGLE, -rotationAngle.current, Math.PI / 2)
        dummy.updateMatrix()
        rightWingRollersRef.current!.setMatrixAt(i, dummy.matrix)
      })
      rightWingRollersRef.current.instanceMatrix.needsUpdate = true
    }

    // Rotate return rollers
    if (returnRollersRef.current) {
      returnStationX.forEach((x, i) => {
        dummy.position.set(x, -0.70, 0)
        dummy.rotation.set(-rotationAngle.current, 0, Math.PI / 2)
        dummy.updateMatrix()
        returnRollersRef.current!.setMatrixAt(i, dummy.matrix)
      })
      returnRollersRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Center Carry Rollers */}
      <instancedMesh
        ref={centerRollersRef}
        args={[undefined, undefined, stationX.length]}
        castShadow
      >
        <cylinderGeometry args={[ROLLER_RADIUS, ROLLER_RADIUS, CENTER_ROLLER_LEN, 20]} />
        <meshStandardMaterial color="#B0BEC5" metalness={0.85} roughness={0.25} />
      </instancedMesh>

      {/* Left Wing Rollers */}
      <instancedMesh
        ref={leftWingRollersRef}
        args={[undefined, undefined, stationX.length]}
        castShadow
      >
        <cylinderGeometry args={[ROLLER_RADIUS, ROLLER_RADIUS, WING_ROLLER_LEN, 20]} />
        <meshStandardMaterial color="#B0BEC5" metalness={0.85} roughness={0.25} />
      </instancedMesh>

      {/* Right Wing Rollers */}
      <instancedMesh
        ref={rightWingRollersRef}
        args={[undefined, undefined, stationX.length]}
        castShadow
      >
        <cylinderGeometry args={[ROLLER_RADIUS, ROLLER_RADIUS, WING_ROLLER_LEN, 20]} />
        <meshStandardMaterial color="#B0BEC5" metalness={0.85} roughness={0.25} />
      </instancedMesh>

      {/* Return Rollers with Rubber Rings */}
      <instancedMesh
        ref={returnRollersRef}
        args={[undefined, undefined, returnStationX.length]}
        castShadow
      >
        <cylinderGeometry args={[ROLLER_RADIUS * 1.1, ROLLER_RADIUS * 1.1, 1.35, 20]} />
        <meshStandardMaterial color="#37474F" metalness={0.6} roughness={0.5} />
      </instancedMesh>

      {/* Idler Steel Transverse Frames (Yellow Safety Brackets) */}
      {stationX.map((x, idx) => (
        <group key={`frame-${idx}`} position={[x, -0.16, 0]}>
          {/* Base channel */}
          <mesh castShadow>
            <boxGeometry args={[0.07, 0.05, 1.55]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.4} roughness={0.4} />
          </mesh>
          {/* Left upright */}
          <mesh position={[0, 0.12, 0.72]} castShadow>
            <boxGeometry args={[0.06, 0.22, 0.06]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.4} roughness={0.4} />
          </mesh>
          {/* Right upright */}
          <mesh position={[0, 0.12, -0.72]} castShadow>
            <boxGeometry args={[0.06, 0.22, 0.06]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.4} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
