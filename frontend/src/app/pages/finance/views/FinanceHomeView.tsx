import { ChevronRight } from 'lucide-react'
import type { FinancePageContext } from '../financeHelpers'
import { OperationFlowRail } from '../../appHelpers'
import { financeReceiptsPath } from '../../routes'

export function FinanceHomeView({ ctx }: { ctx: FinancePageContext }) {
  const { summaryStrip, moduleAlerts, financeModuleCards, goModule, onNavigate } = ctx
  return (
    <section className="finance-page finance-home">
      <OperationFlowRail
        activeLabel="银行水单"
        activePath={financeReceiptsPath}
        kind="finance"
        onNavigate={onNavigate}
      />

      {summaryStrip}
      {moduleAlerts}

      <section className="finance-module-cards" aria-label="财务模块入口">
        {financeModuleCards.map((card) => (
          <button
            key={card.module}
            className="finance-module-card"
            type="button"
            onClick={() => goModule(card.module)}
          >
            <span className="finance-module-card-icon">{card.icon}</span>
            <span className="finance-module-card-body">
              <strong>{card.title}</strong>
              <small>{card.caption}</small>
            </span>
            <span className="finance-module-card-metric">
              <em>{card.metric}</em>
              <span>{card.metricLabel}</span>
            </span>
            <ChevronRight className="finance-module-card-arrow" size={18} />
          </button>
        ))}
      </section>
    </section>
  )
}
