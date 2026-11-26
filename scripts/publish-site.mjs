import { spawnSync } from 'node:child_process'
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { copySiteFiles } from './copy-site-files.mjs'

const project = fileURLToPath(new URL('../', import.meta.url))
const repository = 'https://github.com/vipcchua/vipcchua.github.io.git'
const localClone = process.argv.find(argument => argument.startsWith('--local-clone='))?.slice('--local-clone='.length)
const siteFiles = ['.github', '.gitignore', 'README.md', 'index.html', 'package.json',
  'package-lock.json', 'public', 'scripts', 'src', 'vite.config.js']

function run(command, args, cwd = project, accepted = [0]) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  if (!accepted.includes(result.status)) throw new Error(`${command} exited with code ${result.status}`)
  return result.status
}

function gitConfig(key, cwd) {
  return spawnSync('git', ['config', '--get', key], { cwd, encoding: 'utf8' }).stdout?.trim()
}

function publishGitHub() {
  const tempRoot = realpathSync(tmpdir())
  const staging = realpathSync(mkdtempSync(join(tempRoot, 'cchua-publish-')))
  if (dirname(staging) !== tempRoot) throw new Error('Invalid GitHub staging directory')
  try {
    if (localClone) {
      run('git', ['clone', '--no-hardlinks', '--', localClone, staging])
      run('git', ['remote', 'set-url', 'origin', repository], staging)
    } else {
      run('git', ['-c', 'http.lowSpeedLimit=1024', '-c', 'http.lowSpeedTime=30',
        'clone', '--filter=blob:none', '--no-checkout', '--depth', '1', '--single-branch',
        '--branch', 'main', repository, staging])
      run('git', ['read-tree', 'HEAD'], staging)
    }
    // Replace the source trees so removed photos also disappear from the published version.
    for (const name of ['src', 'public']) {
      const sourceTree = join(staging, name)
      if (dirname(sourceTree) !== staging) throw new Error('Invalid GitHub source directory')
      rmSync(sourceTree, { recursive: true, force: true })
    }
    for (const name of siteFiles) copySiteFiles(join(project, name), join(staging, name))
    run('git', ['add', '-A', '--', 'src', 'public'], staging)
    run('git', ['add', '--ignore-removal', '--', ...siteFiles.filter(name => name !== 'src' && name !== 'public')], staging)
    if (run('git', ['diff', '--cached', '--quiet'], staging, [0, 1]) === 0) {
      console.log('GitHub source is already up to date.')
      return
    }
    const author = gitConfig('user.name', staging) || 'Codex'
    const email = gitConfig('user.email', staging) || 'codex@localhost'
    run('git', ['-c', `user.name=${author}`, '-c', `user.email=${email}`,
      'commit', '-m', 'Update Cchua portfolio'], staging)
    run('git', ['push', 'origin', 'HEAD:main'], staging)
    console.log('GitHub source uploaded. The GitHub Pages workflow will deploy it.')
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
}

const githubOnly = process.argv.includes('--github-only')
const cloudflareOnly = process.argv.includes('--cloudflare-only')
for (const [name, publish, enabled] of [
  ['Cloudflare Pages', () => run(process.execPath, ['scripts/publish-photos.mjs']), !githubOnly],
  ['GitHub Pages', publishGitHub, !cloudflareOnly],
]) {
  if (!enabled) continue
  try {
    console.log(`\nPublishing to ${name}...`)
    publish()
  } catch (error) {
    console.error(`${name}: ${error.message}`)
    process.exitCode = 1
  }
}
