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
              <PanelTitle icon={<ShieldCheck size={18} />} title="杂费项目配置" />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadMiscFeeItems()
                }}
              >
                <label>
                  项目搜索
                  <Input
                    value={miscFeeItemSearch}
                    onChange={(event) => setMiscFeeItemSearch(event.target.value)}
                  />
                </label>
                <label>
                  项目分类
                  <FormSelect
                    value={miscFeeItemCategoryFilter}
                    onChange={(event) => setMiscFeeItemCategoryFilter(event.target.value)}
                  >
                    <option value="">全部分类</option>
                    {miscFeeCategoryOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  启停状态
                  <FormSelect
                    value={miscFeeItemStatusFilter}
                    onChange={(event) => setMiscFeeItemStatusFilter(event.target.value)}
                  >
                    <option value="">全部状态</option>
                    {miscFeeItemStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setMiscItemModalOpen(true)}
                >
                  新增杂费
                </Button>
              </form>
            </div>
            <Table<MiscFeeItem>
              columns={[
                {
                  title: '项目编码',
                  dataIndex: 'code',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: '项目名称', dataIndex: 'name' },
                { title: '分类', dataIndex: 'category', render: miscFeeCategoryLabel },
                {
                  title: '默认分摊',
                  dataIndex: 'default_allocation_method',
                  render: miscFeeAllocationMethodLabel,
                },
                { title: '状态', dataIndex: 'status', render: miscFeeItemStatusTag },
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
            title="新增杂费项目"
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
                  项目编码
                  <Input
                    value={miscFeeItemForm.code}
                    onChange={(event) =>
                      setMiscFeeItemForm({ ...miscFeeItemForm, code: event.target.value })
                    }
                  />
                </label>
                <label>
                  项目名称
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
                  项目分类
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
                  默认分摊方式
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
                  aria-label="启用项目"
                  type="checkbox"
                  checked={miscFeeItemForm.is_active}
                  onChange={(event) =>
                    setMiscFeeItemForm({ ...miscFeeItemForm, is_active: event.target.checked })
                  }
                />
                启用项目
              </label>
              <label>
                备注
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
                  取消
                </button>
                <button className="inline-submit" disabled={submittingMiscFeeItem} type="submit">
                  保存项目
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-misc-allocation-panel">
            <PanelTitle icon={<Wallet size={18} />} title="单票杂费分摊" />
            {selectedMiscFeeItem ? (
              <dl className="detail-list finance-misc-detail-list">
                <div>
                  <dt>当前项目</dt>
                  <dd>{selectedMiscFeeItem.name}</dd>
                </div>
                <div>
                  <dt>分类</dt>
                  <dd>{miscFeeCategoryLabel(selectedMiscFeeItem.category)}</dd>
                </div>
                <div>
                  <dt>默认方式</dt>
                  <dd>
                    {miscFeeAllocationMethodLabel(selectedMiscFeeItem.default_allocation_method)}
                  </dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{miscFeeItemStatusLabel(selectedMiscFeeItem.status)}</dd>
                </div>
              </dl>
            ) : (
              <div className="module-state">暂无杂费项目</div>
            )}
            <form className="record-form" onSubmit={submitMiscFeeAllocation}>
              <div className="form-pair two">
                <label>
                  分摊单号
                  <Input
                    value={miscFeeAllocationForm.allocation_no}
                    onChange={(event) =>
                      setMiscFeeAllocationForm({
                        ...miscFeeAllocationForm,
                        allocation_no: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  项目标识
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
                  出运单标识
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
                  出运单号
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
                  业务员标识
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
                  业务员姓名
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
                  分摊日期
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
                  金额
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
                  币种
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
                分摊方式
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
                分摊依据
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
                备注
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
                保存分摊
              </Button>
            </form>
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-misc-summary-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<LayoutDashboard size={18} />} title="杂费分摊查询" />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadMiscFeeAllocations()
                  void loadMiscFeeAllocationSummary()
                }}
              >
                <label>
                  分摊搜索
                  <Input
                    value={miscFeeAllocationSearch}
                    onChange={(event) => setMiscFeeAllocationSearch(event.target.value)}
                  />
                </label>
                <label>
                  分类
                  <FormSelect
                    value={miscFeeAllocationCategoryFilter}
                    onChange={(event) => {
                      setMiscFeeAllocationCategoryFilter(event.target.value)
                      setMiscFeeSummaryCategoryFilter(event.target.value)
                    }}
                  >
                    <option value="">全部分类</option>
                    {miscFeeCategoryOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  出运单号
                  <Input
                    value={miscFeeAllocationShipmentFilter}
                    onChange={(event) => {
                      setMiscFeeAllocationShipmentFilter(event.target.value)
                      setMiscFeeSummaryShipmentFilter(event.target.value)
                    }}
                  />
                </label>
                <label>
                  业务员标识
                  <Input
                    value={miscFeeAllocationSalesFilter}
                    onChange={(event) => setMiscFeeAllocationSalesFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
              </form>
            </div>
            <div className="finance-receipt-strip">
              <span>分摊记录 {miscFeeAllocations.length} 条</span>
              <strong>
                {formatFinanceAmount(
                  totalMiscFeeAmount.toFixed(2),
                  miscFeeAllocations[0]?.currency ?? 'USD',
                )}
              </strong>
              <span>已进入单票利润成本</span>
            </div>
            <Table<MiscFeeAllocation>
              columns={[
                {
                  title: '分摊单号',
                  dataIndex: 'allocation_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: '杂费项目', dataIndex: 'item_name' },
                { title: '分类', dataIndex: 'item_category', render: miscFeeCategoryLabel },
                { title: '出运单', dataIndex: 'shipment_no' },
                { title: '客户', dataIndex: 'customer_name' },
                { title: '业务员', dataIndex: 'sales_user_name', render: nullableText },
                { title: '分摊日', dataIndex: 'allocated_at', render: formatDate },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '方式',
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
