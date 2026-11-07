import { Alert } from 'antd'
import {
  BarChart3,
  Coins,
  FileSpreadsheet,
  FileStack,
  Handshake,
  PackagePlus,
  Receipt,
  ShieldCheck,
  Ship,
  Wallet,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { type CurrentUser } from '../../../api'
import {
  financePath,
  financeModulePathByModule,
  financeDetailPath,
  type FinanceModule,
  type FinanceView,
} from '../../routes'
import { Metric } from '../../../shared/ui'
import { t } from '../../appI18n'
import { formatFinanceAmount, type ModuleNavigationProps } from '../appHelpers'

import { useFinanceFeedback } from './hooks/useFinanceFeedback'
import { useFinanceOverviewModule } from './hooks/useFinanceOverviewModule'
import { useReceiptsModule } from './hooks/useReceiptsModule'
import { usePaymentsModule } from './hooks/usePaymentsModule'
import { useFeesModule } from './hooks/useFeesModule'
import { useTaxModule } from './hooks/useTaxModule'
import { useMiscModule } from './hooks/useMiscModule'
import { useSettlementModule } from './hooks/useSettlementModule'
import { useReimbursementsModule } from './hooks/useReimbursementsModule'
import { usePortDataModule } from './hooks/usePortDataModule'
import { useReportsModule } from './hooks/useReportsModule'
import { FinanceHomeView } from './views/FinanceHomeView'
import { FinanceOverviewView } from './views/FinanceOverviewView'
import { ReceiptsView } from './views/ReceiptsView'
import { PaymentsView } from './views/PaymentsView'
import { FeesView } from './views/FeesView'
import { TaxView } from './views/TaxView'
import { MiscView } from './views/MiscView'
import { SettlementView } from './views/SettlementView'
import { ReimbursementsView } from './views/ReimbursementsView'
import { PortDataView } from './views/PortDataView'
import { ReportsView } from './views/ReportsView'
import type { FinanceViewShell } from './financePageTypes'

type FinancePageProps = ModuleNavigationProps & {
  currentUser: CurrentUser
  view: FinanceView
}

export function FinancePage({ currentUser, view, onNavigate }: FinancePageProps) {
  const activeModule = view.module
  const detailId = view.id
  const itemId = view.itemId
  const goModule = (module: FinanceModule) => onNavigate(financeModulePathByModule[module])
  const goDetail = (module: FinanceModule, id: string) => onNavigate(financeDetailPath(module, id))
  const _goFinanceHome = () => onNavigate(financePath)

  const { message, setMessage, setError } = useFinanceFeedback()
  const overviewModule = useFinanceOverviewModule({ setError })
  const env = {
    activeModule,
    detailId,
    itemId,
    currentUser,
    setMessage,
    setError,
    loadOverview: overviewModule.loadOverview,
  }
  const receiptsModule = useReceiptsModule(env)
  const paymentsModule = usePaymentsModule(env)
  const feesModule = useFeesModule(env)
  const taxModule = useTaxModule(env)
  const miscModule = useMiscModule(env)
  const settlementModule = useSettlementModule(env)
  const reimbursementsModule = useReimbursementsModule(env)
  const reportsModule = useReportsModule(env)
  const portDataModule = usePortDataModule(env, reportsModule.loadFinanceReport)

  const { summary, currencyLabel, profitAmount, loading, loadOverview } = overviewModule
  const { loadReceipts, loadReceivables, setSelectedReceiptId } = receiptsModule
  const { loadSupplierInvoices, loadPaymentRequests, loadPayables, setSelectedSupplierInvoiceId } =
    paymentsModule
  const {
    loadPartnerFeeInvoices,
    loadFeePaymentRequests,
    loadFeePayables,
    setSelectedPartnerFeeInvoiceId,
  } = feesModule
  const {
    loadVerificationDocuments,
    loadVerificationUsage,
    setSelectedVerificationDocumentId,
    verificationDocuments,
  } = taxModule
  const {
    loadMiscFeeItems,
    loadMiscFeeAllocations,
    loadMiscFeeAllocationSummary,
    setSelectedMiscFeeItemId,
    miscFeeItems,
  } = miscModule
  const {
    loadFinancialSettlements,
    loadProfitCalculations,
    setSelectedFinancialSettlementId,
    financialSettlements,
  } = settlementModule
  const { loadReimbursements, setSelectedReimbursementId, reimbursements } = reimbursementsModule
  const { loadPortImportBatches, loadCustomsRecords, portImportBatches } = portDataModule

  useEffect(() => {
    void loadOverview()
    void loadReceipts()
    void loadReceivables()
    void loadSupplierInvoices()
    void loadPaymentRequests(activeModule === 'payments' ? (itemId ?? undefined) : undefined)
    void loadPayables()
    void loadPartnerFeeInvoices()
    void loadFeePaymentRequests(activeModule === 'fees' ? (itemId ?? undefined) : undefined)
    void loadFeePayables()
    void loadVerificationDocuments()
    void loadVerificationUsage()
    void loadMiscFeeItems()
    void loadMiscFeeAllocations()
    void loadMiscFeeAllocationSummary()
    void loadFinancialSettlements()
    void loadProfitCalculations()
    void loadReimbursements()
    void loadPortImportBatches()
    void loadCustomsRecords()
  }, [])

  // Keep the per-module selection in sync with the detail id in the URL so that
  // opening a detail page directly (or via the browser back/forward) selects the
  // matching record.
  useEffect(() => {
    if (!detailId) return
    switch (activeModule) {
      case 'receipts':
        setSelectedReceiptId(detailId)
        break
      case 'payments':
        setSelectedSupplierInvoiceId(detailId)
        break
      case 'fees':
        setSelectedPartnerFeeInvoiceId(detailId)
        break
      case 'tax':
        setSelectedVerificationDocumentId(detailId)
        break
      case 'misc':
        setSelectedMiscFeeItemId(detailId)
        break
      case 'settlement':
        setSelectedFinancialSettlementId(detailId)
        break
      case 'reimbursements':
        setSelectedReimbursementId(detailId)
        break
      default:
        break
    }
  }, [activeModule, detailId])

  const summaryStrip = (
    <div className="summary-strip" aria-label={t('finance.page.summaryAria')}>
      <Metric label={t('finance.page.metric.shipmentCount')} value={summary?.shipment_count ?? 0} />
      <Metric
        label={t('finance.page.metric.receivableAmount')}
        value={formatFinanceAmount(summary?.receivable_amount, currencyLabel)}
      />
      <Metric
        label={t('finance.page.metric.payableAmount')}
        value={formatFinanceAmount(summary?.payable_amount, currencyLabel)}
      />
      <Metric
        label={t('finance.page.metric.profitAmount')}
        value={formatFinanceAmount(summary?.profit_amount, currencyLabel)}
        intent={profitAmount < 0 ? 'danger' : 'normal'}
      />
      <Metric
        label={t('finance.page.metric.invoiceNoticeCount')}
        value={summary?.invoice_notice_count ?? 0}
      />
      {/* 多币种：formatFinanceAmount 对空币种不显示前缀 */}
      <Metric
        label={t('finance.page.metric.sampleFeeAmount')}
        value={formatFinanceAmount(summary?.sample_fee_amount, '')}
      />
    </div>
  )

  const moduleAlerts = (
    <>
      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}
    </>
  )

  const financeModuleCards: {
    module: FinanceModule
    icon: ReactNode
    title: string
    caption: string
    metric: string
    metricLabel: string
  }[] = [
    {
      module: 'overview',
      icon: <BarChart3 size={20} />,
      title: t('finance.page.card.overview.title'),
      caption: t('finance.page.card.overview.caption'),
      metric: formatFinanceAmount(summary?.profit_amount, currencyLabel),
      metricLabel: t('finance.page.metric.profitAmount'),
    },
    {
      module: 'receipts',
      icon: <Wallet size={20} />,
      title: t('finance.page.card.receipts.title'),
      caption: t('finance.page.card.receipts.caption'),
      metric: formatFinanceAmount(summary?.receivable_amount, currencyLabel),
      metricLabel: t('finance.page.metric.receivableAmount'),
    },
    {
      module: 'payments',
      icon: <Coins size={20} />,
      title: t('finance.page.card.payments.title'),
      caption: t('finance.page.card.payments.caption'),
      metric: formatFinanceAmount(summary?.payable_amount, currencyLabel),
      metricLabel: t('finance.page.metric.payableAmount'),
    },
    {
      module: 'fees',
      icon: <Handshake size={20} />,
      title: t('finance.page.card.fees.title'),
      caption: t('finance.page.card.fees.caption'),
      metric: String(summary?.active_partner_count ?? 0),
      metricLabel: t('finance.page.card.fees.metricLabel'),
    },
    {
      module: 'tax',
      icon: <ShieldCheck size={20} />,
      title: t('finance.page.card.tax.title'),
      caption: t('finance.page.card.tax.caption'),
      metric: String(verificationDocuments.length),
      metricLabel: t('finance.page.card.tax.metricLabel'),
    },
    {
      module: 'misc',
      icon: <FileStack size={20} />,
      title: t('finance.page.card.misc.title'),
      caption: t('finance.page.card.misc.caption'),
      metric: String(miscFeeItems.length),
      metricLabel: t('finance.page.card.misc.metricLabel'),
    },
    {
      module: 'settlement',
      icon: <PackagePlus size={20} />,
      title: t('finance.page.card.settlement.title'),
      caption: t('finance.page.card.settlement.caption'),
      metric: String(financialSettlements.length),
      metricLabel: t('finance.page.card.settlement.metricLabel'),
    },
    {
      module: 'reimbursements',
      icon: <Receipt size={20} />,
      title: t('finance.page.card.reimbursements.title'),
      caption: t('finance.page.card.reimbursements.caption'),
      metric: String(reimbursements.length),
      metricLabel: t('finance.page.card.reimbursements.metricLabel'),
    },
    {
      module: 'portData',
      icon: <Ship size={20} />,
      title: t('finance.page.card.portData.title'),
      caption: t('finance.page.card.portData.caption'),
      metric: String(portImportBatches.length),
      metricLabel: t('finance.page.card.portData.metricLabel'),
    },
    {
      module: 'reports',
      icon: <FileSpreadsheet size={20} />,
      title: t('finance.page.card.reports.title'),
      caption: t('finance.page.card.reports.caption'),
      metric: '6',
      metricLabel: t('finance.page.card.reports.metricLabel'),
    },
  ]

  const moduleHeader = null

  const shell: FinanceViewShell = {
    detailId,
    goModule,
    goDetail,
    moduleAlerts,
    moduleHeader,
    summaryStrip,
    financeModuleCards,
    loading,
    message,
    currentUser,
  }

  if (activeModule === 'home') return <FinanceHomeView shell={shell} />
  if (activeModule === 'overview')
    return <FinanceOverviewView model={overviewModule} shell={shell} />
  if (activeModule === 'receipts') return <ReceiptsView model={receiptsModule} shell={shell} />
  if (activeModule === 'payments') return <PaymentsView model={paymentsModule} shell={shell} />
  if (activeModule === 'fees') return <FeesView model={feesModule} shell={shell} />
  if (activeModule === 'tax') return <TaxView model={taxModule} shell={shell} />
  if (activeModule === 'misc') return <MiscView model={miscModule} shell={shell} />
  if (activeModule === 'settlement')
    return <SettlementView model={settlementModule} shell={shell} />
  if (activeModule === 'reimbursements')
    return <ReimbursementsView model={reimbursementsModule} shell={shell} />
  if (activeModule === 'portData') return <PortDataView model={portDataModule} shell={shell} />
  if (activeModule === 'reports') return <ReportsView model={reportsModule} shell={shell} />

  return null
}
