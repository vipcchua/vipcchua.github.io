import React, { useEffect, useLayoutEffect, useRef } from 'react'
import avatar from '../img/head.jpg'
import { profiles, profileRoles } from '../shared/profiles.js'
import './about.css'
import './aboutProfile.css'

const aboutLinks = profiles.filter(([name]) => ['B站', 'X', 'GitHub'].includes(name))

const experience = [
  [2018, '深圳动漫节 · 特约摄影师'],
  [2019, '萤火虫动漫游戏嘉年华 · 特约摄影师', 'Yaca · 特约摄影师', '上海 COMICUP 魔都同人祭'],
  [2020, '萤火虫动漫游戏嘉年华 · 特约摄影师', '上海 COMICUP 魔都同人祭', '中国国际漫画节动漫游戏展', '盛大网络冒险岛'],
  [2021, '上海 ChinaJoy', '上海 Bilibili World', '广州萤火虫动漫游戏嘉年华', '中国国际漫画节动漫游戏展'],
  [2022, '上海 ChinaJoy', '上海 Bilibili World', '广州萤火虫动漫游戏嘉年华', '长隆水上乐园', '中国国际漫画节动漫游戏展'],
  [2023, '上海 ChinaJoy', '上海 Bilibili World', '米哈游 FES', '快看漫画', 'COMICUP 魔都同人祭', '广州萤火虫动漫游戏嘉年华', '中国国际漫画节动漫游戏展'],
  [2024, '上海 ChinaJoy', '广州 FgOFES', '上海 Bilibili World', '上海 · 崩坏星穹铁道', 'COMICUP 魔都同人祭', '广州萤火虫动漫游戏嘉年华', '战双帕弥什', '快看漫画'],
  [2025, '上海 Bilibili World', '萤火虫动漫游戏嘉年华 · 特约摄影师', '碧蓝航线港区盛夏清凉节', '快看漫画', 'ShowUp 茶会'],
]

export default function About({ mobileLayout }) {
  const timeline = useRef(null)
  const entries = [...experience].reverse().map(([year, ...events], index) => <li key={year}
    style={{ '--timeline-order': Math.min(index, 5) }}>
    <h3><time dateTime={String(year)}>{year} 年</time></h3>
    <ul>{events.map(event => <li key={event}>{event}</li>)}</ul>
  </li>)

  useLayoutEffect(() => {
    if (mobileLayout) return
    const list = timeline.current.firstElementChild
    const rows = Array.from(list.children)
    const preference = matchMedia('(prefers-reduced-motion: no-preference)')
    const observer = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue
        target.classList.add('is-visible')
        observer.unobserve(target)
      }
    }, { threshold: .16 })

    function update() {
      observer.disconnect()
      list.classList.toggle('about-timeline--reveal', preference.matches)
      if (preference.matches) rows.filter(row => !row.classList.contains('is-visible')).forEach(row => observer.observe(row))
    }
    update()
    preference.addEventListener('change', update)
    return () => {
      observer.disconnect()
      preference.removeEventListener('change', update)
      list.classList.remove('about-timeline--reveal')
      rows.forEach(row => row.classList.remove('is-visible'))
    }
  }, [mobileLayout])

  useEffect(() => {
    if (!mobileLayout) return
    const area = timeline.current
    const list = area.firstElementChild
    const preference = matchMedia('(prefers-reduced-motion: no-preference)')
    let frame
    let last = 0
    let position = area.scrollTop
    let lastScroll = position
    let touched = false
    let resumeAfter = 0

    function hold() { touched = true }
    function release(event) {
      if (event.touches.length) return
      touched = false
      resumeAfter = performance.now() + 500
    }

    function move(now) {
      const elapsed = last ? Math.min(now - last, 50) : 0
      last = now
      if (area.scrollTop !== lastScroll) position = area.scrollTop
      if (!touched && now >= resumeAfter) {
        position = (position + elapsed * .022) % list.offsetHeight
        area.scrollTop = position
      }
      lastScroll = area.scrollTop
      frame = requestAnimationFrame(move)
    }
    function update() {
      cancelAnimationFrame(frame)
      const enabled = preference.matches && list.offsetHeight > area.clientHeight
      area.classList.toggle('about-scroll--auto', enabled)
      last = 0
      if (enabled) frame = requestAnimationFrame(move)
    }
    const observer = new ResizeObserver(update)
    observer.observe(area)
    observer.observe(list)
    preference.addEventListener('change', update)
    area.addEventListener('touchstart', hold, { passive: true })
    area.addEventListener('touchend', release, { passive: true })
    area.addEventListener('touchcancel', release, { passive: true })
    update()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      area.classList.remove('about-scroll--auto')
      preference.removeEventListener('change', update)
      area.removeEventListener('touchstart', hold)
      area.removeEventListener('touchend', release)
      area.removeEventListener('touchcancel', release)
    }
  }, [mobileLayout])

  return <section className="about-content scene" aria-labelledby="about-title">
    <header className="about-intro">
      <img src={avatar} alt="Cchua 华仔" width="104" height="104" />
      <div className="about-profile-copy">
        <p className="about-profile-kicker" lang="en">PROFILE</p>
        <p className="about-profile-name">Cchua 华仔</p>
        <h2 className="about-role" id="about-title">资深二次元摄影师、摄像师</h2>
        <p className="about-profile-bio">主要负责大型活动中艺人、Coser 和模特的照片与视频拍摄。</p>
        <ul className="about-profile-tags" aria-label="专业方向">
          {profileRoles.map(role => <li key={role}>{role}</li>)}
        </ul>
      </div>
    </header>
    <div className="about-scroll" ref={timeline} role="region" aria-label="按年份浏览拍摄经历" tabIndex={0}>
      <ol className="about-timeline" aria-label="拍摄经历">{entries}</ol>
      <ol className="about-timeline about-timeline-repeat" aria-hidden="true">{entries}</ol>
    </div>
      <div className="about-profile-links">
        <h3>社交链接</h3>
        <ul>
          {aboutLinks.map(([name, account, url]) => <li key={name}>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <span>{name}</span>
              <strong>{account}</strong>
              <span className="about-profile-link-arrow" aria-hidden="true">↗</span>
            </a>
          </li>)}
        </ul>
      </div>
  </section>
}
