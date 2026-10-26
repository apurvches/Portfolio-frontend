import { useEffect, useRef } from 'react'
import gsap from 'gsap'

// Mission-control readout. Updated straight in the DOM at ~15 Hz so it never costs React renders.
export default function Hud({ anim, ui, getView, on }) {
  const r = useRef({})
  useEffect(() => {
    let n = 0,
      mx = 0,
      my = 0
    const mv = (e) => {
      mx = e.clientX / window.innerWidth - 0.5
      my = e.clientY / window.innerHeight - 0.5
    }
    const sgn = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(1)
    const tick = () => {
      if (++n % 4) return
      const a = anim.current,
        v = getView(),
        e = r.current
      const vel = Math.round(12 + ui.vel * 0.45 + Math.abs(a.warp) * 2400)
      e.sec.textContent = v === 'home' ? 'HOME BASE' : a.s < 0.5 ? 'IN TRANSIT' : v.toUpperCase()
      e.head.textContent = (a.yaw * 57.3).toFixed(0) + '°'
      e.vel.textContent = String(vel).padStart(4, '0') + ' km/s'
      e.bar.style.transform = `scaleX(${Math.min(1, vel / 2400)})`
      e.pos.textContent = sgn(mx) + ' · ' + sgn(my)
    }
    window.addEventListener('pointermove', mv)
    gsap.ticker.add(tick)
    return () => {
      window.removeEventListener('pointermove', mv)
      gsap.ticker.remove(tick)
    }
  }, [])
  return (
    <div className={'hud' + (on ? ' on' : '')} aria-hidden="true">
      <div className="row">
        <span>SECTOR</span>
        <b ref={(el) => (r.current.sec = el)}>HOME BASE</b>
      </div>
      <div className="row">
        <span>HEADING</span>
        <b ref={(el) => (r.current.head = el)}>0°</b>
      </div>
      <div className="row">
        <span>VELOCITY</span>
        <b ref={(el) => (r.current.vel = el)}>0012 km/s</b>
      </div>
      <div className="bar">
        <i ref={(el) => (r.current.bar = el)} />
      </div>
      <div className="row">
        <span>COORD</span>
        <b ref={(el) => (r.current.pos = el)}>+0.0 · +0.0</b>
      </div>
    </div>
  )
}
