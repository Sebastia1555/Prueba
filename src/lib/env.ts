// Modo "vista previa": la app se publica como una única página HTML dentro de
// un visor que no deja imprimir, descargar libremente ni incrustar PDFs.
// Se activa construyendo con `npm run build:preview`.

export const IS_PREVIEW = import.meta.env.VITE_PREVIEW === 'true'

interface ClaudeRuntime {
  use(name: string): Promise<unknown>
}

declare global {
  interface Window {
    claude?: ClaudeRuntime
  }
}
