import projectFolders from 'virtual:photo-project-folders'

const wallImages = import.meta.glob('../imgBlog/photoWall/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', {
  eager: true, import: 'default', query: '?url',
})
const projectImages = import.meta.glob('../imgBlog/project/*/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', {
  eager: true, import: 'default', query: '?url',
})
const projectInfo = import.meta.glob('../imgBlog/project/*/projectInfo.json', {
  eager: true, import: 'default',
})

const collator = new Intl.Collator('zh-CN', { numeric: true })
const byPath = ([left], [right]) => collator.compare(left, right)
const textValue = value => typeof value === 'string' ? value.trim() : ''
const projectPrefix = '../imgBlog/project/'

export const wallPhotos = Object.entries(wallImages).sort(byPath).map(([, url]) => url)

const projects = new Map(projectFolders.map(folder => [folder, { folder, images: [] }]))

function projectFromPath(path) {
  const folder = path.slice(projectPrefix.length).split('/')[0]
  if (!projects.has(folder)) projects.set(folder, { folder, images: [] })
  return projects.get(folder)
}

for (const [path, info] of Object.entries(projectInfo)) {
  projectFromPath(path).info = info
}
for (const [path, url] of Object.entries(projectImages).sort(byPath)) {
  const project = projectFromPath(path)
  const file = path.slice(projectPrefix.length + project.folder.length + 1)
  project.images.push({ file, url })
}

export const photoProjects = [...projects.entries()].sort(byPath).map(([folder, { info, images }]) => {
  const coverFile = textValue(info?.indexPhoto)
  const coverIndex = images.findIndex(image => image.file === coverFile)
  const orderedImages = coverIndex > 0
    ? [images[coverIndex], ...images.slice(0, coverIndex), ...images.slice(coverIndex + 1)]
    : images
  return {
    folder,
    images: orderedImages,
    name: textValue(info?.projectName) || folder,
    time: textValue(info?.projectTime),
    ip: textValue(info?.ip),
  }
})
