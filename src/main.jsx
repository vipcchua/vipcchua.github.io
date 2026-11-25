import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Photos from './pages/Photos.jsx'
import Videos from './pages/Videos.jsx'
import Social from './pages/Social.jsx'
import SiteNavigation from './shared/SiteNavigation.jsx'
import SiteSettings from './shared/SiteSettings.jsx'
import { useDeviceLayout } from './shared/deviceLayout.js'
import { useUiSound } from './shared/useUiSound.js'
import { useScreenNavigation } from './shared/useScreenNavigation.js'
import './shared/site.css'
import './shared/workCards.css'

const pages = [Home, About, Photos, Videos, Social]

function App() {
  const [mobileSwipe, setMobileSwipe] = useState(false)
  const { ipad, mobileLayout, touchDevice } = useDeviceLayout()
  const { muted, toggleMuted, playClick } = useUiSound(touchDevice)
  const { screen, stage, select, intro, finishTyping } = useScreenNavigation(mobileSwipe, mobileLayout)
  const [showMobilePageNumbers, setShowMobilePageNumbers] = useState(false)
  const Page = pages[screen]
  const pushing = intro === 'push' && screen === 0

  return <div className="site" ref={stage} data-ipad={ipad} data-mobile-layout={mobileLayout} data-mobile-swipe={mobileSwipe}
    data-intro={screen === 0 ? intro : 'idle'} onClick={playClick}>
    <SiteNavigation screen={screen} select={select} showMobilePageNumbers={showMobilePageNumbers} />
    <main>
      {screen === 0 && <Home typing={intro === 'typing' || intro === 'hold'} onTypingComplete={finishTyping} />}
      {(pushing || screen === 1) && <div className="about-frame" key="about" inert={pushing}><About mobileLayout={mobileLayout} /></div>}
      {screen > 1 && <Page mobileLayout={mobileLayout} />}
    </main>
    <SiteSettings showSocial={screen === 0} showSettings={touchDevice}
      showPageNumbers={showMobilePageNumbers} togglePageNumbers={() => setShowMobilePageNumbers(show => !show)}
      mobileSwipe={mobileSwipe} toggleMobileSwipe={() => setMobileSwipe(enabled => !enabled)}
      muted={muted} toggleMuted={toggleMuted} />
    <div className="scene-flash" key={pushing ? 1 : screen} aria-hidden="true" />
  </div>
}

document.title = 'Cchua 华仔｜去摘遥不可及的星'
createRoot(document.getElementById('root')).render(<App />)
