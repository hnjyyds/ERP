import { useState } from 'react'

import { exportExportContract, type ExportContract } from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'

type Options = {
  contract: ExportContract | null
  setMessage: (message: string) => void
}

/** 出口合同 PDF/Excel 导出预览。 */
export function useExportContractExport({ contract, setMessage }: Options) {
  const [exportPreview, setExportPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function exportContract(format: 'pdf' | 'excel') {
    if (!contract) return
    setSubmitting(true)
    setMessage('')
    try {
      const result = await exportExportContract(contract.id, format)
      setExportPreview(result.content.split('\n').slice(0, 14).join('\n'))
      setMessage(t('sales.contract.message.exportPreview', { filename: result.filename }))
    } catch (caught) {
      showError(caught, t('sales.contract.message.exportFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    exportPreview,
    clearExportPreview: () => setExportPreview(''),
    submitting,
    exportContract,
  }
}

export type ExportContractExportModel = ReturnType<typeof useExportContractExport>
