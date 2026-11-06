import { Button, Descriptions, Input, Modal, Table } from 'antd'
import { ArrowLeft, Plus, Search, CheckCircle2, PackagePlus, Save, Wallet } from 'lucide-react'
import { type FinancialSettlement, type ProfitCostItem } from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { formatDate, formatFinanceAmount, formatPercent, nullableText } from '../../appHelpers'
import {
  initialManualProfitCostForm,
  settlementStatusTag,
  profitCostTypeLabel,
  profitCostDirectionTag,
} from '../financeHelpers'
import type { SettlementModel } from '../hooks/useSettlementModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: SettlementModel
  shell: FinanceViewShell
}

export function SettlementView({ model, shell }: Props) {
  const {
    financialSettlements,
    loadFinancialSettlements,
    loadProfitCalculations,
    loadingFinancialSettlements,
    loadingProfitCalculations,
    manualProfitCostForm,
    profitCalculationSearch,
    profitCalculationShipmentFilter,
    profitCalculations,
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
            结算核算
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-settlement-grid'}
        aria-label="财务结算和利润核算"
      >
        {!detailId ? (
          <section className="workspace-panel finance-settlement-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Wallet size={18} />} title="财务结算列表" />
            </div>
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadFinancialSettlements()
              }}
            >
              <label>
                结算搜索
                <Input
                  value={settlementSearch}
                  placeholder="结算单 / 出运单 / 客户"
                  onChange={(event) => setSettlementSearch(event.target.value)}
                />
              </label>
              <label>
                出运单号
                <Input
                  value={settlementShipmentFilter}
                  onChange={(event) => setSettlementShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => setSettlementModalOpen(true)}
              >
                新增结算
              </Button>
            </form>
            <div className="finance-receipt-strip">
              <span>锁定结算 {financialSettlements.length} 单</span>
              <strong>
                {formatFinanceAmount(
                  totalSettlementSalesIncome.toFixed(2),
                  financialSettlements[0]?.currency ?? 'USD',
                )}
              </strong>
              <span>
                毛利{' '}
                {formatFinanceAmount(
                  totalSettlementGrossProfit.toFixed(2),
                  financialSettlements[0]?.currency ?? 'USD',
                )}
              </span>
            </div>
            <Table<FinancialSettlement>
              columns={[
                {
                  title: '结算单',
                  dataIndex: 'settlement_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: '出运单', dataIndex: 'shipment_no' },
                { title: '客户', dataIndex: 'customer_name' },
                { title: '结算日', dataIndex: 'settlement_date', render: formatDate },
                {
                  title: '收入',
                  dataIndex: 'sales_income',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '成本',
                  dataIndex: 'purchase_cost_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '退税',
                  dataIndex: 'tax_refund_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '杂费',
                  dataIndex: 'misc_fee_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '手工成本',
                  dataIndex: 'manual_cost_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '毛利',
                  dataIndex: 'gross_profit',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '毛利率', dataIndex: 'gross_profit_rate', render: formatPercent },
                { title: '状态', dataIndex: 'status', render: settlementStatusTag },
              ]}
              dataSource={financialSettlements}
              loading={loadingFinancialSettlements}
              pagination={false}
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
            title="单票结算锁定"
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
                结算单号
                <Input
                  required
                  value={settlementForm.settlement_no}
                  onChange={(event) =>
                    setSettlementForm({ ...settlementForm, settlement_no: event.target.value })
                  }
                />
              </label>
              <label>
                出运单 ID
                <Input
                  required
                  value={settlementForm.shipment_plan_id}
                  onChange={(event) =>
                    setSettlementForm({ ...settlementForm, shipment_plan_id: event.target.value })
                  }
                />
              </label>
              <label>
                出运单号
                <Input
                  value={settlementForm.shipment_no}
                  onChange={(event) =>
                    setSettlementForm({ ...settlementForm, shipment_no: event.target.value })
                  }
                />
              </label>
              <label>
                结算日期
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
                备注
                <textarea
                  aria-label="结算备注"
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
                  取消
                </button>
                <button className="inline-submit" disabled={submittingSettlement} type="submit">
                  锁定结算
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-manual-cost-panel">
            <PanelTitle icon={<PackagePlus size={18} />} title="手工成本关联" />
            {selectedFinancialSettlement ? (
              <Descriptions
                bordered
                className="finance-settlement-descriptions"
                column={2}
                items={[
                  {
                    key: 'settlement_no',
                    label: '结算单',
                    children: selectedFinancialSettlement.settlement_no,
                  },
                  {
                    key: 'shipment_no',
                    label: '出运单',
                    children: selectedFinancialSettlement.shipment_no,
                  },
                  {
                    key: 'gross_profit',
                    label: '当前毛利',
                    children: formatFinanceAmount(
                      selectedFinancialSettlement.gross_profit,
                      selectedFinancialSettlement.currency,
                    ),
                  },
                  {
                    key: 'manual_cost_amount',
                    label: '手工成本',
                    children: formatFinanceAmount(
                      selectedFinancialSettlement.manual_cost_amount,
                      selectedFinancialSettlement.currency,
                    ),
                  },
                ]}
                size="small"
              />
            ) : (
              <div className="module-state">暂无可关联结算单</div>
            )}
            <form className="record-form compact-section" onSubmit={submitManualProfitCost}>
              <label>
                成本单号
                <Input
                  required
                  value={manualProfitCostForm.cost_no}
                  onChange={(event) =>
                    setManualProfitCostForm({
                      ...manualProfitCostForm,
                      cost_no: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                成本类型
                <FormSelect
                  value={manualProfitCostForm.cost_type}
                  onChange={(event) =>
                    setManualProfitCostForm({
                      ...manualProfitCostForm,
                      cost_type: event.target.value,
                    })
                  }
                >
                  <option value="other_cost">其他成本</option>
                </FormSelect>
              </label>
              <label>
                成本日期
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
                  金额
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
                  币种
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
                来源单号
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
                原因
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
                备注
                <textarea
                  aria-label="手工成本备注"
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
                关联成本
              </Button>
            </form>
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-profit-calculation-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<CheckCircle2 size={18} />} title="利润核算表" />
            </div>
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadProfitCalculations()
              }}
            >
              <label>
                核算搜索
                <Input
                  value={profitCalculationSearch}
                  placeholder="结算单 / 出运单 / 客户"
                  onChange={(event) => setProfitCalculationSearch(event.target.value)}
                />
              </label>
              <label>
                出运单号
                <Input
                  value={profitCalculationShipmentFilter}
                  onChange={(event) => setProfitCalculationShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
            <div className="finance-receipt-strip">
              <span>核算单票 {profitCalculations.length} 单</span>
              <strong>
                {formatFinanceAmount(
                  totalProfitCalculationGrossProfit.toFixed(2),
                  profitCalculations[0]?.currency ?? 'USD',
                )}
              </strong>
              <span>按结算锁定口径展开成本明细</span>
            </div>
            <Table<FinancialSettlement>
              columns={[
                {
                  title: '结算单',
                  dataIndex: 'settlement_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: '出运单', dataIndex: 'shipment_no' },
                { title: '客户', dataIndex: 'customer_name' },
                {
                  title: '收入',
                  dataIndex: 'sales_income',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '总成本',
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
                  title: '退税',
                  dataIndex: 'tax_refund_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '毛利',
                  dataIndex: 'gross_profit',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '毛利率', dataIndex: 'gross_profit_rate', render: formatPercent },
              ]}
              dataSource={profitCalculations}
              expandable={{
                expandedRowRender: (record) => (
                  <Table<ProfitCostItem>
                    columns={[
                      { title: '类型', dataIndex: 'cost_type', render: profitCostTypeLabel },
                      { title: '方向', dataIndex: 'direction', render: profitCostDirectionTag },
                      { title: '来源', dataIndex: 'source_no', render: nullableText },
                      { title: '日期', dataIndex: 'cost_date', render: formatDate },
                      {
                        title: '金额',
                        dataIndex: 'amount',
                        render: (value: string, item) => formatFinanceAmount(value, item.currency),
                      },
                      { title: '原因', dataIndex: 'reason', render: nullableText },
                    ]}
                    dataSource={record.cost_items}
                    pagination={false}
                    rowKey="id"
                    size="small"
                  />
                ),
              }}
              loading={loadingProfitCalculations}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </section>
        ) : null}
      </section>
    </section>
  )
}
