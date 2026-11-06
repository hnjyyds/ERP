import { Button, Input, Modal, Table } from 'antd'
import {
  ArrowLeft,
  LayoutDashboard,
  Plus,
  Search,
  CheckCircle2,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { type VerificationDocument, type VerificationUsageItem } from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { t } from '../../../appI18n'
import {
  verificationDocumentStatusOptions,
  verificationReminderStatusOptions,
} from '../../../../shared/formOptions'
import { formatDate, formatFinanceAmount, nullableText } from '../../appHelpers'
import {
  initialTaxRefundForm,
  verificationDocumentStatusLabel,
  verificationDocumentStatusTag,
  verificationReminderStatusTag,
} from '../financeHelpers'
import type { TaxModel } from '../hooks/useTaxModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: TaxModel
  shell: FinanceViewShell
}

export function TaxView({ model, shell }: Props) {
  const {
    customsReceiptForm,
    loadVerificationDocuments,
    loadVerificationUsage,
    loadingVerificationDocuments,
    loadingVerificationUsage,
    selectedVerificationCanRefund,
    selectedVerificationCanRegisterCustoms,
    selectedVerificationCanVerify,
    selectedVerificationDocument,
    setCustomsReceiptForm,
    setSelectedVerificationDocumentId,
    setTaxDocumentModalOpen,
    setTaxRefundForm,
    setVerificationDocumentForm,
    setVerificationOwnerFilter,
    setVerificationRegisterForm,
    setVerificationReminderFilter,
    setVerificationSearch,
    setVerificationShipmentFilter,
    setVerificationStatusFilter,
    setVerificationUsageReminderFilter,
    setVerificationUsageSearch,
    setVerificationUsageShipmentFilter,
    setVerificationUsageStatusFilter,
    submitCustomsReceipt,
    submitTaxRefund,
    submitVerificationDocument,
    submitVerificationRegister,
    submittingCustomsReceipt,
    submittingTaxRefund,
    submittingVerificationDocument,
    submittingVerificationRegister,
    taxDocumentModalOpen,
    taxRefundForm,
    verificationDocumentForm,
    verificationDocuments,
    verificationOwnerFilter,
    verificationRegisterForm,
    verificationReminderFilter,
    verificationSearch,
    verificationShipmentFilter,
    verificationStatusFilter,
    verificationUsage,
    verificationUsageReminderFilter,
    verificationUsageSearch,
    verificationUsageShipmentFilter,
    verificationUsageStatusFilter,
  } = model
  const { detailId, goModule, goDetail, moduleAlerts, moduleHeader } = shell

  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button className="finance-back-button" type="button" onClick={() => goModule('tax')}>
            <ArrowLeft size={16} />
            核销退税
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-tax-grid'}
        aria-label="核销退税"
      >
        {!detailId ? (
          <section className="workspace-panel finance-tax-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<ShieldCheck size={18} />} title="核销单列表" />
              <form
                aria-label="核销单筛选"
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadVerificationDocuments()
                }}
              >
                <label>
                  核销单搜索
                  <Input
                    value={verificationSearch}
                    onChange={(event) => setVerificationSearch(event.target.value)}
                  />
                </label>
                <label>
                  进度状态
                  <FormSelect
                    value={verificationStatusFilter}
                    onChange={(event) => setVerificationStatusFilter(event.target.value)}
                  >
                    <option value="">全部状态</option>
                    {verificationDocumentStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  提醒状态
                  <FormSelect
                    value={verificationReminderFilter}
                    onChange={(event) => setVerificationReminderFilter(event.target.value)}
                  >
                    <option value="">全部提醒</option>
                    {verificationReminderStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  业务员标识
                  <Input
                    value={verificationOwnerFilter}
                    onChange={(event) => setVerificationOwnerFilter(event.target.value)}
                  />
                </label>
                <label>
                  出运单号
                  <Input
                    value={verificationShipmentFilter}
                    onChange={(event) => setVerificationShipmentFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setTaxDocumentModalOpen(true)}
                >
                  领用核销单
                </Button>
              </form>
            </div>
            <Table<VerificationDocument>
              columns={[
                {
                  title: '核销单',
                  dataIndex: 'document_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: '状态', dataIndex: 'status', render: verificationDocumentStatusTag },
                {
                  title: '提醒',
                  dataIndex: 'reminder_status',
                  render: verificationReminderStatusTag,
                },
                { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                { title: '有效期', dataIndex: 'valid_until', render: formatDate },
                {
                  title: '可退税',
                  dataIndex: 'refundable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已退税',
                  dataIndex: 'refunded_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={verificationDocuments}
              loading={loadingVerificationDocuments}
              pagination={false}
              rowClassName={(record) =>
                record.id === selectedVerificationDocument?.id ? 'selected-row' : ''
              }
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedVerificationDocumentId(record.id)
                  setTaxRefundForm(initialTaxRefundForm(record.currency, record.unrefunded_amount))
                  goDetail('tax', record.id)
                },
              })}
            />
          </section>
        ) : null}

        {!detailId ? (
          <Modal
            centered
            footer={null}
            open={taxDocumentModalOpen}
            title="核销单领用"
            width={760}
            onCancel={() => setTaxDocumentModalOpen(false)}
          >
            <form
              className="record-form"
              onSubmit={(e) => {
                submitVerificationDocument(e)
                setTaxDocumentModalOpen(false)
              }}
            >
              <div className="form-pair two">
                <label>
                  核销单号
                  <Input
                    value={verificationDocumentForm.document_no}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        document_no: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  领用日期
                  <Input
                    type="date"
                    value={verificationDocumentForm.received_at}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        received_at: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  出运单标识
                  <Input
                    value={verificationDocumentForm.shipment_plan_id}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        shipment_plan_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  出运单号
                  <Input
                    value={verificationDocumentForm.shipment_no}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
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
                    value={verificationDocumentForm.owner_user_id}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        owner_user_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  业务员姓名
                  <Input
                    value={verificationDocumentForm.owner_user_name}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        owner_user_name: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  客户名称
                  <Input
                    value={verificationDocumentForm.customer_name}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        customer_name: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  有效期至
                  <Input
                    type="date"
                    value={verificationDocumentForm.valid_until}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        valid_until: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  可退税金额
                  <Input
                    value={verificationDocumentForm.refundable_amount}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        refundable_amount: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  币种
                  <Input
                    value={verificationDocumentForm.currency}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        currency: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                备注
                <Input
                  value={verificationDocumentForm.remark}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      remark: event.target.value,
                    })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  className="secondary-inline"
                  type="button"
                  onClick={() => setTaxDocumentModalOpen(false)}
                >
                  取消
                </button>
                <button
                  className="inline-submit"
                  disabled={submittingVerificationDocument}
                  type="submit"
                >
                  领用核销单
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-tax-process-panel">
            <PanelTitle icon={<CheckCircle2 size={18} />} title="回单、核销和退税登记" />
            {selectedVerificationDocument ? (
              <dl className="detail-list finance-tax-detail-list">
                <div>
                  <dt>当前核销单</dt>
                  <dd>{selectedVerificationDocument.document_no}</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{verificationDocumentStatusLabel(selectedVerificationDocument.status)}</dd>
                </div>
                <div>
                  <dt>未退税</dt>
                  <dd>
                    {formatFinanceAmount(
                      selectedVerificationDocument.unrefunded_amount,
                      selectedVerificationDocument.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>提醒日</dt>
                  <dd>{formatDate(selectedVerificationDocument.reminder_date)}</dd>
                </div>
              </dl>
            ) : (
              <div className="module-state">暂无核销单</div>
            )}
            <div className="finance-tax-actions">
              <form className="record-form compact-section" onSubmit={submitCustomsReceipt}>
                <div className="form-divider">报关回单登记</div>
                <div className="form-pair two">
                  <label>
                    报关单号
                    <Input
                      value={customsReceiptForm.customs_declaration_no}
                      onChange={(event) =>
                        setCustomsReceiptForm({
                          ...customsReceiptForm,
                          customs_declaration_no: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    回单号
                    <Input
                      value={customsReceiptForm.customs_receipt_no}
                      onChange={(event) =>
                        setCustomsReceiptForm({
                          ...customsReceiptForm,
                          customs_receipt_no: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <div className="form-pair two">
                  <label>
                    回单日期
                    <Input
                      type="date"
                      value={customsReceiptForm.received_at}
                      onChange={(event) =>
                        setCustomsReceiptForm({
                          ...customsReceiptForm,
                          received_at: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    回单备注
                    <Input
                      value={customsReceiptForm.remark}
                      onChange={(event) =>
                        setCustomsReceiptForm({
                          ...customsReceiptForm,
                          remark: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <Button
                  htmlType="submit"
                  icon={<Save size={16} />}
                  loading={submittingCustomsReceipt}
                  disabled={!selectedVerificationCanRegisterCustoms}
                >
                  登记回单
                </Button>
              </form>

              <form className="record-form compact-section" onSubmit={submitVerificationRegister}>
                <div className="form-divider">核销登记</div>
                <div className="form-pair two">
                  <label>
                    核销编号
                    <Input
                      value={verificationRegisterForm.verification_no}
                      onChange={(event) =>
                        setVerificationRegisterForm({
                          ...verificationRegisterForm,
                          verification_no: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    核销日期
                    <Input
                      type="date"
                      value={verificationRegisterForm.verified_at}
                      onChange={(event) =>
                        setVerificationRegisterForm({
                          ...verificationRegisterForm,
                          verified_at: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  核销备注
                  <Input
                    value={verificationRegisterForm.remark}
                    onChange={(event) =>
                      setVerificationRegisterForm({
                        ...verificationRegisterForm,
                        remark: event.target.value,
                      })
                    }
                  />
                </label>
                <Button
                  htmlType="submit"
                  icon={<CheckCircle2 size={16} />}
                  loading={submittingVerificationRegister}
                  disabled={!selectedVerificationCanVerify}
                >
                  登记核销
                </Button>
              </form>

              <form className="record-form compact-section" onSubmit={submitTaxRefund}>
                <div className="form-divider">退税登记</div>
                <div className="form-pair two">
                  <label>
                    退税编号
                    <Input
                      value={taxRefundForm.refund_no}
                      onChange={(event) =>
                        setTaxRefundForm({ ...taxRefundForm, refund_no: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    退税日期
                    <Input
                      type="date"
                      value={taxRefundForm.refunded_at}
                      onChange={(event) =>
                        setTaxRefundForm({ ...taxRefundForm, refunded_at: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="form-pair three">
                  <label>
                    退税金额
                    <Input
                      value={taxRefundForm.amount}
                      onChange={(event) =>
                        setTaxRefundForm({ ...taxRefundForm, amount: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    币种
                    <Input
                      value={taxRefundForm.currency}
                      onChange={(event) =>
                        setTaxRefundForm({ ...taxRefundForm, currency: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    银行水单号
                    <Input
                      value={taxRefundForm.bank_receipt_no}
                      onChange={(event) =>
                        setTaxRefundForm({
                          ...taxRefundForm,
                          bank_receipt_no: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  退税备注
                  <Input
                    value={taxRefundForm.remark}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, remark: event.target.value })
                    }
                  />
                </label>
                <Button
                  htmlType="submit"
                  icon={<Save size={16} />}
                  loading={submittingTaxRefund}
                  disabled={!selectedVerificationCanRefund}
                >
                  登记退税
                </Button>
              </form>
            </div>
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-tax-usage-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<LayoutDashboard size={18} />} title="核销单使用情况查询" />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadVerificationUsage()
                }}
              >
                <label>
                  使用情况搜索
                  <Input
                    value={verificationUsageSearch}
                    onChange={(event) => setVerificationUsageSearch(event.target.value)}
                  />
                </label>
                <label>
                  进度状态
                  <FormSelect
                    value={verificationUsageStatusFilter}
                    onChange={(event) => setVerificationUsageStatusFilter(event.target.value)}
                  >
                    <option value="">全部状态</option>
                    {verificationDocumentStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  提醒状态
                  <FormSelect
                    value={verificationUsageReminderFilter}
                    onChange={(event) => setVerificationUsageReminderFilter(event.target.value)}
                  >
                    <option value="">全部提醒</option>
                    {verificationReminderStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  出运单号
                  <Input
                    value={verificationUsageShipmentFilter}
                    onChange={(event) => setVerificationUsageShipmentFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
              </form>
            </div>
            <Table<VerificationUsageItem>
              columns={[
                {
                  title: '核销单',
                  dataIndex: 'document_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                { title: '业务员', dataIndex: 'owner_user_name', render: nullableText },
                { title: '状态', dataIndex: 'status', render: verificationDocumentStatusTag },
                {
                  title: '提醒',
                  dataIndex: 'reminder_status',
                  render: verificationReminderStatusTag,
                },
                {
                  title: '可退税',
                  dataIndex: 'refundable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已退税',
                  dataIndex: 'refunded_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '回单号', dataIndex: 'customs_receipt_no', render: nullableText },
                { title: '核销编号', dataIndex: 'verification_no', render: nullableText },
              ]}
              dataSource={verificationUsage}
              loading={loadingVerificationUsage}
              pagination={false}
              rowKey="verification_document_id"
              size="small"
            />
          </section>
        ) : null}
      </section>
    </section>
  )
}
