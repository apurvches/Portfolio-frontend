import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { PLANETS } from '../data.js'

// Every file the scene needs. Loading them here (into the browser cache) means nothing stutters later.
const URLS = [
  ...new Set([
    ...PLANETS.flatMap((p) => Object.values(p.maps)),
    '/textures/moon_texture.jpg',
    '/astronaut_spacecraft.png',
  ]),
]
const LINES = [
  'INITIALIZING STAR SYSTEMS',
  'CALIBRATING PLANETARY ORBITS',
  'LOADING SURFACE DATA',
  'ALIGNING NAVIGATION',
  'READY FOR LAUNCH',
]

export default function Loader({ onStart }) {
  const root = useRef(null),
    pct = useRef(null),
    bar = useRef(null),
    line = useRef(null)
  useEffect(() => {
    let done = 0,
      shown = 0,
      finished = false
    const t0 = performance.now()
    URLS.forEach((u) => {
      const im = new Image()
      im.onload = im.onerror = () => {
        done++
      }
      im.src = u
    })
    const tick = () => {
      if (finished) return
      // never faster than the intro sequence, never ahead of the real loading
      const goal = Math.min(done / URLS.length, Math.min(1, (performance.now() - t0) / 2600))
      shown += (goal - shown) * 0.08
      pct.current.textContent = String(Math.round(shown * 100)).padStart(3, '0')
      bar.current.style.transform = `scaleX(${shown})`
      line.current.textContent = LINES[Math.min(LINES.length - 1, Math.floor(shown * LINES.length))]
      if (shown > 0.995 && goal >= 1) {
        finished = true
        pct.current.textContent = '100'
        bar.current.style.transform = 'scaleX(1)'
        onStart()
        gsap.to(root.current, {
          opacity: 0,
          duration: 1,
          delay: 0.35,
          ease: 'power2.inOut',
          onComplete: () => {
            root.current.style.display = 'none'
          },
        })
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <div className="loader" ref={root} aria-live="polite">
      <div className="orb" />
      <div className="pct" ref={pct}>
        000
      </div>
      <div className="barw">
        <i ref={bar} />
      </div>
      <p className="mono" ref={line}>
        {LINES[0]}
      </p>
      <p className="mono sub">APURV SONI · PORTFOLIO</p>
    </div>
  )
}
