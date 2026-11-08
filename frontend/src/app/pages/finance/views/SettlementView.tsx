import { Button, Descriptions, Input, Modal, Table } from 'antd'
import { ArrowLeft, Plus, Search, CheckCircle2, PackagePlus, Save, Wallet } from 'lucide-react'
import { type FinancialSettlement, type ProfitCostItem } from '@/api'
import { FormSelect, PanelTitle } from '@/shared/ui'
import { formatDate, formatFinanceAmount, formatPercent, nullableText } from '@/app/pages/appHelpers'
import {
  initialManualProfitCostForm,
  settlementStatusTag,
  profitCostTypeLabel,
  profitCostDirectionTag,
} from '@/app/pages/finance/financeHelpers'
import { t } from '@/app/appI18n'
import type { SettlementModel } from '@/app/pages/finance/hooks/useSettlementModule'
import type { FinanceViewShell } from '@/app/pages/finance/financePageTypes'

type Props = {
  model: SettlementModel
  shell: FinanceViewShell
}

export function SettlementView({ model, shell }: Props) {
  const {
    changeFinancialSettlementsPage,
    changeProfitCalculationsPage,
    financialSettlements,
    financialSettlementsPagination,
    financialSettlementsTotal,
    loadingFinancialSettlements,
    loadingProfitCalculations,
    manualProfitCostForm,
    profitCalculationSearch,
    profitCalculationShipmentFilter,
    profitCalculations,
    profitCalculationsPagination,
    profitCalculationsTotal,
    selectedFinancialSettlement,
    setManualProfitCostForm,
    setProfitCalculationSearch,
    setProfitCalculationShipmentFilter,
    setSelectedFinancialSettlementId,
    setSettlementForm,
    setSettlementModalOpen,
    setSettlementSearch,
    setSettlementShipmentFilter,
    settlementForm,
    settlementModalOpen,
    settlementSearch,
    settlementShipmentFilter,
    submitFinancialSettlement,
    submitManualProfitCost,
    submittingManualProfitCost,
    submittingSettlement,
    totalProfitCalculationGrossProfit,
    totalSettlementGrossProfit,
    totalSettlementSalesIncome,
  } = model
  const { detailId, goModule, goDetail, moduleAlerts, moduleHeader } = shell

  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button
            className="finance-back-button"
            type="button"
            onClick={() => goModule('settlement')}
          >
            <ArrowLeft size={16} />
            {t('finance.settlement.title')}
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-settlement-grid'}
        aria-label={t('finance.settlement.pageAria')}
      >
        {!detailId ? (
          <section className="workspace-panel finance-settlement-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<Wallet size={18} />}
                title={t('finance.settlement.panel.settlementList')}
              />
            </div>
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void changeFinancialSettlementsPage(1, financialSettlementsPagination.pageSize)
              }}
            >
              <label>
                {t('finance.settlement.filter.settlementSearch')}
                <Input
                  value={settlementSearch}
                  placeholder={t('finance.settlement.filter.searchPlaceholder')}
                  onChange={(event) => setSettlementSearch(event.target.value)}
                />
              </label>
              <label>
                {t('finance.settlement.field.shipmentNo')}
                <Input
                  value={settlementShipmentFilter}
                  onChange={(event) => setSettlementShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                {t('finance.settlement.action.search')}
              </Button>
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => setSettlementModalOpen(true)}
              >
                {t('finance.settlement.action.createSettlement')}
              </Button>
            </form>
            <div className="finance-receipt-strip">
              <span>
                {t('finance.settlement.metric.lockedCount', { count: financialSettlementsTotal })}
              </span>
              <strong>
                {formatFinanceAmount(
                  totalSettlementSalesIncome,
                  financialSettlements[0]?.currency ?? 'USD',
                )}
              </strong>
              <span>
                {t('finance.settlement.field.grossProfit')}{' '}
                {formatFinanceAmount(
                  totalSettlementGrossProfit,
                  financialSettlements[0]?.currency ?? 'USD',
                )}
              </span>
            </div>
            <Table<FinancialSettlement>
              columns={[
                {
                  title: t('finance.settlement.table.settlementNo'),
                  dataIndex: 'settlement_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: t('finance.settlement.table.shipmentNo'), dataIndex: 'shipment_no' },
                { title: t('finance.settlement.table.customer'), dataIndex: 'customer_name' },
                {
                  title: t('finance.settlement.table.settlementDate'),
                  dataIndex: 'settlement_date',
                  render: formatDate,
                },
                {
                  title: t('finance.settlement.table.salesIncome'),
                  dataIndex: 'sales_income',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.settlement.table.cost'),
                  dataIndex: 'purchase_cost_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.settlement.table.taxRefund'),
                  dataIndex: 'tax_refund_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.settlement.table.miscFee'),
                  dataIndex: 'misc_fee_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.settlement.table.manualCost'),
                  dataIndex: 'manual_cost_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.settlement.table.grossProfit'),
                  dataIndex: 'gross_profit',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.settlement.table.grossProfitRate'),
                  dataIndex: 'gross_profit_rate',
                  render: formatPercent,
                },
                {
                  title: t('finance.field.status'),
                  dataIndex: 'status',
                  render: settlementStatusTag,
                },
              ]}
              dataSource={financialSettlements}
              loading={loadingFinancialSettlements}
              pagination={{
                ...financialSettlementsPagination,
                onChange: (nextPage, nextPageSize) => {
                  void changeFinancialSettlementsPage(nextPage, nextPageSize)
                },
              }}
              rowClassName={(record) =>
                record.id === selectedFinancialSettlement?.id ? 'selected-row' : ''
              }
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedFinancialSettlementId(record.id)
                  setManualProfitCostForm(
                    initialManualProfitCostForm(record.currency, record.settlement_date),
                  )
                  goDetail('settlement', record.id)
                },
              })}
            />
          </section>
        ) : null}

        {!detailId ? (
          <Modal
            centered
            footer={null}
            open={settlementModalOpen}
            title={t('finance.settlement.modal.lockTitle')}
            width={640}
            onCancel={() => setSettlementModalOpen(false)}
          >
            <form
              className="record-form"
              onSubmit={(e) => {
                submitFinancialSettlement(e)
                setSettlementModalOpen(false)
              }}
            >
              <label>
                {t('finance.settlement.field.settlementNo')}
                <Input
                  readOnly
                  value={settlementForm.settlement_no}
                  placeholder={t('finance.form.codeAutoGenerated')}
                />
              </label>
              <label>
                {t('finance.settlement.field.shipmentPlanId')}
                <Input
                  required
                  value={settlementForm.shipment_plan_id}
                  onChange={(event) =>
                    setSettlementForm({ ...settlementForm, shipment_plan_id: event.target.value })
                  }
                />
              </label>
              <label>
                {t('finance.settlement.field.shipmentNo')}
                <Input
                  value={settlementForm.shipment_no}
                  onChange={(event) =>
                    setSettlementForm({ ...settlementForm, shipment_no: event.target.value })
                  }
                />
              </label>
              <label>
                {t('finance.settlement.field.settlementDate')}
                <Input
                  required
                  type="date"
                  value={settlementForm.settlement_date}
                  onChange={(event) =>
                    setSettlementForm({ ...settlementForm, settlement_date: event.target.value })
                  }
                />
              </label>
              <label>
                {t('finance.settlement.field.remark')}
                <textarea
                  aria-label={t('finance.settlement.field.settlementRemark')}
                  rows={3}
                  value={settlementForm.remark}
                  onChange={(event) =>
                    setSettlementForm({ ...settlementForm, remark: event.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  className="secondary-inline"
                  type="button"
                  onClick={() => setSettlementModalOpen(false)}
                >
                  {t('finance.settlement.action.cancel')}
                </button>
                <button className="inline-submit" disabled={submittingSettlement} type="submit">
                  {t('finance.settlement.action.lock')}
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-manual-cost-panel">
            <PanelTitle
              icon={<PackagePlus size={18} />}
              title={t('finance.settlement.panel.manualCostLink')}
            />
            {selectedFinancialSettlement ? (
              <Descriptions
                bordered
                className="finance-settlement-descriptions"
                column={2}
                items={[
                  {
                    key: 'settlement_no',
                    label: t('finance.settlement.field.settlementNo'),
                    children: selectedFinancialSettlement.settlement_no,
                  },
                  {
                    key: 'shipment_no',
                    label: t('finance.settlement.field.shipmentNo'),
                    children: selectedFinancialSettlement.shipment_no,
                  },
                  {
                    key: 'gross_profit',
                    label: t('finance.settlement.field.currentGrossProfit'),
                    children: formatFinanceAmount(
                      selectedFinancialSettlement.gross_profit,
                      selectedFinancialSettlement.currency,
                    ),
                  },
                  {
                    key: 'manual_cost_amount',
                    label: t('finance.settlement.field.manualCost'),
                    children: formatFinanceAmount(
                      selectedFinancialSettlement.manual_cost_amount,
                      selectedFinancialSettlement.currency,
                    ),
                  },
                ]}
                size="small"
              />
            ) : (
              <div className="module-state">{t('finance.settlement.message.noSettlement')}</div>
            )}
            <form className="record-form compact-section" onSubmit={submitManualProfitCost}>
              <label>
                {t('finance.settlement.field.costNo')}
                <Input
                  readOnly
                  value={manualProfitCostForm.cost_no}
                  placeholder={t('finance.form.codeAutoGenerated')}
                />
              </label>
              <label>
                {t('finance.settlement.field.costType')}
                <FormSelect
                  value={manualProfitCostForm.cost_type}
                  onChange={(event) =>
                    setManualProfitCostForm({
                      ...manualProfitCostForm,
                      cost_type: event.target.value,
                    })
                  }
                >
                  <option value="other_cost">{t('finance.report.costType.otherCost')}</option>
                </FormSelect>
              </label>
              <label>
                {t('finance.settlement.field.costDate')}
                <Input
                  required
                  type="date"
                  value={manualProfitCostForm.cost_date}
                  onChange={(event) =>
                    setManualProfitCostForm({
                      ...manualProfitCostForm,
                      cost_date: event.target.value,
                    })
                  }
                />
              </label>
              <div className="form-pair two">
                <label>
                  {t('finance.field.amount')}
                  <Input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={manualProfitCostForm.amount}
                    onChange={(event) =>
                      setManualProfitCostForm({
                        ...manualProfitCostForm,
                        amount: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.field.currency')}
                  <Input
                    required
                    value={manualProfitCostForm.currency}
                    onChange={(event) =>
                      setManualProfitCostForm({
                        ...manualProfitCostForm,
                        currency: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                {t('finance.settlement.field.sourceNo')}
                <Input
                  value={manualProfitCostForm.source_no}
                  onChange={(event) =>
                    setManualProfitCostForm({
                      ...manualProfitCostForm,
                      source_no: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                {t('finance.settlement.field.reason')}
                <Input
                  required
                  value={manualProfitCostForm.reason}
                  onChange={(event) =>
                    setManualProfitCostForm({
                      ...manualProfitCostForm,
                      reason: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                {t('finance.settlement.field.remark')}
                <textarea
                  aria-label={t('finance.settlement.field.manualCostRemark')}
                  rows={3}
                  value={manualProfitCostForm.remark}
                  onChange={(event) =>
                    setManualProfitCostForm({
                      ...manualProfitCostForm,
                      remark: event.target.value,
                    })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingManualProfitCost}
                disabled={!selectedFinancialSettlement}
              >
                {t('finance.settlement.action.linkCost')}
              </Button>
            </form>
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-profit-calculation-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<CheckCircle2 size={18} />}
                title={t('finance.settlement.panel.profitCalculation')}
              />
            </div>
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void changeProfitCalculationsPage(1, profitCalculationsPagination.pageSize)
              }}
            >
              <label>
                {t('finance.settlement.filter.profitSearch')}
                <Input
                  value={profitCalculationSearch}
                  placeholder={t('finance.settlement.filter.searchPlaceholder')}
                  onChange={(event) => setProfitCalculationSearch(event.target.value)}
                />
              </label>
              <label>
                {t('finance.settlement.field.shipmentNo')}
                <Input
                  value={profitCalculationShipmentFilter}
                  onChange={(event) => setProfitCalculationShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                {t('finance.settlement.action.search')}
              </Button>
            </form>
            <div className="finance-receipt-strip">
              <span>
                {t('finance.settlement.metric.profitCount', { count: profitCalculationsTotal })}
              </span>
              <strong>
                {formatFinanceAmount(
                  totalProfitCalculationGrossProfit,
                  profitCalculations[0]?.currency ?? 'USD',
                )}
              </strong>
              <span>{t('finance.settlement.metric.profitHint')}</span>
            </div>
            <Table<FinancialSettlement>
              columns={[
                {
                  title: t('finance.settlement.table.settlementNo'),
                  dataIndex: 'settlement_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: t('finance.settlement.table.shipmentNo'), dataIndex: 'shipment_no' },
                { title: t('finance.settlement.table.customer'), dataIndex: 'customer_name' },
                {
                  title: t('finance.settlement.table.salesIncome'),
                  dataIndex: 'sales_income',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.settlement.table.totalCost'),
                  render: (_, record) =>
                    formatFinanceAmount(
                      (
                        Number(record.purchase_cost_amount || 0) +
                        Number(record.partner_fee_amount || 0) +
                        Number(record.misc_fee_amount || 0) +
                        Number(record.manual_cost_amount || 0)
                      ).toFixed(2),
                      record.currency,
                    ),
                },
                {
                  title: t('finance.settlement.table.taxRefund'),
                  dataIndex: 'tax_refund_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.settlement.table.grossProfit'),
                  dataIndex: 'gross_profit',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.settlement.table.grossProfitRate'),
                  dataIndex: 'gross_profit_rate',
                  render: formatPercent,
                },
              ]}
              dataSource={profitCalculations}
              expandable={{
                expandedRowRender: (record) => (
                  <Table<ProfitCostItem>
                    columns={[
                      {
                        title: t('finance.settlement.table.costType'),
                        dataIndex: 'cost_type',
                        render: profitCostTypeLabel,
                      },
                      {
                        title: t('finance.settlement.table.direction'),
                        dataIndex: 'direction',
                        render: profitCostDirectionTag,
                      },
                      {
                        title: t('finance.settlement.table.source'),
                        dataIndex: 'source_no',
                        render: nullableText,
                      },
                      {
                        title: t('finance.settlement.table.date'),
                        dataIndex: 'cost_date',
                        render: formatDate,
                      },
                      {
                        title: t('finance.field.amount'),
                        dataIndex: 'amount',
                        render: (value: string, item) => formatFinanceAmount(value, item.currency),
                      },
                      {
                        title: t('finance.settlement.table.reason'),
                        dataIndex: 'reason',
                        render: nullableText,
                      },
                    ]}
                    dataSource={record.cost_items}
                    pagination={false}
                    rowKey="id"
                    size="small"
                  />
                ),
              }}
              loading={loadingProfitCalculations}
              pagination={{
                ...profitCalculationsPagination,
                onChange: (nextPage, nextPageSize) => {
                  void changeProfitCalculationsPage(nextPage, nextPageSize)
                },
              }}
              rowKey="id"
              size="small"
            />
          </section>
        ) : null}
      </section>
    </section>
  )
}
