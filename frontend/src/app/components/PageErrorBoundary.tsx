import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { t } from '@/app/appI18n'

type PageErrorBoundaryProps = { children: ReactNode; pageKey: string }
type PageErrorBoundaryState = { failed: boolean; message: string }

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { failed: false, message: '' }

  static getDerivedStateFromError(error: unknown): PageErrorBoundaryState {
    return { failed: true, message: error instanceof Error ? error.message : '' }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('Page render failed', error, errorInfo)
  }

  componentDidUpdate(prev: PageErrorBoundaryProps) {
    if (prev.pageKey !== this.props.pageKey && this.state.failed) {
      this.setState({ failed: false, message: '' })
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="dashboard-feedback error" role="alert">
          {t('app.errorBoundary.loadFailed', {
            message: this.state.message || t('app.errorBoundary.renderFailed'),
          })}
        </section>
      )
    }
    return this.props.children
  }
}
