import { Button, Input, Table, Tag } from 'antd'
import { FileText, Plus, Search, RefreshCw, Save, Ship } from 'lucide-react'
import { type PortImportBatch, type CustomsDeclarationRecord } from '@/api'
import { FormSelect, PanelTitle } from '@/shared/ui'
import { formatFinanceAmount, nullableText } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type { PortDataModel } from '@/app/pages/finance/hooks/usePortDataModule'
import type { FinanceViewShell } from '@/app/pages/finance/financePageTypes'

type Props = {
  model: PortDataModel
  shell: FinanceViewShell
}

export function PortDataView({ model, shell }: Props) {
  const {
    autoMatchPortCustomsReceipts,
    changeCustomsRecordsPage,
    changePortImportBatchesPage,
    customsDeclarationFilter,
    customsReceiptFilter,
    customsRecords,
    customsRecordsPagination,
    customsRecordsTotal,
    customsTradeTypeFilter,
    loadingCustomsRecords,
    loadingPortBatches,
    matchingCustomsReceipts,
    portBatchForm,
    portImportBatches,
    portImportBatchesPagination,
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
      <section className="finance-settlement-grid" aria-label={t('finance.portData.pageAria')}>
        <section className="workspace-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Ship size={18} />} title={t('finance.portData.panel.query')} />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void changeCustomsRecordsPage(1, customsRecordsPagination.pageSize)
              }}
            >
              <label>
                {t('finance.portData.filter.declarationNo')}
                <Input
                  value={customsDeclarationFilter}
                  onChange={(event) => setCustomsDeclarationFilter(event.target.value)}
                />
              </label>
              <label>
                {t('finance.portData.filter.customsReceiptNo')}
                <Input
                  value={customsReceiptFilter}
                  onChange={(event) => setCustomsReceiptFilter(event.target.value)}
                />
              </label>
              <label>
                {t('finance.portData.filter.tradeType')}
                <FormSelect
                  value={customsTradeTypeFilter}
                  onChange={(event) => setCustomsTradeTypeFilter(event.target.value)}
                >
                  <option value="">{t('finance.portData.filter.all')}</option>
                  <option value="export">{t('finance.portData.tradeType.export')}</option>
                  <option value="import">{t('finance.portData.tradeType.import')}</option>
                </FormSelect>
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                {t('finance.portData.action.search')}
              </Button>
              <Button
                htmlType="button"
                icon={<RefreshCw size={16} />}
                loading={matchingCustomsReceipts}
                onClick={() => void autoMatchPortCustomsReceipts()}
              >
                {t('finance.portData.action.autoMatch')}
              </Button>
            </form>
          </div>
          <Table<CustomsDeclarationRecord>
            columns={[
              { title: t('finance.portData.table.declarationNo'), dataIndex: 'declaration_no' },
              {
                title: t('finance.portData.table.receiptNo'),
                dataIndex: 'customs_receipt_no',
                render: nullableText,
              },
              {
                title: t('finance.portData.table.tradeType'),
                dataIndex: 'trade_type',
                render: (value: string) =>
                  value === 'import'
                    ? t('finance.portData.tradeType.import')
                    : t('finance.portData.tradeType.export'),
              },
              { title: t('finance.portData.table.product'), dataIndex: 'product_name' },
              {
                title: t('finance.portData.table.match'),
                dataIndex: 'match_status',
                render: (value: string) =>
                  value === 'matched' ? (
                    <Tag color="green">{t('finance.portData.match.matched')}</Tag>
                  ) : (
                    <Tag>{t('finance.portData.match.unmatched')}</Tag>
                  ),
              },
              {
                title: t('finance.portData.table.verificationDocument'),
                dataIndex: 'verification_document_no',
                render: nullableText,
              },
              {
                title: t('finance.portData.table.customsDate'),
                dataIndex: 'customs_date',
                render: nullableText,
              },
              {
                title: t('finance.field.amount'),
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={customsRecords}
            loading={loadingCustomsRecords}
            pagination={{
              ...customsRecordsPagination,
              onChange: (nextPage, nextPageSize) => {
                void changeCustomsRecordsPage(nextPage, nextPageSize)
              },
            }}
            rowKey="id"
            size="small"
          />
          <div className="finance-receipt-strip">
            <span>{t('finance.portData.metric.count', { count: customsRecordsTotal })}</span>
          </div>

          <div className="panel-heading">
            <PanelTitle
              icon={<FileText size={18} />}
              title={t('finance.portData.panel.batches')}
            />
          </div>
          <Table<PortImportBatch>
            columns={[
              { title: t('finance.portData.table.batchNo'), dataIndex: 'batch_no' },
              { title: t('finance.portData.table.source'), dataIndex: 'source' },
              { title: t('finance.portData.table.importedAt'), dataIndex: 'imported_at' },
              { title: t('finance.portData.table.recordCount'), dataIndex: 'record_count' },
              { title: t('finance.field.status'), dataIndex: 'status' },
            ]}
            dataSource={portImportBatches}
            loading={loadingPortBatches}
            pagination={{
              ...portImportBatchesPagination,
              onChange: (nextPage, nextPageSize) => {
                void changePortImportBatchesPage(nextPage, nextPageSize)
              },
            }}
            rowKey="id"
            size="small"
          />
        </section>

        <section className="workspace-panel">
          <div className="panel-heading">
            <PanelTitle icon={<Plus size={18} />} title={t('finance.portData.panel.import')} />
          </div>
          <form className="record-form" onSubmit={submitPortBatch}>
            <label>
              {t('finance.portData.field.batchNo')}
              <Input
                value={portBatchForm.batch_no}
                onChange={(event) =>
                  setPortBatchForm((prev) => ({ ...prev, batch_no: event.target.value }))
                }
                required
              />
            </label>
            <label>
              {t('finance.portData.field.dataSource')}
              <Input
                value={portBatchForm.source}
                placeholder={t('finance.portData.field.sourcePlaceholder')}
                onChange={(event) =>
                  setPortBatchForm((prev) => ({ ...prev, source: event.target.value }))
                }
                required
              />
            </label>
            <label>
              {t('finance.portData.field.importedAt')}
              <Input
                type="date"
                value={portBatchForm.imported_at}
                onChange={(event) =>
                  setPortBatchForm((prev) => ({ ...prev, imported_at: event.target.value }))
                }
                required
              />
            </label>
            <div className="form-divider">{t('finance.portData.panel.recordDetails')}</div>
            <label>
              {t('finance.portData.field.declarationNo')}
              <Input
                value={portRecordForm.declaration_no}
                onChange={(event) =>
                  setPortRecordForm((prev) => ({ ...prev, declaration_no: event.target.value }))
                }
                required
              />
            </label>
            <label>
              {t('finance.portData.field.customsReceiptNo')}
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
              {t('finance.portData.field.tradeType')}
              <FormSelect
                value={portRecordForm.trade_type}
                onChange={(event) =>
                  setPortRecordForm((prev) => ({ ...prev, trade_type: event.target.value }))
                }
              >
                <option value="export">{t('finance.portData.tradeType.export')}</option>
                <option value="import">{t('finance.portData.tradeType.import')}</option>
              </FormSelect>
            </label>
            <label>
              {t('finance.portData.field.productName')}
              <Input
                value={portRecordForm.product_name}
                onChange={(event) =>
                  setPortRecordForm((prev) => ({ ...prev, product_name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              {t('finance.portData.field.customsAmount')}
              <Input
                value={portRecordForm.amount}
                onChange={(event) =>
                  setPortRecordForm((prev) => ({ ...prev, amount: event.target.value }))
                }
                required
              />
            </label>
            <label>
              {t('finance.field.currency')}
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
              {t('finance.portData.action.importData')}
            </Button>
          </form>
        </section>
      </section>
    </section>
  )
}
