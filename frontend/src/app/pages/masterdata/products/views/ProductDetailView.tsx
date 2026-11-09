// 商品资料：独立详情页（图片、基础信息、配件、关联客户、业务记录）

import { Button, Image, Table } from 'antd'
import { ArrowLeft, FilePenLine, LayoutDashboard, Plus, Trash2, Users } from 'lucide-react'

import type {
  Product,
  ProductCustomer,
  ProductExport,
  ProductTransaction,
} from '@/api'
import { t } from '@/app/appI18n'
import { PanelTitle } from '@/shared/ui'
import { accessoryRuleLabel, productTransactionSourceLabel } from '../productHelpers'

type Props = {
  product: Product | null
  customers: ProductCustomer[]
  transactions: ProductTransaction[]
  exportResult: ProductExport | null
  onBack: () => void
  onEdit: () => void
  onDeactivate: () => void
  onAddAccessory: () => void
  onEditAccessory: (accessory: Product['accessories'][number]) => void
  onDeleteAccessory: (accessory: Product['accessories'][number]) => void
}

export function ProductDetailView({
  product,
  customers,
  transactions,
  exportResult,
  onBack,
  onEdit,
  onDeactivate,
  onAddAccessory,
  onEditAccessory,
  onDeleteAccessory,
}: Props) {
  return (
    <section className="workspace-panel detail-panel product-standalone-detail">
      <div className="panel-heading toolbar-heading">
        <PanelTitle icon={<LayoutDashboard size={18} />} title={t('masterdata.product.detailTitle')} />
        {product ? (
          <div className="section-actions">
            <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
              {t('masterdata.product.backToList')}
            </Button>
            <Button icon={<FilePenLine size={16} />} onClick={onEdit}>
              {t('masterdata.product.edit')}
            </Button>
            <Button danger icon={<Trash2 size={16} />} onClick={onDeactivate}>
              {t('masterdata.product.deactivate')}
            </Button>
          </div>
        ) : null}
      </div>
      {product ? (
        <>
          <div className="product-detail-layout">
            <div className="product-photo">
              {product.image_url ? (
                <Image
                  alt={t('masterdata.product.imageAlt', { name: product.cn_name })}
                  height="100%"
                  preview={{ mask: t('masterdata.product.viewLargeImage') }}
                  src={product.image_url}
                  width="100%"
                />
              ) : (
                <span>{t('masterdata.product.noImage')}</span>
              )}
            </div>
            <dl className="detail-list">
              <div>
                <dt>{t('masterdata.product.field.cnName')}</dt>
                <dd>{product.cn_name}</dd>
              </div>
              <div>
                <dt>{t('masterdata.product.field.enName')}</dt>
                <dd>{product.en_name}</dd>
              </div>
              <div>
                <dt>{t('masterdata.product.field.specificationModel')}</dt>
                <dd>
                  {product.specification ?? t('masterdata.product.notFilled')} /{' '}
                  {product.model ?? t('masterdata.product.notFilled')}
                </dd>
              </div>
              <div>
                <dt>{t('masterdata.product.field.customsCode')}</dt>
                <dd>{product.customs_code}</dd>
              </div>
              <div>
                <dt>{t('masterdata.product.field.taxRebateRate')}</dt>
                <dd>
                  {product.tax_rate} / {product.rebate_rate}
                </dd>
              </div>
              <div>
                <dt>{t('masterdata.product.field.status')}</dt>
                <dd>
                  {product.status === 'active'
                    ? t('status.active')
                    : t('status.inactive')}
                </dd>
              </div>
              <div>
                <dt>{t('masterdata.product.field.packageInfo')}</dt>
                <dd>{product.package_info}</dd>
              </div>
            </dl>
          </div>

          <div className="compact-section section-actions">
            <Button icon={<Plus size={16} />} onClick={onAddAccessory}>
              {t('masterdata.product.accessory.add')}
            </Button>
          </div>

          <Table
            className="compact-section"
            columns={[
              { title: t('masterdata.product.field.accessoryName'), dataIndex: 'accessory_name' },
              {
                title: t('masterdata.product.field.unitConsumption'),
                dataIndex: 'unit_consumption',
              },
              { title: t('masterdata.product.field.unit'), dataIndex: 'unit' },
              {
                title: t('masterdata.product.field.defaultSupplier'),
                dataIndex: 'default_supplier_name',
              },
              {
                title: t('masterdata.product.field.purchaseSplit'),
                dataIndex: 'purchase_split_rule',
                render: accessoryRuleLabel,
              },
              {
                title: t('masterdata.product.field.actions'),
                width: 150,
                render: (_, record) => (
                  <div className="table-actions">
                    <Button size="small" onClick={() => onEditAccessory(record)}>
                      {t('common.edit')}
                    </Button>
                    <Button danger size="small" onClick={() => onDeleteAccessory(record)}>
                      {t('common.delete')}
                    </Button>
                  </div>
                ),
              },
            ]}
            dataSource={product.accessories}
            pagination={false}
            rowKey="id"
            size="small"
          />

          <div className="compact-section">
            <PanelTitle icon={<Users size={16} />} title={t('masterdata.product.related.title')} />
            <Table<ProductCustomer>
              columns={[
                { title: t('masterdata.product.related.customer'), dataIndex: 'customer_name' },
                {
                  title: t('masterdata.product.related.contractCount'),
                  dataIndex: 'contract_count',
                  width: 90,
                },
                {
                  title: t('masterdata.product.related.totalQuantity'),
                  dataIndex: 'total_quantity',
                  width: 110,
                },
                {
                  title: t('masterdata.product.related.totalAmount'),
                  dataIndex: 'total_amount',
                  width: 120,
                },
                {
                  title: t('masterdata.product.related.lastContract'),
                  dataIndex: 'last_contract_date',
                  width: 130,
                },
              ]}
              dataSource={customers}
              locale={{ emptyText: t('masterdata.product.related.empty') }}
              pagination={false}
              rowKey={(record) => record.customer_id ?? record.customer_name}
              size="small"
            />
          </div>

          <div className="compact-section">
            <PanelTitle
              icon={<LayoutDashboard size={16} />}
              title={t('masterdata.product.transactions.title')}
            />
            <Table<ProductTransaction>
              columns={[
                {
                  title: t('masterdata.product.transactions.source'),
                  dataIndex: 'source_type',
                  width: 110,
                  render: productTransactionSourceLabel,
                },
                {
                  title: t('masterdata.product.transactions.sourceCode'),
                  dataIndex: 'source_code',
                  width: 160,
                },
                {
                  title: t('masterdata.product.transactions.date'),
                  dataIndex: 'occurred_at',
                  width: 120,
                },
                {
                  title: t('masterdata.product.transactions.counterparty'),
                  dataIndex: 'counterparty_name',
                  width: 150,
                },
                {
                  title: t('masterdata.product.transactions.quantity'),
                  width: 120,
                  render: (_, record) =>
                    record.quantity ? `${record.quantity} ${record.unit ?? ''}` : '-',
                },
                {
                  title: t('masterdata.product.transactions.amount'),
                  dataIndex: 'amount',
                  width: 120,
                },
                {
                  title: t('masterdata.product.transactions.summary'),
                  dataIndex: 'summary',
                },
              ]}
              dataSource={transactions}
              locale={{ emptyText: t('masterdata.product.transactions.empty') }}
              pagination={false}
              rowKey={(record) =>
                `${record.source_type}-${record.source_code}-${record.occurred_at}`
              }
              size="small"
            />
          </div>

          {exportResult ? (
            <section className="export-preview compact-section">
              <strong>{exportResult.filename}</strong>
              <pre>{exportResult.content.slice(0, 1200)}</pre>
            </section>
          ) : null}
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <LayoutDashboard size={28} />
          <strong>{t('masterdata.product.empty.title')}</strong>
          <span>{t('masterdata.product.empty.description')}</span>
        </div>
      )}
    </section>
  )
}
