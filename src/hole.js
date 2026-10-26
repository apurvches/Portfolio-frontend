// Cursor black hole state shared by the starfield (star bending) and the cursor element.
export const hole = {
  x: -999,
  y: -999,
  tx: -999,
  ty: -999,
  k: 0,
  tk: 0,
  enabled: false,
  mode: 'default',
}
export const HOLE_ENABLED = true // set false to remove the black-hole cursor completely
export const HOLE_R = 44 // bending radius in CSS px
export const HOLE_RH = 12 // event-horizon radius in CSS px

// What is under the cursor decides its shape: default | link | text | disabled (planet states are set by the scene).
const modeOf = (el) => {
  if (!el || !el.closest) return 'default'
  if (el.closest('button:disabled,input:disabled')) return 'disabled'
  if (el.closest('input:not([type=checkbox]):not([type=range]),textarea')) return 'text'
  if (el.closest('button,a,label,.astroWrap')) return 'link'
  return 'default'
}

export function initHole() {
  hole.enabled = HOLE_ENABLED && window.matchMedia('(pointer: fine)').matches // desktop pointers only
  if (!hole.enabled) return () => {}
  document.documentElement.classList.add('no-cursor') // hide the normal cursor, the black hole replaces it
  const mv = (e) => {
    hole.mode = modeOf(e.target)
    if (hole.k < 0.01) {
      hole.x = e.clientX
      hole.y = e.clientY
    }
    hole.tx = e.clientX
    hole.ty = e.clientY
    hole.tk = 1
  }
  const lv = () => {
    hole.tk = 0
  }
  window.addEventListener('pointermove', mv)
  document.documentElement.addEventListener('mouseleave', lv)
  return () => {
    document.documentElement.classList.remove('no-cursor')
    window.removeEventListener('pointermove', mv)
    document.documentElement.removeEventListener('mouseleave', lv)
  }
}

// Smooth follow + grow/shrink. `shrink` makes the lens smaller whenever the cursor is not in its default shape.
export function stepHole(dt, shrink) {
  hole.x += (hole.tx - hole.x) * Math.min(1, dt * 14)
  hole.y += (hole.ty - hole.y) * Math.min(1, dt * 14)
  hole.k += (hole.tk * (shrink ? 0.45 : 1) - hole.k) * Math.min(1, dt * 8)
}
