import { Button, Input, Table, Tag } from 'antd'
import { FileText, Plus, Search, RefreshCw, Save, Ship } from 'lucide-react'
import { type PortImportBatch, type CustomsDeclarationRecord } from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { formatFinanceAmount, nullableText } from '../../appHelpers'
import type { PortDataModel } from '../hooks/usePortDataModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: PortDataModel
  shell: FinanceViewShell
}

export function PortDataView({ model, shell }: Props) {
  const {
    autoMatchPortCustomsReceipts,
    customsDeclarationFilter,
    customsReceiptFilter,
    customsRecords,
    customsTradeTypeFilter,
    loadCustomsRecords,
    loadingCustomsRecords,
    loadingPortBatches,
    matchingCustomsReceipts,
    portBatchForm,
    portImportBatches,
    portRecordForm,
    setCustomsDeclarationFilter,
    setCustomsReceiptFilter,
    setCustomsTradeTypeFilter,
    setPortBatchForm,
    setPortRecordForm,
    submitPortBatch,
    submittingPortBatch,
  } = model
  const { moduleAlerts, moduleHeader } = shell

  return (
    <section className="finance-page">
      {moduleHeader}
      {moduleAlerts}
      <section className="finance-settlement-grid" aria-label="口岸数据导入">
        <section className="workspace-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Ship size={18} />} title="进出口报关数据查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadCustomsRecords()
              }}
            >
              <label>
                报关单号
                <Input
                  value={customsDeclarationFilter}
                  onChange={(event) => setCustomsDeclarationFilter(event.target.value)}
                />
              </label>
              <label>
                报关回单号
                <Input
                  value={customsReceiptFilter}
                  onChange={(event) => setCustomsReceiptFilter(event.target.value)}
                />
              </label>
              <label>
                进出口
                <FormSelect
                  value={customsTradeTypeFilter}
                  onChange={(event) => setCustomsTradeTypeFilter(event.target.value)}
                >
                  <option value="">全部</option>
                  <option value="export">出口</option>
                  <option value="import">进口</option>
                </FormSelect>
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button
                htmlType="button"
                icon={<RefreshCw size={16} />}
                loading={matchingCustomsReceipts}
                onClick={() => void autoMatchPortCustomsReceipts()}
              >
                自动匹配回单
              </Button>
            </form>
          </div>
          <Table<CustomsDeclarationRecord>
            columns={[
              { title: '报关单号', dataIndex: 'declaration_no' },
              { title: '回单号', dataIndex: 'customs_receipt_no', render: nullableText },
              {
                title: '进出口',
                dataIndex: 'trade_type',
                render: (value: string) => (value === 'import' ? '进口' : '出口'),
              },
              { title: '商品', dataIndex: 'product_name' },
              {
                title: '匹配',
                dataIndex: 'match_status',
                render: (value: string) =>
                  value === 'matched' ? <Tag color="green">已匹配</Tag> : <Tag>未匹配</Tag>,
              },
              { title: '核销单', dataIndex: 'verification_document_no', render: nullableText },
              { title: '报关日期', dataIndex: 'customs_date', render: nullableText },
              {
                title: '金额',
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={customsRecords}
            loading={loadingCustomsRecords}
            pagination={false}
            rowKey="id"
            size="small"
          />
          <div className="finance-receipt-strip">
            <span>报关数据 {customsRecords.length} 条</span>
          </div>

          <div className="panel-heading">
            <PanelTitle icon={<FileText size={18} />} title="导入批次记录" />
          </div>
          <Table<PortImportBatch>
            columns={[
              { title: '批次号', dataIndex: 'batch_no' },
              { title: '来源', dataIndex: 'source' },
              { title: '导入日期', dataIndex: 'imported_at' },
              { title: '记录数', dataIndex: 'record_count' },
              { title: '状态', dataIndex: 'status' },
            ]}
            dataSource={portImportBatches}
            loading={loadingPortBatches}
            pagination={false}
            rowKey="id"
            size="small"
          />
        </section>

        <section className="workspace-panel">
          <div className="panel-heading">
            <PanelTitle icon={<Plus size={18} />} title="导入口岸数据" />
          </div>
          <form className="record-form" onSubmit={submitPortBatch}>
            <label>
              批次号
              <Input
                value={portBatchForm.batch_no}
                onChange={(event) =>
                  setPortBatchForm((prev) => ({ ...prev, batch_no: event.target.value }))
                }
                required
              />
            </label>
            <label>
              数据来源
              <Input
                value={portBatchForm.source}
                placeholder="如：电子口岸 / 海关"
                onChange={(event) =>
                  setPortBatchForm((prev) => ({ ...prev, source: event.target.value }))
                }
                required
              />
            </label>
            <label>
              导入日期
              <Input
                type="date"
                value={portBatchForm.imported_at}
                onChange={(event) =>
                  setPortBatchForm((prev) => ({ ...prev, imported_at: event.target.value }))
                }
                required
              />
            </label>
            <div className="form-divider">报关数据明细</div>
            <label>
              报关单号
              <Input
                value={portRecordForm.declaration_no}
                onChange={(event) =>
                  setPortRecordForm((prev) => ({ ...prev, declaration_no: event.target.value }))
                }
                required
              />
            </label>
            <label>
              报关回单号
              <Input
                value={portRecordForm.customs_receipt_no}
                onChange={(event) =>
                  setPortRecordForm((prev) => ({
                    ...prev,
                    customs_receipt_no: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              进出口类型
              <FormSelect
                value={portRecordForm.trade_type}
                onChange={(event) =>
                  setPortRecordForm((prev) => ({ ...prev, trade_type: event.target.value }))
                }
              >
                <option value="export">出口</option>
                <option value="import">进口</option>
              </FormSelect>
            </label>
            <label>
              商品名称
              <Input
                value={portRecordForm.product_name}
                onChange={(event) =>
                  setPortRecordForm((prev) => ({ ...prev, product_name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              报关金额
              <Input
                value={portRecordForm.amount}
                onChange={(event) =>
                  setPortRecordForm((prev) => ({ ...prev, amount: event.target.value }))
                }
                required
              />
            </label>
            <label>
              币种
              <Input
                value={portRecordForm.currency}
                onChange={(event) =>
                  setPortRecordForm((prev) => ({ ...prev, currency: event.target.value }))
                }
                required
              />
            </label>
            <Button
              htmlType="submit"
              type="primary"
              loading={submittingPortBatch}
              icon={<Save size={16} />}
            >
              导入数据
            </Button>
          </form>
        </section>
      </section>
    </section>
  )
}
