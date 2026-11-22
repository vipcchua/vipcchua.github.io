import React, { useEffect, useRef, useState } from 'react'
import { usePhotoMotion } from './usePhotoMotion.js'
import './photos.css'

const photos = Object.entries(import.meta.glob('../imgBlog/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', {
  eager: true, import: 'default', query: '?url',
})).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([, url]) => url)

function photoPlacement() {
  return {
    '--photo-size': (.65 + Math.random() * .75).toFixed(3),
    '--tilt': `${Math.round(Math.random() * 28 - 14)}deg`,
  }
}

export default function Photos() {
  const [placements] = useState(() => photos.map(photoPlacement))
  const active = useRef(null)
  const wallRef = useRef(null)
  const motion = useRef(new Map())
  const switching = useRef(false)
  const drag = useRef(null)
  const suppressClick = useRef(null)

  const gravity = useRef(null)
  const [tiltEnabled, setTiltEnabled] = useState(false)
  const [tiltPending, setTiltPending] = useState(false)
  const [tiltMessage, setTiltMessage] = useState('')
  const canTilt = window.isSecureContext && window.DeviceOrientationEvent
    && matchMedia('(any-pointer: coarse)').matches

  usePhotoMotion({ wallRef, motion, active, drag, gravity })

  useEffect(() => {
    if (!tiltEnabled) return
    const radians = Math.PI / 180
    const timeout = window.setTimeout(() => {
      setTiltEnabled(false)
      setTiltMessage('此浏览器未提供方向感应数据。')
    }, 3000)

    function onOrientation({ beta, gamma }) {
      if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return
      window.clearTimeout(timeout)
      const angle = (screen.orientation?.angle ?? window.orientation ?? 0) * radians
      const x = Math.sin(gamma * radians) * Math.cos(beta * radians)
      const y = Math.sin(beta * radians)
      gravity.current = {
        x: x * Math.cos(angle) + y * Math.sin(angle),
        y: y * Math.cos(angle) - x * Math.sin(angle),
      }
    }

    window.addEventListener('deviceorientation', onOrientation)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('deviceorientation', onOrientation)
      gravity.current = null
    }
  }, [tiltEnabled])

  async function toggleTilt() {
    setTiltMessage('')
    if (tiltEnabled) {
      setTiltEnabled(false)
      return
    }
    const orientation = window.DeviceOrientationEvent
    setTiltPending(true)
    try {
      if (typeof orientation.requestPermission === 'function'
        && await orientation.requestPermission() !== 'granted') {
        setTiltMessage('请允许方向感应权限。')
        return
      }
      setTiltEnabled(true)
    } catch {
      setTiltMessage('无法开启方向感应。')
    } finally {
      setTiltPending(false)
    }
  }

  function startDrag(event) {
    if (!event.isPrimary || event.button !== 0 || active.current || switching.current) return
    suppressClick.current = null
    const tile = event.currentTarget
    const slot = tile.parentElement
    const x = parseFloat(slot.style.getPropertyValue('--drag-x')) || 0
    const y = parseFloat(slot.style.getPropertyValue('--drag-y')) || 0
    const bounds = tile.getBoundingClientRect()
    const wall = slot.parentElement.getBoundingClientRect()
    drag.current = { tile, slot, x, y, bounds, wall, startX: event.clientX, startY: event.clientY,
      lastX: x, lastY: y, lastTime: performance.now(), vx: 0, vy: 0, moved: false }
    tile.setPointerCapture(event.pointerId)
  }

  function moveDrag(event) {
    const current = drag.current
    if (!event.isPrimary || current?.tile !== event.currentTarget) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (!current.moved && Math.hypot(dx, dy) < 7) return
    current.moved = true
    current.slot.classList.add('dragging')
    const { bounds, wall } = current
    const x = current.x + Math.max(wall.left - bounds.left, Math.min(wall.right - bounds.right, dx))
    const y = current.y + Math.max(wall.top - bounds.top, Math.min(wall.bottom - bounds.bottom, dy))
    current.slot.style.setProperty('--drag-x', `${x}px`)
    current.slot.style.setProperty('--drag-y', `${y}px`)
    const now = performance.now()
    const seconds = Math.max(.012, (now - current.lastTime) / 1000)
    current.vx = current.vx * .3 + (x - current.lastX) / seconds * .7
    current.vy = current.vy * .3 + (y - current.lastY) / seconds * .7
    Object.assign(current, { lastX: x, lastY: y, lastTime: now })
  }

  function endDrag(event) {
    const current = drag.current
    if (!event.isPrimary || current?.tile !== event.currentTarget) return
    if (current.moved) {
      suppressClick.current = current.tile
      const body = motion.current.get(current.slot)
      if (body && event.type === 'pointerup' && performance.now() - current.lastTime < 110) {
        const speed = Math.hypot(current.vx, current.vy)
        const gain = Math.min(.85, 1600 / Math.max(1, speed))
        if (speed > 95) Object.assign(body, { vx: current.vx * gain, vy: current.vy * gain, impulse: true })
      }
    }
    current.slot.classList.remove('dragging')
    drag.current = null
  }

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') active.current?.click()
    }
    function onBackground(event) {
      if (!event.target.closest('.photo-tile, .topbar, .screen-nav')) active.current?.click()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('click', onBackground)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onBackground)
    }
  }, [])

  async function selectPhoto(tile) {
    if (switching.current) return
    switching.current = true
    try {
      const previous = active.current
      if (previous) await toggle(previous)
      if (previous !== tile) await toggle(tile)
    } finally {
      switching.current = false
    }
  }

  async function toggle(tile) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const slot = tile.parentElement
    if (active.current && active.current !== tile) return
    if (tile.dataset.moving) return
    tile.dataset.moving = 'true'

    if (active.current === tile) {
      const origin = slot.getBoundingClientRect()
      const image = tile.getBoundingClientRect()
      const width = Math.min(origin.width, origin.height * Number(tile.style.getPropertyValue('--ratio')))
      const left = origin.left + (origin.width - width) / 2
      if (!reduced) await tile.animate([
        { transform: 'none' },
        { transform: `translate(${left - image.left}px, ${origin.top - image.top}px) scale(${width / image.width}) rotate(var(--tilt))` },
      ], { duration: 450, easing: 'cubic-bezier(.3,0,.25,1)', fill: 'forwards' }).finished
      tile.getAnimations().forEach(animation => animation.cancel())
      tile.hidePopover?.()
      tile.removeAttribute('popover')
      tile.classList.remove('is-expanded')
      slot.style.removeProperty('height')
      tile.setAttribute('aria-expanded', 'false')
      active.current = null
    } else {
      const origin = slot.getBoundingClientRect()
      const width = tile.offsetWidth
      const left = origin.left + (origin.width - width) / 2
      const image = tile.querySelector('img')
      if (!image.naturalWidth) { delete tile.dataset.moving; return }
      slot.style.height = `${slot.offsetHeight}px`
      tile.style.setProperty('--ratio', image.naturalWidth / image.naturalHeight)
      active.current = tile
      tile.classList.add('is-expanded')
      if (tile.showPopover) {
        tile.setAttribute('popover', 'manual')
        tile.showPopover()
      }
      tile.setAttribute('aria-expanded', 'true')
      const destination = tile.getBoundingClientRect()
      if (!reduced) {
        const x = left - destination.left
        const y = origin.top - destination.top
        await tile.animate([
          { transform: `translate(${x}px, ${y}px) scale(${width / destination.width}) rotate(var(--tilt))` },
          { transform: 'translate(-2%, -2%) scale(1.045)', offset: .78 },
          { transform: 'none' },
        ], { duration: 620, easing: 'cubic-bezier(.19,.8,.24,1)' }).finished
      }
    }
    delete tile.dataset.moving
  }

  return <section className="photo-section scene" id="photos" tabIndex={-1} aria-labelledby="photos-title">
    <header className="section-head"><h2 id="photos-title">照片</h2></header>
    {canTilt && <div className="photo-tilt-control">
      {tiltMessage && <p className="photo-tilt-message" role="status">{tiltMessage}</p>}
      <button type="button" className="photo-tilt" aria-label="倾斜感应" title="倾斜感应"
        aria-pressed={tiltEnabled} disabled={tiltPending} onClick={toggleTilt}>
        <span className="photo-tilt-icon" aria-hidden="true" />
      </button>
    </div>}
    <div className="photo-wall" ref={wallRef} style={{
      '--rows-compact': Math.max(1, Math.ceil(photos.length / 3)),
      '--rows-medium': Math.max(1, Math.ceil(photos.length / 5)),
      '--rows-wide': Math.max(1, Math.ceil(photos.length / 6)),
    }}>
      {photos.map((url, index) => <div className="photo-slot" key={url} style={placements[index]}>
        <button className="photo-tile" onClick={event => {
          if (suppressClick.current === event.currentTarget && event.detail !== 0) {
            suppressClick.current = null
            return
          }
          selectPhoto(event.currentTarget)
        }} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}
          onPointerCancel={endDrag} onLostPointerCapture={endDrag} aria-expanded="false"
          aria-label={`照片 ${index + 1}，点击放大或收回`}>
          <img src={url} alt="" decoding="async" onLoad={async event => {
            const image = event.currentTarget
            await image.decode().catch(() => {})
            const slot = image.closest('.photo-slot')
            if (!slot?.isConnected) return
            slot.classList.toggle('landscape', image.naturalWidth > image.naturalHeight)
            slot.classList.add('ready')
            if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
              image.style.opacity = '0'
              requestAnimationFrame(() => requestAnimationFrame(() => {
                if (!image.isConnected) return
                const edge = Math.floor(Math.random() * 4)
                const along = Math.random()
                const rect = image.getBoundingClientRect()
                const width = window.innerWidth
                const height = window.innerHeight
                const startX = [-80, width + 80, along * width, along * width][edge]
                const startY = [along * height, along * height, -80, height + 80][edge]
                const dx = startX - rect.left - rect.width / 2
                const dy = startY - rect.top - rect.height / 2
                const curve = Math.random() * .45 - .225
                const spin = Math.random() * 100 - 50
                image.style.removeProperty('opacity')
                image.animate([
                  { opacity: .15, transform: `translate(${dx}px, ${dy}px) scale(.28) rotate(${spin}deg)` },
                  { opacity: .92, transform: `translate(${dx * .31 - dy * curve}px, ${dy * .31 + dx * curve}px) scale(.76) rotate(${spin * .3}deg)`, offset: .56 },
                  { opacity: 1, transform: 'translate(0, 0) scale(1.035)', offset: .89 },
                  { opacity: 1, transform: 'none' },
                ], {
                  duration: 1950 + Math.random() * 1000,
                  delay: Math.random() * 420,
                  easing: 'cubic-bezier(.22,.55,.31,1)',
                  fill: 'backwards',
                })
              }))
            }
          }} />
        </button>
      </div>)}
    </div>
  </section>
}
