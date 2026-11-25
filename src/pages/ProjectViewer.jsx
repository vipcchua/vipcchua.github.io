import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDialogExit } from '../shared/useDialogExit.js'
import './projectViewer.css'

const minZoom = .5
const maxZoom = 6
const center = { x: 0, y: 0 }
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export default function ProjectViewer({ project, onClose }) {
  const dialog = useRef(null)
  const stage = useRef(null)
  const activeThumbnail = useRef(null)
  const pointer = useRef(null)
  const [index, setIndex] = useState(0)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [natural, setNatural] = useState(null)
  const [error, setError] = useState(false)
  const [turn, setTurn] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState(center)
  const [panning, setPanning] = useState(false)
  const { closing, requestClose, handleClose } = useDialogExit(dialog, 'viewer-exit', onClose)
  const count = project.images.length
  const photo = project.images[index]
  const quarterTurn = turn % 180 !== 0
  const width = (quarterTurn ? natural?.height : natural?.width) ?? 0
  const height = (quarterTurn ? natural?.width : natural?.height) ?? 0
  const baseScale = natural ? Math.min(size.width / natural.width, size.height / natural.height, 1) : 1
  const fit = natural ? Math.min(size.width / width, size.height / height, 1) : 1
  const scale = fit * zoom
  const panX = Math.max(0, (width * scale - size.width) / 2)
  const panY = Math.max(0, (height * scale - size.height) / 2)
  const x = clamp(offset.x, -panX, panX)
  const y = clamp(offset.y, -panY, panY)

  useLayoutEffect(() => {
    const element = dialog.current
    if (!element.open) element.showModal()
    const area = stage.current
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    resize.observe(area)
    return () => resize.disconnect()
  }, [])

  useEffect(() => {
    activeThumbnail.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [index])

  function fitImage() {
    setZoom(1)
    setOffset(center)
  }

  function select(next) {
    if (next < 0 || next >= count || next === index) return
    pointer.current = null
    setPanning(false)
    setNatural(null)
    setError(false)
    setTurn(0)
    fitImage()
    setIndex(next)
  }

  function scaleBy(factor) {
    if (natural) setZoom(current => clamp(current * factor, minZoom, maxZoom))
  }

  function onKeyDown(event) {
    if (closing || event.ctrlKey || event.metaKey || event.altKey) return
    const controls = {
      ArrowLeft: () => select(index - 1),
      ArrowRight: () => select(index + 1),
      '+': () => scaleBy(1.25),
      '-': () => scaleBy(.8),
      '0': fitImage,
    }
    if (!Object.hasOwn(controls, event.key)) return
    event.preventDefault()
    controls[event.key]()
  }

  function onPointerDown(event) {
    if (!event.isPrimary || event.button !== 0) return
    const canPan = panX > 0 || panY > 0
    if (!canPan && event.pointerType !== 'touch') return
    pointer.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x, y, canPan }
    if (canPan) setPanning(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event) {
    const drag = pointer.current
    if (drag?.id !== event.pointerId || !drag.canPan) return
    setOffset({
      x: clamp(drag.x + event.clientX - drag.startX, -panX, panX),
      y: clamp(drag.y + event.clientY - drag.startY, -panY, panY),
    })
  }

  function onPointerEnd(event) {
    const drag = pointer.current
    if (drag?.id !== event.pointerId) return
    pointer.current = null
    setPanning(false)
    if (drag.canPan || event.type !== 'pointerup') return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.abs(dx) > Math.max(45, Math.abs(dy))) select(index - Math.sign(dx))
  }

  return <dialog className="project-viewer" ref={dialog} aria-labelledby="project-viewer-title" data-closing={closing}
    onClose={handleClose} onCancel={requestClose} onKeyDown={onKeyDown}>
    <div className="project-viewer-layout">
      <header className="project-viewer-header">
        <button type="button" className="viewer-back viewer-icon-button" aria-label="返回" title="返回"
          autoFocus onClick={requestClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7 7-7-7 7-7" /></svg>
        </button>
        <div className="viewer-project-heading">
          <h2 id="project-viewer-title" title={project.name}>{project.name}</h2>
          {project.time && <p className="viewer-project-time">{project.time}</p>}
        </div>
        {photo && <div className="viewer-tools" role="group" aria-label="照片工具">
          <button type="button" className="viewer-icon-button" aria-label="旋转" title="旋转"
            disabled={!natural} onClick={() => {
              setTurn(current => current + 90)
              setOffset(center)
            }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2 6m2-11v5h-5" /></svg>
          </button>
          <div className="viewer-zoom" role="group" aria-label="缩放">
            <button type="button" aria-label="缩小" title="缩小"
              disabled={!natural || zoom <= minZoom} onClick={() => scaleBy(.8)}>−</button>
            <output aria-label="缩放比例">{natural ? `${Math.max(1, Math.round(scale * 100))}%` : '—'}</output>
            <button type="button" aria-label="放大" title="放大"
              disabled={!natural || zoom >= maxZoom} onClick={() => scaleBy(1.25)}>+</button>
          </div>
          <button type="button" className="viewer-icon-button" aria-label="适应屏幕" title="适应屏幕"
            disabled={!natural} onClick={fitImage}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" />
              <rect x="8" y="9" width="8" height="6" rx="1" />
            </svg>
          </button>
        </div>}
      </header>
      <div className="viewer-image-area">
        <div className="viewer-stage" ref={stage} data-pannable={panX > 0 || panY > 0} data-panning={panning}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd} onLostPointerCapture={onPointerEnd}
          onWheel={event => {
            if (!event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
              scaleBy(Math.exp(-event.deltaY * .002))
            }
          }}>
          {photo && !error && <img key={photo.file} src={photo.url} draggable={false} data-ready={Boolean(natural)}
            alt={`${project.name}，第 ${index + 1} 张照片`}
            onLoad={event => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            onError={() => setError(true)}
            style={natural ? {
              width: natural.width * baseScale,
              height: natural.height * baseScale,
              transform: `translate(${x}px, ${y}px) rotate(${turn}deg) scale(${baseScale ? scale / baseScale : 1})`,
            } : { visibility: 'hidden' }} />}
          {!photo && <p>这个项目还没有照片。</p>}
          {photo && !natural && !error && <p role="status">正在加载照片…</p>}
          {error && <p role="status">这张照片未能加载。</p>}
        </div>
        {count > 1 && <>
          <button type="button" className="viewer-arrow viewer-previous" aria-label="上一张"
            disabled={index === 0} onClick={() => select(index - 1)}>‹</button>
          <button type="button" className="viewer-arrow viewer-next" aria-label="下一张"
            disabled={index === count - 1} onClick={() => select(index + 1)}>›</button>
        </>}
      </div>
      {count > 0 && <footer className="viewer-footer">
        <div className="viewer-thumbnails" role="group" aria-label="项目照片缩略图">
          {project.images.map((image, position) => <button key={image.file} type="button"
            ref={position === index ? activeThumbnail : undefined}
            aria-label={`查看第 ${position + 1} 张照片`} aria-current={position === index ? 'true' : undefined}
            onClick={() => select(position)}>
            <img src={image.url} loading="lazy" decoding="async" alt="" />
          </button>)}
        </div>
        <span className="viewer-count" aria-live="polite">{index + 1} / {count}</span>
      </footer>}
    </div>
  </dialog>
}
