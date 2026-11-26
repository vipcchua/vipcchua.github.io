import React, { useEffect, useState } from 'react'

function readDevice() {
  return {
    viewport: `${window.innerWidth} × ${window.innerHeight}`,
    screen: `${window.screen.width} × ${window.screen.height} / ${window.devicePixelRatio.toFixed(2)}×`,
    online: navigator.onLine,
    downlink: navigator.connection?.downlink,
    rtt: navigator.connection?.rtt,
    type: navigator.connection?.effectiveType?.toUpperCase(),
  }
}

export default function HomeDiagnostics() {
  const [device, setDevice] = useState(readDevice)
  const [samples, setSamples] = useState([])
  const [networkHistory, setNetworkHistory] = useState([])

  useEffect(() => {
    let start = null
    let frames = 0
    let frameId
    const refresh = () => {
      const next = readDevice()
      setDevice(next)
      setNetworkHistory(previous => next.online && next.downlink != null
        ? [...previous.slice(-23), next.downlink]
        : [])
    }
    const connection = navigator.connection
    const events = ['resize', 'online', 'offline']
    function measure(now) {
      start ??= now
      const elapsed = now - start
      if (elapsed >= 1000) {
        if (elapsed < 2000 && frames > 2) setSamples(previous => [...previous.slice(-23), frames * 1000 / elapsed])
        start = now
        frames = 0
      }
      frames += 1
      frameId = requestAnimationFrame(measure)
    }
    const syncVisibility = () => {
      cancelAnimationFrame(frameId)
      start = null
      frames = 0
      if (!document.hidden) frameId = requestAnimationFrame(measure)
    }
    syncVisibility()
    refresh()
    const networkTimer = setInterval(() => { if (!document.hidden) refresh() }, 5000)
    document.addEventListener('visibilitychange', syncVisibility)
    events.forEach(event => window.addEventListener(event, refresh))
    connection?.addEventListener('change', refresh)
    return () => {
      cancelAnimationFrame(frameId)
      clearInterval(networkTimer)
      document.removeEventListener('visibilitychange', syncVisibility)
      events.forEach(event => window.removeEventListener(event, refresh))
      connection?.removeEventListener('change', refresh)
    }
  }, [])

  const fps = samples.at(-1)
  function chart(values, minimum) {
    if (!values.length) return null
    const points = values.length < 2 ? [values[0], values[0]] : values
    const ceiling = Math.max(minimum, ...points) * 1.15
    const line = points.map((value, index) => `${index * 100 / (points.length - 1)},${30 - value * 27 / ceiling}`).join(' ')
    return <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={`0,32 ${line} 100,32`} fill="#6de4ff16" />
      <polyline points={line} />
    </svg>
  }
  const browser = /Edg\//.test(navigator.userAgent) ? 'EDGE'
    : /Firefox\//.test(navigator.userAgent) ? 'FIREFOX'
      : /Chrome\//.test(navigator.userAgent) ? 'CHROME' : /Safari\//.test(navigator.userAgent) ? 'SAFARI' : '—'

  return <aside className="home-diagnostics" aria-label="浏览器状态">
    <section className="home-diagnostic home-diagnostic--render">
      <h2>RENDER PERFORMANCE <span>{fps ? 'LIVE' : '—'}</span></h2>
      <dl><div><dt>FPS</dt><dd>{fps ? Math.round(fps) : '—'}</dd></div>
        <div><dt>FRAME</dt><dd>{fps ? `${(1000 / fps).toFixed(1)} MS` : '—'}</dd></div></dl>
      {chart(samples, 60)}
      <div className="home-diagnostic-foot"><span>16.7 MS FRAME BUDGET</span><strong>{fps ? `${Math.round(6000 / fps)}%` : '—'}</strong></div>
    </section>
    <section className="home-diagnostic home-diagnostic--network">
      <h2>NETWORK LINK <span>{device.online ? 'ONLINE' : 'OFFLINE'}</span></h2>
      <dl><div><dt>DOWNLINK EST.</dt><dd>{device.online && device.downlink != null ? `${device.downlink} MBPS` : '—'}</dd></div>
        <div><dt>UPLINK</dt><dd>—</dd></div>
        <div><dt>RTT</dt><dd>{device.online && device.rtt != null ? `${device.rtt} MS` : '—'}</dd></div>
        <div><dt>TYPE</dt><dd>{device.online ? device.type ?? '—' : '—'}</dd></div></dl>
      {chart(networkHistory, 1)}
    </section>
    <section className="home-diagnostic home-diagnostic--device">
      <h2>VISITOR DEVICE <span>LOCAL</span></h2>
      <dl><div><dt>LOGICAL CORES</dt><dd>{navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} THREADS` : '—'}</dd></div>
        <div><dt>DEVICE MEMORY</dt><dd>{navigator.deviceMemory ? `${navigator.deviceMemory} GB` : '—'}</dd></div>
        <div><dt>SCREEN</dt><dd>{device.screen}</dd></div>
        <div><dt>VIEWPORT</dt><dd>{device.viewport}</dd></div>
        <div><dt>BROWSER</dt><dd>{browser}</dd></div>
        <div><dt>PLATFORM</dt><dd>{navigator.userAgentData?.platform || navigator.platform || '—'}</dd></div>
        <div><dt>WEBGPU</dt><dd>{navigator.gpu ? 'AVAILABLE' : '—'}</dd></div></dl>
    </section>
  </aside>
}
