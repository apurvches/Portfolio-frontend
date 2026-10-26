import { useEffect, useRef } from 'react'
import { hole, HOLE_R, HOLE_RH } from '../hole.js'

// 3D starfield: stars drift towards you with depth (parallax), streak when travelling (anim.warp),
// twinkle on their own timing, and bend around the cursor black hole.
// Three constellations (points in a 0..1 box, and which points are joined). They sit far away, so they turn with the camera slowly.
const SKY = [
  {
    x: 0.1,
    y: 0.18,
    w: 0.17,
    h: 0.2,
    p: [
      [0, 0],
      [0.5, 0.2],
      [1, 0],
      [0.2, 0.8],
      [0.5, 0.85],
      [0.8, 0.8],
      [0.5, 0.5],
    ],
    e: [
      [0, 1],
      [1, 2],
      [1, 6],
      [6, 3],
      [6, 5],
      [3, 4],
      [4, 5],
    ],
  },
  {
    x: 0.62,
    y: 0.7,
    w: 0.2,
    h: 0.18,
    p: [
      [0, 0.4],
      [0.2, 0.3],
      [0.4, 0.35],
      [0.6, 0.5],
      [0.65, 0.9],
      [1, 0.85],
      [0.95, 0.45],
    ],
    e: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
  },
  {
    x: 0.82,
    y: 0.14,
    w: 0.14,
    h: 0.14,
    p: [
      [0, 0.2],
      [0.25, 0.8],
      [0.5, 0.3],
      [0.75, 0.85],
      [1, 0.25],
    ],
    e: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
]

export default function Starfield({ anim }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current,
      ctx = c.getContext('2d')
    let w,
      h,
      R,
      near,
      stars = [],
      raf,
      last = performance.now(),
      mx = 0,
      my = 0,
      px = 0,
      py = 0
    const glow = document.createElement('canvas')
    glow.width = glow.height = 32
    const g = glow.getContext('2d'),
      gr = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    gr.addColorStop(0, 'rgba(236,238,248,.8)')
    gr.addColorStop(1, 'rgba(207,227,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 32, 32)
    const spawn = (s, far) => {
      s.x = (Math.random() * 2 - 1) * R
      s.y = (Math.random() * 2 - 1) * R
      s.z = far ? R * (0.85 + Math.random() * 0.15) : near * (1.1 + Math.random())
      s.pz = s.z
    }
    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth
      h = window.innerHeight
      R = Math.max(w, h)
      near = R * 0.04
      c.width = w * dpr
      c.height = h * dpr
      c.style.width = w + 'px'
      c.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stars = Array.from({ length: Math.round((w * h) / 5200) }, () => {
        const r = Math.random(),
          tier = r < 0.68 ? 0 : r < 0.93 ? 1 : 2,
          s = {
            tier,
            s: [0.7, 1, 1.5][tier],
            base: [0.55, 0.85, 1][tier],
            sp: 0.4 + Math.random() * 1.8,
            ph: Math.random() * 6.283,
          }
        spawn(s, false)
        s.z = near + Math.random() * (R - near)
        s.pz = s.z
        return s
      })
    }
    const dot = (x, y, r, a, big, gs = 28) => {
      ctx.globalAlpha = a
      if (big) ctx.drawImage(glow, x - gs / 2, y - gs / 2, gs, gs)
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, 6.283)
      ctx.fill()
    }
    const draw = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      px += (mx - px) * Math.min(1, dt * 3)
      py += (my - py) * Math.min(1, dt * 3)
      const warp = anim.current.warp,
        v = R * (0.02 + 1.7 * warp),
        k0 = hole.k,
        Rh = HOLE_R * k0,
        rh = HOLE_RH * k0
      ctx.clearRect(0, 0, w, h)
      const hx = anim.current.yaw * R * 0.9 // sideways shift = camera heading
      if (Math.abs(anim.current.warp) < 0.04) {
        // constellations: faint, dimmer while reading
        const dim = 1 - anim.current.s * 0.85,
          sx = hx * 0.35
        ctx.strokeStyle = '#c8cfe6'
        ctx.lineWidth = 1
        for (const c of SKY) {
          const bx = (((c.x * w + sx) % w) + w) % w,
            pts = c.p.map(([a, b]) => [bx + a * c.w * w, c.y * h + b * c.h * h])
          ctx.globalAlpha = 0.13 * dim
          ctx.beginPath()
          for (const [i, j] of c.e) {
            ctx.moveTo(pts[i][0], pts[i][1])
            ctx.lineTo(pts[j][0], pts[j][1])
          }
          ctx.stroke()
          pts.forEach((q, i) =>
            dot(q[0], q[1], 1.6, (0.5 + 0.3 * Math.sin(now / 900 + i * 1.7)) * dim, true, 15)
          )
        }
      }
      const sh = anim.current.shock,
        low = anim.current.low
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        if (low && i & 1) continue
        s.pz = s.z
        s.z -= v * dt
        if (s.z < near) {
          spawn(s, true)
          continue
        }
        if (s.z > R) {
          spawn(s, false)
          continue
        }
        const depth = 1 - s.z / R,
          k = (R * 0.5) / s.z
        let x = w / 2 + s.x * k + px * 70 * depth + hx * (0.3 + 0.7 * depth),
          y = h / 2 + s.y * k + py * 45 * depth
        if (depth < 0.5) x = ((x % w) + w) % w // far stars wrap around so the sky never runs out
        if (v > 0 && (x < -60 || x > w + 60 || y < -60 || y > h + 60)) {
          spawn(s, true)
          continue
        }
        const a =
            s.base * (0.3 + 0.7 * depth) * (0.55 + 0.45 * Math.sin((now / 1000) * s.sp + s.ph)),
          r = s.s * (0.7 + depth * 1.5)
        if (sh) {
          // click shockwave: a ring of displacement expanding from the click
          const age = (now - sh.t0) / 1000
          if (age < 1.6) {
            const dx = x - sh.x,
              dy = y - sh.y,
              d = Math.hypot(dx, dy) || 1,
              f = Math.exp(-(((d - age * 1100) / 160) ** 2)) * 90 * (1 - age / 1.6)
            x += (dx / d) * f
            y += (dy / d) * f
          }
        }
        if (Math.abs(warp) > 0.04) {
          // travelling: draw a streak from the previous position
          const k1 = (R * 0.5) / s.pz,
            x1 = w / 2 + s.x * k1 + px * 70 * (1 - s.pz / R) + hx * (0.3 + 0.7 * (1 - s.pz / R)),
            y1 = h / 2 + s.y * k1 + py * 45 * (1 - s.pz / R)
          if (Math.abs(x - x1) < w / 2) {
            ctx.globalAlpha = a
            ctx.strokeStyle = '#e8ecfa'
            ctx.lineWidth = r
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x, y)
            ctx.stroke()
          }
          continue
        }
        if (k0 > 0.01) {
          // gravitational lensing near the cursor
          const dx = x - hole.x,
            dy = y - hole.y,
            d = Math.hypot(dx, dy) || 0.001
          if (d < Rh * 6) {
            const q = Math.sqrt(d * d + 4 * Rh * Rh),
              t1 = 0.5 * (d + q),
              t2 = 0.5 * (q - d)
            if (t2 > rh) dot(hole.x - (dx / d) * t2, hole.y - (dy / d) * t2, r, a * 0.5, false)
            x = hole.x + (dx / d) * t1
            y = hole.y + (dy / d) * t1
          }
        }
        dot(x, y, r, a, s.tier === 2 && depth > 0.25)
      }
      raf = requestAnimationFrame(draw)
    }
    const move = (e) => {
      mx = (e.clientX / w - 0.5) * 2
      my = (e.clientY / h - 0.5) * 2
    }
    init()
    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', init)
    window.addEventListener('pointermove', move)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', init)
      window.removeEventListener('pointermove', move)
    }
  }, [])
  return <canvas ref={ref} />
}
