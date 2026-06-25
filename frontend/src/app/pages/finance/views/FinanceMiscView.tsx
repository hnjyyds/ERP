import { Button, Input, Table } from 'antd'
import { ArrowLeft, FileStack, Save, Search, ShieldCheck } from 'lucide-react'
import type { MiscFeeAllocation, MiscFeeItem } from '../../../../api'
import { miscFeeAllocationMethodOptions, miscFeeCategoryOptions, miscFeeItemStatusOptions } from '../../../../shared/formOptions'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { formatFinanceAmount } from '../../appHelpers'
import {
  miscFeeAllocationMethodLabel,
  miscFeeCategoryLabel,
  miscFeeItemStatusTag,
  initialMiscFeeAllocationForm,
  initialMiscFeeItemForm,
  miscFeeItemPayload,
  miscFeeAllocationPayload,
} from '../financeHelpers'
import type { FinancePageContext } from '../financeHelpers'

export function FinanceMiscView({ ctx }: { ctx: FinancePageContext }) {
  const {
    detailId, moduleHeader, moduleAlerts, goModule, goDetail,
    miscFeeItems, miscFeeAllocations, miscFeeAllocationSummary, totalMiscFeeAmount,
    selectedMiscFeeItem, selectedMiscFeeItemId, setSelectedMiscFeeItemId,
    miscFeeItemSearch, setMiscFeeItemSearch, miscFeeItemCategoryFilter, setMiscFeeItemCategoryFilter,
    miscFeeItemStatusFilter, setMiscFeeItemStatusFilter,
    miscFeeAllocationSearch, setMiscFeeAllocationSearch, miscFeeAllocationCategoryFilter, setMiscFeeAllocationCategoryFilter,
    miscFeeAllocationShipmentFilter, setMiscFeeAllocationShipmentFilter, miscFeeAllocationSalesFilter, setMiscFeeAllocationSalesFilter,
    miscFeeSummaryShipmentFilter, setMiscFeeSummaryShipmentFilter, miscFeeSummaryCategoryFilter, setMiscFeeSummaryCategoryFilter,
    miscFeeItemForm, setMiscFeeItemForm, miscFeeAllocationForm, setMiscFeeAllocationForm,
    submittingMiscFeeItem, submittingMiscFeeAllocation,
    submitMiscFeeItem, submitMiscFeeAllocation,
    loadMiscFeeItems, loadMiscFeeAllocations, loadMiscFeeAllocationSummary,
    loadingMiscFeeItems, loadingMiscFeeAllocations, loadingMiscFeeSummary,
  } = ctx
  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button className="finance-back-button" type="button" onClick={() => goModule('misc')}>
            <ArrowLeft size={16} />
            杂费管理
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-misc-grid'}
        aria-label="杂费管理"
      >
      {!detailId ? (
      <section className="workspace-panel finance-misc-list-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<FileStack size={18} />} title="杂费项目列表" />
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadMiscFeeItems()
            }}
          >
            <label>
              搜索
              <Input value={miscFeeItemSearch} onChange={(event) => setMiscFeeItemSearch(event.target.value)} />
            </label>
            <label>
              类别
              <FormSelect value={miscFeeItemCategoryFilter} onChange={(event) => setMiscFeeItemCategoryFilter(event.target.value)}>
                <option value="">全部</option>
                {miscFeeCategoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <label>
              状态
              <FormSelect value={miscFeeItemStatusFilter} onChange={(event) => setMiscFeeItemStatusFilter(event.target.value)}>
                <option value="">全部</option>
                {miscFeeItemStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <Table<MiscFeeItem>
          columns={[
            {
              title: '杂费项目',
              dataIndex: 'name',
              render: (value: string) => <button className="row-button" type="button">{value}</button>,
            },
            { title: '状态', dataIndex: 'status', render: miscFeeItemStatusTag },
            { title: '类别', dataIndex: 'category', render: miscFeeCategoryLabel },
            { title: '分摊方式', dataIndex: 'default_allocation_method', render: miscFeeAllocationMethodLabel },
            {
              title: '默认金额',
              dataIndex: 'default_amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            { title: '已分摊', dataIndex: 'allocated_count' },
            {
              title: '已分摊金额',
              dataIndex: 'allocated_amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
          ]}
          dataSource={miscFeeItems}
          loading={loadingMiscFeeItems}
          pagination={false}
          rowClassName={(record) => (record.id === selectedMiscFeeItemId ? 'selected-row' : '')}
          rowKey="id"
          size="small"
          onRow={(record) => ({
            onClick: () => {
              setSelectedMiscFeeItemId(record.id)
              setMiscFeeAllocationForm(initialMiscFeeAllocationForm(record))
              goDetail('misc', record.id)
            },
          })}
        />
      </section>
      ) : null}

      {!detailId ? (
      <section className="workspace-panel finance-misc-form-panel">
        <PanelTitle icon={<FileStack size={18} />} title="配置杂费项目" />
        <form className="record-form" onSubmit={submitMiscFeeItem}>
          <div className="form-pair two">
            <label>
              项目名称
              <Input value={miscFeeItemForm.name} onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, name: event.target.value })} />
            </label>
            <label>
              类别
              <FormSelect value={miscFeeItemForm.category} onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, category: event.target.value })}>
                <option value="">请选择</option>
                {miscFeeCategoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
          </div>
          <div className="form-pair two">
            <label>
              分摊方式
              <FormSelect value={miscFeeItemForm.default_allocation_method} onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, default_allocation_method: event.target.value })}>
                <option value="">请选择</option>
                {miscFeeAllocationMethodOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <label>
              默认金额
              <Input value={miscFeeItemForm.default_amount} onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, default_amount: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              币种
              <Input value={miscFeeItemForm.currency} onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, currency: event.target.value })} />
            </label>
            <label>
              备注
              <Input value={miscFeeItemForm.remark} onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, remark: event.target.value })} />
            </label>
          </div>
          <Button htmlType="submit" icon={<Save size={16} />} loading={submittingMiscFeeItem}>
            配置杂费项目
          </Button>
        </form>
      </section>
      ) : null}

      {selectedMiscFeeItem ? (
        <section className="workspace-panel finance-misc-detail-panel">
          <PanelTitle icon={<FileStack size={18} />} title={`杂费项目 ${selectedMiscFeeItem.name}`} />
          <dl className="detail-list">
            <div><dt>状态</dt><dd>{miscFeeItemStatusTag(selectedMiscFeeItem.status)}</dd></div>
            <div><dt>类别</dt><dd>{miscFeeCategoryLabel(selectedMiscFeeItem.category)}</dd></div>
            <div><dt>分摊方式</dt><dd>{miscFeeAllocationMethodLabel(selectedMiscFeeItem.default_allocation_method)}</dd></div>
            <div><dt>默认金额</dt><dd>{formatFinanceAmount(selectedMiscFeeItem.default_amount, selectedMiscFeeItem.currency)}</dd></div>
            <div><dt>已分摊次数</dt><dd>{selectedMiscFeeItem.allocated_count}</dd></div>
            <div><dt>已分摊金额</dt><dd>{formatFinanceAmount(selectedMiscFeeItem.allocated_amount, selectedMiscFeeItem.currency)}</dd></div>
            <div><dt>备注</dt><dd>{selectedMiscFeeItem.remark ?? '-'}</dd></div>
          </dl>
          <form className="record-form" onSubmit={submitMiscFeeAllocation}>
            <PanelTitle icon={<Save size={18} />} title="分摊杂费" />
            <div className="form-pair two">
              <label>
                出货单号
                <Input value={miscFeeAllocationForm.shipment_no} onChange={(event) => setMiscFeeAllocationForm({ ...miscFeeAllocationForm, shipment_no: event.target.value })} />
              </label>
              <label>
                业务员标识
                <Input value={miscFeeAllocationForm.sales_user_id} onChange={(event) => setMiscFeeAllocationForm({ ...miscFeeAllocationForm, sales_user_id: event.target.value })} />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                业务员姓名
                <Input value={miscFeeAllocationForm.sales_user_name} onChange={(event) => setMiscFeeAllocationForm({ ...miscFeeAllocationForm, sales_user_name: event.target.value })} />
              </label>
              <label>
                分摊方式
                <FormSelect value={miscFeeAllocationForm.allocation_method} onChange={(event) => setMiscFeeAllocationForm({ ...miscFeeAllocationForm, allocation_method: event.target.value })}>
                  <option value="">请选择</option>
                  {miscFeeAllocationMethodOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <div className="form-pair two">
              <label>
                分摊金额
                <Input value={miscFeeAllocationForm.amount} onChange={(event) => setMiscFeeAllocationForm({ ...miscFeeAllocationForm, amount: event.target.value })} />
              </label>
              <label>
                币种
                <Input value={miscFeeAllocationForm.currency} onChange={(event) => setMiscFeeAllocationForm({ ...miscFeeAllocationForm, currency: event.target.value })} />
              </label>
            </div>
            <label>
              备注
              <Input value={miscFeeAllocationForm.remark} onChange={(event) => setMiscFeeAllocationForm({ ...miscFeeAllocationForm, remark: event.target.value })} />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingMiscFeeAllocation}>
              分摊杂费
            </Button>
          </form>
        </section>
      ) : null}

      {!detailId ? (
      <section className="workspace-panel finance-misc-allocation-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<ShieldCheck size={18} />} title="杂费分摊查询" />
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadMiscFeeAllocations()
            }}
          >
            <label>
              搜索
              <Input value={miscFeeAllocationSearch} onChange={(event) => setMiscFeeAllocationSearch(event.target.value)} />
            </label>
            <label>
              类别
              <FormSelect value={miscFeeAllocationCategoryFilter} onChange={(event) => setMiscFeeAllocationCategoryFilter(event.target.value)}>
                <option value="">全部</option>
                {miscFeeCategoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <label>
              出货单号
              <Input value={miscFeeAllocationShipmentFilter} onChange={(event) => setMiscFeeAllocationShipmentFilter(event.target.value)} />
            </label>
            <label>
              业务员标识
              <Input value={miscFeeAllocationSalesFilter} onChange={(event) => setMiscFeeAllocationSalesFilter(event.target.value)} />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <Table<MiscFeeAllocation>
          columns={[
            { title: '分摊号', dataIndex: 'allocation_no', render: (value: string) => <strong>{value}</strong> },
            { title: '杂费项目', dataIndex: 'item_name' },
            { title: '类别', dataIndex: 'category', render: miscFeeCategoryLabel },
            { title: '出货单', dataIndex: 'shipment_no', render: (value: string | null) => value ?? '-' },
            { title: '业务员', dataIndex: 'sales_user_name', render: (value: string | null) => value ?? '-' },
            { title: '分摊方式', dataIndex: 'allocation_method', render: miscFeeAllocationMethodLabel },
            {
              title: '金额',
              dataIndex: 'amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
          ]}
          dataSource={miscFeeAllocations}
          loading={loadingMiscFeeAllocations}
          pagination={false}
          rowKey="id"
          size="small"
        />
      </section>
      ) : null}

      {!detailId ? (
      <section className="workspace-panel finance-misc-summary-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<ShieldCheck size={18} />} title="杂费分摊汇总" />
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadMiscFeeAllocationSummary()
            }}
          >
            <label>
              出货单号
              <Input value={miscFeeSummaryShipmentFilter} onChange={(event) => setMiscFeeSummaryShipmentFilter(event.target.value)} />
            </label>
            <label>
              类别
              <FormSelect value={miscFeeSummaryCategoryFilter} onChange={(event) => setMiscFeeSummaryCategoryFilter(event.target.value)}>
                <option value="">全部</option>
                {miscFeeCategoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <div className="finance-misc-summary-strip">
          <span>合计 {formatFinanceAmount(totalMiscFeeAmount.toFixed(2), '多币种')}</span>
        </div>
        <Table<MiscFeeAllocation>
          columns={[
            { title: '出货单', dataIndex: 'shipment_no', render: (value: string) => <strong>{value}</strong> },
            { title: '类别', dataIndex: 'category', render: miscFeeCategoryLabel },
            { title: '数量', dataIndex: 'count' },
            {
              title: '金额',
              dataIndex: 'amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
          ]}
          dataSource={miscFeeAllocationSummary}
          loading={loadingMiscFeeSummary}
          pagination={false}
          rowKey={(record) => `${record.shipment_no}-${record.category}`}
          size="small"
        />
      </section>
      ) : null}
      </section>
    </section>
  )
}
