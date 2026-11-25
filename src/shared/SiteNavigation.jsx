import React from 'react'
import avatar from '../img/head.jpg'

const labels = ['首页', '关于', '照片', '视频', '社交']

export default function SiteNavigation({ screen, select, showMobilePageNumbers }) {
  return <>
    <header className="topbar">
      <button onClick={() => select(0)} className="brand"><img src={avatar} alt="" width="36" height="36" />Cchua 华仔</button>
      <nav aria-label="主导航">
        {labels.slice(1).map((label, index) => <button key={label} onClick={() => select(index + 1)}
          aria-current={screen === index + 1 ? 'step' : undefined}>{label}</button>)}
      </nav>
    </header>
    <nav className={showMobilePageNumbers ? 'screen-nav' : 'screen-nav screen-nav--mobile-hidden'}
      aria-label={`当前第 ${screen + 1} 屏，共 ${labels.length} 屏`}>
      {labels.map((label, index) => <button key={label}
        onClick={() => select(index)} aria-current={screen === index ? 'step' : undefined}
        aria-label={`第 ${index + 1} 屏，${label}`} title={label}><span aria-hidden="true">0{index + 1}</span></button>)}
    </nav>
  </>
}
