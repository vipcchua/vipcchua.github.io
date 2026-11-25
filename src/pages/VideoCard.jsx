import React from 'react'
import { siBilibili, siTiktok } from 'simple-icons'

const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai',
})

function durationLabel(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds / 60) % 60
  const parts = hours ? [hours, minutes, seconds % 60] : [minutes, seconds % 60]
  return parts.map(part => String(part).padStart(2, '0')).join(':')
}

function countLabel(count) {
  return count >= 10000 ? `${Math.round(count / 10000)} 万` : count.toLocaleString('zh-CN')
}

export default function VideoCard({ video, className = '', onClick, ...pointerHandlers }) {
  const isDouyin = video.platform === 'douyin'
  const platform = isDouyin ? '抖音' : 'B 站'
  return <button className={`work-card ${className}`} type="button" aria-haspopup="dialog"
    onClick={onClick} {...pointerHandlers}>
    <span className="work-cover">
      {video.cover ? <img src={video.cover} alt="" loading="lazy" draggable={false} referrerPolicy="no-referrer" />
        : <span className="video-cover-fallback"><span className="video-play-mark" aria-hidden="true" />{platform}</span>}
      <span className="video-platform" role="img" aria-label={platform} title={platform}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={isDouyin ? siTiktok.path : siBilibili.path} />
        </svg>
      </span>
      <span className="video-stats">
        {video.views != null && <span>播放 {countLabel(video.views)}</span>}
        {video.likes != null && <span>点赞 {countLabel(video.likes)}</span>}
        {video.favorites != null && <span className="video-favorites">收藏 {countLabel(video.favorites)}</span>}
        {video.duration != null && <span className="video-duration">{durationLabel(video.duration)}</span>}
      </span>
    </span>
    <strong className="work-title">{video.title}</strong>
    <span className="work-byline">
      {video.author && <span>{video.author}</span>}
      {video.publishedAt != null && <time dateTime={new Date(video.publishedAt * 1000).toISOString()}>
        {dateFormat.format(video.publishedAt * 1000)}
      </time>}
    </span>
  </button>
}
