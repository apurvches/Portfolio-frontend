import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Starfield from './components/Starfield.jsx'
import Scene from './components/Scene.jsx'
import Landing from './components/Landing.jsx'
import Content from './components/Content.jsx'
import Loader from './components/Loader.jsx'
import Hud from './components/Hud.jsx'
import Galaxies from './components/Galaxies.jsx'
import RouteMap from './components/RouteMap.jsx'
import { NAV, ORDER, SECTIONS, PLANETS } from './data.js'
import { initHole, stepHole, hole } from './hole.js'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const [view, setView] = useState('home') // 'home' or the section we are at / travelling to
  const [docked, setDocked] = useState(false) // true once the camera has arrived and the content is shown
  const [ready, setReady] = useState(false) // true once the loading sequence has finished
  const viewRef = useRef('home'),
    lockUntil = useRef(0),
    contentRef = useRef(null),
    goRef = useRef(),
    bhEl = useRef(null),
    rippleEl = useRef(null),
    readyRef = useRef(false)
  // u: planets visible | s: docked amount | sel: docked planet | cs: camera position on the route (-1 start .. 5 last stop)
  // yaw: camera heading | warp: signed star-streak speed (+ forward, - backward)
  const anim = useRef({ u: 0, s: 0, sel: null, cs: -1, yaw: 0, warp: 0, shock: null, low: false })
  const ui = useRef({
    vel: 0,
    hover: null,
    grab: false,
    drag: false,
    scatter: null,
    onPick: () => {},
  }).current

  // Travel along the route to a stop (or back home). Passing planets are not stopped at.
  const go = (t) => {
    const from = viewRef.current
    if (t === from) return
    const a = anim.current,
      to = t === 'home' ? -1 : ORDER.indexOf(t)
    viewRef.current = t
    setView(t)
    setDocked(false)
    gsap.killTweensOf(a)
    const dist = Math.abs(to - a.cs),
      dur = Math.min(2.6, 1.2 + 0.4 * dist),
      dir = to >= a.cs ? 1 : -1,
      arrive = 0.3 + dur - 0.2
    const tl = gsap.timeline()
    tl.add(() => {
      a.sel = null
    }, 0.5)
      .to(a, { s: 0, duration: 0.5, ease: 'power2.in' }, 0) // undock from the current planet
      .to(a, { cs: to, duration: dur, ease: 'power3.inOut' }, 0.3) // fly along the route
      .to(a, { warp: dir * 0.6, duration: dur * 0.4, ease: 'power2.in' }, 0.3) // stars streak while travelling
      .to(a, { warp: 0, duration: dur * 0.6, ease: 'power3.out' }, '>')
    if (t === 'home') tl.to(a, { u: 0, duration: 0.8 }, arrive)
    else
      tl.to(a, { u: 1, duration: 0.8 }, 0)
        .add(() => {
          a.sel = t
          setDocked(true)
        }, arrive)
        .to(a, { s: 1, duration: 0.9, ease: 'power3.out' }, arrive)
  }
  goRef.current = go
  ui.onPick = (k) => go(k)
  ui.scatter = (x, y) => {
    // click in empty space: a shockwave ripples through the stars
    const a = anim.current
    if (a.s > 0.1 || !readyRef.current) return
    a.shock = { x, y, t0: performance.now(), id: (a.shock ? a.shock.id : 0) + 1 }
    gsap.fromTo(
      rippleEl.current,
      { x, y, scale: 0, opacity: 0.8 },
      { scale: 14, opacity: 0, duration: 1.2, ease: 'power2.out' }
    )
  }
  const start = () => {
    // loading finished: warp burst into the landing page
    readyRef.current = true
    setReady(true)
    gsap
      .timeline()
      .to(anim.current, { warp: 1, duration: 0.9, ease: 'power2.in' })
      .to(anim.current, { warp: 0, duration: 1.8, ease: 'power3.out' })
  }

  useEffect(() => {
    const nav = (d) => {
      // d = +1 next stop, -1 previous stop (the first stop's previous is home)
      const v = viewRef.current,
        i = v === 'home' ? -1 : ORDER.indexOf(v),
        n = i + d
      if (n < -1 || n >= ORDER.length) return
      goRef.current(n === -1 ? 'home' : ORDER[n])
    }
    const run = (d) => {
      if (!readyRef.current || performance.now() < lockUntil.current) return
      lockUntil.current = performance.now() + 1800
      nav(d)
    }
    let edgeTop = 0,
      edgeBot = 0 // how long the content has been resting at its top / bottom (stops momentum scrolling from skipping a section)
    const step = (dir) => {
      const v = viewRef.current
      if (v === 'home') {
        if (dir > 0) run(1)
      } else if (anim.current.s > 0.9) {
        if (dir < 0 && edgeTop > 350) run(-1)
        else if (dir > 0 && edgeBot > 350) run(1)
      }
    }
    let x0 = 0,
      y0 = 0
    const wheel = (e) => {
      if (Math.abs(e.deltaY) > 20) step(e.deltaY)
    }
    const ts = (e) => {
      x0 = e.touches[0].clientX
      y0 = e.touches[0].clientY
    }
    const te = (e) => {
      const dx = x0 - e.changedTouches[0].clientX,
        dy = y0 - e.changedTouches[0].clientY
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy))
        run(dx > 0 ? 1 : -1) // swipe sideways: next / previous stop
      else if (Math.abs(dy) > 70) step(dy)
    }
    const key = (e) => {
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return
      if (e.key === 'ArrowRight') run(1)
      else if (e.key === 'ArrowLeft') run(-1)
    }
    window.addEventListener('wheel', wheel, { passive: true })
    window.addEventListener('touchstart', ts, { passive: true })
    window.addEventListener('touchend', te, { passive: true })
    window.addEventListener('keydown', key)
    const offHole = initHole()
    let last = 0,
      acc = 0,
      frames = 0,
      bad = 0
    const tick = (_, ms) => {
      const dt = ms / 1000,
        el = contentRef.current,
        top = el ? el.scrollTop : 0
      ui.vel += (Math.abs(top - last) / Math.max(dt, 0.001) - ui.vel) * 0.12
      last = top // scroll speed (px/s), smoothed
      const atTop = !el || top <= 1,
        atBot = !el || top + el.clientHeight >= el.scrollHeight - 4
      edgeTop = atTop ? edgeTop + ms : 0
      edgeBot = atBot ? edgeBot + ms : 0
      const mode = ui.drag ? 'grabbing' : ui.grab ? 'grab' : ui.hover ? 'link' : hole.mode // cursor shape
      stepHole(dt, mode !== 'default')
      const bh = bhEl.current
      if (bh && hole.enabled) {
        bh.dataset.mode = mode
        const sc = mode === 'default' ? hole.k : Math.min(1, (hole.k / 0.45) * 0.85)
        bh.style.transform = `translate3d(${hole.x}px,${hole.y}px,0) scale(${sc})`
      }
      acc += ms
      frames++ // quality governor: two slow 2-second windows in a row switch to low quality
      if (acc > 2000) {
        bad = readyRef.current && acc / frames > 28 ? bad + 1 : 0
        if (bad >= 2) anim.current.low = true
        acc = 0
        frames = 0
      }
    }
    gsap.ticker.add(tick)
    gsap.to('.astro', {
      y: -14,
      rotate: 2,
      repeat: -1,
      yoyo: true,
      duration: 3,
      ease: 'sine.inOut',
    })
    return () => {
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('touchstart', ts)
      window.removeEventListener('touchend', te)
      window.removeEventListener('keydown', key)
      gsap.ticker.remove(tick)
      offHole()
    }
  }, [])

  return (
    <div className="app">
      <div className="layer nebula">
        <i />
        <i />
        <i />
      </div>
      <Galaxies />
      <div className="layer">
        <Starfield anim={anim} />
      </div>
      <div className="layer canvasLayer">
        <Scene anim={anim} ui={ui} />
      </div>
      <Landing hide={view !== 'home'} ready={ready} onBegin={() => go(ORDER[0])} />
      <Hud anim={anim} ui={ui} getView={() => viewRef.current} on={ready} />
      <RouteMap anim={anim} view={view} onGo={go} />
      <nav className="nav">
        <button className="logo" onClick={() => go('home')}>
          Apurv Soni
        </button>
        <button className={view === 'home' ? 'active' : ''} onClick={() => go('home')}>
          HOME
        </button>
        {NAV.map((k) => (
          <button key={k} className={view === k ? 'active' : ''} onClick={() => go(k)}>
            {SECTIONS[k].label.toUpperCase()}
          </button>
        ))}
      </nav>
      <div
        className={'astroWrap ' + (docked && view === 'about' ? 'big' : '')}
        onMouseEnter={() =>
          gsap.to('.astro', { scale: 1.4, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
        }
        onMouseLeave={() =>
          gsap.to('.astro', { scale: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
        }
      >
        <img className="astro" src="/astronaut_spacecraft.png" alt="Astronaut with spacecraft" />
      </div>
      {docked && PLANETS.some((p) => p.key === view) && (
        <p className="drag-hint mono">⟳ DRAG TO ROTATE · RELEASE TO RESET</p>
      )}
      {docked && SECTIONS[view] && <Content key={view} id={view} refEl={contentRef} onGo={go} />}
      <div className="bh" ref={bhEl} data-mode="default">
        <i className="disc" />
        <i className="ring" />
        <i className="caret" />
        <i className="grab">⟳</i>
        <i className="no" />
      </div>
      <div className="ripple" ref={rippleEl} />
      <Loader onStart={start} />
    </div>
  )
}
