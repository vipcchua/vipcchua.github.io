import React, { useEffect, useRef, useState } from 'react'
import videos from '../data/videos.json'
import { useDialogExit } from '../shared/useDialogExit.js'
import VideoCard from './VideoCard.jsx'
import VideoWall from './VideoWall.jsx'
import './videos.css'

const filters = [
  ['all', '全部'],
  ['bilibili', 'B 站'],
  ['douyin', '抖音'],
]
const portraitQuery = '(orientation: portrait)'

export default function Videos({ mobileLayout }) {
  const dialog = useRef(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const { closing, requestClose, handleClose } = useDialogExit(dialog, 'video-player-exit', () => setSelectedVideo(null))
  const [platformFilter, setPlatformFilter] = useState('all')
  const [showWall, setShowWall] = useState(false)
  const [portrait, setPortrait] = useState(() => matchMedia(portraitQuery).matches)
  const mobilePortrait = mobileLayout && portrait
  const visibleVideos = platformFilter === 'all'
    ? videos
    : videos.filter(video => (video.platform ?? 'bilibili') === platformFilter)
  const isDouyin = selectedVideo?.platform === 'douyin'
  const originalLabel = isDouyin ? '在抖音打开原视频' : '在 B 站打开原视频'

  useEffect(() => {
    if (selectedVideo && !dialog.current.open) dialog.current.showModal()
  }, [selectedVideo])

  useEffect(() => {
    if (!isDouyin) return
    const panel = dialog.current
    // The Douyin iframe switches to a tall layout at narrow widths.
    // Scale its desktop layout as a unit to keep the controls in view.
    const updateScale = () => {
      const width = parseFloat(getComputedStyle(panel).getPropertyValue('--douyin-content-width'))
      panel.style.setProperty('--player-scale', panel.clientWidth / width)
    }
    updateScale()
    const orientation = matchMedia(portraitQuery)
    const changeLayout = () => {
      setPortrait(orientation.matches)
      updateScale()
    }
    changeLayout()
    orientation.addEventListener('change', changeLayout)
    const observer = new ResizeObserver(() => {
      if (panel.open) updateScale()
    })
    observer.observe(panel)
    return () => {
      observer.disconnect()
      orientation.removeEventListener('change', changeLayout)
      panel.style.removeProperty('--player-scale')
    }
  }, [isDouyin, mobileLayout])

  return <section className={`work-content scene${showWall ? ' video-wall-scene' : ''}`} aria-labelledby="videos-title">
    <header className="section-head">
      <h2 id="videos-title">视频</h2>
      <p className="section-caption">作品展示</p>
    </header>
    <div className="work-filters" role="group" aria-label="视频展示与平台筛选">
      <button type="button" onClick={() => {
        setShowWall(!showWall)
        window.scrollTo({ top: 0, behavior: 'instant' })
      }}>{showWall ? '返回视频列表' : '视频墙'}</button>
      {filters.map(([value, label]) => <button key={value} type="button"
        aria-pressed={platformFilter === value} onClick={() => setPlatformFilter(value)}>{label}</button>)}
    </div>
    {visibleVideos.length === 0 && <p className="video-empty" role="status">这个平台还没有视频。</p>}
    {showWall
      ? <VideoWall key={platformFilter} videos={visibleVideos} onSelect={setSelectedVideo} paused={Boolean(selectedVideo)} />
      : <ul className="work-grid" key={platformFilter}>
        {visibleVideos.map((video, index) => <li key={video.id} style={{ '--card-order': Math.min(index, 7) }}>
          <VideoCard video={video} onClick={() => setSelectedVideo(video)} />
        </li>)}
      </ul>}
    <dialog className="video-player" data-platform={selectedVideo?.platform} data-closing={closing} style={{
      '--player-ratio': 16 / 9,
      '--player-controls': isDouyin ? '36px' : '0px',
    }}
      ref={dialog} aria-labelledby="video-player-title"
      onClose={handleClose} onCancel={requestClose} onClick={event => {
        if (event.target === dialog.current) requestClose(event)
      }}>
      {selectedVideo && <>
        <header className="video-player-header">
          <div className="video-player-heading">
            <h2 id="video-player-title">{selectedVideo.title}</h2>
            <a className="video-player-icon" href={selectedVideo.url} target="_blank" rel="noopener noreferrer"
              aria-label={originalLabel} title={originalLabel}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M14 4h6v6m0-6-9 9m-1-8H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-5" />
              </svg>
            </a>
          </div>
          <button className="video-player-icon" type="button" autoFocus onClick={requestClose}
            aria-label="关闭播放器" title="关闭播放器">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className={isDouyin ? 'video-frame video-frame--douyin' : 'video-frame'}>
        <iframe
          key={isDouyin && mobilePortrait ? 'mobile' : 'desktop'}
          title={selectedVideo.title}
          src={isDouyin
            ? `https://open.douyin.com/player/video?vid=${encodeURIComponent(selectedVideo.id)}&autoplay=0`
            : `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(selectedVideo.id)}&p=1&autoplay=0`}
          allowFullScreen
        />
        </div>
      </>}
    </dialog>
  </section>
}
