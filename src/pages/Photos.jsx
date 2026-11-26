import React, { useState } from 'react'
import { photoProjects } from '../data/photoFiles.js'
import ProjectViewer from './ProjectViewer.jsx'
import PhotoWall from './PhotoWall.jsx'
import FilterIcon from '../shared/FilterIcon.jsx'
import HomeDiagnostics from './HomeDiagnostics.jsx'
import { moveWorkCardHighlight } from '../shared/workCardPointer.js'
import './photoGallery.css'

const filterFields = [['ip', 'IP'], ['time', '时间'], ['category', '类别']].map(([field, label]) => ({
  field, label,
  options: [...new Set(photoProjects.map(item => item[field]).filter(Boolean))],
}))

export default function Photos({ playSound, desktopHud, dayMode }) {
  const [showWall, setShowWall] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({})
  const [project, setProject] = useState(null)
  const visibleProjects = photoProjects.filter(item =>
    filterFields.every(({ field }) => !filters[field] || item[field] === filters[field]))

  function switchView() {
    if (showWall) playSound('close')
    setShowWall(!showWall)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const heading = <header className="section-head">
    <h2 id="photos-title">照片</h2>
    <p className="section-caption">作品展示</p>
    <div className="work-filters photo-view-switch">
      <button type="button" data-silent-click={showWall ? '' : undefined} onClick={switchView}>{showWall ? '返回照片列表' : '照片墙'}</button>
      {!showWall && <>
        <button type="button" aria-expanded={showFilters} aria-controls="photo-project-filters"
          className="filter-toggle" aria-label="筛选照片" title="筛选照片"
          onClick={() => setShowFilters(open => !open)}><FilterIcon /></button>
        <div id="photo-project-filters" className="photo-project-filters" hidden={!showFilters}>
          {filterFields.map(({ field, label, options }) => <div className="filter-buttons" role="group" aria-label={label} key={field}>
            <span>{label}</span>
            {['', ...options].map(value => <button type="button" key={value}
              aria-pressed={(filters[field] ?? '') === value}
              onClick={() => setFilters(current => ({ ...current, [field]: value }))}>{value || '全部'}</button>)}
          </div>)}
        </div>
      </>}
    </div>
  </header>

  if (showWall) return <PhotoWall heading={heading} playSound={playSound} />

  return <section className="work-content scene" id="photos" aria-labelledby="photos-title">
    {desktopHud && <HomeDiagnostics dayMode={dayMode} session />}
    {heading}
    {photoProjects.length === 0 && <p role="status">还没有照片项目。</p>}
    {photoProjects.length > 0 && visibleProjects.length === 0 && <p role="status">没有符合条件的照片项目。</p>}
    <ul className="work-grid photo-project-grid" aria-label="照片项目" onPointerMove={moveWorkCardHighlight}>
      {visibleProjects.map((item, index) => <li key={item.folder} style={{ '--card-order': Math.min(index, 7) }}>
        <button type="button" className="work-card" aria-haspopup="dialog" onClick={() => {
          playSound('popup')
          setProject(item)
        }}>
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
    {project && <ProjectViewer project={project} playSound={playSound} onClose={() => setProject(null)} />}
  </section>
}
