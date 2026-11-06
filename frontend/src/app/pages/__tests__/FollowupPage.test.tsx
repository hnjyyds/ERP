import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '../../../api'
import type { PurchaseFollowPlan } from '../../../api'
import { FollowupPage } from '../purchase/FollowupPage'

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
    vi.spyOn(api, 'listFollowupPlans').mockResolvedValue({ items: [legacyLabelPlan], total: 1 })
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
    vi.spyOn(api, 'listFollowupPlans').mockResolvedValue({ items: [followupPlan], total: 1 })
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
})
