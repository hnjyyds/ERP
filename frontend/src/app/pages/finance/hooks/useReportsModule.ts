import { downloadCsv } from '../../../../shared/print'
import { useEffect, useState } from 'react'
import {
  getReceiptUsageReport,
  getBankReceiptSummaryReport,
  getGoodsPaymentReport,
  getFeePaymentReport,
  getCustomsReceiptCollectionReport,
  getTaxRefundStatisticsReport,
  type ReceiptUsageDetailReport,
  type BankReceiptSummaryReport,
  type GoodsPaymentQueryReport,
  type FeePaymentQueryReport,
  type CustomsReceiptCollectionReport,
  type TaxRefundStatisticsReport,
  FinanceReportDrilldown,
  FinanceReportExplanation,
  exportBankReceiptSummaryReport,
  exportCustomsReceiptCollectionReport,
  exportFeePaymentReport,
  exportGoodsPaymentReport,
  exportReceiptUsageReport,
  exportTaxRefundStatisticsReport,
  drilldownFinanceReport,
  explainFinanceReport,
} from '../../../../api'
import { showError } from '../../../../shared/errors'
import { t } from '../../../appI18n'

import type { FinanceModuleEnv } from '../financePageTypes'

export function useReportsModule(env: FinanceModuleEnv) {
  const { activeModule, setMessage, setError } = env

  const [reportDateFrom, setReportDateFrom] = useState('')

  const [reportDateTo, setReportDateTo] = useState('')

  const [reportCurrency, setReportCurrency] = useState('')

  const [reportReceiptNo, setReportReceiptNo] = useState('')

  const [reportReceiptType, setReportReceiptType] = useState('')

  const [reportSupplierName, setReportSupplierName] = useState('')

  const [reportPartnerName, setReportPartnerName] = useState('')

  const [reportFeeType, setReportFeeType] = useState('')

  const [reportSalesUserId, setReportSalesUserId] = useState('')

  const [reportOwnerUserId, setReportOwnerUserId] = useState('')

  const [reportReminderStatus, setReportReminderStatus] = useState('')

  const [reportStatus, setReportStatus] = useState('')

  const [reportIncludeRegistered, setReportIncludeRegistered] = useState(false)

  const [activeReport, setActiveReport] = useState('receipt-usage')

  const [loadingReport, setLoadingReport] = useState(false)

  const [exportingReport, setExportingReport] = useState(false)

  const [_loadingReportExplanation, setLoadingReportExplanation] = useState(false)

  const [_reportExplanation, setReportExplanation] = useState<FinanceReportExplanation | null>(null)

  const [reportDrilldown, setReportDrilldown] = useState<FinanceReportDrilldown | null>(null)

  const [receiptUsageReport, setReceiptUsageReport] = useState<ReceiptUsageDetailReport | null>(
    null,
  )

  const [bankReceiptSummaryReport, setBankReceiptSummaryReport] =
    useState<BankReceiptSummaryReport | null>(null)

  const [goodsPaymentReport, setGoodsPaymentReport] = useState<GoodsPaymentQueryReport | null>(null)

  const [feePaymentReport, setFeePaymentReport] = useState<FeePaymentQueryReport | null>(null)

  const [customsCollectionReport, setCustomsCollectionReport] =
    useState<CustomsReceiptCollectionReport | null>(null)

  const [taxRefundStatisticsReport, setTaxRefundStatisticsReport] =
    useState<TaxRefundStatisticsReport | null>(null)

  useEffect(() => {
    if (activeModule === 'reports') {
      void loadFinanceReport(activeReport)
      void loadReportExplanation(activeReport)
    }
  }, [activeModule, activeReport])

  function financeReportFilters(report: string) {
    const base = {
      date_from: reportDateFrom || undefined,
      date_to: reportDateTo || undefined,
      currency: reportCurrency.trim() || undefined,
    }
    if (report === 'receipt-usage') {
      return { ...base, receipt_no: reportReceiptNo.trim() || undefined }
    }
    if (report === 'bank-receipt-summary') {
      return { ...base, receipt_type: reportReceiptType.trim() || undefined }
    }
    if (report === 'goods-payment') {
      return {
        ...base,
        supplier_name: reportSupplierName.trim() || undefined,
        status: reportStatus.trim() || undefined,
      }
    }
    if (report === 'fee-payment') {
      return {
        ...base,
        partner_name: reportPartnerName.trim() || undefined,
        fee_type: reportFeeType.trim() || undefined,
        sales_user_id: reportSalesUserId.trim() || undefined,
        status: reportStatus.trim() || undefined,
      }
    }
    if (report === 'customs-receipt-collection') {
      return {
        date_from: reportDateFrom || undefined,
        date_to: reportDateTo || undefined,
        owner_user_id: reportOwnerUserId.trim() || undefined,
        reminder_status: reportReminderStatus.trim() || undefined,
        include_registered: reportIncludeRegistered,
      }
    }
    return { ...base, status: reportStatus.trim() || undefined }
  }

  async function loadFinanceReport(report: string) {
    setLoadingReport(true)
    setError('')
    setReportDrilldown(null)
    const filters = financeReportFilters(report)
    try {
      if (report === 'receipt-usage') {
        setReceiptUsageReport(await getReceiptUsageReport(filters))
      } else if (report === 'bank-receipt-summary') {
        setBankReceiptSummaryReport(await getBankReceiptSummaryReport(filters))
      } else if (report === 'goods-payment') {
        setGoodsPaymentReport(await getGoodsPaymentReport(filters))
      } else if (report === 'fee-payment') {
        setFeePaymentReport(await getFeePaymentReport(filters))
      } else if (report === 'customs-receipt-collection') {
        setCustomsCollectionReport(await getCustomsReceiptCollectionReport(filters))
      } else if (report === 'tax-refund-statistics') {
        setTaxRefundStatisticsReport(await getTaxRefundStatisticsReport(filters))
      }
    } catch (caught) {
      showError(caught, t('finance.report.message.loadFailed'))
    } finally {
      setLoadingReport(false)
    }
  }

  async function exportFinanceReport(report: string) {
    setExportingReport(true)
    setMessage('')
    setError('')
    const filters = financeReportFilters(report)
    try {
      const exported =
        report === 'receipt-usage'
          ? await exportReceiptUsageReport(filters)
          : report === 'bank-receipt-summary'
            ? await exportBankReceiptSummaryReport(filters)
            : report === 'goods-payment'
              ? await exportGoodsPaymentReport(filters)
              : report === 'fee-payment'
                ? await exportFeePaymentReport(filters)
                : report === 'customs-receipt-collection'
                  ? await exportCustomsReceiptCollectionReport(filters)
                  : await exportTaxRefundStatisticsReport(filters)
      downloadCsv(exported.filename, exported.content)
      setMessage(t('finance.report.message.exported', { count: exported.total }))
    } catch (caught) {
      showError(caught, t('finance.report.message.exportFailed'))
    } finally {
      setExportingReport(false)
    }
  }

  async function loadReportExplanation(report: string) {
    setLoadingReportExplanation(true)
    setError('')
    try {
      setReportExplanation(await explainFinanceReport(report))
    } catch (caught) {
      showError(caught, t('finance.report.message.explanationLoadFailed'))
    } finally {
      setLoadingReportExplanation(false)
    }
  }

  async function openFinanceReportDrilldown(report: string, sourceNo: string) {
    setError('')
    try {
      setReportDrilldown(await drilldownFinanceReport(report, sourceNo))
    } catch (caught) {
      showError(caught, t('finance.report.message.drilldownFailed'))
    }
  }

  return {
    activeReport,
    bankReceiptSummaryReport,
    customsCollectionReport,
    exportFinanceReport,
    exportingReport,
    feePaymentReport,
    goodsPaymentReport,
    loadFinanceReport,
    loadingReport,
    openFinanceReportDrilldown,
    receiptUsageReport,
    reportCurrency,
    reportDateFrom,
    reportDateTo,
    reportDrilldown,
    reportFeeType,
    reportIncludeRegistered,
    reportOwnerUserId,
    reportPartnerName,
    reportReceiptNo,
    reportReceiptType,
    reportReminderStatus,
    reportSalesUserId,
    reportStatus,
    reportSupplierName,
    setActiveReport,
    setReportCurrency,
    setReportDateFrom,
    setReportDateTo,
    setReportFeeType,
    setReportIncludeRegistered,
    setReportOwnerUserId,
    setReportPartnerName,
    setReportReceiptNo,
    setReportReceiptType,
    setReportReminderStatus,
    setReportSalesUserId,
    setReportStatus,
    setReportSupplierName,
    taxRefundStatisticsReport,
  }
}

export type ReportsModel = ReturnType<typeof useReportsModule>
