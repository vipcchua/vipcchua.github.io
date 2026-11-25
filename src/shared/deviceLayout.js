import { useEffect, useState } from 'react'

const narrowQuery = '(max-width: 650px)'

export function useDeviceLayout() {
  const [narrow, setNarrow] = useState(() => matchMedia(narrowQuery).matches)
  const { userAgent, platform, maxTouchPoints } = navigator
  const ipad = /iPad/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
  const touchDevice = ipad || /iPhone|iPod|Android/i.test(userAgent)
    || (narrow && matchMedia('(pointer: coarse)').matches)

  useEffect(() => {
    const media = matchMedia(narrowQuery)
    const update = () => setNarrow(media.matches)
    media.addEventListener('change', update)
    update()
    return () => media.removeEventListener('change', update)
  }, [])

  return { ipad, mobileLayout: narrow || ipad, touchDevice }
}
