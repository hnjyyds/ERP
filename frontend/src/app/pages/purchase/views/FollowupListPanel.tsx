import { Button, Input, Table } from 'antd'
import { Search, Settings } from 'lucide-react'
import type { MouseEvent } from 'react'

import { followupStatusOptions } from '@/shared/formOptions'
import { FormSelect, ListPageShell } from '@/shared/ui'
import { formatDate } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type { PurchaseFollowPlan } from '@/api'

import { followupPlanStatusLabel } from '../followupHelpers'
import type { useFollowupWorkspace } from '../hooks/useFollowupWorkspace'

type Props = {
  model: ReturnType<typeof useFollowupWorkspace>
  onConfigure: () => void
  onSelectPlan: (plan: PurchaseFollowPlan) => void
  onStopAndOpenDetail: (event: MouseEvent<HTMLElement>, plan: PurchaseFollowPlan) => void
}

export function FollowupListPanel({
  model,
  onConfigure,
  onSelectPlan,
  onStopAndOpenDetail,
}: Props) {
  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      title={t('purchase.followup.list.title')}
      toolbar={
        <form
          className="inline-filters single-line-filter-toolbar"
          onSubmit={(event) => {
            event.preventDefault()
            model.submitFilters()
          }}
        >
          <label>
            {t('purchase.followup.list.searchLabel')}
            <Input
              value={model.search}
              placeholder={t('purchase.followup.list.searchPlaceholder')}
              onChange={(event) => model.setSearch(event.target.value)}
            />
          </label>
          <label>
            {t('purchase.followup.list.statusFilter')}
            <FormSelect
              value={model.statusFilter}
              onChange={(event) => model.setStatusFilter(event.target.value)}
            >
              <option value="">{t('purchase.followup.list.allStatuses')}</option>
              {followupStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label>
            {t('purchase.followup.list.supplierFilter')}
            <Input
              value={model.supplierFilter}
              placeholder={t('purchase.followup.list.supplierFilterPlaceholder')}
              onChange={(event) => model.setSupplierFilter(event.target.value)}
            />
          </label>
          <label>
            {t('purchase.followup.list.contractFilter')}
            <Input
              value={model.contractFilter}
              placeholder={t('purchase.followup.list.contractFilterPlaceholder')}
              onChange={(event) => model.setContractFilter(event.target.value)}
            />
          </label>
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('purchase.followup.list.query')}
          </Button>
          <Button htmlType="button" icon={<Settings size={16} />} onClick={onConfigure}>
            {t('purchase.followup.list.configureGenerate')}
          </Button>
        </form>
      }
    >
      <Table<PurchaseFollowPlan>
        columns={[
          {
            title: t('purchase.followup.field.purchaseContract'),
            dataIndex: 'purchase_contract_no',
            render: (value: string, record: PurchaseFollowPlan) => (
              <button
                className="row-button"
                type="button"
                onClick={(event) => onStopAndOpenDetail(event, record)}
              >
                {value}
              </button>
            ),
          },
          {
            title: t('purchase.followup.field.status'),
            dataIndex: 'overall_status',
            render: followupPlanStatusLabel,
          },
          { title: t('purchase.followup.field.supplier'), dataIndex: 'supplier_name' },
          {
            title: t('purchase.followup.field.baseDay'),
            dataIndex: 'base_date',
            render: formatDate,
          },
          {
            title: t('purchase.followup.field.nodes'),
            dataIndex: 'nodes',
            render: (_, plan) =>
              `${plan.nodes.filter((node) => node.status === 'completed').length}/${plan.nodes.length}`,
          },
          {
            title: t('purchase.followup.field.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record: PurchaseFollowPlan) => (
              <Button size="small" onClick={(event) => onStopAndOpenDetail(event, record)}>
                {t('purchase.followup.action.viewDetail')}
              </Button>
            ),
          },
        ]}
        dataSource={model.plans}
        loading={model.loading}
        pagination={{
          ...model.pagination,
          onChange: (nextPage, nextPageSize) => {
            model.changeListPage(nextPage, nextPageSize)
          },
        }}
        rowClassName={(record) =>
          record.id === model.selectedPlan?.id ? 'selected-row' : ''
        }
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => onSelectPlan(record),
        })}
      />
    </ListPageShell>
  )
}
