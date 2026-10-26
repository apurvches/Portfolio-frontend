import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ORDER, SECTIONS } from '../data.js'

// Small map of the journey: one dot per stop, a glowing marker for where you are. Click a dot to travel there.
export default function RouteMap({ anim, view, onGo }) {
  const mk = useRef(null)
  useEffect(() => {
    const tick = () => {
      mk.current.style.left =
        (Math.min(Math.max(anim.current.cs, 0), ORDER.length - 1) / (ORDER.length - 1)) * 100 + '%'
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <div
      className={'route' + (view === 'home' ? ' off' : '')}
      role="navigation"
      aria-label="Journey map"
    >
      <div className="line">
        <i ref={mk} />
      </div>
      {ORDER.map((k, i) => (
        <button
          key={k}
          data-l={SECTIONS[k].label}
          aria-label={'Travel to ' + SECTIONS[k].label}
          className={view === k ? 'on' : ''}
          style={{ left: `calc(6px + (100% - 12px) * ${i / (ORDER.length - 1)})` }}
          onClick={() => onGo(k)}
        />
      ))}
    </div>
  )
}
