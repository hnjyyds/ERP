import { Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, Save, ShieldCheck, Wallet } from 'lucide-react'
import { type MiscFeeAllocation, type MiscFeeItem } from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import {
  miscFeeCategoryOptions,
  miscFeeAllocationMethodOptions,
  miscFeeItemStatusOptions,
} from '../../../../shared/formOptions'
import { formatDate, formatFinanceAmount, nullableText } from '../../appHelpers'
import { t } from '../../../appI18n'
import {
  initialMiscFeeAllocationForm,
  miscFeeCategoryLabel,
  miscFeeAllocationMethodLabel,
  miscFeeItemStatusLabel,
  miscFeeItemStatusTag,
} from '../financeHelpers'
import type { MiscModel } from '../hooks/useMiscModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: MiscModel
  shell: FinanceViewShell
}

export function MiscView({ model, shell }: Props) {
  const {
    loadMiscFeeAllocationSummary,
    loadMiscFeeAllocations,
    loadMiscFeeItems,
    loadingMiscFeeAllocations,
    loadingMiscFeeItems,
    loadingMiscFeeSummary,
    miscFeeAllocationCategoryFilter,
    miscFeeAllocationForm,
    miscFeeAllocationSalesFilter,
    miscFeeAllocationSearch,
    miscFeeAllocationShipmentFilter,
    miscFeeAllocations,
    miscFeeItemCategoryFilter,
    miscFeeItemCodeError,
    miscFeeItemForm,
    miscFeeItemSearch,
    miscFeeItemStatusFilter,
    miscFeeItems,
    miscItemModalOpen,
    selectedMiscFeeItem,
    setMiscFeeAllocationCategoryFilter,
    setMiscFeeAllocationForm,
    setMiscFeeAllocationSalesFilter,
    setMiscFeeAllocationSearch,
    setMiscFeeAllocationShipmentFilter,
    setMiscFeeItemCategoryFilter,
    setMiscFeeItemCodeError,
    setMiscFeeItemForm,
    setMiscFeeItemSearch,
    setMiscFeeItemStatusFilter,
    setMiscFeeSummaryCategoryFilter,
    setMiscFeeSummaryShipmentFilter,
    setMiscItemModalOpen,
    setSelectedMiscFeeItemId,
    submitMiscFeeAllocation,
    submitMiscFeeItem,
    submittingMiscFeeAllocation,
    submittingMiscFeeItem,
    totalMiscFeeAmount,
  } = model
  const { detailId, goModule, goDetail, moduleAlerts, moduleHeader } = shell

  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button className="finance-back-button" type="button" onClick={() => goModule('misc')}>
            <ArrowLeft size={16} />
            {t('finance.misc.title')}
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-misc-grid'}
        aria-label={t('finance.misc.title')}
      >
        {!detailId ? (
          <section className="workspace-panel finance-misc-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<ShieldCheck size={18} />}
                title={t('finance.misc.panel.itemConfig')}
              />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadMiscFeeItems()
                }}
              >
                <label>
                  {t('finance.misc.filter.itemSearch')}
                  <Input
                    value={miscFeeItemSearch}
                    onChange={(event) => setMiscFeeItemSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.misc.filter.itemCategory')}
                  <FormSelect
                    value={miscFeeItemCategoryFilter}
                    onChange={(event) => setMiscFeeItemCategoryFilter(event.target.value)}
                  >
                    <option value="">{t('finance.misc.filter.allCategories')}</option>
                    {miscFeeCategoryOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.misc.filter.status')}
                  <FormSelect
                    value={miscFeeItemStatusFilter}
                    onChange={(event) => setMiscFeeItemStatusFilter(event.target.value)}
                  >
                    <option value="">{t('finance.misc.filter.allStatuses')}</option>
                    {miscFeeItemStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.misc.action.search')}
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setMiscFeeItemCodeError('')
                    setMiscItemModalOpen(true)
                  }}
                >
                  {t('finance.misc.action.createMisc')}
                </Button>
              </form>
            </div>
            <Table<MiscFeeItem>
              columns={[
                {
                  title: t('finance.misc.table.code'),
                  dataIndex: 'code',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: t('finance.misc.table.name'), dataIndex: 'name' },
                {
                  title: t('finance.misc.table.category'),
                  dataIndex: 'category',
                  render: miscFeeCategoryLabel,
                },
                {
                  title: t('finance.misc.table.defaultAllocation'),
                  dataIndex: 'default_allocation_method',
                  render: miscFeeAllocationMethodLabel,
                },
                {
                  title: t('finance.field.status'),
                  dataIndex: 'status',
                  render: miscFeeItemStatusTag,
                },
              ]}
              dataSource={miscFeeItems}
              loading={loadingMiscFeeItems}
              pagination={false}
              rowClassName={(record) =>
                record.id === selectedMiscFeeItem?.id ? 'selected-row' : ''
              }
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
          <Modal
            centered
            footer={null}
            open={miscItemModalOpen}
            title={t('finance.misc.modal.createTitle')}
            width={640}
            onCancel={() => setMiscItemModalOpen(false)}
          >
            <form
              className="record-form"
              onSubmit={(e) => {
                submitMiscFeeItem(e)
                setMiscItemModalOpen(false)
              }}
            >
              <div className="form-pair two">
                <label>
                  {t('finance.misc.field.code')}
                  <Input
                    aria-invalid={Boolean(miscFeeItemCodeError)}
                    aria-describedby="misc-fee-item-code-error"
                    value={miscFeeItemForm.code}
                    onChange={(event) => {
                      setMiscFeeItemCodeError('')
                      setMiscFeeItemForm({ ...miscFeeItemForm, code: event.target.value })
                    }}
                  />
                  {miscFeeItemCodeError ? (
                    <span className="form-field-error" id="misc-fee-item-code-error">
                      {miscFeeItemCodeError}
                    </span>
                  ) : null}
                </label>
                <label>
                  {t('finance.misc.field.name')}
                  <Input
                    value={miscFeeItemForm.name}
                    onChange={(event) =>
                      setMiscFeeItemForm({ ...miscFeeItemForm, name: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.misc.field.category')}
                  <FormSelect
                    value={miscFeeItemForm.category}
                    onChange={(event) =>
                      setMiscFeeItemForm({ ...miscFeeItemForm, category: event.target.value })
                    }
                  >
                    {miscFeeCategoryOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.misc.field.defaultAllocationMethod')}
                  <FormSelect
                    value={miscFeeItemForm.default_allocation_method}
                    onChange={(event) =>
                      setMiscFeeItemForm({
                        ...miscFeeItemForm,
                        default_allocation_method: event.target.value,
                      })
                    }
                  >
                    {miscFeeAllocationMethodOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
              </div>
              <label className="checkbox-line">
                <input
                  aria-label={t('finance.misc.field.enableItem')}
                  type="checkbox"
                  checked={miscFeeItemForm.is_active}
                  onChange={(event) =>
                    setMiscFeeItemForm({ ...miscFeeItemForm, is_active: event.target.checked })
                  }
                />
                {t('finance.misc.field.enableItem')}
              </label>
              <label>
                {t('finance.misc.field.remark')}
                <Input
                  value={miscFeeItemForm.remark}
                  onChange={(event) =>
                    setMiscFeeItemForm({ ...miscFeeItemForm, remark: event.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  className="secondary-inline"
                  type="button"
                  onClick={() => setMiscItemModalOpen(false)}
                >
                  {t('finance.misc.action.cancel')}
                </button>
                <button className="inline-submit" disabled={submittingMiscFeeItem} type="submit">
                  {t('finance.misc.action.saveItem')}
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-misc-allocation-panel">
            <PanelTitle
              icon={<Wallet size={18} />}
              title={t('finance.misc.panel.allocation')}
            />
            {selectedMiscFeeItem ? (
              <dl className="detail-list finance-misc-detail-list">
                <div>
                  <dt>{t('finance.misc.field.currentItem')}</dt>
                  <dd>{selectedMiscFeeItem.name}</dd>
                </div>
                <div>
                  <dt>{t('finance.misc.field.category')}</dt>
                  <dd>{miscFeeCategoryLabel(selectedMiscFeeItem.category)}</dd>
                </div>
                <div>
                  <dt>{t('finance.misc.field.defaultMethod')}</dt>
                  <dd>
                    {miscFeeAllocationMethodLabel(selectedMiscFeeItem.default_allocation_method)}
                  </dd>
                </div>
                <div>
                  <dt>{t('finance.field.status')}</dt>
                  <dd>{miscFeeItemStatusLabel(selectedMiscFeeItem.status)}</dd>
                </div>
              </dl>
            ) : (
              <div className="module-state">{t('finance.misc.message.noItem')}</div>
            )}
            <form className="record-form" onSubmit={submitMiscFeeAllocation}>
              <div className="form-pair two">
                <label>
                  {t('finance.misc.field.allocationNo')}
                  <Input
                    readOnly
                    value={miscFeeAllocationForm.allocation_no}
                    placeholder={t('finance.form.codeAutoGenerated')}
                  />
                </label>
                <label>
                  {t('finance.misc.field.itemId')}
                  <Input
                    value={miscFeeAllocationForm.item_id}
                    onChange={(event) =>
                      setMiscFeeAllocationForm({
                        ...miscFeeAllocationForm,
                        item_id: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.misc.field.shipmentPlanId')}
                  <Input
                    value={miscFeeAllocationForm.shipment_plan_id}
                    onChange={(event) =>
                      setMiscFeeAllocationForm({
                        ...miscFeeAllocationForm,
                        shipment_plan_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.misc.field.shipmentNo')}
                  <Input
                    value={miscFeeAllocationForm.shipment_no}
                    onChange={(event) =>
                      setMiscFeeAllocationForm({
                        ...miscFeeAllocationForm,
                        shipment_no: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.misc.field.salesUserId')}
                  <Input
                    value={miscFeeAllocationForm.sales_user_id}
                    onChange={(event) =>
                      setMiscFeeAllocationForm({
                        ...miscFeeAllocationForm,
                        sales_user_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.misc.field.salesUserName')}
                  <Input
                    value={miscFeeAllocationForm.sales_user_name}
                    onChange={(event) =>
                      setMiscFeeAllocationForm({
                        ...miscFeeAllocationForm,
                        sales_user_name: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  {t('finance.misc.field.allocatedAt')}
                  <Input
                    type="date"
                    value={miscFeeAllocationForm.allocated_at}
                    onChange={(event) =>
                      setMiscFeeAllocationForm({
                        ...miscFeeAllocationForm,
                        allocated_at: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.field.amount')}
                  <Input
                    value={miscFeeAllocationForm.amount}
                    onChange={(event) =>
                      setMiscFeeAllocationForm({
                        ...miscFeeAllocationForm,
                        amount: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.field.currency')}
                  <Input
                    value={miscFeeAllocationForm.currency}
                    onChange={(event) =>
                      setMiscFeeAllocationForm({
                        ...miscFeeAllocationForm,
                        currency: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                {t('finance.misc.field.allocationMethod')}
                <FormSelect
                  value={miscFeeAllocationForm.allocation_method}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      allocation_method: event.target.value,
                    })
                  }
                >
                  {miscFeeAllocationMethodOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                {t('finance.misc.field.basis')}
                <Input
                  value={miscFeeAllocationForm.basis}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      basis: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                {t('finance.misc.field.remark')}
                <Input
                  value={miscFeeAllocationForm.remark}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      remark: event.target.value,
                    })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingMiscFeeAllocation}
                disabled={!selectedMiscFeeItem}
              >
                {t('finance.misc.action.saveAllocation')}
              </Button>
            </form>
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-misc-summary-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('finance.misc.panel.allocationQuery')}
              />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadMiscFeeAllocations()
                  void loadMiscFeeAllocationSummary()
                }}
              >
                <label>
                  {t('finance.misc.filter.allocationSearch')}
                  <Input
                    value={miscFeeAllocationSearch}
                    onChange={(event) => setMiscFeeAllocationSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.misc.filter.category')}
                  <FormSelect
                    value={miscFeeAllocationCategoryFilter}
                    onChange={(event) => {
                      setMiscFeeAllocationCategoryFilter(event.target.value)
                      setMiscFeeSummaryCategoryFilter(event.target.value)
                    }}
                  >
                    <option value="">{t('finance.misc.filter.allCategories')}</option>
                    {miscFeeCategoryOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.misc.filter.shipmentNo')}
                  <Input
                    value={miscFeeAllocationShipmentFilter}
                    onChange={(event) => {
                      setMiscFeeAllocationShipmentFilter(event.target.value)
                      setMiscFeeSummaryShipmentFilter(event.target.value)
                    }}
                  />
                </label>
                <label>
                  {t('finance.misc.filter.salesUserId')}
                  <Input
                    value={miscFeeAllocationSalesFilter}
                    onChange={(event) => setMiscFeeAllocationSalesFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.misc.action.search')}
                </Button>
              </form>
            </div>
            <div className="finance-receipt-strip">
              <span>
                {t('finance.misc.metric.allocationCount', { count: miscFeeAllocations.length })}
              </span>
              <strong>
                {formatFinanceAmount(
                  totalMiscFeeAmount.toFixed(2),
                  miscFeeAllocations[0]?.currency ?? 'USD',
                )}
              </strong>
              <span>{t('finance.misc.metric.allocationHint')}</span>
            </div>
            <Table<MiscFeeAllocation>
              columns={[
                {
                  title: t('finance.misc.table.allocationNo'),
                  dataIndex: 'allocation_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: t('finance.misc.table.miscItem'), dataIndex: 'item_name' },
                {
                  title: t('finance.misc.table.category'),
                  dataIndex: 'item_category',
                  render: miscFeeCategoryLabel,
                },
                { title: t('finance.misc.table.shipment'), dataIndex: 'shipment_no' },
                { title: t('finance.misc.table.customer'), dataIndex: 'customer_name' },
                {
                  title: t('finance.misc.table.salesUser'),
                  dataIndex: 'sales_user_name',
                  render: nullableText,
                },
                {
                  title: t('finance.misc.table.allocatedAt'),
                  dataIndex: 'allocated_at',
                  render: formatDate,
                },
                {
                  title: t('finance.field.amount'),
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.misc.table.method'),
                  dataIndex: 'allocation_method',
                  render: miscFeeAllocationMethodLabel,
                },
              ]}
              dataSource={miscFeeAllocations}
              loading={loadingMiscFeeAllocations || loadingMiscFeeSummary}
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
