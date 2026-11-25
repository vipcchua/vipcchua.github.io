import { useEffect, useRef, useState } from 'react'

const muteKey = 'cchua-ui-muted'
const tones = [
  { frequency: 740, endFrequency: 990, volume: .115, delay: 0, duration: .082 },
  { frequency: 1175, endFrequency: 1520, volume: .055, delay: .024, duration: .105 },
]

function initialMute() {
  try {
    return localStorage.getItem(muteKey) === '1'
  } catch {
    return false
  }
}

function playTones({ context, output }) {
  const now = context.currentTime
  for (const { frequency, endFrequency, volume, delay, duration } of tones) {
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const start = now + delay
    oscillator.frequency.setValueAtTime(frequency, start)
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration)
    envelope.gain.setValueAtTime(.0001, start)
    envelope.gain.linearRampToValueAtTime(volume, start + .008)
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration)
    oscillator.connect(envelope).connect(output)
    oscillator.start(start)
    oscillator.stop(start + duration)
    oscillator.onended = () => {
      oscillator.disconnect()
      envelope.disconnect()
    }
  }
}

export function useUiSound(enabled) {
  const [muted, setMuted] = useState(initialMute)
  const mutedRef = useRef(muted)
  const audio = useRef(null)

  useEffect(() => () => {
    audio.current?.context.close().catch(() => {})
    audio.current = null
  }, [])

  function toggleMuted() {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    const sound = audio.current
    if (sound) sound.output.gain.setValueAtTime(next ? 0 : 1, sound.context.currentTime)
    try {
      localStorage.setItem(muteKey, next ? '1' : '0')
    } catch {
      // The current session remains usable when storage is blocked.
    }
  }

  async function playClick(event) {
    if (!enabled || mutedRef.current || !event.isTrusted) return
    const control = event.target.closest('button:enabled, a[href]')
    if (!control || control.hasAttribute('data-silent-click')) return
    if (event.defaultPrevented && control.matches('.photo-tile, .video-wall-card')) return
    const AudioContext = window.AudioContext ?? window.webkitAudioContext
    if (!AudioContext) return

    try {
      if (!audio.current) {
        const context = new AudioContext()
        const output = context.createGain()
        output.connect(context.destination)
        audio.current = { context, output }
      }
      const sound = audio.current
      if (sound.context.state !== 'running') await sound.context.resume()
      if (!mutedRef.current && sound === audio.current) playTones(sound)
    } catch {
      // Audio output is optional.
    }
  }

  return { muted, toggleMuted, playClick }
}
