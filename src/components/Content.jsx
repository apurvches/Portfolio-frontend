import { useEffect, useLayoutEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SECTIONS, NAV } from '../data.js'

const API = 'http://localhost:3000'

function ReviewForm() {
  const [list, setList] = useState([])
  const [f, setF] = useState({
    name: '',
    email: '',
    rating: 5,
    text: '',
    consent: false,
    website: '',
  })
  const [done, setDone] = useState(false)

  const set = (key, value) => {
    setF((prev) => ({ ...prev, [key]: value }))
    setDone(false)
  }

  useEffect(() => {
    fetch(`${API}/api/reviews`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (f.website) return // honeypot

    try {
      const r = await fetch(`${API}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      })
      const j = await r.json().catch(() => ({}))

      if (!r.ok) {
        alert(j.error || 'Something went wrong.')
        return
      }

      setList((prev) => [j, ...prev])
      setDone(true)
      setF((prev) => ({ ...prev, text: '', website: '' }))
    } catch {
      alert('Cannot reach the server. Please try again later.')
    }
  }

  return (
    <>
      <form className="form reveal" onSubmit={submit}>
        <input
          placeholder="Your name"
          required
          minLength={2}
          maxLength={60}
          value={f.name}
          onChange={(e) => set('name', e.target.value)}
        />
        <input
          type="email"
          placeholder="Your email (kept private)"
          required
          maxLength={120}
          value={f.email}
          onChange={(e) => set('email', e.target.value)}
        />
        <div className="stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className={n <= f.rating ? 'on' : ''}
              onClick={() => set('rating', n)}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          rows="4"
          placeholder="Tell me about your experience..."
          required
          minLength={10}
          maxLength={1000}
          value={f.text}
          onChange={(e) => set('text', e.target.value)}
        />
        <input
          className="hp"
          name="company_url"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={f.website}
          onChange={(e) => set('website', e.target.value)}
        />
        <label className="note">
          <input
            type="checkbox"
            checked={f.consent}
            required
            onChange={(e) => set('consent', e.target.checked)}
          />{' '}
          I agree that my name and email are stored to publish my review. Only my name is shown.
        </label>
        <button className="cta" type="submit">
          Submit review →
        </button>
        {done && <p className="note ok">Thank you for your review!</p>}
      </form>

      {list.map((r) => (
        <div className="card tx" key={r.id}>
          <div className="body">
            <p className="mono">INCOMING TRANSMISSION · {'★'.repeat(r.rating)}</p>
            <h3>{r.name}</h3>
            <p className="sub">{r.body}</p>
          </div>
        </div>
      ))}
    </>
  )
}

const tilt = (e) => {
  const c = e.target.closest && e.target.closest('.card')
  if (!c) return
  const r = c.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width
  const y = (e.clientY - r.top) / r.height
  c.style.setProperty('--mx', x * 100 + '%')
  c.style.setProperty('--my', y * 100 + '%')
  c.style.setProperty('--rx', ((0.5 - y) * 6).toFixed(2) + 'deg')
  c.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg')
}

const untilt = (e) => {
  const c = e.target.closest && e.target.closest('.card')
  if (c && !c.contains(e.relatedTarget)) {
    c.style.setProperty('--rx', '0deg')
    c.style.setProperty('--ry', '0deg')
  }
}

export default function Content({ id, refEl, onGo }) {
  const s = SECTIONS[id]
  const idx = NAV.indexOf(id) + 1
  const prev = NAV[idx - 2]
  const next = NAV[idx]

  useLayoutEffect(() => {
    const el = refEl.current
    const items = el.querySelectorAll('.reveal')
    gsap.set(items, { opacity: 0, y: 36 })

    const bs = ScrollTrigger.batch(items, {
      scroller: el,
      start: 'top 96%',
      once: true,
      onEnter: (b) =>
        gsap.to(b, {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.9,
        }),
    })

    ScrollTrigger.refresh()
    return () => bs.forEach((t) => t.kill())
  }, [])

  const cards =
    s.kind === 'cards' &&
    s.items.map(([n, t, d, tags]) => (
      <div className="card reveal" key={n}>
        <span className="mono num">{n}</span>
        <div className="body">
          <h3>{t}</h3>
          <p className="sub">{d}</p>
          {tags && (
            <div className="chips sm">
              {tags.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          )}
        </div>
        <span className="arrow">→</span>
      </div>
    ))

  return (
    <div className="content" ref={refEl} onPointerMove={tilt} onPointerOut={untilt}>
      <p className="mono reveal">
        {String(idx).padStart(2, '0')} / {s.label.toUpperCase()}
      </p>
      <h2 className="reveal">{s.title}</h2>
      <p className="lead reveal">{s.para}</p>
      {s.kind === 'about' && (
        <div className="stats reveal">
          {s.stats.map(([n, l]) => (
            <div key={l}>
              <b>{n}</b>
              <span className="mono">{l}</span>
            </div>
          ))}
        </div>
      )}
      {s.kind === 'chips' &&
        s.groups.map(([g, c]) => (
          <div className="reveal" key={g}>
            <p className="mono sub">{g}</p>
            <div className="chips">
              {c.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
        ))}
      {cards && (s.timeline ? <div className="timeline">{cards}</div> : cards)}
      {s.kind === 'links' &&
        s.items.map(([l, v, h]) => (
          <a className="card link reveal" key={l} href={h} target="_blank" rel="noreferrer">
            <div className="body">
              <span className="mono">{l}</span>
              <h3>{v}</h3>
            </div>
            <span className="arrow">↗</span>
          </a>
        ))}
      {s.kind === 'form' && <ReviewForm />}
      <div className="pager reveal">
        {prev && <button onClick={() => onGo(prev)}>← {SECTIONS[prev].label}</button>}
        {next && <button onClick={() => onGo(next)}>{SECTIONS[next].label} →</button>}
      </div>
    </div>
  )
}
