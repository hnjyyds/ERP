import { Button, Input, Table } from 'antd'
import { Plus, Search } from 'lucide-react'

import type { PurchaseInquiry } from '@/api'
import { ListPageShell, FormSelect } from '@/shared/ui'
import { formatDate, formatMoney } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { purchaseInquiryStatusOptions } from '@/shared/formOptions'

import { lowestSupplierQuotation, purchaseInquiryStatusLabel } from '../purchaseInquiryHelpers'
import type { usePurchaseInquiriesList } from '../hooks/usePurchaseInquiriesList'

type Props = {
  model: ReturnType<typeof usePurchaseInquiriesList>
  onCreate: () => void
}

export function PurchaseInquiryListPanel({ model, onCreate }: Props) {
  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      title={t('purchase.inquiry.list.title')}
      toolbar={
        <form
          className="inline-filters"
          onSubmit={(event) => {
            event.preventDefault()
            model.submitFilters()
          }}
        >
          <label>
            {t('purchase.inquiry.list.searchLabel')}
            <Input
              value={model.search}
              placeholder={t('purchase.inquiry.list.searchPlaceholder')}
              onChange={(event) => model.setSearch(event.target.value)}
            />
          </label>
          <label>
            {t('purchase.inquiry.list.statusFilter')}
            <FormSelect
              value={model.statusFilter}
              onChange={(event) => model.setStatusFilter(event.target.value)}
            >
              <option value="">{t('purchase.inquiry.list.allStatuses')}</option>
              {purchaseInquiryStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label>
            {t('purchase.inquiry.list.productFilter')}
            <Input
              value={model.productFilter}
              placeholder={t('purchase.inquiry.list.productFilterPlaceholder')}
              onChange={(event) => model.setProductFilter(event.target.value)}
            />
          </label>
          <label>
            {t('purchase.inquiry.list.supplierFilter')}
            <Input
              value={model.supplierFilter}
              placeholder={t('purchase.inquiry.list.supplierFilterPlaceholder')}
              onChange={(event) => model.setSupplierFilter(event.target.value)}
            />
          </label>
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('purchase.inquiry.list.query')}
          </Button>
          <Button htmlType="button" icon={<Plus size={16} />} onClick={onCreate}>
            {t('purchase.inquiry.list.create')}
          </Button>
        </form>
      }
    >
      <Table<PurchaseInquiry>
        columns={[
          {
            title: t('purchase.inquiry.field.code'),
            dataIndex: 'code',
            render: (value: string, record: PurchaseInquiry) => (
              <button
                className="row-button"
                type="button"
                onClick={(event) => model.stopAndOpenInquiryDetail(event, record)}
              >
                {value}
              </button>
            ),
          },
          {
            title: t('purchase.inquiry.field.status'),
            dataIndex: 'status',
            render: purchaseInquiryStatusLabel,
          },
          {
            title: t('purchase.inquiry.field.product'),
            dataIndex: 'lines',
            render: (_, inquiry) =>
              `${inquiry.lines[0]?.product_code ?? t('purchase.inquiry.detail.notFilled')} / ${inquiry.lines[0]?.product_name ?? t('purchase.inquiry.detail.notFilled')}`,
          },
          {
            title: t('purchase.inquiry.field.inquiryDay'),
            dataIndex: 'inquiry_date',
            render: formatDate,
          },
          {
            title: t('purchase.inquiry.field.quoteCount'),
            dataIndex: 'quotations',
            render: (_, inquiry) => inquiry.quotations.length,
          },
          {
            title: t('purchase.inquiry.field.lowestPrice'),
            dataIndex: 'quotations',
            render: (_, inquiry) => {
              const lowest = lowestSupplierQuotation(inquiry.quotations)
              return lowest
                ? formatMoney(lowest.unit_price, lowest.currency)
                : t('purchase.inquiry.detail.notQuoted')
            },
          },
          {
            title: t('purchase.inquiry.field.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record: PurchaseInquiry) => (
              <Button size="small" onClick={(event) => model.stopAndOpenInquiryDetail(event, record)}>
                {t('purchase.inquiry.action.viewDetail')}
              </Button>
            ),
          },
        ]}
        dataSource={model.inquiries}
        loading={model.loading}
        pagination={{
          ...model.pagination,
          onChange: (nextPage, nextPageSize) => model.changeListPage(nextPage, nextPageSize),
        }}
        rowClassName={(record) => (record.id === model.selectedInquiry?.id ? 'selected-row' : '')}
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => model.setSelectedInquiryId(record.id),
        })}
      />
    </ListPageShell>
  )
}
