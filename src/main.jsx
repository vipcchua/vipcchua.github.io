import React from 'react'
import { createRoot } from 'react-dom/client'
import Home from './pages/Home.jsx'
import Photos from './pages/Photos.jsx'
import Social from './pages/Social.jsx'
import SiteNavigation from './shared/SiteNavigation.jsx'
import { useScreenNavigation } from './shared/useScreenNavigation.js'
import './shared/site.css'

const pages = [Home, Photos, Social]

function App() {
  const { screen, stage, select } = useScreenNavigation()
  const Page = pages[screen]

  return <div className="site" ref={stage}>
    <SiteNavigation screen={screen} select={select} />
    <main><Page /></main>
    <div className="scene-flash" key={screen} aria-hidden="true" />
  </div>
}

document.title = 'Cchua 华仔｜去摘遥不可及的星'
createRoot(document.getElementById('root')).render(<App />)
