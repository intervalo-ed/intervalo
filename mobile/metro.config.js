// El monorepo (watchFolders, nodeModulesPaths) lo configura solo
// `expo/metro-config`, y en un workspace Expo además deduplica `react`,
// `react-dom`, `react-native` y los módulos nativos. Lo que falta son los demás
// peers de dx-core: bun instala aislado, así que `packages/dx-core/node_modules`
// tiene su propia copia de `@tanstack/react-query` (la de la web, atada a
// react@19.2) y un hook de dx-core leería un QueryClientContext distinto del
// que monta la app. Un peer se resuelve como si lo importara la app, que es lo
// que significa ser peer.

const fs = require("node:fs")
const path = require("node:path")
const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// Metro ve los archivos por su ruta real, no por el symlink de node_modules.
const dxCore = fs.realpathSync(path.join(__dirname, "node_modules/@intervalo/dx-core"))
const peers = Object.keys(require(path.join(dxCore, "package.json")).peerDependencies ?? {})
const desdeLaApp = path.join(__dirname, "package.json")

const esPeer = (nombre) => peers.some((p) => nombre === p || nombre.startsWith(`${p}/`))

// Ver components/latex/mathjax-variantes-vacias.js.
const VARIANTES_SIN_USO =
  /^\.\/tex\/(double-struck|fraktur|fraktur-bold|monospace|sans-serif|sans-serif-bold|sans-serif-italic|sans-serif-bold-italic|script|script-bold|tex-calligraphic|tex-calligraphic-bold|tex-oldstyle|tex-oldstyle-bold)\.js$/
const fuenteTexDeMathJax = path.join("mathjax-full", "js", "output", "svg", "fonts", "tex.js")
const variantesVacias = path.join(__dirname, "components/latex/mathjax-variantes-vacias.js")

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (context.originModulePath.endsWith(fuenteTexDeMathJax) && VARIANTES_SIN_USO.test(moduleName)) {
    return { type: "sourceFile", filePath: variantesVacias }
  }
  if (context.originModulePath.startsWith(dxCore + path.sep) && esPeer(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: desdeLaApp },
      moduleName,
      platform,
    )
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
