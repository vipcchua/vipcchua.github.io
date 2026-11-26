import React, { useEffect, useState } from 'react'
import avatar from '../img/head.jpg'

const labels = ['首页', '关于', '照片', '视频', '社交']
const clockFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit' })
const dateFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', month: 'short', day: 'numeric' })

function SiteClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  const time = clockFormat.format(now)
  const [hour, minute] = time.split(':').map(Number)
  return <time className="desktop-hud-clock" dateTime={now.toISOString()}>
    <span className="desktop-hud-dial" aria-hidden="true"
      style={{ '--hour-hand': `${hour * 30 + minute / 2}deg`, '--minute-hand': `${minute * 6}deg` }} />
    <span><strong>{time}</strong><small>{dateFormat.format(now)}</small></span>
  </time>
}

export default function SiteNavigation({ screen, select, showMobilePageNumbers, desktopHud }) {
  return <>
    <header className={desktopHud ? 'topbar topbar--desktop-hud' : 'topbar'}>
      {desktopHud && <SiteClock />}
      <button onClick={() => select(0)} className="brand" aria-label="Cchua 华仔，首页">
        <img src={avatar} alt="" width="36" height="36" />Cchua 华仔
      </button>
      <div className="topbar-center">
        <nav aria-label="主导航">
        {labels.slice(1).map((label, index) => <button key={label} onClick={() => select(index + 1)}
          aria-current={screen === index + 1 ? 'step' : undefined}>{label}</button>)}
        </nav>
      </div>
    </header>
    {desktopHud && <footer className="desktop-hud-caption" lang="en">CCHUA // PERSONAL SITE</footer>}
    <nav className="screen-nav" hidden={!showMobilePageNumbers}
      aria-label={`当前第 ${screen + 1} 屏，共 ${labels.length} 屏`}>
      {labels.map((label, index) => <button key={label}
        onClick={() => select(index)} aria-current={screen === index ? 'step' : undefined}
        aria-label={`第 ${index + 1} 屏，${label}`} title={label}><span aria-hidden="true">0{index + 1}</span></button>)}
    </nav>
  </>
}
