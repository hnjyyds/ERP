import type { FormEvent } from 'react'
import { useState } from 'react'
import {
  autoMatchCustomsReceipts,
  createPortImportBatch,
  listPortImportBatches,
  listCustomsDeclarationRecords,
  type PortImportBatch,
  type PortImportBatchCreatePayload,
  type CustomsDeclarationRecord,
  CustomsDeclarationRecordCreatePayload,
} from '../../../../api'
import { showError } from '../../../../shared/errors'
import { t } from '../../../appI18n'

import type { FinanceModuleEnv } from '../financePageTypes'

export function usePortDataModule(
  env: FinanceModuleEnv,
  loadFinanceReport: (report: string) => Promise<void>,
) {
  const { setMessage, setError } = env

  const [portImportBatches, setPortImportBatches] = useState<PortImportBatch[]>([])

  const [customsRecords, setCustomsRecords] = useState<CustomsDeclarationRecord[]>([])

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

  async function loadPortImportBatches() {
    setLoadingPortBatches(true)
    setError('')
    try {
      const result = await listPortImportBatches({
        source: portBatchSourceFilter.trim() || undefined,
      })
      setPortImportBatches(result.items)
    } catch (caught) {
      showError(caught, t('finance.portData.message.loadBatchesFailed'))
    } finally {
      setLoadingPortBatches(false)
    }
  }

  async function loadCustomsRecords() {
    setLoadingCustomsRecords(true)
    setError('')
    try {
      const result = await listCustomsDeclarationRecords({
        declaration_no: customsDeclarationFilter.trim() || undefined,
        customs_receipt_no: customsReceiptFilter.trim() || undefined,
        trade_type: customsTradeTypeFilter || undefined,
      })
      setCustomsRecords(result.items)
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

  return {
    autoMatchPortCustomsReceipts,
    customsDeclarationFilter,
    customsReceiptFilter,
    customsRecords,
    customsTradeTypeFilter,
    loadCustomsRecords,
    loadPortImportBatches,
    loadingCustomsRecords,
    loadingPortBatches,
    matchingCustomsReceipts,
    portBatchForm,
    portImportBatches,
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
