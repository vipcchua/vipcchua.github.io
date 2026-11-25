import React from 'react'
import { profiles } from '../shared/profiles.js'
import SocialIcon from '../shared/SocialIcon.jsx'
import './social.css'

export default function Social() {
  return (
    <section className="social-content scene" id="social" tabIndex={-1} aria-labelledby="social-title">
      <header className="section-head"><h2 id="social-title">社交主页</h2></header>
      <ul className="profile-grid">
        {profiles.map(([name, account, url], index) => <li key={name}>
          <a className="profile" href={url} target="_blank" rel="noopener noreferrer">
            <SocialIcon name={name} index={index} />
            <div><strong>{name}</strong><span>{account}</span></div>
          </a>
        </li>)}
      </ul>
      <footer>
        <p lang="en">To reach the unreachable star</p>
      </footer>
    </section>
  )
}
