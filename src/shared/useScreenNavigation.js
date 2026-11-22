import { useEffect, useRef, useState } from 'react'

const routes = ['/', '/photos', '/social']
const currentRoute = () => Math.max(0, routes.indexOf(location.pathname.replace(/\/$/, '') || '/'))

function navigate(screen) {
  if (currentRoute() !== screen) history.pushState(null, '', routes[screen])
  return screen
}

export function useScreenNavigation() {
  const [screen, setScreen] = useState(currentRoute)
  const stage = useRef(null)

  useEffect(() => {
    const element = stage.current
    let lastWheel = 0
    let distance = 0
    let consumed = false
    let touchStart

    function move(direction) {
      if (element.querySelector('.is-expanded')) return
      setScreen(navigate(Math.max(0, Math.min(routes.length - 1, currentRoute() + direction))))
    }
    function wheel(event) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      if (element.querySelector('.is-expanded')) { event.preventDefault(); return }
      const bottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      if ((event.deltaY > 0 && !bottom) || (event.deltaY < 0 && window.scrollY > 0)) return
      event.preventDefault()
      const now = performance.now()
      if (now - lastWheel > 210) { distance = 0; consumed = false }
      lastWheel = now
      if (consumed) return
      distance += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1)
      if (Math.abs(distance) >= 32) { consumed = true; move(Math.sign(distance)) }
    }
    function start(event) {
      if (event.target.closest('.photo-tile')) { touchStart = undefined; return }
      touchStart = event.touches.length === 1 ? {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        scroll: window.scrollY,
        bottom: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2,
      } : undefined
    }
    function end(event) {
      if (!touchStart || event.touches.length) return
      const touch = event.changedTouches[0]
      const dx = touchStart.x - touch.clientX
      const dy = touchStart.y - touch.clientY
      const canSwitch = dy > 0 ? touchStart.bottom : touchStart.scroll <= 0
      touchStart = undefined
      if (Math.abs(dy) <= Math.max(42, Math.abs(dx))) return
      if (canSwitch) move(Math.sign(dy))
      else if (!element.querySelector('.is-expanded')) window.scrollBy({ top: dy })
    }
    function key(event) {
      if (!['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
      event.preventDefault()
      if (!event.repeat) move(['PageDown', 'ArrowDown'].includes(event.key) ? 1 : -1)
    }
    element.addEventListener('wheel', wheel, { passive: false })
    element.addEventListener('touchstart', start, { passive: true })
    element.addEventListener('touchend', end, { passive: true })
    window.addEventListener('keydown', key)
    const restoreRoute = () => setScreen(currentRoute())
    window.addEventListener('popstate', restoreRoute)
    return () => {
      element.removeEventListener('wheel', wheel)
      element.removeEventListener('touchstart', start)
      element.removeEventListener('touchend', end)
      window.removeEventListener('keydown', key)
      window.removeEventListener('popstate', restoreRoute)
    }
  }, [])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [screen])

  function select(next) {
    const expanded = stage.current.querySelector('.is-expanded')
    if (expanded) { expanded.click(); return }
    setScreen(navigate(next))
  }

  return { screen, stage, select }
}
