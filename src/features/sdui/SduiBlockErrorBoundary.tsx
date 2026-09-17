import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = { children: ReactNode; name?: string }
type State = { hasError: boolean }

export class SduiBlockErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[SDUI] block failed', this.props.name, error, info)
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}
