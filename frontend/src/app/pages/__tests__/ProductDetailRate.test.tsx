import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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
