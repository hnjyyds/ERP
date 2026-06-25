import { Button, Input, Table } from 'antd'
import { Search, Ship } from 'lucide-react'
import type { CustomsDeclarationRecord, PortImportBatch } from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { formatDate, nullableText } from '../../appHelpers'
import type { FinancePageContext } from '../financeHelpers'

export function FinancePortDataView({ ctx }: { ctx: FinancePageContext }) {
  const {
    moduleHeader, moduleAlerts,
    portImportBatches, customsRecords,
    portBatchSourceFilter, setPortBatchSourceFilter,
    customsDeclarationFilter, setCustomsDeclarationFilter,
    customsReceiptFilter, setCustomsReceiptFilter,
    customsTradeTypeFilter, setCustomsTradeTypeFilter,
    portBatchForm, setPortBatchForm,
    portRecordForm, setPortRecordForm,
    submittingPortBatch, matchingCustomsReceipts,
    submitPortBatch, autoMatchPortCustomsReceipts,
    loadPortImportBatches, loadCustomsRecords,
    loadingPortBatches, loadingCustomsRecords,
  } = ctx
  return (
    <section className="finance-page">
      {moduleHeader}
      {moduleAlerts}
      <section className="finance-port-grid" aria-label="口岸数据导入">
      <section className="workspace-panel finance-port-batch-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<Ship size={18} />} title="导入批次" />
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadPortImportBatches()
            }}
          >
            <label>
              来源
              <Input value={portBatchSourceFilter} onChange={(event) => setPortBatchSourceFilter(event.target.value)} />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <Table<PortImportBatch>
          columns={[
            { title: '批次号', dataIndex: 'batch_no', render: (value: string) => <strong>{value}</strong> },
            { title: '来源', dataIndex: 'source' },
            { title: '导入日期', dataIndex: 'imported_at', render: formatDate },
            { title: '记录数', dataIndex: 'record_count' },
            { title: '备注', dataIndex: 'remark', render: nullableText },
          ]}
          dataSource={portImportBatches}
          loading={loadingPortBatches}
          pagination={false}
          rowKey="id"
          size="small"
        />
      </section>

      <section className="workspace-panel finance-port-form-panel">
        <PanelTitle icon={<Ship size={18} />} title="导入口岸数据" />
        <form className="record-form" onSubmit={submitPortBatch}>
          <div className="form-divider">批次信息</div>
          <div className="form-pair two">
            <label>
              批次号
              <Input value={portBatchForm.batch_no} onChange={(event) => setPortBatchForm({ ...portBatchForm, batch_no: event.target.value })} />
            </label>
            <label>
              来源
              <Input value={portBatchForm.source} onChange={(event) => setPortBatchForm({ ...portBatchForm, source: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              导入日期
              <Input type="date" value={portBatchForm.imported_at} onChange={(event) => setPortBatchForm({ ...portBatchForm, imported_at: event.target.value })} />
            </label>
            <label>
              批次备注
              <Input value={portBatchForm.remark} onChange={(event) => setPortBatchForm({ ...portBatchForm, remark: event.target.value })} />
            </label>
          </div>
          <div className="form-divider">报关记录</div>
          <div className="form-pair two">
            <label>
              报关单号
              <Input value={portRecordForm.declaration_no} onChange={(event) => setPortRecordForm({ ...portRecordForm, declaration_no: event.target.value })} />
            </label>
            <label>
              报关回单号
              <Input value={portRecordForm.customs_receipt_no} onChange={(event) => setPortRecordForm({ ...portRecordForm, customs_receipt_no: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              贸易类型
              <FormSelect value={portRecordForm.trade_type} onChange={(event) => setPortRecordForm({ ...portRecordForm, trade_type: event.target.value })}>
                <option value="export">出口</option>
                <option value="import">进口</option>
              </FormSelect>
            </label>
            <label>
              出口合同号
              <Input value={portRecordForm.export_contract_no} onChange={(event) => setPortRecordForm({ ...portRecordForm, export_contract_no: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              报关日期
              <Input type="date" value={portRecordForm.customs_date} onChange={(event) => setPortRecordForm({ ...portRecordForm, customs_date: event.target.value })} />
            </label>
            <label>
              商品名称
              <Input value={portRecordForm.product_name} onChange={(event) => setPortRecordForm({ ...portRecordForm, product_name: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              HS编码
              <Input value={portRecordForm.hs_code} onChange={(event) => setPortRecordForm({ ...portRecordForm, hs_code: event.target.value })} />
            </label>
            <label>
              数量
              <Input value={portRecordForm.quantity} onChange={(event) => setPortRecordForm({ ...portRecordForm, quantity: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              单位
              <Input value={portRecordForm.unit} onChange={(event) => setPortRecordForm({ ...portRecordForm, unit: event.target.value })} />
            </label>
            <label>
              金额
              <Input value={portRecordForm.amount} onChange={(event) => setPortRecordForm({ ...portRecordForm, amount: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              币种
              <Input value={portRecordForm.currency} onChange={(event) => setPortRecordForm({ ...portRecordForm, currency: event.target.value })} />
            </label>
            <label>
              客户/供应商
              <Input value={portRecordForm.customer_or_supplier} onChange={(event) => setPortRecordForm({ ...portRecordForm, customer_or_supplier: event.target.value })} />
            </label>
          </div>
          <Button htmlType="submit" icon={<Ship size={16} />} loading={submittingPortBatch}>
            导入口岸数据
          </Button>
        </form>
      </section>

      <section className="workspace-panel finance-port-records-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<Ship size={18} />} title="报关记录" />
          <div className="inline-filters">
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadCustomsRecords()
              }}
            >
              <label>
                报关单号
                <Input value={customsDeclarationFilter} onChange={(event) => setCustomsDeclarationFilter(event.target.value)} />
              </label>
              <label>
                回单号
                <Input value={customsReceiptFilter} onChange={(event) => setCustomsReceiptFilter(event.target.value)} />
              </label>
              <label>
                贸易类型
                <FormSelect value={customsTradeTypeFilter} onChange={(event) => setCustomsTradeTypeFilter(event.target.value)}>
                  <option value="">全部</option>
                  <option value="export">出口</option>
                  <option value="import">进口</option>
                </FormSelect>
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
            </form>
            <Button
              loading={matchingCustomsReceipts}
              onClick={() => void autoMatchPortCustomsReceipts()}
            >
              自动匹配回单
            </Button>
          </div>
        </div>
        <Table<CustomsDeclarationRecord>
          columns={[
            { title: '报关单号', dataIndex: 'declaration_no', render: (value: string) => <strong>{value}</strong> },
            { title: '回单号', dataIndex: 'customs_receipt_no', render: nullableText },
            { title: '贸易类型', dataIndex: 'trade_type', render: (value: string) => value === 'export' ? '出口' : '进口' },
            { title: '出口合同', dataIndex: 'export_contract_no', render: nullableText },
            { title: '报关日期', dataIndex: 'customs_date', render: formatDate },
            { title: '商品', dataIndex: 'product_name' },
            { title: 'HS编码', dataIndex: 'hs_code', render: nullableText },
            { title: '数量', dataIndex: 'quantity', render: nullableText },
            { title: '单位', dataIndex: 'unit', render: nullableText },
            { title: '金额', dataIndex: 'amount' },
            { title: '币种', dataIndex: 'currency' },
            { title: '客户/供应商', dataIndex: 'customer_or_supplier', render: nullableText },
          ]}
          dataSource={customsRecords}
          loading={loadingCustomsRecords}
          pagination={false}
          rowKey="id"
          size="small"
        />
      </section>
      </section>
    </section>
  )
}
