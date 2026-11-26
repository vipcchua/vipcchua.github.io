import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Photos from './pages/Photos.jsx'
import Videos from './pages/Videos.jsx'
import Social from './pages/Social.jsx'
import SiteNavigation from './shared/SiteNavigation.jsx'
import SiteSettings from './shared/SiteSettings.jsx'
import { useDeviceLayout } from './shared/deviceLayout.js'
import { useDesktopPointer } from './shared/useDesktopPointer.js'
import { useUiSound } from './shared/useUiSound.js'
import { useScreenNavigation } from './shared/useScreenNavigation.js'
import './shared/site.css'
import './shared/workCards.css'
import './shared/theme.css'
import './shared/desktopHud.css'

const pages = [Home, About, Photos, Videos, Social]

function usePagePreference(key, fallback) {
  const [enabled, setEnabled] = useState(() => {
    try {
      const value = localStorage.getItem(key)
      if (value === '1' || value === '0') return value === '1'
    } catch {}
    return fallback
  })
  useEffect(() => {
    try { localStorage.setItem(key, enabled ? '1' : '0') } catch {}
  }, [key, enabled])
  return [enabled, setEnabled]
}

function App() {
  const { ipad, mobileLayout, touchDevice } = useDeviceLayout()
  const [preferenceScope] = useState(() => touchDevice ? 'mobile' : 'desktop')
  const desktopDefaults = preferenceScope === 'desktop'
  const [mobileSwipe, setMobileSwipe] = usePagePreference(`cchua-${preferenceScope}-scroll-pages`, desktopDefaults)
  const { muted, toggleMuted, playClick, playSound, needsSoundPermission } = useUiSound()
  const { screen, stage, select, intro, finishTyping } = useScreenNavigation(mobileSwipe, mobileLayout, playSound)
  const [showMobilePageNumbers, setShowMobilePageNumbers] = usePagePreference(`cchua-${preferenceScope}-show-page-numbers`, desktopDefaults)
  const [dayMode, setDayMode] = usePagePreference('cchua-day-mode', false)
  const Page = pages[screen]
  const pushing = intro === 'push' && screen === 0
  const desktopHud = preferenceScope === 'desktop' && !mobileLayout
  const desktopPointer = desktopHud && screen <= 1
  useDesktopPointer(stage, desktopPointer)

  return <div className="site" ref={stage} data-ipad={ipad} data-mobile-layout={mobileLayout} data-touch-device={touchDevice} data-mobile-swipe={mobileSwipe}
    data-theme={dayMode ? 'day' : 'night'} data-desktop-pointer={desktopPointer}
    data-intro={screen === 0 ? intro : 'idle'} onClick={playClick}>
    <SiteNavigation screen={screen} select={select} showMobilePageNumbers={showMobilePageNumbers} desktopHud={desktopHud} />
    <main>
      {screen === 0 && <Home typing={intro === 'typing' || intro === 'hold'} onTypingComplete={finishTyping} desktopHud={desktopHud} />}
      {(pushing || screen === 1) && <div className="about-frame" key="about" inert={pushing}><About mobileLayout={mobileLayout} /></div>}
      {screen > 1 && <Page mobileLayout={mobileLayout} playSound={playSound} />}
    </main>
    <SiteSettings showSocial={screen === 0}
      showPageNumbers={showMobilePageNumbers} togglePageNumbers={() => setShowMobilePageNumbers(show => !show)}
      mobileSwipe={mobileSwipe} toggleMobileSwipe={() => setMobileSwipe(enabled => !enabled)}
      muted={muted} toggleMuted={toggleMuted} playSound={playSound}
      dayMode={dayMode} toggleDayMode={() => setDayMode(value => !value)} />
    {needsSoundPermission && <button className="sound-enable" type="button" data-silent-click
      onClick={() => playSound('menu')}>启用音效</button>}
    <div className="scene-flash" key={pushing ? 1 : screen} aria-hidden="true" />
  </div>
}

document.title = 'Cchua 华仔｜去摘遥不可及的星'
createRoot(document.getElementById('root')).render(<App />)
