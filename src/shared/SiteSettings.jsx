import React, { useEffect, useRef } from 'react'
import { profiles } from './profiles.js'
import SocialIcon from './SocialIcon.jsx'
import './siteSettings.css'

export default function SiteSettings({
  showSocial, showPageNumbers, togglePageNumbers, mobileSwipe, toggleMobileSwipe, muted, toggleMuted, playSound, dayMode, toggleDayMode,
}) {
  const socialPanel = useRef(null)
  const socialTrigger = useRef(null)
  const closeTimer = useRef(null)

  useEffect(() => {
    if (!showSocial) return
    function dismiss(event) {
      if (socialPanel.current?.matches(':popover-open')
        && !socialPanel.current.contains(event.target) && !socialTrigger.current.contains(event.target)) {
        socialTrigger.current.click()
      }
    }
    document.addEventListener('pointerdown', dismiss)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      clearTimeout(closeTimer.current)
    }
  }, [showSocial])

  function toggleSocial() {
    const panel = socialPanel.current
    if (!panel.matches(':popover-open')) {
      document.querySelector('.site-settings-panel:popover-open')?.hidePopover()
      panel.showPopover()
      socialTrigger.current.setAttribute('aria-expanded', 'true')
      playSound('socialOpen')
      return
    }
    if (panel.dataset.closing) return
    playSound('close')
    socialTrigger.current.setAttribute('aria-expanded', 'false')
    const finish = () => {
      panel.hidePopover()
      delete panel.dataset.closing
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish()
    else {
      panel.dataset.closing = 'true'
      closeTimer.current = setTimeout(finish, 520)
    }
  }
  const settings = [
    ['白天模式', dayMode ? 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z' : 'M20 15a8.4 8.4 0 0 1-11-11 8.5 8.5 0 1 0 11 11Z', dayMode, toggleDayMode],
    ['显示页码', 'M9 4 7 20m10-16-2 16M4 9h16M3 15h16', showPageNumbers, togglePageNumbers],
    ['上下滚动切页', 'M8 18V6m-3 3 3-3 3 3m5-3v12m-3-3 3 3 3-3', mobileSwipe, toggleMobileSwipe],
    ['静音', `M4 9v6h4l5 4V5L8 9z ${muted ? 'm12 1 4 4m0-4-4 4' : 'm12 0a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10'}`, muted, toggleMuted],
  ]
  return <div className="site-settings">
    {showSocial && <div className="dock-item">
      <button type="button" className="dock-trigger dock-social-trigger dock-button" ref={socialTrigger}
        aria-controls="site-social-panel" aria-expanded="false" onClick={toggleSocial}
        aria-label="社交平台" title="社交平台" data-silent-click>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2m1-14a3 3 0 0 1 0 6m2 2a4 4 0 0 1 3 4v2" />
        </svg>
      </button>
      <section id="site-social-panel" className="site-social-panel" popover="manual" ref={socialPanel} aria-label="社交平台">
        <ul>
          {profiles.map(([name, , url], index) => {
            const angle = Math.PI * index / Math.max(1, profiles.length - 1)
            const style = {
              '--arc-x': `${50 - 50 * Math.cos(angle)}%`,
              '--arc-y': `${(1 - Math.sin(angle)) * 100}%`,
              '--dock-order': profiles.length - index - 1,
              '--dock-return-order': index,
            }
            return <li key={name} style={style}>
              <a className="dock-button" href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}>
                <SocialIcon name={name} index={index} />
              </a>
            </li>
          })}
        </ul>
      </section>
    </div>}
    <div className="dock-item">
      <button type="button" className="dock-trigger dock-settings-trigger dock-button" popoverTarget="site-settings-panel"
        aria-label="设置" title="设置" data-silent-click>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 3h4l.5 2.4 1.6.9 2.3-.8 2 3.5-1.8 1.6v1.8l1.8 1.6-2 3.5-2.3-.8-1.6.9L14 20h-4l-.5-2.4-1.6-.9-2.3.8-2-3.5 1.8-1.6v-1.8L3.6 9l2-3.5 2.3.8 1.6-.9z" transform="translate(0 .5)" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      <section id="site-settings-panel" className="site-settings-panel" popover="auto" aria-label="设置"
        onBeforeToggle={event => playSound(event.newState === 'open' ? 'popup' : 'close')}>
        {settings.map(([label, path, enabled, toggle], index) => <button type="button" className="dock-button site-setting"
          key={label} role="switch" aria-checked={enabled} aria-label={label} title={label}
          data-silent-click={toggle === toggleMuted ? '' : undefined}
          style={{ '--dock-order': settings.length - index - 1 }} onClick={toggle}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>
        </button>)}
      </section>
    </div>
  </div>
}
