import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type PageErrorBoundaryProps = { children: ReactNode; pageKey: string }
type PageErrorBoundaryState = { message: string }

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { message: '' }

  static getDerivedStateFromError(error: unknown): PageErrorBoundaryState {
    return { message: error instanceof Error ? error.message : '页面渲染失败' }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('Page render failed', error, errorInfo)
  }

  componentDidUpdate(prev: PageErrorBoundaryProps) {
    if (prev.pageKey !== this.props.pageKey && this.state.message) {
      this.setState({ message: '' })
    }
  }

  render() {
    if (this.state.message) {
      return (
        <section className="dashboard-feedback error" role="alert">
          页面加载失败：{this.state.message}
        </section>
      )
    }
    return this.props.children
  }
}
