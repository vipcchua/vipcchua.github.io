import React, { useRef, useState } from 'react'
import { useWallDrag } from '../shared/useWallDrag.js'
import { useWallMotion } from '../shared/useWallMotion.js'
import VideoCard from './VideoCard.jsx'
import './videoWall.css'

function placement() {
  return {
    '--video-size': (.88 + Math.random() * .25).toFixed(2),
    '--tilt': `${(Math.random() * 12 - 6).toFixed(1)}deg`,
    '--fly-x': `${(Math.random() * 48 - 24).toFixed(1)}vw`,
    '--fly-y': `${(Math.random() * 30 - 15).toFixed(1)}svh`,
    '--fly-delay': `${Math.round(Math.random() * 260)}ms`,
  }
}

export default function VideoWall({ videos, onSelect, paused }) {
  const wallRef = useRef(null)
  const motion = useRef(new Map())
  const [placements] = useState(() => videos.map(placement))
  const { drag, wasDragged, pointerHandlers } = useWallDrag(motion)
  useWallMotion({ wallRef, motion, drag, paused })

  return <ul className="video-wall" aria-label="漂浮视频" ref={wallRef}>
    {videos.map((video, index) => <li key={video.id} className="video-wall-slot ready" style={placements[index]}>
      <VideoCard className="video-wall-card" video={video} {...pointerHandlers} onClick={event => {
        if (!wasDragged(event)) onSelect(video)
      }} />
    </li>)}
  </ul>
}
