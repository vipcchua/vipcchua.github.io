import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function copySiteFiles(source, target, filter = () => true) {
  const info = statSync(source)
  if (!filter(source, info)) return
  if (info.isDirectory()) {
    mkdirSync(target, { recursive: true })
    for (const entry of readdirSync(source, { withFileTypes: true })) {
      if (entry.isDirectory() || entry.isFile()) copySiteFiles(join(source, entry.name), join(target, entry.name), filter)
    }
    return
  }
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(source, target)
}
