import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import type { Product } from '@/api'
import { formatRatePercent } from '@/app/pages/masterdata/products/formatters'
import { ProductDetailView } from '@/app/pages/masterdata/products/views/ProductDetailView'

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: 'p-1',
    code: 'P-001',
    cn_name: '纸袋',
    en_name: 'Paper Bag',
    customs_code: '4202920000',
    tax_rate: '0.13',
    rebate_rate: '0.09',
    package_info: '100 pcs/carton',
    unit: 'pcs',
    status: 'active',
    ...overrides,
  } as Product
}

function renderDetail(product: Product) {
  return render(
    <ProductDetailView
      customers={[]}
      exportResult={null}
      onAddAccessory={vi.fn()}
      onBack={vi.fn()}
      onDeactivate={vi.fn()}
      onDeleteAccessory={vi.fn()}
      onEdit={vi.fn()}
      onEditAccessory={vi.fn()}
      product={product}
      transactions={[]}
    />,
  )
}

describe('formatRatePercent', () => {
  it('把小数税率转成百分比文本', () => {
    expect(formatRatePercent('0.13')).toBe('13%')
    expect(formatRatePercent(0.09)).toBe('9%')
    expect(formatRatePercent('0.135')).toBe('13.5%')
    expect(formatRatePercent('0')).toBe('0%')
  })

  it('未填写时返回 null', () => {
    expect(formatRatePercent(null)).toBeNull()
    expect(formatRatePercent(undefined)).toBeNull()
    expect(formatRatePercent('')).toBeNull()
  })
})

describe('ProductDetailView 税率展示', () => {
  it('按百分比展示税率与退税率', () => {
    renderDetail(makeProduct({ tax_rate: '0.13', rebate_rate: '0.09' }))

    expect(screen.getByText('13% / 9%')).toBeTruthy()
  })

  it('零税率展示为 0%，不显示为空', () => {
    renderDetail(makeProduct({ tax_rate: '0', rebate_rate: '0' }))

    expect(screen.getByText('0% / 0%')).toBeTruthy()
  })

  it('未填写税率时展示占位文案', () => {
    renderDetail(makeProduct({ tax_rate: undefined, rebate_rate: undefined }))

    expect(screen.getAllByText('未填 / 未填').length).toBeGreaterThan(0)
  })
})

describe('ProductDetailView 图片预览', () => {
  const productWithImages = makeProduct({
    image_urls: ['https://cdn.example.com/c.png', 'https://cdn.example.com/a.png'],
    image_names: ['UIQA-C.png', 'UIQA-A.png'],
  })

  it('缩略图展示文件名，可访问名称包含序号与文件名', () => {
    renderDetail(productWithImages)

    expect(screen.getAllByText('UIQA-C.png').length).toBeGreaterThan(0)
    expect(
      screen.getByAltText('纸袋 图片 第 1 张 UIQA-C.png'),
    ).toBeTruthy()
    expect(
      screen.getByAltText('纸袋 图片 第 2 张 UIQA-A.png'),
    ).toBeTruthy()
  })

  it('打开大图预览后仍显示文件名并设置可访问名称', async () => {
    renderDetail(productWithImages)

    fireEvent.click(screen.getAllByAltText('纸袋 图片 第 1 张 UIQA-C.png')[0])

    await waitFor(() => {
      const previewImage = document.querySelector('.ant-image-preview-img')
      expect(previewImage?.getAttribute('alt')).toContain('UIQA-C.png')
      expect(document.querySelector('.product-preview-name')?.textContent).toBe('UIQA-C.png')
    })
  })
})
