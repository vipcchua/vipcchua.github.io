import React from 'react'
import { socialMarks } from './profiles.js'

export default function SocialIcon({ name, index }) {
  const { path } = socialMarks[index]

  if (name === 'TikTok') {
    return <svg viewBox="-2 -2 28 28" aria-hidden="true">
      <path d={path} fill="#25f4ee" transform="translate(-1.15 -.9)" />
      <path d={path} fill="#fe2c55" transform="translate(1.15 .9)" />
      <path d={path} fill="currentColor" />
    </svg>
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>
}
