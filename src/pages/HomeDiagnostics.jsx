import React, { useLayoutEffect, useRef } from 'react'
import markup from './referenceHud/windows.html?raw'
import styles from './referenceHud/windows.css?raw'
import sessionMarkup from './referenceHud/session.html?raw'
import sessionStyles from './referenceHud/session.css?raw'
import { startTelemetry } from './referenceHud/telemetry.js'
import { bindHudPointer } from './referenceHud/pointer.js'

export default function HomeDiagnostics({ dayMode, session = false }) {
  const host = useRef(null)
  useLayoutEffect(() => {
    const shadow = host.current.shadowRoot || host.current.attachShadow({ mode: 'open' })
    shadow.innerHTML = '<style>' + styles + (session ? sessionStyles : '') + '</style>' + (session ? sessionMarkup : markup)
    const stopTelemetry = startTelemetry(shadow)
    const stopPointer = session ? null : bindHudPointer(shadow)
    return () => { stopPointer?.(); stopTelemetry() }
  }, [session])
  return <div ref={host} data-theme={dayMode ? 'light' : 'dark'} aria-label="桌面状态面板" />
}
