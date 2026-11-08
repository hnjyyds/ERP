import type { ReactNode } from 'react'

import type { CurrentUser } from '@/api'
import type { FinanceModule } from '@/app/routes'

export type FinanceModuleEnv = {
  activeModule: FinanceModule
  detailId: string | null
  itemId: string | null | undefined
  currentUser: CurrentUser
  setMessage: (value: string) => void
  setError: (value: string) => void
  loadOverview: () => Promise<void>
}

export type FinanceModuleCard = {
  module: FinanceModule
  icon: ReactNode
  title: string
  caption: string
  metric: string
  metricLabel: string
}

export type FinanceViewShell = {
  detailId: string | null
  goModule: (module: FinanceModule) => void
  goDetail: (module: FinanceModule, id: string) => void
  moduleAlerts: ReactNode
  moduleHeader: ReactNode
  summaryStrip: ReactNode
  financeModuleCards: FinanceModuleCard[]
  loading: boolean
  message: string
  currentUser: CurrentUser
}
