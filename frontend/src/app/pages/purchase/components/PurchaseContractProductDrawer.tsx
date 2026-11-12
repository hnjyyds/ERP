import { Button, Checkbox, Drawer, Empty, Input } from 'antd'
import { PackagePlus, Search } from 'lucide-react'

import type { Product } from '@/api'
import { t } from '@/app/appI18n'
import { productPath } from '@/app/routes'

type Props = {
  open: boolean
  products: Product[]
  loading: boolean
  search: string
  pendingProductIds: string[]
  selectedProductIds: Set<string>
  onSearchChange: (value: string) => void
  onToggle: (productId: string, checked: boolean) => void
  onAdd: () => void
  onClose: () => void
}

export function PurchaseContractProductDrawer({
  open,
  products,
  loading,
  search,
  pendingProductIds,
  selectedProductIds,
  onSearchChange,
  onToggle,
  onAdd,
  onClose,
}: Props) {
  return (
    <Drawer
      destroyOnHidden
      footer={
        <div className="product-picker-actions">
          <span>{t('purchase.contract.form.selectedCount', { count: pendingProductIds.length })}</span>
          <div>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button disabled={pendingProductIds.length === 0} type="primary" onClick={onAdd}>
              {t('purchase.contract.form.addSelected', { count: pendingProductIds.length })}
            </Button>
          </div>
        </div>
      }
      open={open}
      size="large"
      title={t('purchase.contract.form.productDrawerTitle')}
      zIndex={1100}
      onClose={onClose}
    >
      <Input
        allowClear
        aria-label={t('purchase.contract.form.searchProductAria')}
        className="product-picker-search"
        placeholder={t('purchase.contract.form.productSearchPlaceholder')}
        prefix={<Search size={16} />}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div className="product-picker-list" role="list">
        {loading ? (
          <div className="product-picker-empty">{t('purchase.contract.form.loadingProducts')}</div>
        ) : products.length > 0 ? (
          products.map((product) => {
            const alreadyAdded = selectedProductIds.has(product.id)
            const displayName = product.cn_name || product.en_name || product.code
            return (
              <div
                className={`product-picker-item${alreadyAdded ? ' is-added' : ''}`}
                key={product.id}
                role="listitem"
              >
                <Checkbox
                  aria-label={`${displayName} (${product.code})`}
                  checked={pendingProductIds.includes(product.id)}
                  disabled={alreadyAdded}
                  onChange={(event) => onToggle(product.id, event.target.checked)}
                >
                  <span className="product-picker-item-main">
                    <strong>{displayName}</strong>
                    <span>
                      {product.code} ·{' '}
                      {[product.specification, product.model].filter(Boolean).join(' · ') ||
                        t('purchase.contract.form.noSpecification')}
                    </span>
                  </span>
                </Checkbox>
                {alreadyAdded ? (
                  <span className="product-picker-added-label">
                    {t('purchase.contract.form.added')}
                  </span>
                ) : null}
              </div>
            )
          })
        ) : (
          <Empty
            description={t('purchase.contract.form.noProducts')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              icon={<PackagePlus size={16} />}
              type="primary"
              onClick={() => window.open(productPath, '_blank', 'noopener,noreferrer')}
            >
              {t('common.empty.createProduct')}
            </Button>
          </Empty>
        )}
      </div>
    </Drawer>
  )
}
