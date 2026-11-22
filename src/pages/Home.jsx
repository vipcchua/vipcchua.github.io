import React from 'react'
import { profiles } from '../shared/profiles.js'
import SocialIcon from '../shared/SocialIcon.jsx'
import './home.css'

const roles = ['摄影摄像', '账号运营', '程序开发', '产品经理']
const roleMarks = ['◉', '↗', '⌘', '◇']

export default function Home() {
  return (
    <section className="hero scene" id="home" tabIndex={-1}>
      <div className="hero-copy">
        <h1>
          <span lang="en">— To reach the unreachable star</span>
          <span>去摘遥不可及的星</span>
        </h1>
      </div>
      <ul className="roles" aria-label="专业方向">
        {roles.map((role, index) => <li key={role}><span aria-hidden="true">{roleMarks[index]}</span>{role}</li>)}
      </ul>
      <ul className="hero-social" aria-label="社交媒体" style={{ '--social-count': profiles.length }}>
        {profiles.map(([name, , url], index) => <li key={name}>
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}>
            <SocialIcon name={name} index={index} />
          </a>
        </li>)}
      </ul>
    </section>
  )
}
