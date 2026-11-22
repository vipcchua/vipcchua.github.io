import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'

const step = Math.PI / 8

function texture(width, height, paint) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  paint(canvas.getContext('2d'), width, height)
  const result = new THREE.CanvasTexture(canvas)
  result.colorSpace = THREE.SRGBColorSpace
  return result
}

function artwork([title, subtitle, color], index) {
  return texture(512, 640, (ctx, width, height) => {
    ctx.fillStyle = '#fff7e7'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = color
    ctx.fillRect(24, 24, 464, 457)
    ctx.save()
    ctx.translate(260, 246)
    ctx.rotate(index * .45 - .35)
    for (let ring = 0; ring < 11; ring++) {
      ctx.beginPath()
      ctx.ellipse(0, 0, 38 + ring * 13, 76 + ring * 10, 0, 0, Math.PI * 2)
      ctx.strokeStyle = ring % 2 ? '#fff5d9' : '#422f46'
      ctx.lineWidth = ring % 2 ? 5 : 2
      ctx.stroke()
    }
    ctx.restore()
    ctx.fillStyle = '#422f46'
    ctx.font = '600 48px sans-serif'
    ctx.fillText(title, 30, 550)
    ctx.font = '25px Georgia'
    ctx.fillText(subtitle, 32, 595)
  })
}

export default forwardRef(function Gallery({ exhibits, onSelect, onUnavailable }, ref) {
  const host = useRef(null)
  const callbacks = useRef({ onSelect, onUnavailable })
  callbacks.current = { onSelect, onUnavailable }
  const target = useRef(.26)
  useImperativeHandle(ref, () => ({ step: direction => { target.current -= direction * step } }), [])

  useEffect(() => {
    const element = host.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch {
      callbacks.current.onUnavailable()
      return
    }
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f8e9d6')
    scene.fog = new THREE.Fog('#f8e9d6', 10, 35)
    const camera = new THREE.PerspectiveCamera(58, 1, .05, 55)
    const canvas = renderer.domElement
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    element.append(canvas)

    function mesh(geometry, options) {
      const object = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(options))
      scene.add(object)
      return object
    }

    function wall(radius, side, colors) {
      const map = texture(4, 256, (ctx, width, height) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1), color))
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      })
      mesh(new THREE.CylinderGeometry(radius, radius, 5.2, 96, 1, true), { side, map }).position.y = 2.6
    }
    wall(15, THREE.BackSide, ['#e9ccb1', '#fff2de', '#fff2de', '#dfbd9c'])
    wall(9.8, THREE.FrontSide, ['#e5c1aa', '#ffefdb', '#fff6e6', '#e8c7a4'])
    const floor = mesh(new THREE.CircleGeometry(15, 96), { color: '#e2c4a7' })
    floor.rotation.x = -Math.PI / 2
    const ceiling = mesh(new THREE.CircleGeometry(15, 96), { color: '#f3dfcc' })
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = 5.2

    const maps = exhibits.map(artwork)
    const frames = []
    for (const outer of [true, false]) {
      for (let slot = 0; slot < 16; slot++) {
        const index = (slot + (outer ? 0 : 2)) % exhibits.length
        const angle = slot * step + (outer ? 0 : step / 2)
        const radius = outer ? 14.91 : 9.89
        const frame = mesh(new THREE.BoxGeometry(1.78, 2.18, .10), { color: '#946b56' })
        frame.position.set(radius * Math.cos(angle), 2.05, radius * Math.sin(angle))
        const facing = outer ? 0 : radius * 2
        frame.lookAt(facing * Math.cos(angle), 2.05, facing * Math.sin(angle))
        const art = new THREE.Mesh(new THREE.PlaneGeometry(1.63, 2.03), new THREE.MeshBasicMaterial({ map: maps[index] }))
        art.position.z = .052
        art.userData.index = index
        frame.add(art)
        frames.push(art)
      }
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ray = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let angle = target.current + (reduced.matches ? 0 : .18)
    let last = performance.now()
    let pointerStart = null
    let animation
    function resize() {
      const { clientWidth: width, clientHeight: height } = element
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.fov = width < height ? 68 : 58
      camera.updateProjectionMatrix()
    }
    function draw(now) {
      angle += (target.current - angle) * (reduced.matches ? 1 : 1 - Math.exp(-(now - last) / 260))
      last = now
      const x = Math.cos(angle)
      const z = Math.sin(angle)
      camera.position.set(12.4 * x, 1.82, 12.4 * z)
      camera.lookAt(camera.position.x + z - .32 * x, 1.72, camera.position.z - x - .32 * z)
      renderer.render(scene, camera)
      animation = requestAnimationFrame(draw)
    }
    function wheel(event) {
      event.preventDefault()
      target.current -= event.deltaY * (event.deltaMode === 1 ? .04 : .0015)
    }
    function start(event) {
      if (!event.isPrimary || event.button !== 0) return
      pointerStart = { x: event.clientX, y: event.clientY, angle: target.current, dragged: false }
      canvas.setPointerCapture(event.pointerId)
    }
    function move(event) {
      if (!event.isPrimary || !pointerStart) return
      const dx = event.clientX - pointerStart.x
      const dy = event.clientY - pointerStart.y
      if (Math.hypot(dx, dy) > 6) pointerStart.dragged = true
      if (pointerStart.dragged) target.current = pointerStart.angle + (Math.abs(dx) > Math.abs(dy) ? dx : dy) * .004
    }
    function end(event) {
      if (!event.isPrimary || !pointerStart) return
      const { dragged } = pointerStart
      pointerStart = null
      if (dragged || event.type !== 'pointerup') return
      const bounds = canvas.getBoundingClientRect()
      pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2)
      ray.setFromCamera(pointer, camera)
      const hit = ray.intersectObjects(frames)[0]
      if (hit) callbacks.current.onSelect(hit.object.userData.index)
    }

    const events = { wheel, pointerdown: start, pointermove: move, pointerup: end, pointercancel: end, webglcontextlost: () => callbacks.current.onUnavailable() }
    for (const [event, handler] of Object.entries(events)) canvas.addEventListener(event, handler, { passive: false })
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    animation = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animation)
      observer.disconnect()
      for (const [event, handler] of Object.entries(events)) canvas.removeEventListener(event, handler)
      const textures = new Set()
      scene.traverse(object => {
        object.geometry?.dispose()
        if (object.material?.map) textures.add(object.material.map)
        object.material?.dispose()
      })
      textures.forEach(map => map.dispose())
      renderer.dispose()
      canvas.remove()
    }
  }, [exhibits])

  return <div className="gallery" ref={host} aria-hidden="true" />
})
