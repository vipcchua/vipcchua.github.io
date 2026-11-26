import React, { useEffect, useRef } from 'react'
import background from '../img/bg.jpg'
import './desktopAtmosphere.css'

const particles = Array.from({ length: 15 }, (_, index) => ({
  '--x': `${(index * 37 + 12) % 96}%`,
  '--y': `${(index * 53 + 17) % 94}%`,
  '--size': `${2 + index % 4}px`,
  '--duration': `${6 + index % 7}s`,
  '--phase': `-${index * .61}s`,
}))

let cachedGlass

function loadGlass() {
  cachedGlass ??= new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = Math.round(320 * image.naturalHeight / image.naturalWidth)
      const context = canvas.getContext('2d')
      if (!context) return resolve(null)
      context.filter = 'blur(6px)'
      context.drawImage(image, -12, -12, canvas.width + 24, canvas.height + 24)
      resolve(canvas.toDataURL('image/webp', .74))
    }
    image.onerror = () => resolve(null)
    image.src = background
  })
  return cachedGlass
}

export default function DesktopAtmosphere() {
  const layer = useRef(null)
  useEffect(() => {
    const hero = layer.current.closest('.hero')
    let active = true
    function updateVisibility() {
      hero.dataset.atmospherePaused = String(document.hidden)
    }
    loadGlass().then(image => {
      if (active && image) hero.style.setProperty('--hud-glass-image', `url(${image})`)
    })
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', updateVisibility)
      hero.style.removeProperty('--hud-glass-image')
      delete hero.dataset.atmospherePaused
    }
  }, [])
  return <div className="desktop-atmosphere" ref={layer} aria-hidden="true">
    {particles.map((style, index) => <i className="desktop-atmosphere-particle" key={index} style={style} />)}
  </div>
}
