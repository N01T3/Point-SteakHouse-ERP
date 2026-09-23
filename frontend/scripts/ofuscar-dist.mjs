// Ofusca o bundle de produção da amostra online (frontend/dist).
// Uso: `npm run build:amostra` (vite build + este script).
// Remove sourcemaps e aplica javascript-obfuscator em todos os .js gerados.
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JavaScriptObfuscator from 'javascript-obfuscator'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const dist = path.resolve(aqui, '..', 'dist')

async function listarJs(dir) {
  const entradas = await readdir(dir)
  const arquivos = []
  for (const entrada of entradas) {
    const caminho = path.join(dir, entrada)
    const info = await stat(caminho)
    if (info.isDirectory()) arquivos.push(...(await listarJs(caminho)))
    else if (caminho.endsWith('.js')) arquivos.push(caminho)
  }
  return arquivos
}

async function listarMapas(dir) {
  const entradas = await readdir(dir)
  const arquivos = []
  for (const entrada of entradas) {
    const caminho = path.join(dir, entrada)
    const info = await stat(caminho)
    if (info.isDirectory()) arquivos.push(...(await listarMapas(caminho)))
    else if (caminho.endsWith('.map')) arquivos.push(caminho)
  }
  return arquivos
}

const arquivos = await listarJs(dist)
if (arquivos.length === 0) {
  console.error(`Nenhum .js encontrado em ${dist} — rode "vite build" antes.`)
  process.exit(1)
}

for (const arquivo of arquivos) {
  const codigo = await readFile(arquivo, 'utf8')
  const resultado = JavaScriptObfuscator.obfuscate(codigo, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.6,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.3,
    debugProtection: true,
    debugProtectionInterval: 0,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 1,
    rotateStringArray: true,
    shuffleStringArray: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
  })
  await writeFile(arquivo, resultado.getObfuscatedCode(), 'utf8')
  console.log(`ofuscado: ${path.relative(dist, arquivo)}`)
}

for (const mapa of await listarMapas(dist)) {
  await rm(mapa, { force: true })
  console.log(`mapa removido: ${path.relative(dist, mapa)}`)
}
