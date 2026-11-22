import { useEffect } from 'react'

export function usePhotoMotion({ wallRef, motion, active, drag, gravity }) {
  useEffect(() => {
    const wall = wallRef.current
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const slots = Array.from(wall.children)
    let frame
    let previous = 0
    let width = 0
    let height = 0
    const observer = new ResizeObserver(() => {
      width = wall.clientWidth
      height = wall.clientHeight
    })
    observer.observe(wall)
    slots.forEach(slot => observer.observe(slot))

    function animate(now) {
      const elapsed = previous ? Math.min((now - previous) / 1000, .04) : 0
      previous = now
      const slope = gravity.current
      const bounce = slope ? .36 : 1
      const bounds = slots.map(slot => {
        const tile = slot.firstElementChild
        const angle = parseFloat(slot.style.getPropertyValue('--tilt')) * Math.PI / 180
        const w = tile.offsetWidth
        const h = tile.offsetHeight
        const inset = (slot.offsetWidth - w) / 2
        const skew = Math.sin(angle)
        const rise = w * skew
        const projectedWidth = w * Math.cos(angle)
        return {
          w: slot.offsetWidth, h,
          left: inset + Math.min(0, -h * skew),
          right: inset + projectedWidth + Math.max(0, -h * skew),
          top: Math.min(0, rise),
          bottom: Math.max(0, rise) + h * Math.cos(angle),
        }
      })
      slots.forEach((slot, index) => {
        const tile = slot.firstElementChild
        const box = bounds[index]
        if (!width || !height || !box.h || !slot.classList.contains('ready') || active.current === tile || drag.current?.tile === tile) return
        const minX = -box.left
        const minY = -box.top
        const limitX = Math.max(minX, width - box.right)
        const limitY = Math.max(minY, height - box.bottom)
        let position = motion.current.get(slot)
        if (!position) {
          const angle = Math.random() * Math.PI * 2
          const speed = 50 + Math.random() * 70
          const columns = Math.max(1, Math.round(width / box.w))
          position = {
            x: limitX * ((index % columns + Math.random() * .6) / columns),
            y: limitY * ((Math.floor(index / columns) + Math.random() * .6) / Math.ceil(slots.length / columns)),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
          }
          motion.current.set(slot, position)
        }
        const dx = parseFloat(slot.style.getPropertyValue('--drag-x')) || 0
        const dy = parseFloat(slot.style.getPropertyValue('--drag-y')) || 0
        const paused = preference.matches || (!position.impulse
          && (tile.matches(':focus-visible') || (!slope && tile.matches(':hover'))))
        if (!paused) {
          if (slope) {
            const damping = Math.exp(-elapsed * 1.8)
            position.vx = (position.vx + slope.x * 780 * elapsed) * damping
            position.vy = (position.vy + slope.y * 780 * elapsed) * damping
          }
          position.x += position.vx * elapsed
          position.y += position.vy * elapsed
          if (position.impulse) {
            if (!slope) {
              const damping = Math.exp(-elapsed * 2.2)
              position.vx *= damping
              position.vy *= damping
            }
            if (Math.hypot(position.vx, position.vy) < 80) position.impulse = false
          }
        }
        if (position.x + dx < minX) position.vx = bounce * Math.abs(position.vx)
        if (position.x + dx > limitX) position.vx = -bounce * Math.abs(position.vx)
        if (position.y + dy < minY) position.vy = bounce * Math.abs(position.vy)
        if (position.y + dy > limitY) position.vy = -bounce * Math.abs(position.vy)
        position.x = Math.max(minX, Math.min(limitX, position.x + dx)) - dx
        position.y = Math.max(minY, Math.min(limitY, position.y + dy)) - dy
        slot.style.setProperty('--float-left', `${position.x}px`)
        slot.style.setProperty('--float-top', `${position.y}px`)
      })
      if (!preference.matches) {
        const bodies = slots.flatMap((slot, index) => {
          const body = motion.current.get(slot)
          if (!body || active.current === slot.firstElementChild) return []
          const held = drag.current?.slot === slot ? drag.current : null
          const box = bounds[index]
          return [{
            body, held, box,
            x: body.x + (parseFloat(slot.style.getPropertyValue('--drag-x')) || 0) + (box.left + box.right) / 2,
            y: body.y + (parseFloat(slot.style.getPropertyValue('--drag-y')) || 0) + (box.top + box.bottom) / 2,
          }]
        })
        for (const source of bodies) {
          if (!source.held?.moved && !source.body.impulse) continue
          for (const target of bodies) {
            if (target === source || target.held) continue
            const dx = target.x - source.x
            const dy = target.y - source.y
            const overlapX = ((source.box.right - source.box.left) + (target.box.right - target.box.left)) * .42 - Math.abs(dx)
            const overlapY = ((source.box.bottom - source.box.top) + (target.box.bottom - target.box.top)) * .42 - Math.abs(dy)
            if (overlapX <= 0 || overlapY <= 0) continue
            const horizontal = overlapX < overlapY
            const nx = horizontal ? Math.sign(dx || 1) : 0
            const ny = horizontal ? 0 : Math.sign(dy || 1)
            const sourceVelocity = source.held || source.body
            const approach = (sourceVelocity.vx - target.body.vx) * nx + (sourceVelocity.vy - target.body.vy) * ny
            const push = Math.max(0, approach) * .62
            target.body.x += nx * Math.min(overlapX, 16)
            target.body.y += ny * Math.min(overlapY, 16)
            if (push > 28) {
              target.body.vx += nx * push
              target.body.vy += ny * push
              target.body.impulse = true
              if (!source.held) {
                source.body.vx -= nx * push * .55
                source.body.vy -= ny * push * .55
              }
            }
          }
        }
      }
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [wallRef, motion, active, drag, gravity])
}
