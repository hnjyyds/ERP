import { Button, Input, Table } from 'antd'
import { Receipt, Search } from 'lucide-react'
import type { Reimbursement } from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { formatFinanceAmount } from '../../appHelpers'
import { reimbursementCategoryLabel, reimbursementStatusTag } from '../financeHelpers'
import type { FinancePageContext } from '../financeHelpers'

export function FinanceReimbursementsView({ ctx }: { ctx: FinancePageContext }) {
  const {
    moduleHeader, moduleAlerts,
    reimbursements, reimbursementsTotalAmount,
    selectedReimbursementId, setSelectedReimbursementId,
    reimbursementSearch, setReimbursementSearch,
    reimbursementStatusFilter, setReimbursementStatusFilter,
    reimbursementCategoryFilter, setReimbursementCategoryFilter,
    reimbursementForm, setReimbursementForm,
    reimbursementPayMethod, setReimbursementPayMethod,
    submittingReimbursement, submittingReimbursementAction,
    submitReimbursement, handleReimbursementApprove, handleReimbursementPay,
    loadReimbursements, loadingReimbursements,
  } = ctx
  const selectedReimbursement = reimbursements.find((item) => item.id === selectedReimbursementId) ?? null
  return (
    <section className="finance-page">
      {moduleHeader}
      {moduleAlerts}
      <section className="finance-reimbursement-grid" aria-label="报销管理">
      <section className="workspace-panel finance-reimbursement-list-panel">
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
              <Input value={reimbursementSearch} onChange={(event) => setReimbursementSearch(event.target.value)} />
            </label>
            <label>
              状态
              <FormSelect value={reimbursementStatusFilter} onChange={(event) => setReimbursementStatusFilter(event.target.value)}>
                <option value="">全部</option>
                <option value="draft">草稿</option>
                <option value="submitted">待审批</option>
                <option value="approved">已审批</option>
                <option value="paid">已付款</option>
                <option value="rejected">已驳回</option>
              </FormSelect>
            </label>
            <label>
              类别
              <FormSelect value={reimbursementCategoryFilter} onChange={(event) => setReimbursementCategoryFilter(event.target.value)}>
                <option value="">全部</option>
                <option value="travel">差旅</option>
                <option value="entertainment">招待</option>
                <option value="office">办公</option>
                <option value="other">其他</option>
              </FormSelect>
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <div className="finance-reimbursement-strip">
          <span>合计 {reimbursements.length} 条</span>
          <strong>总金额 {formatFinanceAmount(reimbursementsTotalAmount, '多币种')}</strong>
        </div>
        <Table<Reimbursement>
          columns={[
            {
              title: '报销单号',
              dataIndex: 'reimbursement_no',
              render: (value: string) => <button className="row-button" type="button">{value}</button>,
            },
            { title: '状态', dataIndex: 'status', render: reimbursementStatusTag },
            { title: '申请人', dataIndex: 'applicant_user_name' },
            { title: '部门', dataIndex: 'department', render: (value: string | null) => value ?? '-' },
            { title: '类别', dataIndex: 'category', render: reimbursementCategoryLabel },
            { title: '币种', dataIndex: 'currency' },
            {
              title: '金额',
              dataIndex: 'amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            { title: '事由', dataIndex: 'reason', render: (value: string | null) => value ?? '-' },
          ]}
          dataSource={reimbursements}
          loading={loadingReimbursements}
          pagination={false}
          rowClassName={(record) => (record.id === selectedReimbursementId ? 'selected-row' : '')}
          rowKey="id"
          size="small"
          onRow={(record) => ({
            onClick: () => setSelectedReimbursementId(record.id),
          })}
        />
      </section>

      <section className="workspace-panel finance-reimbursement-form-panel">
        <PanelTitle icon={<Receipt size={18} />} title="登记报销单" />
        <form className="record-form" onSubmit={submitReimbursement}>
          <div className="form-pair two">
            <label>
              报销单号
              <Input value={reimbursementForm.reimbursement_no} onChange={(event) => setReimbursementForm({ ...reimbursementForm, reimbursement_no: event.target.value })} />
            </label>
            <label>
              申请人标识
              <Input value={reimbursementForm.applicant_user_id} onChange={(event) => setReimbursementForm({ ...reimbursementForm, applicant_user_id: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              申请人姓名
              <Input value={reimbursementForm.applicant_user_name} onChange={(event) => setReimbursementForm({ ...reimbursementForm, applicant_user_name: event.target.value })} />
            </label>
            <label>
              部门
              <Input value={reimbursementForm.department} onChange={(event) => setReimbursementForm({ ...reimbursementForm, department: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              类别
              <FormSelect value={reimbursementForm.category} onChange={(event) => setReimbursementForm({ ...reimbursementForm, category: event.target.value })}>
                <option value="travel">差旅</option>
                <option value="entertainment">招待</option>
                <option value="office">办公</option>
                <option value="other">其他</option>
              </FormSelect>
            </label>
            <label>
              币种
              <Input value={reimbursementForm.currency} onChange={(event) => setReimbursementForm({ ...reimbursementForm, currency: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              金额
              <Input value={reimbursementForm.amount} onChange={(event) => setReimbursementForm({ ...reimbursementForm, amount: event.target.value })} />
            </label>
            <label>
              事由
              <Input value={reimbursementForm.reason} onChange={(event) => setReimbursementForm({ ...reimbursementForm, reason: event.target.value })} />
            </label>
          </div>
          <label>
            备注
            <Input value={reimbursementForm.remark} onChange={(event) => setReimbursementForm({ ...reimbursementForm, remark: event.target.value })} />
          </label>
          <Button htmlType="submit" icon={<Receipt size={16} />} loading={submittingReimbursement}>
            登记报销单
          </Button>
        </form>
      </section>

      {selectedReimbursement ? (
        <section className="workspace-panel finance-reimbursement-detail-panel">
          <PanelTitle icon={<Receipt size={18} />} title={`报销单 ${selectedReimbursement.reimbursement_no}`} />
          <dl className="detail-list">
            <div><dt>状态</dt><dd>{reimbursementStatusTag(selectedReimbursement.status)}</dd></div>
            <div><dt>申请人</dt><dd>{selectedReimbursement.applicant_user_name}</dd></div>
            <div><dt>部门</dt><dd>{selectedReimbursement.department ?? '-'}</dd></div>
            <div><dt>类别</dt><dd>{reimbursementCategoryLabel(selectedReimbursement.category)}</dd></div>
            <div><dt>币种</dt><dd>{selectedReimbursement.currency}</dd></div>
            <div><dt>金额</dt><dd>{formatFinanceAmount(selectedReimbursement.amount, selectedReimbursement.currency)}</dd></div>
            <div><dt>事由</dt><dd>{selectedReimbursement.reason ?? '-'}</dd></div>
            <div><dt>备注</dt><dd>{selectedReimbursement.remark ?? '-'}</dd></div>
            <div><dt>审批人</dt><dd>{selectedReimbursement.reviewer_name ?? '未审批'}</dd></div>
            <div><dt>付款方式</dt><dd>{selectedReimbursement.payment_method ?? '未付款'}</dd></div>
          </dl>
          <div className="finance-reimbursement-actions">
            <Button
              loading={submittingReimbursementAction}
              disabled={selectedReimbursement.status !== 'submitted'}
              onClick={() => void handleReimbursementApprove(true)}
            >
              审批通过
            </Button>
            <Button
              loading={submittingReimbursementAction}
              disabled={selectedReimbursement.status !== 'submitted'}
              onClick={() => void handleReimbursementApprove(false)}
            >
              驳回
            </Button>
            <div className="finance-reimbursement-pay">
              <FormSelect
                value={reimbursementPayMethod}
                onChange={(event) => setReimbursementPayMethod(event.target.value)}
              >
                <option value="bank_transfer">银行转账</option>
                <option value="cash">现金</option>
                <option value="other">其他</option>
              </FormSelect>
              <Button
                loading={submittingReimbursementAction}
                disabled={selectedReimbursement.status !== 'approved'}
                onClick={() => void handleReimbursementPay()}
              >
                付款
              </Button>
            </div>
          </div>
        </section>
      ) : null}
      </section>
    </section>
  )
}
