import { printExportContract, printSampleRequest } from '../api'
import { showError } from './errors'

/**
 * 打开出口合同打印视图：调用后端渲染含主联系人的 HTML，
 * 在新窗口写入并触发浏览器打印（可另存为 PDF）。
 */
export async function openExportContractPrint(contractId: string): Promise<void> {
  try {
    const document_ = await printExportContract(contractId)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showError(new Error('浏览器拦截了打印窗口'), '请允许弹出窗口后重试')
      return
    }
    printWindow.document.open()
    printWindow.document.write(document_.html)
    printWindow.document.close()
    printWindow.focus()
    // 等待样式与内容渲染后触发打印。
    printWindow.setTimeout(() => printWindow.print(), 300)
  } catch (caught) {
    showError(caught, '生成打印单据失败')
  }
}

export async function openSampleRequestPrint(requestId: string): Promise<void> {
  try {
    const document_ = await printSampleRequest(requestId)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showError(new Error('浏览器拦截了打印窗口'), '请允许弹出窗口后重试')
      return
    }
    printWindow.document.open()
    printWindow.document.write(document_.html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.setTimeout(() => printWindow.print(), 300)
  } catch (caught) {
    showError(caught, '生成内部打样单失败')
  }
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' })
  downloadBlob(filename, blob)
}

export function downloadBase64File(
  filename: string,
  contentBase64: string,
  contentType: string,
): void {
  const binary = window.atob(contentBase64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  downloadBlob(filename, new Blob([bytes], { type: contentType }))
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
