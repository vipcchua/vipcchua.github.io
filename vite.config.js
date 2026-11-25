import { readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'

const folderModule = 'virtual:photo-project-folders'
const resolvedFolderModule = '\0' + folderModule

function photoProjectFolders() {
  let directory
  return {
    name: 'photo-project-folders',
    configResolved(config) {
      directory = resolve(config.root, 'src/imgBlog/project')
    },
    resolveId(id) {
      if (id === folderModule) return resolvedFolderModule
    },
    load(id) {
      if (id !== resolvedFolderModule) return
      let names = []
      try {
        names = readdirSync(directory, { withFileTypes: true })
          .filter(entry => entry.isDirectory()).map(entry => entry.name)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      return `export default ${JSON.stringify(names)}`
    },
    configureServer(server) {
      function refresh(path) {
        if (resolve(dirname(path)) !== directory && resolve(path) !== directory) return
        const module = server.moduleGraph.getModuleById(resolvedFolderModule)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('addDir', refresh).on('unlinkDir', refresh)
    },
  }
}

export default defineConfig({ plugins: [photoProjectFolders()] })
