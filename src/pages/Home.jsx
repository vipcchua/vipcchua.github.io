import React from 'react'
import { mottoFadeDuration, mottoStartDelay, mottoTypingDuration } from '../shared/homeIntroTiming.js'
import './home.css'

const roles = ['摄影摄像', '账号运营', '程序开发', '产品经理']
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

export default function Home({ typing, onTypingComplete }) {
  return (
    <section className="hero scene" id="home" tabIndex={-1}>
      <div className="hero-copy">
        <h1>
          <MottoLine text={motto[0]} lang="en" typing={typing} />
          <MottoLine text={motto[1]} lang="zh-Hans" typing={typing} onTypingComplete={onTypingComplete} />
        </h1>
      </div>
      <ul className="roles" aria-label="专业方向">
        {roles.map((role, index) => <li key={role}>
          <span className={`role-mark role-mark--${roleMarks[index]}`} aria-hidden="true" />{role}
        </li>)}
      </ul>
    </section>
  )
}
