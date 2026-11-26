import React, { useCallback, useRef, useState } from 'react'
import { useWallRotation } from '../shared/useWallRotation.js'
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
  const canPop = useCallback(index => !paused && drag.current?.slot.dataset.index !== String(index), [drag, paused])
  const { indexes, popped, generations } = useWallRotation(videos.length, canPop)
  useWallMotion({ wallRef, motion, drag, paused })

  return <ul className="video-wall" aria-label="漂浮视频" ref={wallRef}>
    {indexes.map(index => <li key={`${videos[index].id}:${generations[index] ?? 0}`} data-index={index} data-popped={index === popped} inert={index === popped}
      className="video-wall-slot ready" style={placements[index]}>
      <VideoCard className="video-wall-card" video={videos[index]} {...pointerHandlers} onClick={event => {
        if (!wasDragged(event)) onSelect(videos[index])
      }} />
    </li>)}
  </ul>
}
