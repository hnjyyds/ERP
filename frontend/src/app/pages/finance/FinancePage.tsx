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

  const { message, setMessage, error, setError } = useFinanceFeedback()
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
    <div className="summary-strip" aria-label="财务管理概览">
      <Metric label="出货单" value={summary?.shipment_count ?? 0} />
      <Metric
        label="应收金额"
        value={formatFinanceAmount(summary?.receivable_amount, currencyLabel)}
      />
      <Metric
        label="应付成本"
        value={formatFinanceAmount(summary?.payable_amount, currencyLabel)}
      />
      <Metric
        label="预计利润"
        value={formatFinanceAmount(summary?.profit_amount, currencyLabel)}
        intent={profitAmount < 0 ? 'danger' : 'normal'}
      />
      <Metric label="开票通知" value={summary?.invoice_notice_count ?? 0} />
      <Metric label="样品费用" value={formatFinanceAmount(summary?.sample_fee_amount, '多币种')} />
    </div>
  )

  const moduleAlerts = (
    <>
      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}
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
      title: '经营总览',
      caption: '出运利润 / 分币种 / 状态汇总',
      metric: formatFinanceAmount(summary?.profit_amount, currencyLabel),
      metricLabel: '预计利润',
    },
    {
      module: 'receipts',
      icon: <Wallet size={20} />,
      title: '收款管理',
      caption: '银行水单认领、分摊与应收账款',
      metric: formatFinanceAmount(summary?.receivable_amount, currencyLabel),
      metricLabel: '应收金额',
    },
    {
      module: 'payments',
      icon: <Coins size={20} />,
      title: '付款管理',
      caption: '供应商发票、付款申请与应付账款',
      metric: formatFinanceAmount(summary?.payable_amount, currencyLabel),
      metricLabel: '应付成本',
    },
    {
      module: 'fees',
      icon: <Handshake size={20} />,
      title: '付费管理',
      caption: '合作伙伴费用发票、付费申请与审批',
      metric: String(summary?.active_partner_count ?? 0),
      metricLabel: '启用伙伴',
    },
    {
      module: 'tax',
      icon: <ShieldCheck size={20} />,
      title: '核销退税',
      caption: '核销单领用、回单核销与退税登记',
      metric: String(verificationDocuments.length),
      metricLabel: '核销单',
    },
    {
      module: 'misc',
      icon: <FileStack size={20} />,
      title: '杂费管理',
      caption: '杂费项目配置与单票分摊查询',
      metric: String(miscFeeItems.length),
      metricLabel: '杂费项目',
    },
    {
      module: 'settlement',
      icon: <PackagePlus size={20} />,
      title: '结算核算',
      caption: '单票结算锁定、手工成本与利润核算',
      metric: String(financialSettlements.length),
      metricLabel: '锁定结算',
    },
    {
      module: 'reimbursements',
      icon: <Receipt size={20} />,
      title: '报销管理',
      caption: '员工报销单登记、审批与付款',
      metric: String(reimbursements.length),
      metricLabel: '报销单',
    },
    {
      module: 'portData',
      icon: <Ship size={20} />,
      title: '口岸数据导入',
      caption: '进出口报关数据导入与查询',
      metric: String(portImportBatches.length),
      metricLabel: '导入批次',
    },
    {
      module: 'reports',
      icon: <FileSpreadsheet size={20} />,
      title: '财务报表',
      caption: '水单、收付与退税统计报表',
      metric: '6',
      metricLabel: '报表',
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
