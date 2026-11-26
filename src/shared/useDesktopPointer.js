import { useEffect } from 'react'

export function useDesktopPointer(stage, enabled) {
  useEffect(() => {
    if (!enabled) return
    const site = stage.current
    const motion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let frame = 0
    let point

    function reset() {
      cancelAnimationFrame(frame)
      frame = 0
      point = null
      for (const key of ['--pointer-x', '--pointer-y', '--pointer-slide-x', '--pointer-slide-y']) {
        site.style.removeProperty(key)
      }
    }

    function render() {
      frame = 0
      if (!point || !motion.matches) return
      const { x, y } = point
      const horizontal = x / innerWidth
      const vertical = y / innerHeight
      site.style.setProperty('--pointer-x', `${horizontal * 100}%`)
      site.style.setProperty('--pointer-y', `${vertical * 100}%`)
      site.style.setProperty('--pointer-slide-x', `${(horizontal - .5) * 25}px`)
      site.style.setProperty('--pointer-slide-y', `${(vertical - .5) * 17}px`)
    }

    function move(event) {
      if (event.pointerType !== 'mouse' || !motion.matches) return
      point = { x: event.clientX, y: event.clientY }
      if (!frame) frame = requestAnimationFrame(render)
    }

    site.addEventListener('pointermove', move, { passive: true })
    site.addEventListener('pointerleave', reset)
    window.addEventListener('blur', reset)
    motion.addEventListener('change', reset)
    return () => {
      reset()
      site.removeEventListener('pointermove', move)
      site.removeEventListener('pointerleave', reset)
      window.removeEventListener('blur', reset)
      motion.removeEventListener('change', reset)
    }
  }, [stage, enabled])
}
