import { ChevronRight } from 'lucide-react'
import { t } from '@/app/appI18n'
import type { FinanceViewShell } from '@/app/pages/finance/financePageTypes'

type Props = {
  shell: FinanceViewShell
}

export function FinanceHomeView({ shell }: Props) {
  const { goModule, moduleAlerts, summaryStrip, financeModuleCards } = shell

  return (
    <section className="finance-page finance-home">
      {summaryStrip}
      {moduleAlerts}

      <section className="finance-module-cards" aria-label={t('finance.home.moduleCardsAria')}>
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
