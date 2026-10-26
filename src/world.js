import { Vector3, CatmullRomCurve3 } from 'three'

// The journey is one fixed route through space. Index 0 is the start, then one stop per section (see ORDER in data.js).
// A section stop i sits on the route at wp(i); its planet floats beside the route, a little ahead.
const wp = (i) => new Vector3(Math.sin(i * 1.6) * 16, Math.cos(i * 1.1) * 3, -60 * i)
export const curve = new CatmullRomCurve3(
  [new Vector3(0, 0, 40), ...Array.from({ length: 6 }, (_, i) => wp(i))],
  false,
  'centripetal'
)
export const planetPos = (i) => {
  const c = wp(i),
    side = i % 2 ? 1 : -1
  return new Vector3(c.x + side * 17, c.y + 1, c.z - 30)
}
const t0 = new Vector3()
curve.getTangent(0, t0)
export const BASE_YAW = Math.atan2(-t0.x, -t0.z)
