// 商品资料：列表面板（查询、导入/导出入口、列视图、分页）

import { Button, Input, Table, Tag, Tooltip } from 'antd'
import { Download, Plus, Search, Upload as UploadIcon } from 'lucide-react'
import type { MouseEvent } from 'react'

import type { Product } from '@/api'
import { t } from '@/app/appI18n'
import { ListPageShell } from '@/shared/ui'
import { ListEmptyState } from '@/shared/ui/ListEmptyState'
import type { ProductsListModel } from '../hooks/useProductsPage'

type Props = {
  model: ProductsListModel
  onCreate: () => void
  onOpenImport: () => void
  onExport: () => void
  onOpenDetail: (product: Product) => void
}

export function ProductsListView({ model, onCreate, onOpenImport, onExport, onOpenDetail }: Props) {
  const {
    products,
    selectedProduct,
    search,
    setSearch,
    loading,
    selectedRowKeys,
    setSelectedRowKeys,
    columnViewControl,
    isColumnVisible,
    pagination,
    goToPage,
    submitSearch,
    setSelectedProductId,
  } = model

  function stopAndOpenDetail(event: MouseEvent<HTMLElement>, product: Product) {
    event.stopPropagation()
    onOpenDetail(product)
  }

  return (
    <ListPageShell
      icon={<Search size={18} />}
      title={t('masterdata.product.listTitle')}
      toolbar={
        <form
          className="inline-filters product-list-filters"
          onSubmit={(event) => {
            event.preventDefault()
            submitSearch()
          }}
        >
          <label className="inline-filter-search">
            {t('masterdata.product.searchLabel')}
            <Input
              value={search}
              placeholder={t('masterdata.product.searchPlaceholder')}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="product-filter-actions">
            <Tooltip title={t('masterdata.product.searchAction')}>
              <Button
                aria-label={t('masterdata.product.searchAction')}
                className="toolbar-icon-button"
                htmlType="submit"
                icon={<Search size={16} />}
              />
            </Tooltip>
            <Button type="primary" icon={<Plus size={16} />} onClick={onCreate}>
              {t('masterdata.product.create')}
            </Button>
            <Tooltip title={t('masterdata.product.importAction')}>
              <Button
                aria-label={t('masterdata.product.importAction')}
                icon={<UploadIcon size={16} />}
                onClick={onOpenImport}
              >
                {t('masterdata.product.importShort')}
              </Button>
            </Tooltip>
            <Tooltip
              title={
                selectedRowKeys.length > 0
                  ? t('masterdata.product.exportSelected', { count: selectedRowKeys.length })
                  : t('masterdata.product.exportAll')
              }
            >
              <Button
                aria-label={
                  selectedRowKeys.length > 0
                    ? t('masterdata.product.exportSelected', { count: selectedRowKeys.length })
                    : t('masterdata.product.exportAll')
                }
                icon={<Download size={16} />}
                onClick={onExport}
              >
                {t('masterdata.product.exportShort')}
              </Button>
            </Tooltip>
            {columnViewControl}
          </div>
        </form>
      }
    >
      <Table<Product>
        locale={{
          emptyText: (
            <ListEmptyState
              createLabel={t('masterdata.product.create')}
              emptyTitle={t('masterdata.product.emptyTitle')}
              filtered={Boolean(search.trim())}
              onCreate={onCreate}
              onClearFilters={() => submitSearch('')}
            />
          ),
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        columns={[
          {
            title: t('masterdata.product.field.code'),
            dataIndex: 'code',
            render: (value: string, record: Product) => (
              <button
                className="row-button"
                type="button"
                onClick={(event) => stopAndOpenDetail(event, record)}
              >
                {value}
              </button>
            ),
          },
          { title: t('masterdata.product.field.cnName'), dataIndex: 'cn_name' },
          { title: t('masterdata.product.field.enName'), dataIndex: 'en_name' },
          { title: t('masterdata.product.field.customsCode'), dataIndex: 'customs_code' },
          { title: t('masterdata.product.field.unit'), dataIndex: 'unit', width: 80 },
          {
            title: t('masterdata.product.field.status'),
            dataIndex: 'status',
            width: 90,
            render: (value: string) => (
              <Tag color={value === 'active' ? 'success' : 'default'}>
                {value === 'active' ? t('status.active') : t('status.inactive')}
              </Tag>
            ),
          },
          {
            title: t('masterdata.product.field.accessories'),
            dataIndex: 'accessories',
            width: 80,
            render: (_value: Product['accessories'], record: Product) => record.accessories.length,
          },
          {
            title: t('masterdata.product.field.entry'),
            dataIndex: 'detail',
            width: 110,
            render: (_value: unknown, record: Product) => (
              <Button size="small" onClick={(event) => stopAndOpenDetail(event, record)}>
                {t('masterdata.product.viewDetail')}
              </Button>
            ),
          },
        ].filter(
          (column) =>
            column.dataIndex === 'detail' || isColumnVisible(column.dataIndex as string),
        )}
        dataSource={products}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (nextPage, nextPageSize) => goToPage(nextPage, nextPageSize),
        }}
        rowClassName={(record) => (record.id === selectedProduct?.id ? 'selected-row' : '')}
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => setSelectedProductId(record.id),
        })}
      />
    </ListPageShell>
  )
}
