import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, Plus, Search, CheckCircle2, Save, ShieldCheck, Wallet } from 'lucide-react'
import {
  type FeePayableItem,
  type FeePaymentRequest,
  type PartnerFeeInvoice,
} from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import {
  partnerFeeInvoiceStatusOptions,
  feeTypeOptions,
  partnerTypeOptions,
} from '../../../../shared/formOptions'
import { t } from '../../../appI18n'
import { formatFinanceAmount, nullableText } from '../../appHelpers'
import {
  initialFeePaymentRequestForm,
  initialFeePaymentApprovalForm,
  partnerFeeInvoiceStatusTag,
  feePaymentRequestStatusTag,
  feeTypeLabel,
} from '../financeHelpers'
import { ApprovalAssigneeSelect } from '../../../components/ApprovalAssigneeSelect'
import type { FeesModel } from '../hooks/useFeesModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: FeesModel
  shell: FinanceViewShell
}

export function FeesView({ model, shell }: Props) {
  const {
    feeInvoiceModalOpen,
    feeInvoicePartnerFilter,
    feeInvoiceSearch,
    feeInvoiceShipmentFilter,
    feeInvoiceStatusFilter,
    feeInvoiceTypeFilter,
    feePayablePartnerFilter,
    feePayableSearch,
    feePayableShipmentFilter,
    feePayableStatusFilter,
    feePayableTypeFilter,
    feePayables,
    feePaymentApprovalForm,
    feePaymentRequestForm,
    feePaymentRequests,
    loadFeePayables,
    loadPartnerFeeInvoices,
    loadingFeePayables,
    loadingFeePaymentRequests,
    loadingPartnerFeeInvoices,
    partnerFeeInvoiceForm,
    partnerFeeInvoices,
    selectedFeePaymentRequest,
    selectedFeePaymentRequestCanApprove,
    selectedPartnerFeeInvoice,
    setFeeInvoiceModalOpen,
    setFeeInvoicePartnerFilter,
    setFeeInvoiceSearch,
    setFeeInvoiceShipmentFilter,
    setFeeInvoiceStatusFilter,
    setFeeInvoiceTypeFilter,
    setFeePayablePartnerFilter,
    setFeePayableSearch,
    setFeePayableShipmentFilter,
    setFeePayableStatusFilter,
    setFeePayableTypeFilter,
    setFeePaymentApprovalForm,
    setFeePaymentRequestForm,
    setPartnerFeeInvoiceForm,
    setSelectedFeePaymentRequestId,
    setSelectedPartnerFeeInvoiceId,
    submitFeePaymentApproval,
    submitFeePaymentRequest,
    submitPartnerFeeInvoice,
    submittingFeePaymentApproval,
    submittingFeePaymentRequest,
    submittingPartnerFeeInvoice,
  } = model
  const { detailId, goModule, goDetail, moduleAlerts, moduleHeader, currentUser } = shell

  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button className="finance-back-button" type="button" onClick={() => goModule('fees')}>
            <ArrowLeft size={16} />
            付费管理
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-fee-grid'}
        aria-label="付费管理"
      >
        {!detailId ? (
          <section className="workspace-panel finance-fee-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Wallet size={18} />} title="合作伙伴费用发票" />
              <form
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadPartnerFeeInvoices()
                }}
              >
                <label>
                  费用发票搜索
                  <Input
                    value={feeInvoiceSearch}
                    onChange={(event) => setFeeInvoiceSearch(event.target.value)}
                  />
                </label>
                <label>
                  发票状态
                  <FormSelect
                    value={feeInvoiceStatusFilter}
                    onChange={(event) => setFeeInvoiceStatusFilter(event.target.value)}
                  >
                    <option value="">全部状态</option>
                    {partnerFeeInvoiceStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  费用类型
                  <FormSelect
                    value={feeInvoiceTypeFilter}
                    onChange={(event) => setFeeInvoiceTypeFilter(event.target.value)}
                  >
                    <option value="">全部类型</option>
                    {feeTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  合作伙伴标识
                  <Input
                    value={feeInvoicePartnerFilter}
                    onChange={(event) => setFeeInvoicePartnerFilter(event.target.value)}
                  />
                </label>
                <label>
                  出运单号
                  <Input
                    value={feeInvoiceShipmentFilter}
                    onChange={(event) => setFeeInvoiceShipmentFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setFeeInvoiceModalOpen(true)}
                >
                  发票登记
                </Button>
              </form>
            </div>
            <Table<PartnerFeeInvoice>
              columns={[
                {
                  title: '费用发票',
                  dataIndex: 'invoice_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: '状态', dataIndex: 'status', render: partnerFeeInvoiceStatusTag },
                { title: '合作伙伴', dataIndex: 'partner_name' },
                { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
                {
                  title: '发票金额',
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '未付',
                  dataIndex: 'unpaid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={partnerFeeInvoices}
              loading={loadingPartnerFeeInvoices}
              pagination={false}
              rowClassName={(record) =>
                record.id === selectedPartnerFeeInvoice?.id ? 'selected-row' : ''
              }
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedPartnerFeeInvoiceId(record.id)
                  setFeePaymentRequestForm(initialFeePaymentRequestForm(record))
                  setFeePaymentApprovalForm(
                    initialFeePaymentApprovalForm(record.unpaid_amount, currentUser.display_name),
                  )
                  goDetail('fees', record.id)
                },
              })}
            />
          </section>
        ) : null}

        {!detailId ? (
          <Modal
            centered
            footer={null}
            open={feeInvoiceModalOpen}
            title="费用发票登记"
            width={760}
            onCancel={() => setFeeInvoiceModalOpen(false)}
          >
            <form
              className="record-form"
              onSubmit={(e) => {
                submitPartnerFeeInvoice(e)
                setFeeInvoiceModalOpen(false)
              }}
            >
              <div className="form-pair two">
                <label>
                  费用发票号
                  <Input
                    value={partnerFeeInvoiceForm.invoice_no}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        invoice_no: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  发票日期
                  <Input
                    type="date"
                    value={partnerFeeInvoiceForm.invoice_date}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        invoice_date: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  合作伙伴标识
                  <Input
                    value={partnerFeeInvoiceForm.partner_id}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        partner_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  合作伙伴名称
                  <Input
                    value={partnerFeeInvoiceForm.partner_name}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        partner_name: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  合作伙伴类型
                  <FormSelect
                    value={partnerFeeInvoiceForm.partner_type}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        partner_type: event.target.value,
                      })
                    }
                  >
                    <option value="">自动匹配</option>
                    {partnerTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  费用类型
                  <FormSelect
                    value={partnerFeeInvoiceForm.fee_type}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        fee_type: event.target.value,
                      })
                    }
                  >
                    {feeTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  出运单标识
                  <Input
                    value={partnerFeeInvoiceForm.shipment_plan_id}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        shipment_plan_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  出运单号
                  <Input
                    value={partnerFeeInvoiceForm.shipment_no}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        shipment_no: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  业务员标识
                  <Input
                    value={partnerFeeInvoiceForm.sales_user_id}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        sales_user_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  业务员姓名
                  <Input
                    value={partnerFeeInvoiceForm.sales_user_name}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        sales_user_name: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  发票金额
                  <Input
                    value={partnerFeeInvoiceForm.total_amount}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        total_amount: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  币种
                  <Input
                    value={partnerFeeInvoiceForm.currency}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        currency: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  到期日
                  <Input
                    type="date"
                    value={partnerFeeInvoiceForm.due_date}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        due_date: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                备注
                <Input
                  value={partnerFeeInvoiceForm.remark}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({
                      ...partnerFeeInvoiceForm,
                      remark: event.target.value,
                    })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  className="secondary-inline"
                  type="button"
                  onClick={() => setFeeInvoiceModalOpen(false)}
                >
                  取消
                </button>
                <button
                  className="inline-submit"
                  disabled={submittingPartnerFeeInvoice}
                  type="submit"
                >
                  登记费用发票
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-fee-request-panel">
            <PanelTitle icon={<CheckCircle2 size={18} />} title="付费申请和审批" />
            {selectedPartnerFeeInvoice ? (
              <dl className="detail-list finance-fee-detail-list">
                <div>
                  <dt>当前费用发票</dt>
                  <dd>{selectedPartnerFeeInvoice.invoice_no}</dd>
                </div>
                <div>
                  <dt>费用类型</dt>
                  <dd>{feeTypeLabel(selectedPartnerFeeInvoice.fee_type)}</dd>
                </div>
                <div>
                  <dt>已付</dt>
                  <dd>
                    {formatFinanceAmount(
                      selectedPartnerFeeInvoice.paid_amount,
                      selectedPartnerFeeInvoice.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>未付</dt>
                  <dd>
                    {formatFinanceAmount(
                      selectedPartnerFeeInvoice.unpaid_amount,
                      selectedPartnerFeeInvoice.currency,
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="module-state">暂无合作伙伴费用发票</div>
            )}
            <div className="finance-receipt-actions">
              <form className="record-form compact-section" onSubmit={submitFeePaymentRequest}>
                <div className="form-divider">付费申请新增</div>
                <div className="finance-payment-fields">
                  <label>
                    付费申请号
                    <Input
                      value={feePaymentRequestForm.request_no}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          request_no: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    费用发票标识
                    <Input
                      value={feePaymentRequestForm.partner_fee_invoice_id}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          partner_fee_invoice_id: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    申请日期
                    <Input
                      type="date"
                      value={feePaymentRequestForm.request_date}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          request_date: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    申请金额
                    <Input
                      value={feePaymentRequestForm.requested_amount}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          requested_amount: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    币种
                    <Input
                      value={feePaymentRequestForm.currency}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          currency: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    申请备注
                    <Input
                      value={feePaymentRequestForm.remark}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          remark: event.target.value,
                        })
                      }
                    />
                  </label>
                  <ApprovalAssigneeSelect
                    currentUserId={currentUser.id}
                    onChange={(reviewer_id) =>
                      setFeePaymentRequestForm({ ...feePaymentRequestForm, reviewer_id })
                    }
                    requiredPermission="finance:view"
                    value={feePaymentRequestForm.reviewer_id}
                  />
                </div>
                <Button
                  htmlType="submit"
                  icon={<Save size={16} />}
                  loading={submittingFeePaymentRequest}
                  disabled={!selectedPartnerFeeInvoice || !feePaymentRequestForm.reviewer_id}
                >
                  新增付费申请
                </Button>
              </form>
              <form className="record-form compact-section" onSubmit={submitFeePaymentApproval}>
                <div className="form-divider">付费审批</div>
                <div className="finance-payment-fields">
                  <label>
                    审批金额
                    <Input
                      value={feePaymentApprovalForm.approved_amount}
                      onChange={(event) =>
                        setFeePaymentApprovalForm({
                          ...feePaymentApprovalForm,
                          approved_amount: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    审批日期
                    <Input
                      type="date"
                      value={feePaymentApprovalForm.approved_at}
                      onChange={(event) =>
                        setFeePaymentApprovalForm({
                          ...feePaymentApprovalForm,
                          approved_at: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    审批人
                    <Input disabled value={selectedFeePaymentRequest?.reviewer_name ?? ''} />
                  </label>
                  <label>
                    付款账号
                    <Input
                      value={feePaymentApprovalForm.payment_account}
                      onChange={(event) =>
                        setFeePaymentApprovalForm({
                          ...feePaymentApprovalForm,
                          payment_account: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    审批备注
                    <Input
                      value={feePaymentApprovalForm.remark}
                      onChange={(event) =>
                        setFeePaymentApprovalForm({
                          ...feePaymentApprovalForm,
                          remark: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <Button
                  htmlType="submit"
                  icon={<CheckCircle2 size={16} />}
                  loading={submittingFeePaymentApproval}
                  disabled={!selectedFeePaymentRequestCanApprove}
                >
                  审批付费
                </Button>
                {selectedFeePaymentRequest?.status === 'submitted' &&
                !selectedFeePaymentRequestCanApprove ? (
                  <Alert
                    showIcon
                    type="info"
                    message={`等待 ${selectedFeePaymentRequest.reviewer_name ?? '指定审批人'} 审批`}
                  />
                ) : null}
              </form>
            </div>
            <section className="finance-allocation-history">
              <strong>付费申请列表</strong>
              <Table<FeePaymentRequest>
                columns={[
                  {
                    title: '申请号',
                    dataIndex: 'request_no',
                    render: (value: string) => (
                      <button className="row-button" type="button">
                        {value}
                      </button>
                    ),
                  },
                  { title: '状态', dataIndex: 'status', render: feePaymentRequestStatusTag },
                  { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
                  { title: '合作伙伴', dataIndex: 'partner_name' },
                  { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                  {
                    title: '申请金额',
                    dataIndex: 'requested_amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                  {
                    title: '已付',
                    dataIndex: 'paid_amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                ]}
                dataSource={feePaymentRequests}
                loading={loadingFeePaymentRequests}
                pagination={false}
                rowClassName={(record) =>
                  record.id === selectedFeePaymentRequest?.id ? 'selected-row' : ''
                }
                rowKey="id"
                size="small"
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedFeePaymentRequestId(record.id)
                    setFeePaymentApprovalForm(
                      initialFeePaymentApprovalForm(
                        record.requested_amount,
                        currentUser.display_name,
                      ),
                    )
                  },
                })}
              />
            </section>
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-fee-payable-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<ShieldCheck size={18} />} title="应付费用查询" />
              <form
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadFeePayables()
                }}
              >
                <label>
                  应付费用搜索
                  <Input
                    value={feePayableSearch}
                    onChange={(event) => setFeePayableSearch(event.target.value)}
                  />
                </label>
                <label>
                  应付状态
                  <FormSelect
                    value={feePayableStatusFilter}
                    onChange={(event) => setFeePayableStatusFilter(event.target.value)}
                  >
                    <option value="">全部状态</option>
                    {partnerFeeInvoiceStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  费用类型
                  <FormSelect
                    value={feePayableTypeFilter}
                    onChange={(event) => setFeePayableTypeFilter(event.target.value)}
                  >
                    <option value="">全部类型</option>
                    {feeTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  合作伙伴标识
                  <Input
                    value={feePayablePartnerFilter}
                    onChange={(event) => setFeePayablePartnerFilter(event.target.value)}
                  />
                </label>
                <label>
                  出运单号
                  <Input
                    value={feePayableShipmentFilter}
                    onChange={(event) => setFeePayableShipmentFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
              </form>
            </div>
            <Table<FeePayableItem>
              columns={[
                {
                  title: '费用发票',
                  dataIndex: 'invoice_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: '合作伙伴', dataIndex: 'partner_name' },
                { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
                {
                  title: '发票金额',
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已付费',
                  dataIndex: 'paid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '应付余额',
                  dataIndex: 'payable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '状态', dataIndex: 'status', render: partnerFeeInvoiceStatusTag },
              ]}
              dataSource={feePayables}
              loading={loadingFeePayables}
              pagination={false}
              rowKey="partner_fee_invoice_id"
              size="small"
            />
          </section>
        ) : null}
      </section>
    </section>
  )
}
