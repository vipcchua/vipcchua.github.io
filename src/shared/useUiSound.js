import { useCallback, useEffect, useRef, useState } from 'react'
import sounds from '../data/ui-sounds.json'

const muteKey = 'cchua-ui-muted'
const urls = import.meta.glob('../sounds/*.wav', { eager: true, import: 'default', query: '?url' })

function initialMute() {
  try { return localStorage.getItem(muteKey) === '1' } catch { return false }
}

export function useUiSound() {
  const [muted, setMuted] = useState(initialMute)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const mutedRef = useRef(muted)
  const audio = useRef(null)
  const players = useRef(new Map())
  const attempt = useRef(0)

  useEffect(() => () => audio.current?.pause(), [])

  function toggleMuted() {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    if (next) audio.current?.pause()
    try { localStorage.setItem(muteKey, next ? '1' : '0') } catch { /* Keep the in-memory setting. */ }
  }

  const playSound = useCallback(name => {
    const url = urls[`../sounds/${sounds[name]}`]
    if (mutedRef.current || !url) return
    if (!players.current.has(url)) players.current.set(url, new Audio(url))
    const player = players.current.get(url)
    audio.current?.pause()
    audio.current = player
    player.currentTime = 0
    const id = ++attempt.current
    player.play().then(() => {
      if (id === attempt.current) setAudioBlocked(false)
      for (const file of Object.values(sounds)) {
        const source = urls[`../sounds/${file}`]
        if (source && !players.current.has(source)) players.current.set(source, new Audio(source))
      }
    }).catch(error => {
      if (id === attempt.current && error.name === 'NotAllowedError') setAudioBlocked(true)
    })
  }, [])

  function playClick(event) {
    if (!event.isTrusted) return
    const control = event.target.closest('button:enabled, a[href]')
    if (!control || control.matches('[data-silent-click], [aria-haspopup="dialog"]')) return
    if (event.defaultPrevented && control.matches('.photo-tile, .video-wall-card')) return
    playSound('click')
  }

  return { muted, toggleMuted, playClick, playSound, needsSoundPermission: audioBlocked && !muted }
}
