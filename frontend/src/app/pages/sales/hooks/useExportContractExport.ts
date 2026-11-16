import { useState } from 'react'

import { exportExportContract, type ExportContract } from '@/api'
import { showError } from '@/shared/errors'
import { downloadCsv, openExportContractPrint } from '@/shared/print'
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
      if (format === 'pdf') {
        // 后端未生成二进制 PDF，复用合同打印视图，由浏览器打印/另存为 PDF。
        await openExportContractPrint(contract.id)
        return
      }
      const result = await exportExportContract(contract.id, format)
      downloadCsv(result.filename, result.content)
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
