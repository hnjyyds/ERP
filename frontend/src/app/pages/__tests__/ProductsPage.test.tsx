import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    listProducts: vi.fn(),
    listProductCustomers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listProductTransactions: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    uploadImage: vi.fn(),
  }
})

vi.mock('@/shared/print', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/print')>()
  return { ...actual, downloadCsv: vi.fn() }
})

import { ProductsPage } from '@/app/pages/masterdata/ProductsPage'
import { setRuntimeSettings } from '@/app/pages/appHelpers'
import {
  createProduct,
  listProductCustomers,
  listProductTransactions,
  listProducts,
  updateProduct,
  uploadImage,
  type Product,
  type ProductCustomer,
  type ProductTransaction,
} from '@/api'
import { downloadCsv } from '@/shared/print'

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

const customerFixture: ProductCustomer = {
  customer_id: 'customer-1',
  customer_name: '客户乙',
  contract_count: 3,
  total_quantity: '1200',
  total_amount: '9800.00',
  last_contract_date: '2026-07-01',
}

const transactionFixture: ProductTransaction = {
  source_type: 'shipment',
  source_code: 'SHP-001',
  occurred_at: '2026-07-02',
  counterparty_name: '客户甲',
  quantity: '100',
  unit: 'pcs',
  amount: '800.00',
  summary: '测试摘要',
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
    expect(screen.getByText('商品资料')).toBeTruthy()
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

  it('无匹配后清空筛选，立即按空关键字恢复列表', async () => {
    const user = userEvent.setup()
    vi.mocked(listProducts)
      .mockResolvedValueOnce({
        items: [productFixture],
        total: 1,
        summary: { with_image_count: 0, accessory_count: 0 },
      })
      .mockResolvedValueOnce({
        items: [],
        total: 0,
        summary: { with_image_count: 0, accessory_count: 0 },
      })
      .mockResolvedValue({
        items: [productFixture],
        total: 1,
        summary: { with_image_count: 0, accessory_count: 0 },
      })

    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listProducts).toHaveBeenCalledTimes(1))

    await user.type(
      screen.getByPlaceholderText('编号 / 中文 / 英文 / 海关编码'),
      'UIQA-NOMATCH',
    )
    await user.click(screen.getByRole('button', { name: '查询商品' }))

    expect(await screen.findByText('没有匹配的结果')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '清空筛选' }))

    await waitFor(() => {
      expect(listProducts).toHaveBeenLastCalledWith({ q: undefined, limit: 50, offset: 0 })
    })
    expect(await screen.findByText('P-001')).toBeInTheDocument()
    expect(currentQuery().get('q')).toBeNull()
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

    expect(await screen.findByRole('heading', { level: 2, name: '商品资料' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '编号' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '中文名称' })).toBeInTheDocument()

    await act(async () => {
      await Promise.resolve()
    })
    act(() => switchLanguage())

    expect(screen.getByRole('heading', { level: 2, name: 'Products' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Code' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Chinese name' })).toBeInTheDocument()
    expect(screen.queryByText('商品资料')).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '编号' })).not.toBeInTheDocument()
  })

  it('英文名称与包装资料缺失时就地提示必填并阻止提交', async () => {
    const user = userEvent.setup()
    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listProducts).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: '新增商品' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/产品编号/), 'P-201')
    await user.type(within(dialog).getByLabelText(/中文名称/), '缺字段商品')
    await user.type(within(dialog).getByLabelText(/海关编码/), '8481804090')
    await user.click(within(dialog).getByRole('button', { name: '新增商品' }))

    expect(await within(dialog).findByText('请填写商品英文名称')).toBeInTheDocument()
    expect(createProduct).not.toHaveBeenCalled()

    await user.type(within(dialog).getByLabelText(/英文名称/), 'Missing Field')
    await user.click(within(dialog).getByRole('button', { name: '新增商品' }))
    expect(await within(dialog).findByText('请填写包装资料')).toBeInTheDocument()
    expect(createProduct).not.toHaveBeenCalled()
  })

  it('商品新建填写配件单耗但缺配件名称时就地提示并阻止提交', async () => {
    const user = userEvent.setup()
    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listProducts).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: '新增商品' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/产品编号/), 'P-202')
    await user.type(within(dialog).getByLabelText(/中文名称/), '配件缺名称')
    await user.type(within(dialog).getByLabelText(/英文名称/), 'Accessory Missing Name')
    await user.type(within(dialog).getByLabelText(/海关编码/), '8481804090')
    await user.type(within(dialog).getByLabelText(/包装资料/), '24 pcs/carton')
    const consumption = within(dialog).getByLabelText(/单耗/)
    await user.clear(consumption)
    await user.type(consumption, '1.25')
    await user.click(within(dialog).getByRole('button', { name: '新增商品' }))

    expect(
      await within(dialog).findByText('已填写配件信息，请补充配件名称或清空配件信息'),
    ).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/配件名称/)).toHaveFocus()
    expect(createProduct).not.toHaveBeenCalled()
  })

  it('新增商品：校验必填、提交创建 payload 并回到第一页刷新', async () => {
    const user = userEvent.setup()
    vi.mocked(createProduct).mockResolvedValue({ ...productFixture, id: 'product-new', code: 'P-200' })

    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listProducts).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: '新增商品' }))
    const dialog = await screen.findByRole('dialog')

    await user.click(within(dialog).getByRole('button', { name: '新增商品' }))
    expect(await within(dialog).findByText('请填写商品编号')).toBeInTheDocument()
    expect(createProduct).not.toHaveBeenCalled()

    await user.type(within(dialog).getByLabelText(/产品编号/), 'P-200')
    await user.type(within(dialog).getByLabelText(/中文名称/), '新商品')
    await user.type(within(dialog).getByLabelText(/英文名称/), 'New Product')
    await user.type(within(dialog).getByLabelText(/海关编码/), '8481804090')
    await user.type(within(dialog).getByLabelText(/包装资料/), '24 pcs/carton')
    await user.click(within(dialog).getByRole('button', { name: '新增商品' }))

    await waitFor(() => {
      expect(createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'P-200',
          cn_name: '新商品',
          customs_code: '8481804090',
          unit: 'pcs',
          status: 'active',
          accessories: [],
        }),
      )
    })
    await waitFor(() => {
      expect(listProducts).toHaveBeenLastCalledWith({ q: undefined, limit: 50, offset: 0 })
    })
  })

  it('多选上传图片后按顺序保存 image_urls，并标出主图与添加格', async () => {
    const user = userEvent.setup()
    vi.mocked(uploadImage).mockImplementation(async (filename: string) => ({
      url: `https://example.test/${filename}`,
      filename,
      content_type: 'image/png',
      size: 1,
    }))
    vi.mocked(createProduct).mockResolvedValue({
      ...productFixture,
      id: 'product-img',
      code: 'P-300',
    })

    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listProducts).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: '新增商品' }))
    const dialog = await screen.findByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText('添加图片'), {
      target: {
        files: [
          new File(['a'], 'front.png', { type: 'image/png' }),
          new File(['b'], 'side.png', { type: 'image/png' }),
        ],
      },
    })

    await waitFor(() => expect(within(dialog).getAllByAltText('商品图片预览')).toHaveLength(2))
    expect(within(dialog).getByText('主图')).toBeInTheDocument()
    expect(within(dialog).getByText('共 2 张')).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText(/产品编号/), 'P-300')
    await user.type(within(dialog).getByLabelText(/中文名称/), '带图商品')
    await user.type(within(dialog).getByLabelText(/英文名称/), 'Product With Images')
    await user.type(within(dialog).getByLabelText(/海关编码/), '8481804090')
    await user.type(within(dialog).getByLabelText(/包装资料/), '12 pcs/carton')
    await user.click(within(dialog).getByRole('button', { name: '新增商品' }))

    await waitFor(() => {
      expect(createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          image_url: 'https://example.test/front.png',
          image_urls: ['https://example.test/front.png', 'https://example.test/side.png'],
        }),
      )
    })
  })

  it('替换图片失败时保留原图，并在该图片位置显示错误', async () => {
    const user = userEvent.setup()
    vi.mocked(uploadImage).mockResolvedValueOnce({
      url: 'https://example.test/front.png',
      filename: 'front.png',
      content_type: 'image/png',
      size: 1,
    })

    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listProducts).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: '新增商品' }))
    const dialog = await screen.findByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText('添加图片'), {
      target: { files: [new File(['a'], 'front.png', { type: 'image/png' })] },
    })
    await waitFor(() => expect(within(dialog).getAllByAltText('商品图片预览')).toHaveLength(1))

    vi.mocked(uploadImage).mockRejectedValueOnce(new Error('upload failed'))
    fireEvent.change(within(dialog).getByLabelText('更换商品图片'), {
      target: { files: [new File(['c'], 'broken.png', { type: 'image/png' })] },
    })

    expect(await within(dialog).findByText('更换失败，已保留原图')).toBeInTheDocument()
    expect(within(dialog).getAllByAltText('商品图片预览')[0]).toHaveAttribute(
      'src',
      'https://example.test/front.png',
    )
  })

  it('列表加载失败显示独立错误态并可重试', async () => {
    const user = userEvent.setup()
    vi.mocked(listProducts)
      .mockReset()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValue({
        items: [productFixture],
        total: 1,
        summary: { with_image_count: 0, accessory_count: 0 },
      })

    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)

    expect(await screen.findByText('加载失败')).toBeTruthy()
    expect(screen.queryByText('完成首次录入后，这里会显示对应记录')).toBeNull()

    await user.click(screen.getByRole('button', { name: /重\s*试/ }))
    expect(await screen.findByText('P-001')).toBeTruthy()
  })

  it('导出：未选行导出当前筛选的全部页，选中后只导出选中行', async () => {
    const user = userEvent.setup()
    vi.mocked(downloadCsv).mockClear()
    const thirdProduct = { ...productFixture, id: 'product-3', code: 'P-003' }
    vi.mocked(listProducts).mockImplementation(
      async (filters: { limit?: number } = {}) => ({
        // 列表首屏只返回当前页 2 条，导出请求（limit 200）返回完整 3 条。
        items:
          filters.limit === 200
            ? [productFixture, { ...productFixture, id: 'product-2', code: 'P-002' }, thirdProduct]
            : [productFixture, { ...productFixture, id: 'product-2', code: 'P-002' }],
        total: 3,
        summary: { with_image_count: 0, accessory_count: 0 },
      }),
    )

    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listProducts).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: '导出全部商品' }))
    await waitFor(() => expect(downloadCsv).toHaveBeenCalledTimes(1))
    expect(vi.mocked(downloadCsv).mock.calls[0][0]).toBe('商品资料.csv')
    expect(vi.mocked(downloadCsv).mock.calls[0][1]).toContain('P-001')
    expect(vi.mocked(downloadCsv).mock.calls[0][1]).toContain('P-002')
    // 第二页记录也必须包含在“导出全部”中。
    expect(vi.mocked(downloadCsv).mock.calls[0][1]).toContain('P-003')

    await user.click(screen.getAllByRole('checkbox')[1])
    await user.click(await screen.findByRole('button', { name: '导出已选 1 条商品' }))
    await waitFor(() => expect(downloadCsv).toHaveBeenCalledTimes(2))
    expect(vi.mocked(downloadCsv).mock.calls[1][1]).toContain('P-001')
    expect(vi.mocked(downloadCsv).mock.calls[1][1]).not.toContain('P-002')
  })

  it('详情页渲染配件、关联客户与业务记录，并可编辑保存', async () => {
    vi.mocked(listProducts).mockResolvedValue({
      items: [
        {
          ...productFixture,
          accessories: [
            {
              id: 'accessory-1',
              product_id: 'product-1',
              accessory_name: '配件一',
              unit_consumption: '2',
              unit: 'pcs',
              default_supplier_name: '供应商甲',
              purchase_split_rule: 'by_supplier',
            },
          ],
        },
      ],
      total: 1,
      summary: { with_image_count: 0, accessory_count: 1 },
    })
    vi.mocked(listProductCustomers).mockResolvedValue({ items: [customerFixture], total: 1 })
    vi.mocked(listProductTransactions).mockResolvedValue({ items: [transactionFixture], total: 1 })
    vi.mocked(updateProduct).mockResolvedValue({ ...productFixture, cn_name: '改名商品' })
    const user = userEvent.setup()

    render(<ProductsPage detailId="product-1" onNavigate={onNavigate} />)

    expect(await screen.findByText('商品明细')).toBeInTheDocument()
    expect(screen.getByText('配件一')).toBeInTheDocument()
    expect(await screen.findByText('客户乙')).toBeInTheDocument()
    expect(await screen.findByText('出货明细')).toBeInTheDocument()
    expect(await screen.findByText('测试摘要')).toBeInTheDocument()
    expect(screen.queryByText('商品资料')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '编辑商品' }))
    const dialog = await screen.findByRole('dialog')
    const cnNameInput = within(dialog).getByLabelText(/中文名称/)
    await user.clear(cnNameInput)
    await user.type(cnNameInput, '改名商品')
    await user.click(within(dialog).getByRole('button', { name: '保存商品' }))

    await waitFor(() => {
      expect(updateProduct).toHaveBeenCalledWith(
        'product-1',
        expect.objectContaining({ cn_name: '改名商品' }),
      )
    })
  })

  it('当前页为空且页码大于 1 时回退上一页', async () => {
    window.history.replaceState({}, '', '/masterdata/products?page=3')
    vi.mocked(listProducts)
      .mockResolvedValueOnce({
        items: [],
        total: 100,
        summary: { with_image_count: 0, accessory_count: 0 },
      })
      .mockResolvedValue({
        items: [productFixture],
        total: 100,
        summary: { with_image_count: 0, accessory_count: 0 },
      })

    render(<ProductsPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listProducts).toHaveBeenLastCalledWith({ q: undefined, limit: 50, offset: 50 })
    })
    expect(currentQuery().get('page')).toBe('2')
  })
})
