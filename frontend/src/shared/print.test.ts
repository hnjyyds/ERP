import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadBase64File } from './print'

async function blobBytes(blob: Blob): Promise<number[]> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)))
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

describe('downloadBase64File', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('preserves binary workbook bytes exactly', async () => {
    const original = Uint8Array.from([
      0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0xff, 0x00, 0x80,
    ])
    const contentBase64 = window.btoa(String.fromCharCode(...original))
    let downloadedBlob: Blob | undefined

    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      downloadedBlob = blob as Blob
      return 'blob:test-workbook'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    downloadBase64File(
      'purchase-contract.xls',
      contentBase64,
      'application/vnd.ms-excel',
    )

    expect(downloadedBlob).toBeDefined()
    expect(downloadedBlob?.type).toBe('application/vnd.ms-excel')
    expect(await blobBytes(downloadedBlob!)).toEqual(Array.from(original))
  })
})
