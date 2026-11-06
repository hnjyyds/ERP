import { request } from './core'

export interface FileUploadResult {
  url: string
  filename: string
  content_type: string
  size: number
}

export interface DocumentPrint {
  document_type: string
  document_code: string
  content_type: string
  html: string
}

export interface DocumentFile {
  document_type: string
  document_code: string
  filename: string
  content_type: string
  content_base64: string
}

export function uploadImage(filename: string, contentBase64: string): Promise<FileUploadResult> {
  return request<FileUploadResult>('/files/images', {
    method: 'POST',
    body: JSON.stringify({ filename, content_base64: contentBase64 }),
  })
}

export function printExportContract(contractId: string): Promise<DocumentPrint> {
  return request<DocumentPrint>(`/printing/export-contracts/${contractId}`)
}

export function printSampleRequest(requestId: string): Promise<DocumentPrint> {
  return request<DocumentPrint>(`/printing/sample-requests/${requestId}`)
}

export function generatePurchaseContractTemplate(contractId: string): Promise<DocumentFile> {
  return request<DocumentFile>(`/printing/purchase-contracts/${contractId}/template`)
}
