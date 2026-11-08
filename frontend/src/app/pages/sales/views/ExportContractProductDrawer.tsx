import { Button, Checkbox, Drawer, Input } from 'antd'
import { Search } from 'lucide-react'

import { t } from '@/app/appI18n'

import type { ExportContractFormModalModel } from '../hooks/useExportContractFormModal'

type Props = { model: ExportContractFormModalModel }

export function ExportContractProductDrawer({ model }: Props) {
  return (
    <Drawer
      destroyOnHidden
      footer={
        <div className="product-picker-actions">
          <span>
            {t('sales.contract.form.selectedCount', { count: model.pendingProductIds.length })}
          </span>
          <div>
            <Button onClick={model.closeProductDrawer}>{t('common.cancel')}</Button>
            <Button
              disabled={model.pendingProductIds.length === 0}
              type="primary"
              onClick={model.addPendingProducts}
            >
              {t('sales.contract.form.addSelected', {
                count: model.pendingProductIds.length,
              })}
            </Button>
          </div>
        </div>
      }
      open={model.productDrawerOpen}
      size="large"
      title={t('sales.contract.form.productDrawerTitle')}
      zIndex={1100}
      onClose={model.closeProductDrawer}
    >
      <Input
        allowClear
        aria-label={t('sales.contract.form.searchProductAria')}
        className="product-picker-search"
        placeholder={t('sales.contract.form.productSearchPlaceholder')}
        prefix={<Search size={16} />}
        value={model.productSearch}
        onChange={(event) => model.setProductSearch(event.target.value)}
      />
      <div className="product-picker-list" role="list">
        {model.filteredProducts.length > 0 ? (
          model.filteredProducts.map((product) => {
            const alreadyAdded = model.selectedProductIds.has(product.id)
            const displayName = product.cn_name || product.en_name || product.code
            return (
              <div
                className={`product-picker-item${alreadyAdded ? ' is-added' : ''}`}
                key={product.id}
                role="listitem"
              >
                <Checkbox
                  aria-label={`${displayName} (${product.code})`}
                  checked={model.pendingProductIds.includes(product.id)}
                  disabled={alreadyAdded}
                  onChange={(event) =>
                    model.togglePendingProduct(product.id, event.target.checked)
                  }
                >
                  <span className="product-picker-item-main">
                    <strong>{displayName}</strong>
                    <span>
                      {product.code} ·{' '}
                      {[product.specification, product.model].filter(Boolean).join(' · ') ||
                        t('sales.contract.form.noSpecification')}
                    </span>
                  </span>
                </Checkbox>
                {alreadyAdded ? (
                  <span className="product-picker-added-label">
                    {t('sales.contract.form.added')}
                  </span>
                ) : null}
              </div>
            )
          })
        ) : (
          <div className="product-picker-empty">
            {t('sales.contract.form.noMatchingProducts')}
          </div>
        )}
      </div>
    </Drawer>
  )
}
