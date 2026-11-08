import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  autoMatchCustomsReceipts,
  createPortImportBatch,
  listPortImportBatches,
  listCustomsDeclarationRecords,
  type PortImportBatch,
  type PortImportBatchCreatePayload,
  type CustomsDeclarationRecord,
  CustomsDeclarationRecordCreatePayload,
} from '@/api'
import { showError } from '@/shared/errors'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { t } from '@/app/appI18n'

import type { FinanceModuleEnv } from '@/app/pages/finance/financePageTypes'

export function usePortDataModule(
  env: FinanceModuleEnv,
  loadFinanceReport: (report: string) => Promise<void>,
) {
  const { setMessage, setError } = env

  const urlQuery = useUrlQuery()

  const [portImportBatches, setPortImportBatches] = useState<PortImportBatch[]>([])

  const [customsRecords, setCustomsRecords] = useState<CustomsDeclarationRecord[]>([])

  const batchesPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'port_batches_page'),
  )

  const recordsPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'port_records_page'),
  )

  const batchesUrlPage = urlQuery.params.get('port_batches_page') ?? ''

  const appliedBatchesPageRef = useRef(batchesUrlPage)

  const recordsUrlPage = urlQuery.params.get('port_records_page') ?? ''

  const appliedRecordsPageRef = useRef(recordsUrlPage)

  const [loadingPortBatches, setLoadingPortBatches] = useState(false)

  const [loadingCustomsRecords, setLoadingCustomsRecords] = useState(false)

  const [submittingPortBatch, setSubmittingPortBatch] = useState(false)

  const [portBatchSourceFilter, _setPortBatchSourceFilter] = useState('')

  const [customsDeclarationFilter, setCustomsDeclarationFilter] = useState('')

  const [customsReceiptFilter, setCustomsReceiptFilter] = useState('')

  const [customsTradeTypeFilter, setCustomsTradeTypeFilter] = useState('')

  const [portBatchForm, setPortBatchForm] = useState({
    batch_no: '',
    source: '',
    imported_at: '',
    remark: '',
  })

  const [portRecordForm, setPortRecordForm] = useState({
    declaration_no: '',
    customs_receipt_no: '',
    trade_type: 'export',
    export_contract_no: '',
    customs_date: '',
    product_name: '',
    hs_code: '',
    quantity: '',
    unit: '',
    amount: '',
    currency: 'USD',
    customer_or_supplier: '',
  })

  const [matchingCustomsReceipts, setMatchingCustomsReceipts] = useState(false)

  async function loadPortImportBatches(pageOverride?: number, pageSizeOverride?: number) {
    setLoadingPortBatches(true)
    setError('')
    try {
      const page = pageOverride ?? batchesPager.page
      const pageSize = pageSizeOverride ?? batchesPager.pageSize
      const result = await listPortImportBatches({
        source: portBatchSourceFilter.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setPortImportBatches(result.items)
      batchesPager.setTotal(result.total)
    } catch (caught) {
      showError(caught, t('finance.portData.message.loadBatchesFailed'))
    } finally {
      setLoadingPortBatches(false)
    }
  }

  async function loadCustomsRecords(pageOverride?: number, pageSizeOverride?: number) {
    setLoadingCustomsRecords(true)
    setError('')
    try {
      const page = pageOverride ?? recordsPager.page
      const pageSize = pageSizeOverride ?? recordsPager.pageSize
      const result = await listCustomsDeclarationRecords({
        declaration_no: customsDeclarationFilter.trim() || undefined,
        customs_receipt_no: customsReceiptFilter.trim() || undefined,
        trade_type: customsTradeTypeFilter || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setCustomsRecords(result.items)
      recordsPager.setTotal(result.total)
    } catch (caught) {
      showError(caught, t('finance.portData.message.loadCustomsFailed'))
    } finally {
      setLoadingCustomsRecords(false)
    }
  }

  async function submitPortBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingPortBatch(true)
    setMessage('')
    setError('')
    try {
      const record: CustomsDeclarationRecordCreatePayload = {
        declaration_no: portRecordForm.declaration_no.trim(),
        customs_receipt_no: portRecordForm.customs_receipt_no.trim() || undefined,
        trade_type: portRecordForm.trade_type,
        export_contract_no: portRecordForm.export_contract_no.trim() || undefined,
        customs_date: portRecordForm.customs_date || undefined,
        product_name: portRecordForm.product_name.trim(),
        hs_code: portRecordForm.hs_code.trim() || undefined,
        quantity: portRecordForm.quantity.trim() || undefined,
        unit: portRecordForm.unit.trim() || undefined,
        amount: portRecordForm.amount.trim(),
        currency: portRecordForm.currency.trim(),
        customer_or_supplier: portRecordForm.customer_or_supplier.trim() || undefined,
      }
      const payload: PortImportBatchCreatePayload = {
        batch_no: portBatchForm.batch_no.trim(),
        source: portBatchForm.source.trim(),
        imported_at: portBatchForm.imported_at,
        record_count: 1,
        remark: portBatchForm.remark.trim() || undefined,
        records: [record],
      }
      const created = await createPortImportBatch(payload)
      setMessage(t('finance.portData.message.importSuccess', { code: created.batch_no }))
      setPortBatchForm({ batch_no: '', source: '', imported_at: '', remark: '' })
      setPortRecordForm({
        declaration_no: '',
        customs_receipt_no: '',
        trade_type: 'export',
        export_contract_no: '',
        customs_date: '',
        product_name: '',
        hs_code: '',
        quantity: '',
        unit: '',
        amount: '',
        currency: 'USD',
        customer_or_supplier: '',
      })
      await loadPortImportBatches()
      await loadCustomsRecords()
    } catch (caught) {
      showError(caught, t('finance.portData.message.importFailed'))
    } finally {
      setSubmittingPortBatch(false)
    }
  }

  async function autoMatchPortCustomsReceipts() {
    setMatchingCustomsReceipts(true)
    setMessage('')
    setError('')
    try {
      const result = await autoMatchCustomsReceipts()
      setMessage(
        t('finance.portData.message.autoMatched', { count: result.matched_count }),
      )
      await loadCustomsRecords()
      await loadFinanceReport('customs-receipt-collection')
    } catch (caught) {
      showError(caught, t('finance.portData.message.autoMatchFailed'))
    } finally {
      setMatchingCustomsReceipts(false)
    }
  }

  async function changeCustomsRecordsPage(nextPage: number, nextPageSize: number) {
    const next = recordsPager.changePage(nextPage, nextPageSize)
    appliedRecordsPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ port_records_page: next.page === 1 ? null : next.page })
    await loadCustomsRecords(next.page, next.pageSize)
  }

  async function changePortImportBatchesPage(nextPage: number, nextPageSize: number) {
    const next = batchesPager.changePage(nextPage, nextPageSize)
    appliedBatchesPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ port_batches_page: next.page === 1 ? null : next.page })
    await loadPortImportBatches(next.page, next.pageSize)
  }

  useEffect(() => {
    if (appliedRecordsPageRef.current === recordsUrlPage) return
    appliedRecordsPageRef.current = recordsUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'port_records_page')
    recordsPager.setPage(nextPage)
    void loadCustomsRecords(nextPage, recordsPager.pageSize)
  }, [recordsUrlPage])

  useEffect(() => {
    if (appliedBatchesPageRef.current === batchesUrlPage) return
    appliedBatchesPageRef.current = batchesUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'port_batches_page')
    batchesPager.setPage(nextPage)
    void loadPortImportBatches(nextPage, batchesPager.pageSize)
  }, [batchesUrlPage])

  return {
    autoMatchPortCustomsReceipts,
    changeCustomsRecordsPage,
    changePortImportBatchesPage,
    customsDeclarationFilter,
    customsReceiptFilter,
    customsRecords,
    customsRecordsPagination: recordsPager.pagination,
    customsRecordsTotal: recordsPager.total,
    customsTradeTypeFilter,
    loadCustomsRecords,
    loadPortImportBatches,
    loadingCustomsRecords,
    loadingPortBatches,
    matchingCustomsReceipts,
    portBatchForm,
    portImportBatches,
    portImportBatchesPagination: batchesPager.pagination,
    portImportBatchesTotal: batchesPager.total,
    portRecordForm,
    setCustomsDeclarationFilter,
    setCustomsReceiptFilter,
    setCustomsTradeTypeFilter,
    setPortBatchForm,
    setPortRecordForm,
    submitPortBatch,
    submittingPortBatch,
  }
}

export type PortDataModel = ReturnType<typeof usePortDataModule>
