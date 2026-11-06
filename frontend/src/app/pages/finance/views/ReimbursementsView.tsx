import { Alert, Button, Descriptions, Input, Modal, Table } from 'antd'
import { Plus, Search, ClipboardCheck, Receipt, Save } from 'lucide-react'
import { type Reimbursement } from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { canApproveAssignedRecord, formatFinanceAmount } from '../../appHelpers'
import { reimbursementCategoryLabel, reimbursementStatusTag } from '../financeHelpers'
import { ApprovalAssigneeSelect } from '../../../components/ApprovalAssigneeSelect'
import type { ReimbursementsModel } from '../hooks/useReimbursementsModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: ReimbursementsModel
  shell: FinanceViewShell
}

export function ReimbursementsView({ model, shell }: Props) {
  const {
    handleReimbursementApprove,
    handleReimbursementPay,
    loadReimbursements,
    loadingReimbursements,
    reimbursementCategoryFilter,
    reimbursementForm,
    reimbursementModalOpen,
    reimbursementPayMethod,
    reimbursementSearch,
    reimbursementStatusFilter,
    reimbursements,
    reimbursementsTotalAmount,
    selectedReimbursementId,
    setReimbursementCategoryFilter,
    setReimbursementForm,
    setReimbursementModalOpen,
    setReimbursementPayMethod,
    setReimbursementSearch,
    setReimbursementStatusFilter,
    setSelectedReimbursementId,
    submitReimbursement,
    submittingReimbursement,
    submittingReimbursementAction,
  } = model
  const { moduleAlerts, moduleHeader, currentUser } = shell

  const selectedReimbursement =
    reimbursements.find((item) => item.id === selectedReimbursementId) ?? reimbursements[0] ?? null
  return (
    <section className="finance-page">
      {moduleHeader}
      {moduleAlerts}
      <section className="finance-settlement-grid" aria-label="报销管理">
        <section className="workspace-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Receipt size={18} />} title="报销单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadReimbursements()
              }}
            >
              <label>
                搜索
                <Input
                  value={reimbursementSearch}
                  placeholder="单号 / 申请人 / 部门"
                  onChange={(event) => setReimbursementSearch(event.target.value)}
                />
              </label>
              <label>
                状态
                <FormSelect
                  value={reimbursementStatusFilter}
                  onChange={(event) => setReimbursementStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  <option value="submitted">待审批</option>
                  <option value="approved">已审批</option>
                  <option value="rejected">已驳回</option>
                  <option value="paid">已付款</option>
                </FormSelect>
              </label>
              <label>
                分类
                <FormSelect
                  value={reimbursementCategoryFilter}
                  onChange={(event) => setReimbursementCategoryFilter(event.target.value)}
                >
                  <option value="">全部分类</option>
                  <option value="travel">差旅</option>
                  <option value="office">办公</option>
                  <option value="entertainment">招待</option>
                  <option value="other">其他</option>
                </FormSelect>
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => setReimbursementModalOpen(true)}
              >
                新增报销
              </Button>
            </form>
          </div>
          <Table<Reimbursement>
            columns={[
              { title: '报销单号', dataIndex: 'reimbursement_no' },
              { title: '申请人', dataIndex: 'applicant_user_name' },
              { title: '部门', dataIndex: 'department' },
              { title: '分类', dataIndex: 'category', render: reimbursementCategoryLabel },
              {
                title: '金额',
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '状态', dataIndex: 'status', render: reimbursementStatusTag },
            ]}
            dataSource={reimbursements}
            loading={loadingReimbursements}
            pagination={false}
            rowClassName={(record) =>
              record.id === selectedReimbursement?.id ? 'selected-row' : ''
            }
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedReimbursementId(record.id),
            })}
          />
          <div className="finance-receipt-strip">
            <span>报销单 {reimbursements.length} 条</span>
            <strong>{formatFinanceAmount(reimbursementsTotalAmount, 'CNY')}</strong>
          </div>
        </section>

        <section className="workspace-panel">
          <Modal
            centered
            footer={null}
            open={reimbursementModalOpen}
            title="新增报销单"
            width={720}
            onCancel={() => setReimbursementModalOpen(false)}
          >
            <form className="record-form" onSubmit={submitReimbursement}>
              <label>
                报销单号
                <Input
                  value={reimbursementForm.reimbursement_no}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({
                      ...prev,
                      reimbursement_no: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                申请人工号
                <Input
                  value={reimbursementForm.applicant_user_id}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({
                      ...prev,
                      applicant_user_id: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                申请人姓名
                <Input
                  value={reimbursementForm.applicant_user_name}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({
                      ...prev,
                      applicant_user_name: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                部门
                <Input
                  value={reimbursementForm.department}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, department: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                分类
                <FormSelect
                  value={reimbursementForm.category}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                >
                  <option value="travel">差旅</option>
                  <option value="office">办公</option>
                  <option value="entertainment">招待</option>
                  <option value="other">其他</option>
                </FormSelect>
              </label>
              <label>
                币种
                <Input
                  value={reimbursementForm.currency}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, currency: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                金额
                <Input
                  value={reimbursementForm.amount}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                事由
                <Input
                  value={reimbursementForm.reason}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                />
              </label>
              <ApprovalAssigneeSelect
                currentUserId={currentUser.id}
                onChange={(reviewer_id) =>
                  setReimbursementForm((previous) => ({ ...previous, reviewer_id }))
                }
                requiredPermission="finance:view"
                value={reimbursementForm.reviewer_id}
              />
              <Button
                disabled={!reimbursementForm.reviewer_id}
                htmlType="submit"
                type="primary"
                loading={submittingReimbursement}
                icon={<Save size={16} />}
              >
                登记报销单
              </Button>
            </form>
          </Modal>

          {selectedReimbursement ? (
            <div className="finance-action-block">
              <PanelTitle icon={<ClipboardCheck size={18} />} title="审批与付款" />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="报销单号">
                  {selectedReimbursement.reimbursement_no}
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  {reimbursementStatusTag(selectedReimbursement.status)}
                </Descriptions.Item>
                <Descriptions.Item label="金额">
                  {formatFinanceAmount(
                    selectedReimbursement.amount,
                    selectedReimbursement.currency,
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="审批人">
                  {selectedReimbursement.reviewer_name ?? '未指定'}
                </Descriptions.Item>
              </Descriptions>
              <div className="finance-action-row">
                <Button
                  disabled={
                    selectedReimbursement.status !== 'submitted' ||
                    !canApproveAssignedRecord(
                      currentUser,
                      selectedReimbursement.reviewer_id,
                      'finance:view',
                    )
                  }
                  loading={submittingReimbursementAction}
                  type="primary"
                  onClick={() => void handleReimbursementApprove(true)}
                >
                  审批通过
                </Button>
                <Button
                  disabled={
                    selectedReimbursement.status !== 'submitted' ||
                    !canApproveAssignedRecord(
                      currentUser,
                      selectedReimbursement.reviewer_id,
                      'finance:view',
                    )
                  }
                  loading={submittingReimbursementAction}
                  danger
                  onClick={() => void handleReimbursementApprove(false)}
                >
                  驳回
                </Button>
              </div>
              {selectedReimbursement.status === 'submitted' &&
              !canApproveAssignedRecord(
                currentUser,
                selectedReimbursement.reviewer_id,
                'finance:view',
              ) ? (
                <Alert
                  message={`等待 ${selectedReimbursement.reviewer_name ?? '指定审批人'} 审批`}
                  showIcon
                  type="info"
                />
              ) : null}
              <div className="finance-action-row">
                <FormSelect
                  value={reimbursementPayMethod}
                  onChange={(event) => setReimbursementPayMethod(event.target.value)}
                >
                  <option value="bank_transfer">银行转账</option>
                  <option value="cash">现金</option>
                  <option value="cheque">支票</option>
                  <option value="other">其他</option>
                </FormSelect>
                <Button
                  disabled={selectedReimbursement.status !== 'approved'}
                  loading={submittingReimbursementAction}
                  type="primary"
                  onClick={() => void handleReimbursementPay()}
                >
                  确认付款
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </section>
  )
}
