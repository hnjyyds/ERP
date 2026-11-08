import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    listProducts: vi.fn(),
    listProductCustomers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listProductTransactions: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  }
})

import { ProductsPage } from '@/app/pages/masterdata/ProductsPage'
import { setRuntimeSettings } from '@/app/pages/appHelpers'
import { listProducts, type Product } from '@/api'

const productFixture: Product = {
  id: 'product-1',
  code: 'P-001',
  cn_name: '测试商品',
  en_name: 'Test product',
  specification: null,
  model: null,
  customs_code: '8481804090',
  tax_rate: '0.13',
  rebate_rate: '0.09',
  package_info: '',
  unit: 'pcs',
  image_url: null,
  status: 'active',
  accessories: [],
}

function currentQuery() {
  return new URLSearchParams(window.location.search)
}

describe('ProductsPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/masterdata/products')
    vi.mocked(listProducts).mockResolvedValue({
      items: [productFixture],
      total: 120,
      summary: { with_image_count: 80, accessory_count: 35 },
    })
  })

  it('renders product list panel', () => {
    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('商品列表')).toBeTruthy()
  })

  it('使用带可访问名称的图标工具按钮，并保留新增商品文字', () => {
    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)

    expect(screen.getByRole('button', { name: '查询商品' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导入商品' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导出全部商品' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '设置列视图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增商品' })).toBeInTheDocument()
  })

  it('从 URL 恢复搜索与页码，并按 offset 请求', async () => {
    window.history.replaceState({}, '', '/masterdata/products?q=ABC&page=3')
    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listProducts).toHaveBeenCalledWith({ q: 'ABC', limit: 50, offset: 100 })
    })
    expect(screen.getByPlaceholderText('编号 / 中文 / 英文 / 海关编码')).toHaveValue('ABC')
  })

  it('提交查询时写入 URL 并回到第一页', async () => {
    window.history.replaceState({}, '', '/masterdata/products?page=3')
    const user = userEvent.setup()
    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listProducts).toHaveBeenCalledWith(expect.objectContaining({ offset: 100 }))
    })

    await user.type(screen.getByPlaceholderText('编号 / 中文 / 英文 / 海关编码'), '螺栓')
    await user.click(screen.getByRole('button', { name: '查询商品' }))

    await waitFor(() => {
      expect(listProducts).toHaveBeenLastCalledWith({ q: '螺栓', limit: 50, offset: 0 })
    })
    expect(currentQuery().get('q')).toBe('螺栓')
    expect(currentQuery().get('page')).toBeNull()
  })

  it('翻页时把页码写入 URL', async () => {
    const user = userEvent.setup()
    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => expect(screen.getByTitle('2')).toBeTruthy())
    await user.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(listProducts).toHaveBeenLastCalledWith({ q: undefined, limit: 50, offset: 50 })
    })
    expect(currentQuery().get('page')).toBe('2')
  })

  it('浏览器后退时按 URL 恢复搜索与页码', async () => {
    window.history.replaceState({}, '', '/masterdata/products?q=AAA&page=2')
    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listProducts).toHaveBeenCalledWith({ q: 'AAA', limit: 50, offset: 50 })
    })

    window.history.pushState({}, '', '/masterdata/products?q=BBB&page=3')
    window.dispatchEvent(new PopStateEvent('popstate'))

    await waitFor(() => {
      expect(listProducts).toHaveBeenLastCalledWith({ q: 'BBB', limit: 50, offset: 100 })
    })
    expect(screen.getByPlaceholderText('编号 / 中文 / 英文 / 海关编码')).toHaveValue('BBB')
  })

  afterEach(() => {
    setRuntimeSettings({ language: 'zh-CN', timeZone: 'Asia/Shanghai' })
  })

  it('已挂载的列表在切换语言后更新标题与表头', async () => {
    let switchLanguage = () => {}

    function Harness() {
      const [, setTick] = useState(0)
      switchLanguage = () => {
        setRuntimeSettings({ language: 'en-US', timeZone: 'UTC' })
        setTick((tick) => tick + 1)
      }
      return <ProductsPage detailId={null} onNavigate={onNavigate} />
    }

    render(<Harness />)

    expect(await screen.findByRole('heading', { level: 2, name: '商品列表' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '编号' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '中文名称' })).toBeInTheDocument()

    await act(async () => {
      await Promise.resolve()
    })
    act(() => switchLanguage())

    expect(screen.getByRole('heading', { level: 2, name: 'Product list' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Code' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Chinese name' })).toBeInTheDocument()
    expect(screen.queryByText('商品列表')).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '编号' })).not.toBeInTheDocument()
  })
})
