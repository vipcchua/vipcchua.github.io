import React, { useState } from 'react'
import { photoProjects } from '../data/photoFiles.js'
import ProjectViewer from './ProjectViewer.jsx'
import PhotoWall from './PhotoWall.jsx'
import './photoGallery.css'

export default function Photos() {
  const [showWall, setShowWall] = useState(false)
  const [project, setProject] = useState(null)

  function switchView() {
    setShowWall(!showWall)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const heading = <header className="section-head">
    <h2 id="photos-title">照片</h2>
    <p className="section-caption">作品展示</p>
    <div className="work-filters photo-view-switch">
      <button type="button" onClick={switchView}>{showWall ? '返回照片列表' : '照片墙'}</button>
    </div>
  </header>

  if (showWall) return <PhotoWall heading={heading} />

  return <section className="work-content scene" id="photos" aria-labelledby="photos-title">
    {heading}
    {photoProjects.length === 0 && <p role="status">还没有照片项目。</p>}
    <ul className="work-grid photo-project-grid" aria-label="照片项目">
      {photoProjects.map((item, index) => <li key={item.folder} style={{ '--card-order': Math.min(index, 7) }}>
        <button type="button" className="work-card" aria-haspopup="dialog" onClick={() => setProject(item)}>
          <span className="work-cover">
            {item.images.length
              ? <img src={item.images[0].url} alt="" loading="lazy" decoding="async" />
              : <span className="photo-cover-placeholder">暂无照片</span>}
          </span>
          <strong className="work-title" title={item.name}>{item.name}</strong>
          <span className="work-byline">
            {item.time && <span className="photo-project-time" title={item.time}>{item.time}</span>}
            {item.ip && <span className="photo-project-ip" title={item.ip}>{item.ip}</span>}
          </span>
        </button>
      </li>)}
    </ul>
    {project && <ProjectViewer project={project} onClose={() => setProject(null)} />}
  </section>
}
