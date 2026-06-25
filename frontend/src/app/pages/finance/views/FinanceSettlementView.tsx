import { Button, Input, Table } from 'antd'
import { ArrowLeft, PackagePlus, Save, Search } from 'lucide-react'
import type { FinancialSettlement } from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { formatFinanceAmount, formatDate } from '../../appHelpers'
import {
  initialFinancialSettlementForm,
  initialManualProfitCostForm,
  financialSettlementPayload,
  manualProfitCostPayload,
  settlementStatusTag,
  settlementStatusLabel,
  profitCostTypeLabel,
  profitCostDirectionTag,
} from '../financeHelpers'
import type { FinancePageContext } from '../financeHelpers'

export function FinanceSettlementView({ ctx }: { ctx: FinancePageContext }) {
  const {
    detailId, moduleHeader, moduleAlerts, goModule, goDetail,
    financialSettlements, profitCalculations,
    totalSettlementSalesIncome, totalSettlementGrossProfit, totalProfitCalculationGrossProfit,
    selectedFinancialSettlement, selectedFinancialSettlementId, setSelectedFinancialSettlementId,
    settlementSearch, setSettlementSearch, settlementShipmentFilter, setSettlementShipmentFilter,
    profitCalculationSearch, setProfitCalculationSearch, profitCalculationShipmentFilter, setProfitCalculationShipmentFilter,
    settlementForm, setSettlementForm, manualProfitCostForm, setManualProfitCostForm,
    submittingSettlement, submittingManualProfitCost,
    submitFinancialSettlement, submitManualProfitCost,
    loadFinancialSettlements, loadProfitCalculations,
    loadingFinancialSettlements, loadingProfitCalculations,
  } = ctx
  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button className="finance-back-button" type="button" onClick={() => goModule('settlement')}>
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
        aria-label="结算核算"
      >
      {!detailId ? (
      <section className="workspace-panel finance-settlement-list-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<PackagePlus size={18} />} title="财务结算列表" />
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadFinancialSettlements()
            }}
          >
            <label>
              搜索
              <Input value={settlementSearch} onChange={(event) => setSettlementSearch(event.target.value)} />
            </label>
            <label>
              出货单号
              <Input value={settlementShipmentFilter} onChange={(event) => setSettlementShipmentFilter(event.target.value)} />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <div className="finance-settlement-strip">
          <span>合计 {financialSettlements.length} 条</span>
          <strong>销售收入 {formatFinanceAmount(totalSettlementSalesIncome.toFixed(2), '多币种')}</strong>
          <span>毛利 {formatFinanceAmount(totalSettlementGrossProfit.toFixed(2), '多币种')}</span>
        </div>
        <Table<FinancialSettlement>
          columns={[
            {
              title: '结算单号',
              dataIndex: 'settlement_no',
              render: (value: string) => <button className="row-button" type="button">{value}</button>,
            },
            { title: '状态', dataIndex: 'status', render: settlementStatusTag },
            { title: '出货单', dataIndex: 'shipment_no', render: (value: string | null) => value ?? '-' },
            { title: '结算日期', dataIndex: 'settlement_date', render: formatDate },
            { title: '币种', dataIndex: 'currency' },
            {
              title: '销售收入',
              dataIndex: 'sales_income',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            {
              title: '采购成本',
              dataIndex: 'purchase_cost',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            {
              title: '毛利',
              dataIndex: 'gross_profit',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            { title: '利润率', dataIndex: 'profit_rate' },
          ]}
          dataSource={financialSettlements}
          loading={loadingFinancialSettlements}
          pagination={false}
          rowClassName={(record) => (record.id === selectedFinancialSettlementId ? 'selected-row' : '')}
          rowKey="id"
          size="small"
          onRow={(record) => ({
            onClick: () => {
              setSelectedFinancialSettlementId(record.id)
              setManualProfitCostForm(initialManualProfitCostForm(record.currency, record.settlement_date))
              goDetail('settlement', record.id)
            },
          })}
        />
      </section>
      ) : null}

      {!detailId ? (
      <section className="workspace-panel finance-settlement-form-panel">
        <PanelTitle icon={<PackagePlus size={18} />} title="锁定财务结算" />
        <form className="record-form" onSubmit={submitFinancialSettlement}>
          <div className="form-pair two">
            <label>
              结算单号
              <Input value={settlementForm.settlement_no} onChange={(event) => setSettlementForm({ ...settlementForm, settlement_no: event.target.value })} />
            </label>
            <label>
              出货单标识
              <Input value={settlementForm.shipment_plan_id} onChange={(event) => setSettlementForm({ ...settlementForm, shipment_plan_id: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              出货单号
              <Input value={settlementForm.shipment_no} onChange={(event) => setSettlementForm({ ...settlementForm, shipment_no: event.target.value })} />
            </label>
            <label>
              结算日期
              <Input type="date" value={settlementForm.settlement_date} onChange={(event) => setSettlementForm({ ...settlementForm, settlement_date: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              币种
              <Input value={settlementForm.currency} onChange={(event) => setSettlementForm({ ...settlementForm, currency: event.target.value })} />
            </label>
            <label>
              销售收入
              <Input value={settlementForm.sales_income} onChange={(event) => setSettlementForm({ ...settlementForm, sales_income: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              采购成本
              <Input value={settlementForm.purchase_cost} onChange={(event) => setSettlementForm({ ...settlementForm, purchase_cost: event.target.value })} />
            </label>
            <label>
              运费
              <Input value={settlementForm.freight_cost} onChange={(event) => setSettlementForm({ ...settlementForm, freight_cost: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              佣金
              <Input value={settlementForm.commission_cost} onChange={(event) => setSettlementForm({ ...settlementForm, commission_cost: event.target.value })} />
            </label>
            <label>
              其他费用
              <Input value={settlementForm.other_cost} onChange={(event) => setSettlementForm({ ...settlementForm, other_cost: event.target.value })} />
            </label>
          </div>
          <label>
            备注
            <Input value={settlementForm.remark} onChange={(event) => setSettlementForm({ ...settlementForm, remark: event.target.value })} />
          </label>
          <Button htmlType="submit" icon={<Save size={16} />} loading={submittingSettlement}>
            锁定结算
          </Button>
        </form>
      </section>
      ) : null}

      {selectedFinancialSettlement ? (
        <section className="workspace-panel finance-settlement-detail-panel">
          <PanelTitle icon={<PackagePlus size={18} />} title={`结算 ${selectedFinancialSettlement.settlement_no}`} />
          <dl className="detail-list">
            <div><dt>状态</dt><dd>{settlementStatusTag(selectedFinancialSettlement.status)}</dd></div>
            <div><dt>出货单</dt><dd>{selectedFinancialSettlement.shipment_no ?? '-'}</dd></div>
            <div><dt>结算日期</dt><dd>{formatDate(selectedFinancialSettlement.settlement_date)}</dd></div>
            <div><dt>币种</dt><dd>{selectedFinancialSettlement.currency}</dd></div>
            <div><dt>销售收入</dt><dd>{formatFinanceAmount(selectedFinancialSettlement.sales_income, selectedFinancialSettlement.currency)}</dd></div>
            <div><dt>采购成本</dt><dd>{formatFinanceAmount(selectedFinancialSettlement.purchase_cost, selectedFinancialSettlement.currency)}</dd></div>
            <div><dt>运费</dt><dd>{formatFinanceAmount(selectedFinancialSettlement.freight_cost, selectedFinancialSettlement.currency)}</dd></div>
            <div><dt>佣金</dt><dd>{formatFinanceAmount(selectedFinancialSettlement.commission_cost, selectedFinancialSettlement.currency)}</dd></div>
            <div><dt>其他费用</dt><dd>{formatFinanceAmount(selectedFinancialSettlement.other_cost, selectedFinancialSettlement.currency)}</dd></div>
            <div><dt>毛利</dt><dd>{formatFinanceAmount(selectedFinancialSettlement.gross_profit, selectedFinancialSettlement.currency)}</dd></div>
            <div><dt>利润率</dt><dd>{selectedFinancialSettlement.profit_rate}</dd></div>
            <div><dt>备注</dt><dd>{selectedFinancialSettlement.remark ?? '-'}</dd></div>
          </dl>
          <form className="record-form" onSubmit={submitManualProfitCost}>
            <PanelTitle icon={<Save size={18} />} title="关联手工成本" />
            <div className="form-pair two">
              <label>
                成本编号
                <Input value={manualProfitCostForm.cost_no} onChange={(event) => setManualProfitCostForm({ ...manualProfitCostForm, cost_no: event.target.value })} />
              </label>
              <label>
                成本类型
                <FormSelect value={manualProfitCostForm.cost_type} onChange={(event) => setManualProfitCostForm({ ...manualProfitCostForm, cost_type: event.target.value })}>
                  <option value="">请选择</option>
                  <option value="freight">运费</option>
                  <option value="commission">佣金</option>
                  <option value="other">其他</option>
                </FormSelect>
              </label>
            </div>
            <div className="form-pair two">
              <label>
                金额
                <Input value={manualProfitCostForm.amount} onChange={(event) => setManualProfitCostForm({ ...manualProfitCostForm, amount: event.target.value })} />
              </label>
              <label>
                币种
                <Input value={manualProfitCostForm.currency} onChange={(event) => setManualProfitCostForm({ ...manualProfitCostForm, currency: event.target.value })} />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                成本日期
                <Input type="date" value={manualProfitCostForm.cost_date} onChange={(event) => setManualProfitCostForm({ ...manualProfitCostForm, cost_date: event.target.value })} />
              </label>
              <label>
                备注
                <Input value={manualProfitCostForm.remark} onChange={(event) => setManualProfitCostForm({ ...manualProfitCostForm, remark: event.target.value })} />
              </label>
            </div>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingManualProfitCost}>
              关联手工成本
            </Button>
          </form>
        </section>
      ) : null}

      {!detailId ? (
      <section className="workspace-panel finance-profit-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<PackagePlus size={18} />} title="利润核算" />
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadProfitCalculations()
            }}
          >
            <label>
              搜索
              <Input value={profitCalculationSearch} onChange={(event) => setProfitCalculationSearch(event.target.value)} />
            </label>
            <label>
              出货单号
              <Input value={profitCalculationShipmentFilter} onChange={(event) => setProfitCalculationShipmentFilter(event.target.value)} />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <div className="finance-profit-strip">
          <span>合计 {profitCalculations.length} 条</span>
          <strong>毛利 {formatFinanceAmount(totalProfitCalculationGrossProfit.toFixed(2), '多币种')}</strong>
        </div>
        <Table<FinancialSettlement>
          columns={[
            { title: '结算单号', dataIndex: 'settlement_no', render: (value: string) => <strong>{value}</strong> },
            { title: '出货单', dataIndex: 'shipment_no', render: (value: string | null) => value ?? '-' },
            { title: '结算日期', dataIndex: 'settlement_date', render: formatDate },
            { title: '币种', dataIndex: 'currency' },
            {
              title: '销售收入',
              dataIndex: 'sales_income',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            {
              title: '采购成本',
              dataIndex: 'purchase_cost',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            {
              title: '毛利',
              dataIndex: 'gross_profit',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            { title: '利润率', dataIndex: 'profit_rate' },
          ]}
          dataSource={profitCalculations}
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
