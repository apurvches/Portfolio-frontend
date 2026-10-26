import { useMemo } from 'react'

// Distant spiral galaxies, drawn once on a canvas and rotated very slowly with CSS (costs almost nothing).
function make(seed, hue) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  let s = seed
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const core = g.createRadialGradient(128, 128, 0, 128, 128, 44)
  core.addColorStop(0, `hsla(${hue},35%,92%,.9)`)
  core.addColorStop(1, `hsla(${hue},35%,60%,0)`)
  g.fillStyle = core
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 2800; i++) {
    const arm = i % 2,
      t = Math.pow(rnd(), 0.7),
      r = t * 120,
      a = t * 5.5 + arm * Math.PI + (rnd() - 0.5) * (0.5 + t)
    g.fillStyle = `hsla(${hue + (rnd() - 0.5) * 40},35%,${70 + rnd() * 25}%,${(1 - t) * 0.75 * rnd()})`
    g.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 1.4, 1.4)
  }
  return c.toDataURL()
}
export default function Galaxies() {
  const imgs = useMemo(() => [make(7, 215), make(19, 280), make(31, 190)], [])
  return (
    <div className="layer galaxies" aria-hidden="true">
      {imgs.map((src, i) => (
        <img key={i} className={'galaxy g' + (i + 1)} src={src} alt="" />
      ))}
    </div>
  )
}
