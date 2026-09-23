import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type CameraAnimationMode =
  | 'idle'
  | 'orbit'
  | 'tracking'
  | 'macro-j023'
  | 'macro-motor'
  | 'macro-tail'
  | 'low-angle'

interface CameraRigProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  onSelectAsset?: (id: string | null) => void
}

export function CameraRig({ controlsRef, onSelectAsset }: CameraRigProps) {
  const { camera } = useThree()
  const modeRef = useRef<CameraAnimationMode>('idle')
  const timeRef = useRef<number>(0)
  const targetPos = useRef(new THREE.Vector3(0, 4.2, 13.0))
  const targetLook = useRef(new THREE.Vector3(0, 0.2, 0))
  const isTransitioning = useRef<boolean>(false)

  // Attach global hooks to window for Playwright automation
  useEffect(() => {
    const rigApi = {
      setMode: (mode: CameraAnimationMode) => {
        modeRef.current = mode
        timeRef.current = 0
        if (controlsRef.current) {
          controlsRef.current.enabled = mode === 'idle'
        }
        if (mode === 'macro-j023' && onSelectAsset) onSelectAsset('joint-J023')
        if (mode === 'macro-motor' && onSelectAsset) onSelectAsset('motor-M01')
        if (mode === 'macro-tail' && onSelectAsset) onSelectAsset('pulley-TP01')
      },
      setPreset: (name: 'iso' | 'side' | 'drive' | 'tail' | 'j023') => {
        modeRef.current = 'idle'
        if (controlsRef.current) controlsRef.current.enabled = true
        if (name === 'iso') {
          targetPos.current.set(0, 4.2, 13.0)
          targetLook.current.set(0, 0.2, 0)
        } else if (name === 'side') {
          targetPos.current.set(0, 1.2, 14.5)
          targetLook.current.set(0, 0.2, 0)
        } else if (name === 'drive') {
          targetPos.current.set(8.5, 3.2, 5.5)
          targetLook.current.set(8.0, 0.4, 0.5)
          if (onSelectAsset) onSelectAsset('motor-M01')
        } else if (name === 'tail') {
          targetPos.current.set(-8.0, 3.0, 5.5)
          targetLook.current.set(-7.5, 0.4, 0)
          if (onSelectAsset) onSelectAsset('pulley-TP01')
        } else if (name === 'j023') {
          targetPos.current.set(5.5, 2.2, 3.8)
          targetLook.current.set(5.5, 0.6, 0)
          if (onSelectAsset) onSelectAsset('joint-J023')
        }
        isTransitioning.current = true
      },
      getCurrentMode: () => modeRef.current,
    }

    ;(window as any).__CAMERA_RIG__ = rigApi

    return () => {
      delete (window as any).__CAMERA_RIG__
    }
  }, [controlsRef, onSelectAsset])

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (modeRef.current === 'orbit') {
      // Smooth continuous cinematic orbital sweep
      const radius = 12.5
      const speed = 0.35
      const x = Math.sin(t * speed) * radius
      const z = Math.cos(t * speed) * radius
      const y = 3.8 + Math.sin(t * speed * 0.5) * 1.0

      camera.position.lerp(new THREE.Vector3(x, y, z), delta * 3.0)
      const look = new THREE.Vector3(0, 0.3, 0)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(look, delta * 3.0)
        controlsRef.current.update()
      } else {
        camera.lookAt(look)
      }
    } else if (modeRef.current === 'tracking') {
      // Dynamic linear tracking sweep along the conveyor length
      const travelX = -7.5 + ((t * 2.2) % 15.0)
      const x = travelX
      const y = 2.4 + Math.sin(t * 0.8) * 0.3
      const z = 6.2

      camera.position.lerp(new THREE.Vector3(x, y, z), delta * 3.5)
      const look = new THREE.Vector3(x + 1.5, 0.4, 0)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(look, delta * 3.5)
        controlsRef.current.update()
      } else {
        camera.lookAt(look)
      }
    } else if (modeRef.current === 'macro-j023') {
      // Close-up inspection of degraded belt joint J023 with subtle micro-pan
      const x = 5.6 + Math.sin(t * 0.6) * 0.25
      const y = 1.9 + Math.cos(t * 0.5) * 0.15
      const z = 3.6 + Math.sin(t * 0.4) * 0.3

      camera.position.lerp(new THREE.Vector3(x, y, z), delta * 4.0)
      const look = new THREE.Vector3(5.5, 0.6, 0)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(look, delta * 4.0)
        controlsRef.current.update()
      } else {
        camera.lookAt(look)
      }
    } else if (modeRef.current === 'macro-motor') {
      // Close-up inspection of drive motor M01
      const x = 9.2 + Math.sin(t * 0.5) * 0.3
      const y = 2.4 + Math.cos(t * 0.6) * 0.2
      const z = 4.8

      camera.position.lerp(new THREE.Vector3(x, y, z), delta * 4.0)
      const look = new THREE.Vector3(8.0, 0.4, 0.5)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(look, delta * 4.0)
        controlsRef.current.update()
      } else {
        camera.lookAt(look)
      }
    } else if (modeRef.current === 'macro-tail') {
      // Tail pulley and ore feed chute inspection
      const x = -8.2 + Math.cos(t * 0.5) * 0.3
      const y = 2.6 + Math.sin(t * 0.5) * 0.2
      const z = 4.8

      camera.position.lerp(new THREE.Vector3(x, y, z), delta * 4.0)
      const look = new THREE.Vector3(-7.5, 0.4, 0)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(look, delta * 4.0)
        controlsRef.current.update()
      } else {
        camera.lookAt(look)
      }
    } else if (modeRef.current === 'low-angle') {
      // Dynamic low-angle perspective looking down the belt
      const x = -6.2 + Math.sin(t * 0.4) * 0.5
      const y = 0.9 + Math.cos(t * 0.6) * 0.15
      const z = 4.2

      camera.position.lerp(new THREE.Vector3(x, y, z), delta * 3.5)
      const look = new THREE.Vector3(0, 0.6, 0)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(look, delta * 3.5)
        controlsRef.current.update()
      } else {
        camera.lookAt(look)
      }
    } else if (isTransitioning.current) {
      camera.position.lerp(targetPos.current, delta * 4.0)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, delta * 4.0)
        controlsRef.current.update()
      }
      if (
        camera.position.distanceTo(targetPos.current) < 0.05 &&
        (!controlsRef.current || controlsRef.current.target.distanceTo(targetLook.current) < 0.05)
      ) {
        isTransitioning.current = false
      }
    }
  })

  return null
}
