// 开票通知：列表面板（筛选、分页、详情入口）

import { Button, Input, Table } from 'antd'
import { Plus, Search } from 'lucide-react'
import type { MouseEvent } from 'react'

import type { PurchaseInvoiceNotice } from '@/api'
import { t } from '@/app/appI18n'
import { formatMoney } from '@/app/pages/appHelpers'
import { purchaseInvoiceNoticeStatusOptions } from '@/shared/formOptions'
import { FormSelect, ListPageShell } from '@/shared/ui'
import {
  purchaseInvoiceNoticeStatusLabel,
} from '../invoiceNoticeHelpers'
import type { PurchaseInvoiceNoticesModel } from '../hooks/usePurchaseInvoiceNotices'

type Props = {
  model: PurchaseInvoiceNoticesModel
}

export function PurchaseInvoiceNoticesListView({ model }: Props) {
  const {
    notices,
    selectedNotice,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    customsFilter,
    setCustomsFilter,
    pagination,
    submitSearch,
    goToPage,
    openGenerateModal,
    openInvoiceNoticeDetail,
    setSelectedNoticeId,
  } = model

  function stopAndOpenDetail(event: MouseEvent<HTMLElement>, notice: PurchaseInvoiceNotice) {
    event.stopPropagation()
    openInvoiceNoticeDetail(notice)
  }

  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      title={t('purchase.invoiceNotice.list.title')}
      toolbar={
        <form
          className="inline-filters"
          onSubmit={(event) => {
            event.preventDefault()
            submitSearch()
          }}
        >
          <label>
            {t('purchase.invoiceNotice.list.searchLabel')}
            <Input
              value={search}
              placeholder={t('purchase.invoiceNotice.list.searchPlaceholder')}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            {t('purchase.invoiceNotice.list.statusFilter')}
            <FormSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">{t('purchase.invoiceNotice.list.allStatuses')}</option>
              {purchaseInvoiceNoticeStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label>
            {t('purchase.invoiceNotice.list.supplierFilter')}
            <Input
              value={supplierFilter}
              placeholder={t('purchase.invoiceNotice.list.supplierFilterPlaceholder')}
              onChange={(event) => setSupplierFilter(event.target.value)}
            />
          </label>
          <label>
            {t('purchase.invoiceNotice.list.customsFilter')}
            <Input
              value={customsFilter}
              placeholder={t('purchase.invoiceNotice.list.customsFilterPlaceholder')}
              onChange={(event) => setCustomsFilter(event.target.value)}
            />
          </label>
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('purchase.invoiceNotice.list.query')}
          </Button>
          <Button htmlType="button" icon={<Plus size={16} />} onClick={openGenerateModal}>
            {t('purchase.invoiceNotice.list.generate')}
          </Button>
        </form>
      }
    >
      <Table<PurchaseInvoiceNotice>
        columns={[
          {
            title: t('purchase.invoiceNotice.field.noticeCode'),
            dataIndex: 'code',
            render: (value: string, record: PurchaseInvoiceNotice) => (
              <button
                className="row-button"
                type="button"
                onClick={(event) => stopAndOpenDetail(event, record)}
              >
                {value}
              </button>
            ),
          },
          {
            title: t('purchase.invoiceNotice.field.status'),
            dataIndex: 'status',
            render: purchaseInvoiceNoticeStatusLabel,
          },
          { title: t('purchase.invoiceNotice.field.supplier'), dataIndex: 'supplier_name' },
          {
            title: t('purchase.invoiceNotice.field.customsDeclaration'),
            dataIndex: 'customs_declaration_no',
          },
          {
            title: t('purchase.invoiceNotice.field.amount'),
            dataIndex: 'total_amount',
            render: (_, notice) => formatMoney(notice.total_amount, notice.currency),
          },
          {
            title: t('purchase.invoiceNotice.field.reminders'),
            dataIndex: 'reminders',
            render: (_, notice) =>
              t('purchase.invoiceNotice.list.openReminderCount', {
                count: notice.reminders.filter((item) => item.status === 'open').length,
              }),
          },
          {
            title: t('purchase.invoiceNotice.field.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record: PurchaseInvoiceNotice) => (
              <Button size="small" onClick={(event) => stopAndOpenDetail(event, record)}>
                {t('purchase.invoiceNotice.action.viewDetail')}
              </Button>
            ),
          },
        ]}
        dataSource={notices}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (nextPage, nextPageSize) => goToPage(nextPage, nextPageSize),
        }}
        rowClassName={(record) => (record.id === selectedNotice?.id ? 'selected-row' : '')}
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => setSelectedNoticeId(record.id),
        })}
      />
    </ListPageShell>
  )
}
