import React from 'react'
import avatar from '../img/head.jpg'

export default function SiteNavigation({ screen, select }) {
  return <>
    <header className="topbar">
      <button onClick={() => select(0)} className="brand"><img src={avatar} alt="" width="36" height="36" />Cchua 华仔</button>
      <nav aria-label="主导航">
        <button onClick={() => select(1)} aria-current={screen === 1 ? 'step' : undefined}>照片</button>
        <button onClick={() => select(2)} aria-current={screen === 2 ? 'step' : undefined}>社交</button>
      </nav>
    </header>
    <nav className="screen-nav" aria-label={`当前第 ${screen + 1} 屏，共 3 屏`}>
      {['首页', '照片', '社交主页'].map((label, index) => <button key={label}
        onClick={() => select(index)} aria-current={screen === index ? 'step' : undefined}
        aria-label={`第 ${index + 1} 屏，${label}`} title={label}><span aria-hidden="true">0{index + 1}</span></button>)}
    </nav>
  </>
}
