import { Suspense, memo, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  CanvasTexture,
  MathUtils,
  Quaternion,
  Vector3,
  Object3D,
  Line,
  LineBasicMaterial,
  BufferGeometry,
  Points,
  PointsMaterial,
} from 'three'
import Planet from './Planet.jsx'
import { PLANETS, ORDER } from '../data.js'
import { curve, planetPos, BASE_YAW } from '../world.js'

const PLANET_D = 6 // planet diameter in world units
const BELT_C = curve.getPoint((3.5 + 1) / 6) // asteroid belt: on the route between Experience and Reviews
const STOPS = ORDER.map((_, i) => planetPos(i))
const _q = new Quaternion(),
  _a = new Vector3(),
  _id = new Quaternion(),
  _b = new Vector3(),
  _d = new Vector3(),
  _p = new Vector3(),
  _t = new Vector3(),
  _l = new Vector3()

// Trackball rotation about the planet centre: drag direction -> rotation axis in screen space.
const rot = (o, dx, dy) => {
  const l = Math.hypot(dx, dy)
  if (l < 1e-4) return
  o.quaternion.premultiply(_q.setFromAxisAngle(_a.set(dy, dx, 0).normalize(), l * 0.008))
}

// The camera travels along the route (anim.cs), turns into the curves and banks like a spacecraft.
function Rig({ anim }) {
  const st = useRef({ yaw: BASE_YAW, roll: 0 })
  useFrame(({ camera, pointer }, dt) => {
    const a = anim.current,
      tt = MathUtils.clamp((a.cs + 1) / 6, 0, 1)
    curve.getPoint(tt, _p)
    curve.getTangent(tt, _t)
    const yaw = Math.atan2(-_t.x, -_t.z),
      rate = (yaw - st.current.yaw) / Math.max(dt, 1e-3)
    st.current.yaw = yaw
    a.yaw = yaw - BASE_YAW // the starfield turns with this
    st.current.roll +=
      (MathUtils.clamp(-rate * 0.5, -0.2, 0.2) - st.current.roll) * Math.min(1, dt * 6)
    camera.position.copy(_p)
    camera.lookAt(_l.copy(_p).addScaledVector(_t, 20))
    camera.rotateZ(st.current.roll)
    const k = 1 - a.s
    camera.translateX(pointer.x * 0.5 * k)
    camera.translateY(pointer.y * 0.3 * k) // gentle mouse parallax, off while docked
    camera.updateMatrixWorld()
  })
  return null
}

function Node({ p, idx, anim, ui }) {
  const g = useRef(),
    spin = useRef(0.12),
    rim = useRef(0),
    ori = useRef(),
    drag = useRef(false)
  const base = useMemo(() => planetPos(idx), [idx])
  useFrame((st, dt) => {
    const { u, s, sel } = anim.current,
      t = st.clock.elapsedTime,
      isSel = sel === p.key,
      k = isSel ? s : 0
    const cam = st.camera,
      visH = 2 * Math.tan(MathUtils.degToRad(cam.fov / 2)) * 8,
      visW = visH * cam.aspect
    const mobile = visW / visH < 0.8,
      unit = Math.min(visH, visW * 1.4)
    // resting pose in the world (gentle float)  ->  docked pose in the bottom-left corner of the screen
    _b.set(
      base.x + Math.cos(t * 0.4 + idx) * 0.3,
      base.y + Math.sin(t * 0.5 + idx * 1.7) * 0.35,
      base.z
    )
    _d.set(mobile ? -visW * 0.26 : -visW * 0.27, mobile ? visH * 0.38 : -visH * 0.22, -8)
    cam.localToWorld(_d)
    g.current.position.lerpVectors(_b, _d, k)
    const td = (mobile ? unit * 0.4 : visH * 0.62) * (p.ring ? 0.8 : 1) // ringed planets dock a little smaller so the ring stays clear of the text
    // planets only appear when you are near them, so you never see them crowded together
    const vis = Math.max(1 - MathUtils.smoothstep(cam.position.distanceTo(_b), 70, 130), k)
    g.current.visible = vis > 0.01
    g.current.scale.setScalar(
      Math.max(MathUtils.lerp(PLANET_D, td, k) * (isSel ? 1 : 1 - s) * u * vis, 1e-4) / 2.6
    )
    // spin is proportional to scroll speed (ui.vel, px/s) for the docked planet
    spin.current = drag.current ? 0 : 0.12 + (isSel ? ui.vel * 0.0025 : 0)
    // once released (or when leaving) the planet eases back to its original axis
    if (ori.current && !drag.current)
      ori.current.quaternion.slerp(_id, 1 - Math.exp(-dt * (isSel && s > 0.9 ? 3.5 : 6)))
  })
  const on = {
    onPointerOver: (e) => {
      if (anim.current.sel === p.key && anim.current.s > 0.9) {
        ui.grab = true
        return
      }
      if (anim.current.s > 0.1) return
      e.stopPropagation()
      ui.hover = p.key // a passing planet can be clicked to fly there
    },
    onPointerDown: (e) => {
      // click and hold to rotate the docked planet in all 3 dimensions
      if (!(anim.current.sel === p.key && anim.current.s > 0.9)) return
      e.stopPropagation()
      let lx = e.nativeEvent.clientX,
        ly = e.nativeEvent.clientY
      drag.current = true
      ui.drag = true
      const mv = (ev) => {
        rot(ori.current, ev.clientX - lx, ev.clientY - ly)
        lx = ev.clientX
        ly = ev.clientY
      }
      const up = () => {
        drag.current = false
        ui.drag = false
        window.removeEventListener('pointermove', mv)
        window.removeEventListener('pointerup', up)
      }
      window.addEventListener('pointermove', mv)
      window.addEventListener('pointerup', up)
    },
    onPointerOut: () => {
      if (drag.current) return
      ui.hover = null
      ui.grab = false
    },
    onClick: (e) => {
      if (anim.current.s > 0.1) return
      e.stopPropagation()
      ui.hover = null
      ui.onPick(p.key)
    },
  }
  return (
    <group ref={g} {...on}>
      <Planet
        maps={p.maps}
        spin={spin}
        rim={rim}
        ring={p.ring}
        moon={p.moon}
        sats={p.sats}
        orient={ori}
      />
    </group>
  )
}

// Asteroid belt: one instanced mesh (a single draw call), slowly turning. The route passes through its middle.
function Belt({ anim }) {
  const mesh = useRef(),
    grp = useRef()
  useEffect(() => {
    const m = new Object3D()
    for (let i = 0; i < 260; i++) {
      const a = Math.random() * 6.283,
        r = 12 + (Math.random() + Math.random() - 1) * 3.5
      m.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 2.2, Math.sin(a) * r)
      m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6)
      const s = 0.07 + Math.pow(Math.random(), 3) * 0.42
      m.scale.set(s, s * (0.6 + Math.random() * 0.6), s)
      m.updateMatrix()
      mesh.current.setMatrixAt(i, m.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [])
  useFrame((st, dt) => {
    grp.current.rotation.y += dt * 0.04
    grp.current.visible =
      anim.current.s < 0.5 && anim.current.u > 0.01 && st.camera.position.distanceTo(BELT_C) < 160
  })
  return (
    <group ref={grp} position={BELT_C}>
      <instancedMesh ref={mesh} args={[null, null, 260]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8a8077" roughness={1} flatShading />
      </instancedMesh>
    </group>
  )
}

// Faint constellation joining the stops of the journey; fades out when you are docked so the content comes first.
function Constellation({ anim }) {
  const obj = useMemo(() => {
    const geo = new BufferGeometry().setFromPoints(STOPS)
    const mk = (o) => ({ transparent: true, opacity: 0, depthWrite: false, ...o })
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const g = c.getContext('2d'),
      gr = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    gr.addColorStop(0, '#fff')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 32, 32) // round, soft dots instead of squares
    return {
      line: new Line(geo, new LineBasicMaterial(mk({ color: '#aab4d8' }))),
      pts: new Points(
        geo,
        new PointsMaterial(
          mk({ color: '#eef0fa', size: 2.6, map: new CanvasTexture(c), alphaTest: 0.02 })
        )
      ),
    }
  }, [])
  useFrame(() => {
    const a = anim.current,
      f = a.u * (1 - a.s)
    obj.line.material.opacity = 0.3 * f
    obj.pts.material.opacity = 0.7 * f
  })
  return (
    <>
      <primitive object={obj.line} />
      <primitive object={obj.pts} />
    </>
  )
}

// Quality governor: if the frame rate stays low, drop the 3D resolution
function Governor({ anim }) {
  const { setDpr } = useThree()
  useFrame(() => {
    const a = anim.current
    if (a.low && !a.lowApplied) {
      a.lowApplied = true
      setDpr(1)
    }
  })
  return null
}

function Scene({ anim, ui }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      onPointerMissed={(e) => ui.scatter && ui.scatter(e.clientX, e.clientY)}
      camera={{ position: [0, 0, 40], fov: 45, far: 600 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.2} />
      <directionalLight position={[-4, 2.5, 3.5]} intensity={2.4} />
      <Rig anim={anim} />
      <Governor anim={anim} />
      <Belt anim={anim} />
      <Constellation anim={anim} />
      <Suspense fallback={null}>
        {PLANETS.map((p) => (
          <Node key={p.key} p={p} idx={ORDER.indexOf(p.key)} anim={anim} ui={ui} />
        ))}
      </Suspense>
    </Canvas>
  )
}

export default memo(Scene)
