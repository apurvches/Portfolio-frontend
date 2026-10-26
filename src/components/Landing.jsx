import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

const NAME = 'APURV SONI'

export default function Landing({ hide, ready, onBegin }) {
  const root = useRef(null)
  useLayoutEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.landing h1 span', { y: 70, opacity: 0, rotateX: -60, duration: 1, stagger: 0.05 })
        .from('.landing .role', { y: 24, opacity: 0, duration: 0.8 }, '-=0.5')
        .from('.hint', { opacity: 0, duration: 1 }, '-=0.3')
      gsap.to('.hint', { y: 8, repeat: -1, yoyo: true, duration: 1.2, ease: 'sine.inOut' })
    }, root)
    return () => ctx.revert()
  }, [ready])
  return (
    <div ref={root} className={'layer lwrap' + (hide ? ' hide' : '')}>
      <section className="landing">
        <p className="mono">PORTFOLIO</p>
        <h1 aria-label={NAME}>
          {NAME.split('').map((ch, i) => (
            <span key={i}>{ch === ' ' ? '\u00A0' : ch}</span>
          ))}
        </h1>
        <p className="role">Full-stack developer · React · GSAP · Three.js</p>
        <button className="cta begin" onClick={onBegin}>
          Begin the journey →
        </button>
      </section>
      <p className="hint mono">SCROLL TO BEGIN THE JOURNEY ↓</p>
    </div>
  )
}
