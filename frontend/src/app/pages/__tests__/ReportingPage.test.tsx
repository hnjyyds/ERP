import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApprovalDocument, ApprovalQuery, ReportingStatistics } from '../../../api'

vi.mock('../../App', () => ({
  t: (key: string, opts?: Record<string, unknown>) =>
    opts?.count != null ? `${key}${opts.count}` : key,
}))

vi.mock('../../../api', async () => {
  const actual = await vi.importActual<typeof import('../../../api')>('../../../api')
  return {
    ...actual,
    listApprovalDocuments: vi.fn(),
    listReportingStatistics: vi.fn(),
  }
})

import { listApprovalDocuments, listReportingStatistics } from '../../../api'
import { ReportingPage } from '../reporting/ReportingPage'

const emptyStatistics: ReportingStatistics = {
  summary: {
    date_from: null,
    date_to: null,
    currency_label: 'CNY',
    export_contract_count: 0,
    export_contract_amount: '0',
    purchase_contract_count: 0,
    purchase_contract_amount: '0',
    shipment_count: 0,
    shipment_receivable_amount: '0',
    shipment_profit_amount: '0',
    settlement_count: 0,
    settlement_gross_profit: '0',
  },
  export_contract_statuses: [],
  purchase_contract_statuses: [],
  export_contract_items: [],
  purchase_contract_items: [],
  customer_shipments: [],
  sales_monthly_shipments: [],
  shipment_items: [],
}

function approvalDocument(overrides: Partial<ApprovalDocument>): ApprovalDocument {
  return {
    document_type: 'export_contract',
    document_type_label: '出口合同',
    document_id: 'export-1',
    document_no: 'EC-001',
    counterparty_name: '测试客户',
    applicant_user_id: 'sales-1',
    applicant_user_name: '测试业务员',
    business_date: '2026-08-05',
    submitted_at: '2026-08-05T08:00:00',
    approved_at: null,
    status: 'submitted',
    status_label: '待审批',
    amount: '1200.00',
    currency: 'USD',
    source_path: '/sales/contracts/export-1',
    ...overrides,
  }
}

function approvalQuery(items: ApprovalDocument[]): ApprovalQuery {
  return {
    items,
    total: items.length,
    pending_count: items.filter((item) => item.status === 'submitted').length,
    approved_count: items.filter((item) => item.status === 'approved').length,
    type_summaries: [],
  }
}

describe('ReportingPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listApprovalDocuments).mockResolvedValue(approvalQuery([]))
    vi.mocked(listReportingStatistics).mockResolvedValue(emptyStatistics)
  })

  it('renders without crashing', () => {
    const { container } = render(<ReportingPage onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders summary strip', () => {
    render(<ReportingPage onNavigate={onNavigate} />)
    expect(screen.getByLabelText('经理查询概览')).toBeTruthy()
  })

  it('renders approval document query panel', () => {
    render(<ReportingPage onNavigate={onNavigate} />)
    expect(screen.getByText('审批单据查询')).toBeTruthy()
  })

  it('opens pending documents for approval and approved documents for details', async () => {
    const user = userEvent.setup()
    vi.mocked(listApprovalDocuments).mockResolvedValue(
      approvalQuery([
        approvalDocument({}),
        approvalDocument({
          document_type: 'purchase_contract',
          document_type_label: '采购合同',
          document_id: 'purchase-1',
          document_no: 'PC-001',
          status: 'approved',
          status_label: '已审批',
          source_path: '/purchase/contracts/purchase-1',
          approved_at: '2026-08-05T09:00:00',
        }),
      ]),
    )

    render(<ReportingPage onNavigate={onNavigate} />)

    await user.click(await screen.findByRole('button', { name: /去审批/ }))
    expect(onNavigate).toHaveBeenLastCalledWith('/sales/contracts/export-1')

    await user.click(screen.getByRole('button', { name: /查看详情/ }))
    expect(onNavigate).toHaveBeenLastCalledWith('/purchase/contracts/purchase-1')
  })

  it('does not navigate when the document type is unsupported', async () => {
    vi.mocked(listApprovalDocuments).mockResolvedValue(
      approvalQuery([
        approvalDocument({
          document_type: 'unsupported_document',
          document_type_label: '未知单据',
          document_id: 'unknown-1',
          document_no: 'UNKNOWN-001',
          source_path: '/unsupported/unknown-1',
        }),
      ]),
    )

    render(<ReportingPage onNavigate={onNavigate} />)

    expect(await screen.findByText('暂不支持')).toBeTruthy()
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
