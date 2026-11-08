import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { FollowProcessTemplate, PurchaseFollowPlan } from '@/api'
import { FollowupPage } from '@/app/pages/purchase/FollowupPage'

const followupPlan: PurchaseFollowPlan = {
  id: 'followup-plan-1',
  purchase_contract_id: 'purchase-contract-1',
  purchase_contract_no: 'PC-001',
  supplier_id: 'supplier-1',
  supplier_name: '贝斯特针织',
  template_id: 'template-1',
  base_date: '2026-08-01',
  overall_status: 'overdue',
  owner_user_id: 'user-1',
  nodes: [
    {
      id: 'followup-node-1',
      follow_plan_id: 'followup-plan-1',
      node_code: 'confirm_sample_submitted',
      node_name: '确认样提交',
      sequence_no: 20,
      planned_date: '2026-08-04',
      remind_date: '2026-08-03',
      actual_date: null,
      status: 'overdue',
      source_record_type: null,
      source_record_id: null,
      source_summary: null,
      overdue_days: 5,
    },
  ],
}

const legacyLabelPlan: PurchaseFollowPlan = {
  ...followupPlan,
  nodes: [
    ['contract_confirmed', '合同下单确立'],
    ['confirm_sample_submitted', '确认样提交'],
    ['bulk_sample_submitted', '大货样提交'],
    ['quality_inspection', 'QC 查验'],
    ['inbound_completed', '入库'],
    ['outbound_completed', '出库'],
  ].map(([node_code, node_name], index) => ({
    ...followupPlan.nodes[0],
    id: `legacy-followup-node-${index + 1}`,
    node_code,
    node_name,
    sequence_no: (index + 1) * 10,
  })),
}

function metricValue(label: string): string | null | undefined {
  const cell = Array.from(document.querySelectorAll('.metric-cell')).find(
    (node) => node.querySelector('.metric-label')?.textContent === label,
  )
  return cell?.querySelector('.metric-value')?.textContent
}

function fieldByLabel(labelText: string): HTMLInputElement {
  const label = Array.from(document.querySelectorAll('label')).find(
    (node) => node.textContent?.trim() === labelText,
  )
  const input = label?.querySelector('input, textarea')
  if (!input) throw new Error(`field not found: ${labelText}`)
  return input as HTMLInputElement
}

describe('FollowupPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<FollowupPage detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders followup list panel', () => {
    render(<FollowupPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('采购跟单计划')).toBeTruthy()
  })

  it('按节点编码统一显示日期名称并兼容历史节点名称', async () => {
    vi.spyOn(api, 'listFollowupPlans').mockResolvedValue({
      items: [legacyLabelPlan],
      total: 1,
      summary: {
        completed_plan_count: 0,
        overdue_plan_count: 0,
        completed_node_count: 0,
        total_node_count: legacyLabelPlan.nodes.length,
      },
    })
    vi.spyOn(api, 'listFollowupTemplates').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listFollowupOverdueNodes').mockResolvedValue({ items: [], total: 0 })

    render(
      <FollowupPage
        detailId="followup-plan-1"
        onNavigate={onNavigate}
      />,
    )

    for (const label of [
      '下单日期',
      '确认样提交日期',
      '大货样提交日期',
      'QC查验日期',
      '入库日期',
      '出库日期',
    ]) {
      expect(await screen.findByText(label)).toBeInTheDocument()
    }
  })

  it('可以在默认模板的是否选项间切换', async () => {
    render(<FollowupPage detailId={null} onNavigate={onNavigate} />)

    await userEvent.click(screen.getByRole('button', { name: '配置/生成' }))
    const noOption = screen.getByText('否', { selector: '.ant-segmented-item-label' })
    await userEvent.click(noOption)

    expect(noOption.closest('.ant-segmented-item')).toHaveClass('ant-segmented-item-selected')
  })

  it('定位工作台传入的节点并提供可执行的登记入口', async () => {
    vi.spyOn(api, 'listFollowupPlans').mockResolvedValue({
      items: [followupPlan],
      total: 1,
      summary: {
        completed_plan_count: 0,
        overdue_plan_count: 0,
        completed_node_count: 1,
        total_node_count: followupPlan.nodes.length,
      },
    })
    vi.spyOn(api, 'listFollowupTemplates').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listFollowupOverdueNodes').mockResolvedValue({ items: [], total: 0 })
    const syncSourceEvent = vi
      .spyOn(api, 'syncFollowupSourceEvent')
      .mockResolvedValue(followupPlan)

    render(
      <FollowupPage
        detailId="followup-plan-1"
        targetNodeId="followup-node-1"
        onNavigate={onNavigate}
      />,
    )

    expect(await screen.findByText('已定位：确认样提交日期')).toBeInTheDocument()
    const targetRow = screen.getByText('当前待办').closest('tr')
    expect(targetRow).toHaveClass('followup-node-target')

    await userEvent.click(screen.getByRole('button', { name: /登记提交/ }))
    expect(screen.getByText('登记确认样提交日期')).toBeInTheDocument()
    expect(screen.getByLabelText('业务记录编号')).toHaveValue('')
    expect(screen.getByLabelText('处理说明')).toHaveValue('')

    await userEvent.type(screen.getByLabelText('业务记录编号'), 'SAMPLE-001')
    await userEvent.type(screen.getByLabelText('处理说明'), '供应商已提交确认样')
    await userEvent.click(screen.getByRole('button', { name: '保存并完成节点' }))

    await waitFor(() =>
      expect(syncSourceEvent).toHaveBeenCalledWith({
        purchase_contract_id: 'purchase-contract-1',
        node_code: 'confirm_sample_submitted',
        source_record_type: 'sample_followup_event',
        source_record_id: 'SAMPLE-001',
        actual_date: expect.any(String),
        source_summary: '供应商已提交确认样',
      }),
    )
  })

  it('按服务端分页请求且在翻页时保持后端汇总指标不变', async () => {
    window.history.replaceState({}, '', '/')
    const listSpy = vi.spyOn(api, 'listFollowupPlans').mockResolvedValue({
      items: [followupPlan],
      total: 120,
      summary: {
        completed_plan_count: 4,
        overdue_plan_count: 2,
        completed_node_count: 9,
        total_node_count: 12,
      },
    })
    vi.spyOn(api, 'listFollowupTemplates').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listFollowupOverdueNodes').mockResolvedValue({ items: [], total: 0 })

    render(<FollowupPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 0 }))
    })
    expect(metricValue('已完成计划')).toBe('4')
    expect(metricValue('逾期计划')).toBe('2')
    expect(metricValue('完成节点')).toBe('9/12')

    await userEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 50 }))
    })
    expect(metricValue('已完成计划')).toBe('4')
    expect(metricValue('逾期计划')).toBe('2')
    expect(metricValue('完成节点')).toBe('9/12')
  })

  const emptySummary = {
    completed_plan_count: 0,
    overdue_plan_count: 0,
    completed_node_count: 0,
    total_node_count: 0,
  }

  const templateFixture: FollowProcessTemplate = {
    id: 'template-1',
    name: '默认模板',
    owner_user_id: '',
    enabled: true,
    is_default: true,
    nodes: [
      {
        id: 'template-node-1',
        template_id: 'template-1',
        node_code: 'contract_confirmed',
        node_name: '合同下单',
        sequence_no: 10,
        standard_days: 0,
        remind_before_days: 0,
        actual_date_source: 'purchase_contract',
      },
      {
        id: 'template-node-2',
        template_id: 'template-1',
        node_code: 'confirm_sample_submitted',
        node_name: '确认样提交',
        sequence_no: 20,
        standard_days: 3,
        remind_before_days: 1,
        actual_date_source: 'sample_confirm',
      },
    ],
  }

  function mockWorkspace(items: PurchaseFollowPlan[], total = items.length) {
    vi.spyOn(api, 'listFollowupTemplates').mockResolvedValue({
      items: [templateFixture],
      total: 1,
    })
    const listSpy = vi.spyOn(api, 'listFollowupPlans').mockResolvedValue({
      items,
      total,
      summary: emptySummary,
    })
    vi.spyOn(api, 'listFollowupOverdueNodes').mockResolvedValue({ items: [], total: 0 })
    return listSpy
  }

  it('从 URL 恢复筛选与页码，并在浏览器前进后退时重新读取', async () => {
    window.history.replaceState(
      {},
      '',
      '/purchase/followup?q=PC&status=overdue&supplier=s-1&contract=pc-1&page=2',
    )
    const listSpy = mockWorkspace([followupPlan], 120)

    render(<FollowupPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'PC',
          overall_status: 'overdue',
          supplier_id: 's-1',
          purchase_contract_id: 'pc-1',
          limit: 50,
          offset: 50,
        }),
      )
    })
    expect(screen.getByPlaceholderText('采购合同 / 供应商')).toHaveValue('PC')

    window.history.pushState({}, '', '/purchase/followup?q=PC2&status=completed&supplier=s-2&page=1')
    window.dispatchEvent(new PopStateEvent('popstate'))

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: 'PC2',
          overall_status: 'completed',
          supplier_id: 's-2',
          purchase_contract_id: undefined,
          offset: 0,
        }),
      )
    })
    expect(screen.getByPlaceholderText('采购合同 / 供应商')).toHaveValue('PC2')
  })

  it('提交筛选时写入 URL 并回到第一页', async () => {
    window.history.replaceState({}, '', '/purchase/followup?page=3')
    const listSpy = mockWorkspace([followupPlan], 120)
    const user = userEvent.setup()
    render(<FollowupPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ offset: 100 }))
    })

    await user.type(screen.getByPlaceholderText('采购合同 / 供应商'), 'PC-2')
    await user.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'PC-2', offset: 0 }),
      )
    })
    const query = new URLSearchParams(window.location.search)
    expect(query.get('q')).toBe('PC-2')
    expect(query.get('page')).toBeNull()
    expect(screen.getByTitle('1')).toHaveClass('ant-pagination-item-active')
  })

  it('生成跟单计划后按合同筛选刷新列表', async () => {
    window.history.replaceState({}, '', '/')
    const generated = {
      ...followupPlan,
      id: 'followup-plan-9',
      purchase_contract_id: 'pc-9',
      purchase_contract_no: 'PC-009',
    }
    mockWorkspace([followupPlan])
    const generateSpy = vi
      .spyOn(api, 'generateFollowupPlanFromPurchaseContract')
      .mockResolvedValue(generated)
    const user = userEvent.setup()
    render(<FollowupPage detailId={null} onNavigate={onNavigate} />)

    await user.click(screen.getByRole('button', { name: '配置/生成' }))
    fireEvent.change(document.getElementById('followup-contract-id')!, {
      target: { value: 'pc-9' },
    })
    await user.click(screen.getByRole('button', { name: '生成跟单计划' }))

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith({
        purchase_contract_id: 'pc-9',
        as_of: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    })
    expect(screen.getByPlaceholderText('输入采购合同号')).toHaveValue('pc-9')
    expect(await screen.findByText('已生成跟单计划 PC-009')).toBeInTheDocument()
  })

  it('节点登记失败时保留弹窗与已填写的记录编号和说明', async () => {
    window.history.replaceState({}, '', '/')
    mockWorkspace([followupPlan])
    const syncSpy = vi
      .spyOn(api, 'syncFollowupSourceEvent')
      .mockRejectedValueOnce(new Error('boom'))
    const user = userEvent.setup()
    render(<FollowupPage detailId="followup-plan-1" onNavigate={onNavigate} />)

    await user.click(await screen.findByRole('button', { name: /登记提交/ }))
    await user.type(screen.getByLabelText('业务记录编号'), 'SAMPLE-002')
    await user.type(screen.getByLabelText('处理说明'), '供应商已提交确认样')
    await user.click(screen.getByRole('button', { name: '保存并完成节点' }))

    await waitFor(() => expect(syncSpy).toHaveBeenCalledTimes(1))
    expect(screen.getByLabelText('业务记录编号')).toHaveValue('SAMPLE-002')
    expect(screen.getByLabelText('处理说明')).toHaveValue('供应商已提交确认样')
  })

  it('模板保存失败时保留模板名与节点天数', async () => {
    window.history.replaceState({}, '', '/')
    mockWorkspace([followupPlan])
    const updateSpy = vi
      .spyOn(api, 'updateFollowupTemplate')
      .mockRejectedValueOnce(new Error('boom'))
    const user = userEvent.setup()
    render(<FollowupPage detailId={null} onNavigate={onNavigate} />)

    await user.click(screen.getByRole('button', { name: '配置/生成' }))
    const nameInput = screen.getByLabelText('模板名称')
    await user.clear(nameInput)
    await user.type(nameInput, '新模板')
    await user.clear(fieldByLabel('确认样提交日期'))
    await user.type(fieldByLabel('确认样提交日期'), '5')
    await user.click(screen.getByRole('button', { name: '保存跟单模板' }))

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(1))
    expect(updateSpy.mock.calls[0][1]).toMatchObject({
      name: '新模板',
      nodes: expect.arrayContaining([
        expect.objectContaining({ node_code: 'confirm_sample_submitted', standard_days: 5 }),
      ]),
    })
    expect(screen.getByLabelText('模板名称')).toHaveValue('新模板')
    expect(fieldByLabel('确认样提交日期')).toHaveValue(5)
  })
})
