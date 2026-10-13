import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Al cambiar (p. ej. la ruta) se vuelve a intentar mostrar el contenido. */
  resetKey: string
}

interface State {
  error: Error | null
  resetKey: string
}

/** Evita que un dato raro deje toda la app en blanco: muestra un aviso en su lugar. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error en la pantalla', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="ap-card p-6 text-center">
        <div className="text-3xl">⚠️</div>
        <p className="mt-2 text-[17px] font-semibold">Esta pantalla no se ha podido mostrar</p>
        <p className="mt-1 text-[15px] text-[color:var(--ap-ink-2)]">
          Tus datos siguen guardados. Vuelve al inicio o prueba otra sección desde el menú.
        </p>
        <button type="button" className="ap-btn ap-btn-sm ap-btn-primary mt-4" onClick={() => this.setState({ error: null })}>
          Reintentar
        </button>
      </div>
    )
  }
}
