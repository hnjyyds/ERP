import { Button, Input, Table, Tag } from 'antd'
import { Plus, RefreshCw, RotateCcw, Search } from 'lucide-react'
import type { MouseEvent } from 'react'

import type { QualityInspection, QualityInspectionStatus } from '@/api'
import { FormSelect, ListPageShell, RemoteSelect } from '@/shared/ui'
import { t } from '@/app/appI18n'

import {
  formatScheduledAt,
  nextAction,
  qualityResultOptions,
  qualityTaskStatusOptions,
  resultColor,
  resultLabel,
  taskPriority,
  taskStatusColor,
  taskStatusLabel,
  type QualityInspectionAssigneeFilter,
} from '../qualityInspectionMeta'
import type { useQualityInspectionsList } from '../hooks/useQualityInspectionsList'

type Props = {
  model: ReturnType<typeof useQualityInspectionsList>
  onCreate: () => void
  onOpenDetail: (event: MouseEvent<HTMLElement>, inspection: QualityInspection) => void
}

export function QualityInspectionListPanel({ model, onCreate, onOpenDetail }: Props) {
  const prioritizedInspections = model.inspections
    .map((inspection, index) => ({ inspection, index }))
    .sort(
      (left, right) =>
        taskPriority(left.inspection) - taskPriority(right.inspection) || left.index - right.index,
    )
    .map(({ inspection }) => inspection)

  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      title={t('quality.inspection.panel.listTitle')}
    >
      <form
        className="inline-filters single-line-filter-toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          model.submitFilters()
        }}
      >
        <label>
          {t('quality.inspection.filter.search')}
          <Input
            value={model.search}
            placeholder={t('quality.inspection.filter.searchPlaceholder')}
            onChange={(event) => model.setSearch(event.target.value)}
          />
        </label>
        <label>
          {t('quality.inspection.filter.status')}
          <FormSelect
            value={model.statusFilter}
            onChange={(event) => model.setStatusFilter(event.target.value)}
          >
            <option value="">{t('quality.inspection.filter.allStatuses')}</option>
            {qualityTaskStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </FormSelect>
        </label>
        <label>
          {t('quality.inspection.filter.result')}
          <FormSelect
            value={model.resultFilter}
            onChange={(event) => model.setResultFilter(event.target.value)}
          >
            <option value="">{t('quality.inspection.filter.allResults')}</option>
            {qualityResultOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </FormSelect>
        </label>
        <label className="entity-search-filter">
          {t('quality.inspection.filter.supplier')}
          <RemoteSelect
            ariaLabel={t('quality.inspection.filter.supplierAria')}
            fetchOptions={model.fetchSupplierOptions}
            placeholder={t('quality.inspection.filter.supplierPlaceholder')}
            value={model.supplierFilter || null}
            onChange={(value) => {
              model.setSupplierFilter(value)
              model.setContractFilter('')
            }}
          />
        </label>
        <label className="entity-search-filter">
          {t('quality.inspection.filter.contract')}
          <RemoteSelect
            ariaLabel={t('quality.inspection.filter.contractAria')}
            fetchOptions={model.fetchFilterContractOptions}
            placeholder={t('quality.inspection.filter.contractPlaceholder')}
            value={model.contractFilter || null}
            onChange={model.setContractFilter}
          />
        </label>
        <label>
          {t('quality.inspection.filter.assignee')}
          <FormSelect
            value={model.assigneeFilter}
            onChange={(event) =>
              model.setAssigneeFilter(event.target.value as QualityInspectionAssigneeFilter)
            }
          >
            <option value="all">{t('quality.inspection.filter.allAssignees')}</option>
            <option value="mine">{t('quality.inspection.filter.mine')}</option>
          </FormSelect>
        </label>
        <div className="filter-actions">
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('quality.inspection.action.query')}
          </Button>
          <Button
            aria-label={t('quality.inspection.action.resetFilters')}
            htmlType="button"
            icon={<RotateCcw size={16} />}
            title={t('quality.inspection.action.resetFilters')}
            onClick={model.resetFilters}
          />
          <Button
            aria-label={t('quality.inspection.action.refreshList')}
            htmlType="button"
            icon={<RefreshCw size={16} />}
            loading={model.loading}
            title={t('quality.inspection.action.refreshList')}
            onClick={() => void model.loadQualityInspections()}
          />
          <Button type="primary" icon={<Plus size={16} />} onClick={onCreate}>
            {t('quality.inspection.action.create')}
          </Button>
        </div>
      </form>

      <Table<QualityInspection>
        columns={[
          {
            title: t('quality.inspection.table.code'),
            dataIndex: 'code',
            render: (value: string, record) => (
              <button className="row-button" type="button" onClick={(event) => onOpenDetail(event, record)}>
                {value}
              </button>
            ),
          },
          {
            title: t('quality.inspection.table.status'),
            dataIndex: 'status',
            render: (value: QualityInspectionStatus) => (
              <Tag color={taskStatusColor(value)}>{taskStatusLabel(value)}</Tag>
            ),
          },
          {
            title: t('quality.inspection.table.result'),
            dataIndex: 'result',
            render: (value: string | null) => (
              <Tag color={resultColor(value)}>{resultLabel(value)}</Tag>
            ),
          },
          { title: t('quality.inspection.table.contract'), dataIndex: 'purchase_contract_no' },
          { title: t('quality.inspection.table.supplier'), dataIndex: 'supplier_name' },
          { title: t('quality.inspection.table.inspector'), dataIndex: 'inspector_name' },
          {
            title: t('quality.inspection.table.scheduledAt'),
            dataIndex: 'scheduled_at',
            render: formatScheduledAt,
          },
          {
            title: t('quality.inspection.table.nextAction'),
            key: 'next-action',
            render: (_: unknown, record) => {
              const action = nextAction(record)
              return <Tag color={action.color}>{action.label}</Tag>
            },
          },
          {
            title: t('quality.inspection.table.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record) => (
              <Button size="small" onClick={(event) => onOpenDetail(event, record)}>
                {t('quality.inspection.action.viewDetail')}
              </Button>
            ),
          },
        ]}
        dataSource={prioritizedInspections}
        loading={model.loading}
        pagination={{
          ...model.pagination,
          onChange: (nextPage, nextPageSize) => {
            model.changeInspectionsPage(nextPage, nextPageSize)
          },
        }}
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => model.setSelectedInspectionId(record.id),
        })}
      />
    </ListPageShell>
  )
}
