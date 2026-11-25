import { useEffect, useRef, useState } from 'react'

const routes = ['/', '/about', '/photos', '/videos', '/social']
const currentRoute = () => Math.max(0, routes.indexOf(location.pathname.replace(/\/$/, '') || '/'))
const introMedia = '(prefers-reduced-motion: no-preference)'
const introKey = 'cchua-home-intro-v3'
const holdDuration = 500
const pushDuration = 800

function initialIntro(mobileLayout) {
  if (!mobileLayout || location.pathname !== '/' || !matchMedia(introMedia).matches) return 'idle'
  try {
    return sessionStorage.getItem(introKey) ? 'idle' : 'typing'
  } catch {
    return 'typing'
  }
}

function navigate(screen) {
  if (currentRoute() !== screen) history.pushState(null, '', routes[screen])
  return screen
}

export function useScreenNavigation(mobileSwipe, mobileLayout) {
  const [screen, setScreen] = useState(currentRoute)
  const [intro, setIntro] = useState(() => initialIntro(mobileLayout))
  const stage = useRef(null)

  useEffect(() => {
    if (intro !== 'typing') return
    try { sessionStorage.setItem(introKey, '1') } catch { /* The intro only starts on mount. */ }
  }, [intro])

  useEffect(() => {
    if (intro === 'idle') return
    if (screen !== 0 || !mobileLayout) {
      setIntro('idle')
      return
    }
    const media = matchMedia(introMedia)
    const cancel = () => { if (!media.matches) setIntro('idle') }
    media.addEventListener('change', cancel)
    cancel()
    const timer = intro === 'typing' ? undefined : setTimeout(() => {
      if (intro === 'hold') {
        setIntro('push')
        return
      }
      if (currentRoute() === 0) setScreen(navigate(1))
      setIntro('idle')
    }, intro === 'hold' ? holdDuration : pushDuration)
    return () => {
      clearTimeout(timer)
      media.removeEventListener('change', cancel)
    }
  }, [intro, screen, mobileLayout])

  useEffect(() => {
    const element = stage.current
    let lastWheel = 0
    let distance = 0
    let consumed = false
    let touchStart
    const touch = matchMedia('(hover: none) and (pointer: coarse)')
    const canChangeScreen = () => (!mobileLayout && !touch.matches) || mobileSwipe
    const overlayOpen = () => element.querySelector('dialog[open], .site-settings :popover-open')
    const isAboutScroll = event => mobileLayout && event.target.closest('.about-scroll')

    function move(direction) {
      if (overlayOpen() || element.querySelector('.is-expanded')) return
      setScreen(navigate(Math.max(0, Math.min(routes.length - 1, currentRoute() + direction))))
    }
    function wheel(event) {
      if (!canChangeScreen() || isAboutScroll(event)) return
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      if (overlayOpen()) return
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
      if (!canChangeScreen() || overlayOpen() || event.target.closest('.photo-tile, .video-wall-card, .site-settings') || isAboutScroll(event)) {
        touchStart = undefined
        return
      }
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
      if (!canChangeScreen() || isAboutScroll(event)) return
      if (overlayOpen()) return
      const down = ['PageDown', 'ArrowDown'].includes(event.key)
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      if (down ? !atBottom : window.scrollY > 0) return
      event.preventDefault()
      if (!event.repeat) move(down ? 1 : -1)
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
  }, [mobileSwipe, mobileLayout])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [screen])

  function select(next) {
    const expanded = stage.current.querySelector('.is-expanded')
    if (expanded) { expanded.click(); return }
    setScreen(navigate(next))
  }

  function finishTyping() {
    setIntro(current => current === 'typing' ? 'hold' : current)
  }

  return { screen, stage, select, intro, finishTyping }
}
