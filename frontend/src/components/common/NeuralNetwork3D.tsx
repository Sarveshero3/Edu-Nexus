import { useRef, useMemo, memo } from 'react'
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/* ═══════════════════════════════════════════════════════
   3D Neural Network — React Three Fiber (v8 compatible)
   6-layer architecture with:
   • Glowing spherical nodes with emissive halos
   • Animated connection beams between layers
   • Travelling signal particles
   • Slow camera orbit for depth
   • Floating ambient dust
   ═══════════════════════════════════════════════════════ */

const LAYER_COLORS = [
  new THREE.Color('#22d3ee'),
  new THREE.Color('#60a5fa'),
  new THREE.Color('#818cf8'),
  new THREE.Color('#a78bfa'),
  new THREE.Color('#c084fc'),
  new THREE.Color('#e879f9'),
]

const LAYER_COUNTS = [5, 4, 7, 6, 4, 3]
const LAYER_SPACING = 2.2

// ─── Node sphere with emissive glow ───
function NeuralNode({ position, color, delay }: {
  position: [number, number, number]; color: THREE.Color; delay: number
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + delay
    const pulse = 0.8 + Math.sin(t * 1.5) * 0.2
    meshRef.current.scale.setScalar(pulse)
    glowRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.3)
    ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.08 + Math.sin(t * 1.5) * 0.05
  })

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="white" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

// ─── Connection lines between adjacent layers ───
function Connections({ nodes }: {
  nodes: { pos: [number, number, number]; layer: number }[]
}) {
  const linesRef = useRef<THREE.LineSegments>(null!)

  const geometry = useMemo(() => {
    const positions: number[] = []
    const lineColors: number[] = []

    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[j].layer === nodes[i].layer + 1) {
          if ((i + j) % 3 !== 0) continue
          const a = nodes[i].pos
          const b = nodes[j].pos
          positions.push(a[0], a[1], a[2], b[0], b[1], b[2])
          const c1 = LAYER_COLORS[nodes[i].layer]
          const c2 = LAYER_COLORS[nodes[j].layer]
          lineColors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b)
        }
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3))
    return geo
  }, [nodes])

  useFrame(({ clock }) => {
    const mat = linesRef.current.material as THREE.LineBasicMaterial
    mat.opacity = 0.06 + Math.sin(clock.getElapsedTime() * 0.5) * 0.03
  })

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.08} />
    </lineSegments>
  )
}

// ─── Travelling signal particles ───
function SignalParticle({ from, to, color, speed, delay }: {
  from: [number, number, number]; to: [number, number, number]
  color: THREE.Color; speed: number; delay: number
}) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = ((clock.getElapsedTime() * speed + delay) % 1)
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    ref.current.position.set(
      from[0] + (to[0] - from[0]) * ease,
      from[1] + (to[1] - from[1]) * ease,
      from[2] + (to[2] - from[2]) * ease,
    )
    const fade = Math.sin(t * Math.PI)
    ref.current.scale.setScalar(0.3 + fade * 0.7)
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.9
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
    </mesh>
  )
}

// ─── Floating ambient particles ───
function AmbientParticles() {
  const ref = useRef<THREE.Points>(null!)

  const positions = useMemo(() => {
    const count = 120
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.015
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.05
  })

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return g
  }, [positions])

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color="#818cf8"
        size={0.03}
        transparent
        opacity={0.25}
        sizeAttenuation
      />
    </points>
  )
}

// ─── Slow auto-orbit camera ───
function CameraOrbit() {
  const { camera } = useThree()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.15
    const radius = 7
    camera.position.x = Math.sin(t) * radius * 0.3
    camera.position.y = Math.cos(t * 0.7) * 0.8
    camera.position.z = radius + Math.sin(t * 0.5) * 0.5
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ─── Main scene ───
function NeuralScene() {
  const nodes = useMemo(() => {
    const result: { pos: [number, number, number]; layer: number }[] = []
    const startX = -((LAYER_COUNTS.length - 1) * LAYER_SPACING) / 2

    LAYER_COUNTS.forEach((count, li) => {
      const x = startX + li * LAYER_SPACING
      const totalH = (count - 1) * 0.7
      for (let i = 0; i < count; i++) {
        const y = -totalH / 2 + i * 0.7
        const z = (Math.random() - 0.5) * 0.4
        result.push({ pos: [x, y, z], layer: li })
      }
    })
    return result
  }, [])

  const signals = useMemo(() => {
    const result: { from: [number, number, number]; to: [number, number, number]; color: THREE.Color; speed: number; delay: number }[] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[j].layer === nodes[i].layer + 1 && Math.random() < 0.15) {
          result.push({
            from: nodes[i].pos,
            to: nodes[j].pos,
            color: LAYER_COLORS[nodes[i].layer],
            speed: 0.3 + Math.random() * 0.4,
            delay: Math.random() * 10,
          })
        }
      }
    }
    return result
  }, [nodes])

  return (
    <>
      <CameraOrbit />
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 3, 5]} intensity={0.3} color="#22d3ee" />
      <pointLight position={[-5, -2, 3]} intensity={0.2} color="#a78bfa" />

      <AmbientParticles />
      <Connections nodes={nodes} />

      {nodes.map((n, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0} floatIntensity={0.15} floatingRange={[-0.05, 0.05]}>
          <NeuralNode
            position={n.pos}
            color={LAYER_COLORS[n.layer]}
            delay={i * 0.3}
          />
        </Float>
      ))}

      {signals.map((s, i) => (
        <SignalParticle key={i} {...s} />
      ))}
    </>
  )
}

// ─── Exported wrapper ───
function NeuralNetwork3DInner({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: '280px' }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <NeuralScene />
      </Canvas>
    </div>
  )
}

const NeuralNetwork3D = memo(NeuralNetwork3DInner)
export default NeuralNetwork3D
