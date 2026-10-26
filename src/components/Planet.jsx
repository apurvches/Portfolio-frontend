import { useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import {
  TextureLoader,
  AdditiveBlending,
  BackSide,
  DoubleSide,
  RingGeometry,
  CanvasTexture,
  SRGBColorSpace,
} from 'three'

const vert =
  'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
const frag =
  'varying vec3 vN; uniform vec3 uColor; uniform float uK; void main(){ float i = pow(max(0.62 - dot(vN, vec3(0.0,0.0,1.0)), 0.0), 2.0) * uK; gl_FragColor = vec4(uColor, 1.0) * i; }'

// Procedural ring: banded alpha with a gap, mapped radially.
const RIN = 1.55,
  ROUT = 2.4
const ringTex = (() => {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 4
  const x = c.getContext('2d')
  for (let i = 0; i < 1024; i++) {
    const t = i / 1024
    const n = 0.5 + 0.25 * Math.sin(t * 140) + 0.15 * Math.sin(t * 37 + 1) + 0.1 * Math.sin(t * 310)
    let a = Math.min(t / 0.06, 1) * Math.min((1 - t) / 0.08, 1) * (0.25 + 0.7 * n)
    if (Math.abs(t - 0.66) < 0.025) a *= 0.04
    x.fillStyle = `rgba(${(200 + 40 * n) | 0},${(185 + 35 * n) | 0},${(230 + 20 * n) | 0},${Math.max(0, Math.min(1, a))})`
    x.fillRect(i, 0, 1, 4)
  }
  return new CanvasTexture(c)
})()
const ringGeo = (() => {
  const g = new RingGeometry(RIN, ROUT, 160, 1),
    p = g.attributes.position,
    uv = g.attributes.uv
  for (let i = 0; i < p.count; i++)
    uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) - RIN) / (ROUT - RIN), 0.5)
  return g
})()

function Moon({ spin }) {
  const t = useLoader(TextureLoader, '/textures/moon_texture.jpg'),
    g = useRef()
  t.colorSpace = SRGBColorSpace
  useFrame((_, dt) => {
    g.current.rotation.y += dt * (0.25 + spin.current * 0.6)
  })
  return (
    <group rotation={[0.25, 0, 0.15]}>
      <group ref={g}>
        <mesh position={[2.4, 0.2, 0]}>
          <sphereGeometry args={[0.32, 48, 48]} />
          <meshStandardMaterial map={t} roughness={1} />
        </mesh>
      </group>
    </group>
  )
}

// Small bodies orbiting a planet (project moons, review satellites). They turn with the planet when it is dragged.
function Sats({ list, spin }) {
  const refs = useRef([])
  useFrame((_, dt) => {
    refs.current.forEach((g, i) => {
      if (g) g.rotation.y += dt * (0.3 + 0.12 * i + spin.current * 0.5)
    })
  })
  return list.map((c, i) => (
    <group key={i} rotation={[c.tilt, 0, 0]}>
      <group ref={(el) => (refs.current[i] = el)} rotation={[0, i * 2.1, 0]}>
        <mesh position={[c.r, 0, 0]}>
          <sphereGeometry args={[c.size, 24, 24]} />
          <meshStandardMaterial
            color={c.color}
            roughness={0.7}
            emissive={c.emissive || '#000000'}
            emissiveIntensity={c.emissive ? 1.4 : 0}
          />
        </mesh>
      </group>
    </group>
  ))
}

// Textured 3D planet. spin = rad/s (scroll-speed driven), rim = hover amount 0..1 (soft blue scatter).
export default function Planet({ maps, spin, rim, ring, moon, orient, sats }) {
  const body = useRef(),
    cl = useRef()
  const keys = Object.keys(maps)
  const loaded = useLoader(
    TextureLoader,
    keys.map((k) => maps[k])
  )
  const T = {}
  keys.forEach((k, i) => (T[k] = loaded[i]))
  T.map.colorSpace = SRGBColorSpace
  const uniforms = useMemo(() => ({ uColor: { value: [0.45, 0.68, 1] }, uK: { value: 0 } }), [])
  useFrame((_, dt) => {
    body.current.rotation.y += dt * spin.current
    if (cl.current) cl.current.rotation.y += dt * spin.current * 1.25
    uniforms.uK.value = rim.current
  })
  return (
    <group>
      <group ref={orient}>
        <mesh ref={body}>
          <sphereGeometry args={[1.3, 128, 128]} />
          <meshStandardMaterial
            map={T.map}
            roughness={0.9}
            metalness={0}
            bumpMap={T.bump || null}
            bumpScale={T.bump ? 1.5 : 0}
          />
        </mesh>
        {T.clouds && (
          <mesh ref={cl}>
            <sphereGeometry args={[1.32, 96, 96]} />
            <meshStandardMaterial
              alphaMap={T.clouds}
              transparent
              opacity={0.65}
              color="#fff"
              depthWrite={false}
            />
          </mesh>
        )}
        {ring && (
          <mesh geometry={ringGeo} rotation={[-1.2, 0, 0.25]} raycast={() => null}>
            <meshBasicMaterial map={ringTex} transparent side={DoubleSide} depthWrite={false} />
          </mesh>
        )}
        {moon && <Moon spin={spin} />}
        {sats && <Sats list={sats} spin={spin} />}
      </group>
      <mesh scale={1.3} raycast={() => null}>
        <sphereGeometry args={[1.3, 64, 64]} />
        <shaderMaterial
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          side={BackSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
