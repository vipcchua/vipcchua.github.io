export function bindHudPointer(shadow) {
  const scene = shadow.host.closest('.hero')
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const layers = [...shadow.querySelectorAll('[data-depth]'), ...scene.querySelectorAll('[data-depth]')].map(element => ({
    element, depth: Number(element.dataset.depth),
  }))
  let frame = 0
  let point
  function flushPointer() {
    frame = 0
    if (!point || document.hidden || reducedMotion.matches) return
    const x = (point.x / window.innerWidth - 0.5) * 2
    const y = (point.y / window.innerHeight - 0.5) * 2
    for (const { element, depth } of layers) {
      element.style.setProperty('--shift-x', `${(x * depth * 30).toFixed(2)}px`)
      element.style.setProperty('--shift-y', `${(y * depth * 20).toFixed(2)}px`)
      element.style.setProperty('--depth-z', `${(depth * 55).toFixed(2)}px`)
    }
  }
  function move(event) {
    if (event.pointerType === 'touch' || reducedMotion.matches) return
    point = { x: event.clientX, y: event.clientY }
    if (!frame) frame = requestAnimationFrame(flushPointer)
  }
  function reset() {
    cancelAnimationFrame(frame)
    frame = 0
    point = null
    for (const { element } of layers) {
      for (const key of ['--shift-x', '--shift-y', '--depth-z']) element.style.removeProperty(key)
    }
  }
  window.addEventListener('pointermove', move, { capture: true, passive: true })
  document.documentElement.addEventListener('pointerleave', reset)
  window.addEventListener('blur', reset)
  reducedMotion.addEventListener('change', reset)
  return () => {
    reset()
    window.removeEventListener('pointermove', move, true)
    document.documentElement.removeEventListener('pointerleave', reset)
    window.removeEventListener('blur', reset)
    reducedMotion.removeEventListener('change', reset)
  }
}
