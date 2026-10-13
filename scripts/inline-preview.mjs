// Junta el build de `vite build --mode artifact` en un único archivo HTML
// (sin <html>/<head>/<body>: el visor de artefactos añade su propio esqueleto).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? 'dist-preview'
const out = process.argv[3] ?? join(dir, 'cuidamos.html')
const html = readFileSync(join(dir, 'index.html'), 'utf8')

const jsSrc = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/)?.[1]
const cssHrefs = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map((m) => m[1])
if (!jsSrc) throw new Error('No se ha encontrado el script principal en index.html')

const read = (p) => readFileSync(join(dir, p.replace(/^\.\//, '')), 'utf8')
// Un "</script" dentro del código cerraría la etiqueta antes de tiempo.
const js = read(jsSrc).replace(/<\/script/gi, '<\\/script')
const css = cssHrefs.map(read).join('\n').replace(/<\/style/gi, '<\\/style')
if (/<!--/.test(js)) throw new Error('El JS contiene "<!--": revisar antes de incrustarlo')

const page = `<title>Cuidamos</title>
<meta name="description" content="Agenda familiar para cuidar a una persona mayor: turnos, medicación, citas médicas, documentos y gastos.">
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`
writeFileSync(out, page)
console.log(`${out}: ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB`)
