import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductsPage } from '../masterdata/ProductsPage'

describe('ProductsPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<ProductsPage onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders product list panel', () => {
    render(<ProductsPage onNavigate={onNavigate} />)
    expect(screen.getByText('商品列表')).toBeTruthy()
  })

  it('renders search input', () => {
    render(<ProductsPage onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('编号 / 中文 / 英文 / 海关编码')).toBeTruthy()
  })
})
