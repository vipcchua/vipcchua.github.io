import { useRef } from 'react'

export function useWallDrag(motion, canStart) {
  const drag = useRef(null)
  const suppressClick = useRef(null)

  function start(event) {
    if (!event.isPrimary || event.button !== 0 || (canStart && !canStart())) return
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

  function move(event) {
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

  function end(event) {
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

  function wasDragged(event) {
    if (suppressClick.current !== event.currentTarget || event.detail === 0) return false
    suppressClick.current = null
    event.preventDefault()
    return true
  }

  return { drag, wasDragged, pointerHandlers: {
    onPointerDown: start, onPointerMove: move, onPointerUp: end,
    onPointerCancel: end, onLostPointerCapture: end,
  } }
}
