import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { basename, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  cpSync(join(project, 'index.html'), join(staging, 'index.html'))
  cpSync(join(project, 'vite.config.js'), join(staging, 'vite.config.js'))
  const publicDirectory = join(project, 'public')
  if (existsSync(publicDirectory)) cpSync(publicDirectory, join(staging, 'public'), { recursive: true })
  cpSync(join(project, 'src'), join(staging, 'src'), {
    recursive: true,
    filter(source) {
      if (!source.startsWith(photoDirectory + sep)) return true
      const info = statSync(source)
      if (!info.isFile() || info.size <= limit) return true
      console.log(`Skipped: ${basename(source)} (${(info.size / 1024 ** 2).toFixed(1)} MiB)`)
      return false
    },
  })
  const relativeStage = basename(staging)
  run(process.execPath, ['node_modules/vite/bin/vite.js', 'build', relativeStage])

  if (!process.argv.includes('--build-only')) {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
    run(command, ['--yes', 'wrangler@4.50.0', 'pages', 'deploy', `${relativeStage}/dist`, '--project-name', 'cchua', '--branch', 'main'], {
      shell: process.platform === 'win32',
    })
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  rmSync(staging, { recursive: true, force: true })
}
