import React from 'react'
import HomeDiagnostics from './HomeDiagnostics.jsx'
import DesktopAtmosphere from './desktopAtmosphere.jsx'
import { mottoFadeDuration, mottoStartDelay, mottoTypingDuration } from '../shared/homeIntroTiming.js'
import { profileRoles as roles } from '../shared/profiles.js'
import './home.css'

const roleMarks = ['camera', 'growth', 'command', 'product']
const motto = ['— To reach the unreachable star', '去摘遥不可及的星']

function MottoLine({ text, lang, typing, onTypingComplete }) {
  const letters = Array.from(text)
  return <span lang={lang}>
    {typing ? <>
      <span className="motto-readable">{text}</span>
      <span aria-hidden="true">{letters.map((letter, index) => (
        <span key={index} className="motto-letter"
          onAnimationEnd={index === letters.length - 1 ? onTypingComplete : undefined}
          style={{
            animationDelay: `${mottoStartDelay + index * mottoTypingDuration / (letters.length - 1)}ms`,
            animationDuration: `${mottoFadeDuration}ms`,
          }}>{letter}</span>
      ))}</span>
    </> : text}
  </span>
}

export default function Home({ typing, onTypingComplete, desktopHud, dayMode }) {
  return (
    <section className="hero scene" id="home" tabIndex={-1}>
      {desktopHud && <DesktopAtmosphere />}
      {desktopHud && <div className="home-hud" aria-hidden="true">
        <i className="home-hud-corner home-hud-corner--tl" />
        <i className="home-hud-corner home-hud-corner--tr" />
        <i className="home-hud-corner home-hud-corner--bl" />
        <i className="home-hud-corner home-hud-corner--br" />
        <div className="home-hud-line" data-depth="0.45"><span>PROFILE</span><i /><span>01 / HOME</span></div>
        <span className="home-hud-footer home-hud-footer--left">© {new Date().getFullYear()} Cchua</span>
        <span className="home-hud-footer home-hud-footer--right">PERSONAL SITE</span>
      </div>}
      {desktopHud && <HomeDiagnostics dayMode={dayMode} />}
      <div className="hero-copy" data-depth="0.32">
        <h1>
          <MottoLine text={motto[0]} lang="en" typing={typing} />
          <MottoLine text={motto[1]} lang="zh-Hans" typing={typing} onTypingComplete={onTypingComplete} />
        </h1>
      </div>
      <ul className="roles" data-depth="0.38" aria-label="专业方向">
        {roles.map((role, index) => <li key={role}>
          <span className={`role-mark role-mark--${roleMarks[index]}`} aria-hidden="true" />{role}
        </li>)}
      </ul>
    </section>
  )
}
