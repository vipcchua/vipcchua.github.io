import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { basename, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { copySiteFiles } from './copy-site-files.mjs'

const project = fileURLToPath(new URL('../', import.meta.url))
const photoDirectory = join(project, 'src', 'imgBlog')
const limit = 25 * 1024 * 1024
const staging = mkdtempSync(join(project, '.photo-update-'))

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: project, stdio: 'inherit', ...options })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Command failed with exit code ${result.status}`)
}

try {
  copySiteFiles(join(project, 'index.html'), join(staging, 'index.html'))
  copySiteFiles(join(project, 'vite.config.js'), join(staging, 'vite.config.js'))
  const publicDirectory = join(project, 'public')
  if (existsSync(publicDirectory)) copySiteFiles(publicDirectory, join(staging, 'public'))
  copySiteFiles(join(project, 'src'), join(staging, 'src'), (source, info) => {
      if (!source.startsWith(photoDirectory + sep)) return true
      if (!info.isFile() || info.size <= limit) return true
      console.log(`Skipped: ${basename(source)} (${(info.size / 1024 ** 2).toFixed(1)} MiB)`)
      return false
  })
  const relativeStage = basename(staging)
  run(process.execPath, ['node_modules/vite/bin/vite.js', 'build', relativeStage])

  if (!process.argv.includes('--build-only')) {
    run(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'pages', 'deploy',
      `${relativeStage}/dist`, '--project-name', 'cchua', '--branch', 'main'])
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  rmSync(staging, { recursive: true, force: true })
}
