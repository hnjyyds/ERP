import { Alert, Button, Descriptions, Input, Modal, Table } from 'antd'
import { Plus, Search, ClipboardCheck, Receipt, Save } from 'lucide-react'
import { type Reimbursement } from '@/api'
import { FormSelect, PanelTitle } from '@/shared/ui'
import { canApproveAssignedRecord, formatFinanceAmount } from '@/app/pages/appHelpers'
import { reimbursementCategoryLabel, reimbursementStatusTag } from '@/app/pages/finance/financeHelpers'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import { t } from '@/app/appI18n'
import type { ReimbursementsModel } from '@/app/pages/finance/hooks/useReimbursementsModule'
import type { FinanceViewShell } from '@/app/pages/finance/financePageTypes'

type Props = {
  model: ReimbursementsModel
  shell: FinanceViewShell
}

export function ReimbursementsView({ model, shell }: Props) {
  const {
    changeReimbursementsPage,
    handleReimbursementApprove,
    handleReimbursementPay,
    loadingReimbursements,
    reimbursementCategoryFilter,
    reimbursementForm,
    reimbursementModalOpen,
    reimbursementPayMethod,
    reimbursementSearch,
    reimbursementStatusFilter,
    reimbursements,
    reimbursementsPagination,
    reimbursementsTotal,
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
      <section className="finance-settlement-grid" aria-label={t('finance.reimbursement.pageAria')}>
        <section className="workspace-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle
              icon={<Receipt size={18} />}
              title={t('finance.reimbursement.panel.list')}
            />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void changeReimbursementsPage(1, reimbursementsPagination.pageSize)
              }}
            >
              <label>
                {t('finance.reimbursement.filter.search')}
                <Input
                  value={reimbursementSearch}
                  placeholder={t('finance.reimbursement.filter.searchPlaceholder')}
                  onChange={(event) => setReimbursementSearch(event.target.value)}
                />
              </label>
              <label>
                {t('finance.reimbursement.filter.status')}
                <FormSelect
                  value={reimbursementStatusFilter}
                  onChange={(event) => setReimbursementStatusFilter(event.target.value)}
                >
                  <option value="">{t('finance.reimbursement.filter.allStatuses')}</option>
                  <option value="submitted">
                    {t('finance.reimbursement.status.submitted')}
                  </option>
                  <option value="approved">{t('finance.reimbursement.status.approved')}</option>
                  <option value="rejected">{t('finance.reimbursement.status.rejected')}</option>
                  <option value="paid">{t('finance.reimbursement.status.paid')}</option>
                </FormSelect>
              </label>
              <label>
                {t('finance.reimbursement.filter.category')}
                <FormSelect
                  value={reimbursementCategoryFilter}
                  onChange={(event) => setReimbursementCategoryFilter(event.target.value)}
                >
                  <option value="">{t('finance.reimbursement.filter.allCategories')}</option>
                  <option value="travel">{t('finance.reimbursement.category.travel')}</option>
                  <option value="office">{t('finance.reimbursement.category.office')}</option>
                  <option value="entertainment">
                    {t('finance.reimbursement.category.entertainment')}
                  </option>
                  <option value="other">{t('finance.reimbursement.category.other')}</option>
                </FormSelect>
              </label>
              <div className="filter-actions">
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.reimbursement.action.search')}
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setReimbursementModalOpen(true)}
                >
                  {t('finance.reimbursement.action.create')}
                </Button>
              </div>
            </form>
          </div>
          <Table<Reimbursement>
            columns={[
              {
                title: t('finance.reimbursement.table.reimbursementNo'),
                dataIndex: 'reimbursement_no',
              },
              {
                title: t('finance.reimbursement.table.applicant'),
                dataIndex: 'applicant_user_name',
              },
              { title: t('finance.reimbursement.table.department'), dataIndex: 'department' },
              {
                title: t('finance.reimbursement.table.category'),
                dataIndex: 'category',
                render: reimbursementCategoryLabel,
              },
              {
                title: t('finance.field.amount'),
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('finance.field.status'),
                dataIndex: 'status',
                render: reimbursementStatusTag,
              },
            ]}
            dataSource={reimbursements}
            loading={loadingReimbursements}
            pagination={{
              ...reimbursementsPagination,
              onChange: (nextPage, nextPageSize) => {
                void changeReimbursementsPage(nextPage, nextPageSize)
              },
            }}
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
            <span>{t('finance.reimbursement.metric.count', { count: reimbursementsTotal })}</span>
            <strong>{formatFinanceAmount(reimbursementsTotalAmount, 'CNY')}</strong>
          </div>
        </section>

        <section className="workspace-panel">
          <Modal
            centered
            footer={null}
            open={reimbursementModalOpen}
            title={t('finance.reimbursement.modal.createTitle')}
            width={720}
            onCancel={() => setReimbursementModalOpen(false)}
          >
            <form className="record-form" onSubmit={submitReimbursement}>
              <label>
                {t('finance.reimbursement.field.reimbursementNo')}
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
                {t('finance.reimbursement.field.applicantUserId')}
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
                {t('finance.reimbursement.field.applicantUserName')}
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
                {t('finance.reimbursement.field.department')}
                <Input
                  value={reimbursementForm.department}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, department: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                {t('finance.reimbursement.field.category')}
                <FormSelect
                  value={reimbursementForm.category}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                >
                  <option value="travel">{t('finance.reimbursement.category.travel')}</option>
                  <option value="office">{t('finance.reimbursement.category.office')}</option>
                  <option value="entertainment">
                    {t('finance.reimbursement.category.entertainment')}
                  </option>
                  <option value="other">{t('finance.reimbursement.category.other')}</option>
                </FormSelect>
              </label>
              <label>
                {t('finance.field.currency')}
                <Input
                  value={reimbursementForm.currency}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, currency: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                {t('finance.field.amount')}
                <Input
                  value={reimbursementForm.amount}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                {t('finance.reimbursement.field.reason')}
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
                {t('finance.reimbursement.action.submit')}
              </Button>
            </form>
          </Modal>

          {selectedReimbursement ? (
            <div className="finance-action-block">
              <PanelTitle
                icon={<ClipboardCheck size={18} />}
                title={t('finance.reimbursement.panel.approval')}
              />
              <Descriptions column={1} size="small">
                <Descriptions.Item label={t('finance.reimbursement.field.reimbursementNo')}>
                  {selectedReimbursement.reimbursement_no}
                </Descriptions.Item>
                <Descriptions.Item label={t('finance.reimbursement.field.currentStatus')}>
                  {reimbursementStatusTag(selectedReimbursement.status)}
                </Descriptions.Item>
                <Descriptions.Item label={t('finance.field.amount')}>
                  {formatFinanceAmount(
                    selectedReimbursement.amount,
                    selectedReimbursement.currency,
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={t('finance.reimbursement.field.approver')}>
                  {selectedReimbursement.reviewer_name ??
                    t('finance.reimbursement.field.unassigned')}
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
                  {t('finance.reimbursement.action.approve')}
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
                  {t('finance.reimbursement.action.reject')}
                </Button>
              </div>
              {selectedReimbursement.status === 'submitted' &&
              !canApproveAssignedRecord(
                currentUser,
                selectedReimbursement.reviewer_id,
                'finance:view',
              ) ? (
                <Alert
                  message={t('finance.reimbursement.message.pendingApproval', {
                    name:
                      selectedReimbursement.reviewer_name ??
                      t('finance.reimbursement.field.assignedApprover'),
                  })}
                  showIcon
                  type="info"
                />
              ) : null}
              <div className="finance-action-row">
                <FormSelect
                  value={reimbursementPayMethod}
                  onChange={(event) => setReimbursementPayMethod(event.target.value)}
                >
                  <option value="bank_transfer">
                    {t('finance.reimbursement.payMethod.bankTransfer')}
                  </option>
                  <option value="cash">{t('finance.reimbursement.payMethod.cash')}</option>
                  <option value="cheque">{t('finance.reimbursement.payMethod.cheque')}</option>
                  <option value="other">{t('finance.reimbursement.payMethod.other')}</option>
                </FormSelect>
                <Button
                  disabled={selectedReimbursement.status !== 'approved'}
                  loading={submittingReimbursementAction}
                  type="primary"
                  onClick={() => void handleReimbursementPay()}
                >
                  {t('finance.reimbursement.action.confirmPayment')}
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </section>
  )
}
