import { Button, Input, Modal, Select, Table } from 'antd'
import { FileStack, LayoutDashboard, Plus, UserPlus } from 'lucide-react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'

import type {
  AssignableUser,
  ExportContract,
  Product,
  PurchaseContractCreatePayload,
  Supplier,
} from '@/api'
import { purchaseContractSourceTypeOptions } from '@/shared/formOptions'
import { FormSelect, PanelTitle } from '@/shared/ui'
import { formatMoney } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { supplierPath } from '@/app/routes'
import {
  renderAssignableUserOptions,
  renderSupplierOptions,
  type PurchaseContractFormState,
  type PurchaseContractGenerateFormState,
  type PurchaseContractLineFormState,
} from '@/app/pages/purchase/purchaseContractHelpers'

import { PurchaseContractProductDrawer } from './PurchaseContractProductDrawer'

type PurchaseContractFormModalProps = {
  open: boolean
  mode: 'manual' | 'generate'
  editingContractId: string | null
  form: PurchaseContractFormState
  generateForm: PurchaseContractGenerateFormState
  setForm: Dispatch<SetStateAction<PurchaseContractFormState>>
  setGenerateForm: Dispatch<SetStateAction<PurchaseContractGenerateFormState>>
  suppliers: Supplier[]
  assignableUsers: AssignableUser[]
  products: Product[]
  exportContracts: ExportContract[]
  loadingSuppliers: boolean
  loadingAssignableUsers: boolean
  loadingProducts: boolean
  loadingExportContracts: boolean
  submitting: boolean
  productDrawerOpen: boolean
  productSearch: string
  pendingProductIds: string[]
  selectedProductIds: Set<string>
  onClose: () => void
  onSubmitManual: (event?: FormEvent<HTMLFormElement>) => void
  onSubmitGenerate: (event?: FormEvent<HTMLFormElement>) => void
  onSupplierSearch: (query: string) => void
  applySupplier: (supplierId: string | undefined, target?: 'manual' | 'generate') => void
  applyBuyer: (userId: string | undefined) => void
  applyBuyerToGenerateForm: (userId: string | undefined) => void
  applyQcUser: (userId: string | undefined) => void
  applyQcUserToGenerateForm: (userId: string | undefined) => void
  onOpenProductDrawer: () => void
  onCloseProductDrawer: () => void
  onProductSearchChange: (value: string) => void
  onTogglePendingProduct: (productId: string, checked: boolean) => void
  onAddPendingProducts: () => void
  updateContractLine: (
    lineKey: string,
    field: keyof PurchaseContractLineFormState,
    value: string,
  ) => void
  removeContractLine: (lineKey: string) => void
}

export function PurchaseContractFormModal({
  open,
  mode,
  editingContractId,
  form,
  generateForm,
  setForm,
  setGenerateForm,
  suppliers,
  assignableUsers,
  products,
  exportContracts,
  loadingSuppliers,
  loadingAssignableUsers,
  loadingProducts,
  loadingExportContracts,
  submitting,
  productDrawerOpen,
  productSearch,
  pendingProductIds,
  selectedProductIds,
  onClose,
  onSubmitManual,
  onSubmitGenerate,
  onSupplierSearch,
  applySupplier,
  applyBuyer,
  applyBuyerToGenerateForm,
  applyQcUser,
  applyQcUserToGenerateForm,
  onOpenProductDrawer,
  onCloseProductDrawer,
  onProductSearchChange,
  onTogglePendingProduct,
  onAddPendingProducts,
  updateContractLine,
  removeContractLine,
}: PurchaseContractFormModalProps) {
  const supplierMissing = !loadingSuppliers && suppliers.length === 0

  function openSupplierCreate() {
    window.open(supplierPath, '_blank', 'noopener,noreferrer')
  }

  function renderSupplierSelect(
    value: string,
    currentName: string,
    onChange: (supplierId: string | undefined, target?: 'manual' | 'generate') => void,
    target: 'manual' | 'generate',
  ) {
    return (
      <>
        <Select
          showSearch
          loading={loadingSuppliers}
          value={value || undefined}
          placeholder={
            supplierMissing
              ? t('purchase.contract.form.supplierMissing')
              : t('purchase.contract.form.supplierSelectPlaceholder')
          }
          filterOption={false}
          notFoundContent={
            loadingSuppliers ? (
              t('purchase.contract.form.loadingSuppliers')
            ) : (
              <div className="inline-empty-action">
                <span>{t('purchase.contract.form.noSuppliers')}</span>
                <Button
                  icon={<UserPlus size={14} />}
                  size="small"
                  type="link"
                  onClick={openSupplierCreate}
                >
                  {t('common.empty.createSupplier')}
                </Button>
              </div>
            )
          }
          onSearch={onSupplierSearch}
          onChange={(supplierId) => onChange(supplierId, target)}
        >
          {value && !suppliers.some((supplier) => supplier.id === value) ? (
            <Select.Option key={value} value={value}>
              {currentName || value}
            </Select.Option>
          ) : null}
          {renderSupplierOptions(suppliers)}
        </Select>
        {supplierMissing ? (
          <Button
            className="inline-create-link"
            icon={<UserPlus size={14} />}
            size="small"
            type="link"
            onClick={openSupplierCreate}
          >
            {t('common.empty.createSupplier')}
          </Button>
        ) : null}
      </>
    )
  }

  return (
    <>
      <Modal
        centered
        className="purchase-contract-modal"
        footer={
          <div className="modal-actions">
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              className="inline-submit"
              loading={submitting}
              type="primary"
              onClick={() => {
                if (mode === 'manual') {
                  onSubmitManual()
                  return
                }
                onSubmitGenerate()
              }}
            >
              {mode === 'generate'
                ? t('purchase.contract.form.generateAction')
                : editingContractId
                  ? t('purchase.contract.form.save')
                  : t('purchase.contract.form.createTitle')}
            </Button>
          </div>
        }
        open={open}
        title={
          editingContractId
            ? t('purchase.contract.form.editTitle')
            : mode === 'generate'
              ? t('purchase.contract.form.generateTitle')
              : t('purchase.contract.form.createTitle')
        }
        width={1160}
        onCancel={onClose}
      >
        <div className="workflow-modal-content entity-modal-form">
          {mode === 'manual' ? (
            <form className="record-form entity-modal-form contract-modal-form" onSubmit={onSubmitManual}>
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={
                  editingContractId
                    ? t('purchase.contract.form.editTitle')
                    : t('purchase.contract.form.manualTitle')
                }
              />
              <div className="form-row">
                <label>
                  {t('purchase.contract.field.code')}
                  <Input
                    readOnly
                    value={form.code}
                    placeholder={t('purchase.contract.form.codeAutoGenerated')}
                  />
                </label>
                <label>
                  {t('purchase.contract.field.contractDate')}
                  <Input
                    type="date"
                    value={form.contract_date}
                    onInput={(event) =>
                      setForm({ ...form, contract_date: event.currentTarget.value })
                    }
                  />
                </label>
                <label>
                  {t('purchase.contract.form.selectSupplier')}
                  {renderSupplierSelect(
                    form.supplier_id,
                    form.supplier_name,
                    applySupplier,
                    'manual',
                  )}
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t('purchase.contract.field.factoryName')}
                  <Input
                    value={form.supplier_name}
                    onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
                  />
                </label>
                <label>
                  {t('purchase.contract.field.buyer')}
                  <Select
                    allowClear
                    showSearch
                    loading={loadingAssignableUsers}
                    optionFilterProp="label"
                    value={form.buyer_user_id || undefined}
                    placeholder={t('purchase.contract.form.buyerSelectPlaceholder')}
                    notFoundContent={
                      loadingAssignableUsers
                        ? t('purchase.contract.form.loadingUsers')
                        : t('purchase.contract.form.noUsers')
                    }
                    onChange={applyBuyer}
                  >
                    {renderAssignableUserOptions(assignableUsers)}
                  </Select>
                </label>
                <label>
                  {t('purchase.contract.field.qcUser')}
                  <Select
                    allowClear
                    showSearch
                    loading={loadingAssignableUsers}
                    optionFilterProp="label"
                    value={form.qc_user_id || undefined}
                    placeholder={
                      assignableUsers.length > 0
                        ? t('purchase.contract.form.userSelectPlaceholder')
                        : t('purchase.contract.form.noUsers')
                    }
                    notFoundContent={
                      loadingAssignableUsers
                        ? t('purchase.contract.form.loadingUsers')
                        : t('purchase.contract.form.noUsers')
                    }
                    onChange={applyQcUser}
                  >
                    {renderAssignableUserOptions(assignableUsers)}
                  </Select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t('purchase.contract.field.currency')}
                  <Input
                    value={form.currency}
                    onChange={(event) => setForm({ ...form, currency: event.target.value })}
                  />
                </label>
                <label>
                  {t('purchase.contract.field.deliveryDate')}
                  <Input
                    type="date"
                    value={form.delivery_date}
                    onInput={(event) =>
                      setForm({ ...form, delivery_date: event.currentTarget.value })
                    }
                  />
                </label>
                <label>
                  {t('purchase.contract.field.source')}
                  <FormSelect
                    value={form.source_type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        source_type: event.target
                          .value as PurchaseContractCreatePayload['source_type'],
                      })
                    }
                  >
                    {purchaseContractSourceTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t('purchase.contract.field.paymentTerms')}
                  <Input
                    value={form.payment_terms}
                    onChange={(event) => setForm({ ...form, payment_terms: event.target.value })}
                  />
                </label>
                <label>
                  {t('purchase.contract.field.remarks')}
                  <Input
                    value={form.remarks}
                    onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                  />
                </label>
              </div>

              <div className="contract-line-toolbar">
                <div>
                  <div className="form-divider">{t('purchase.contract.form.linesTitle')}</div>
                  <p>{t('purchase.contract.form.linesHint', { count: form.lines.length })}</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={onOpenProductDrawer}>
                  {t('purchase.contract.form.addProducts')}
                </Button>
              </div>
              <Table<PurchaseContractLineFormState>
                className="contract-lines-table"
                columns={[
                  {
                    title: t('purchase.contract.field.product'),
                    key: 'product',
                    width: 210,
                    render: (_, line) => (
                      <div className="contract-line-product">
                        <strong>{line.product_name}</strong>
                        <span>{line.product_code}</span>
                      </div>
                    ),
                  },
                  {
                    title: t('purchase.contract.form.specificationModel'),
                    key: 'specification',
                    width: 210,
                    render: (_, line) => (
                      <div className="contract-line-stacked-fields">
                        <Input
                          aria-label={t('purchase.contract.form.specificationAria', {
                            name: line.product_name,
                          })}
                          placeholder={t('purchase.contract.field.specification')}
                          value={line.specification}
                          onChange={(event) =>
                            updateContractLine(line.key, 'specification', event.target.value)
                          }
                        />
                        <Input
                          aria-label={t('purchase.contract.form.modelAria', {
                            name: line.product_name,
                          })}
                          placeholder={t('purchase.contract.field.model')}
                          value={line.model}
                          onChange={(event) =>
                            updateContractLine(line.key, 'model', event.target.value)
                          }
                        />
                      </div>
                    ),
                  },
                  {
                    title: t('purchase.contract.field.quantity'),
                    key: 'quantity',
                    width: 130,
                    render: (_, line) => (
                      <Input
                        aria-label={t('purchase.contract.form.quantityAria', {
                          name: line.product_name,
                        })}
                        min="0.0001"
                        step="0.0001"
                        type="number"
                        value={line.quantity}
                        onChange={(event) =>
                          updateContractLine(line.key, 'quantity', event.target.value)
                        }
                      />
                    ),
                  },
                  {
                    title: t('purchase.contract.field.unit'),
                    key: 'unit',
                    width: 105,
                    render: (_, line) => (
                      <Input
                        aria-label={t('purchase.contract.form.unitAria', {
                          name: line.product_name,
                        })}
                        value={line.unit}
                        onChange={(event) =>
                          updateContractLine(line.key, 'unit', event.target.value)
                        }
                      />
                    ),
                  },
                  {
                    title: t('purchase.contract.field.unitPrice'),
                    key: 'unit_price',
                    width: 140,
                    render: (_, line) => (
                      <Input
                        aria-label={t('purchase.contract.form.unitPriceAria', {
                          name: line.product_name,
                        })}
                        min="0"
                        step="0.0001"
                        type="number"
                        value={line.unit_price}
                        onChange={(event) =>
                          updateContractLine(line.key, 'unit_price', event.target.value)
                        }
                      />
                    ),
                  },
                  {
                    title: t('purchase.contract.field.amount'),
                    key: 'amount',
                    width: 140,
                    render: (_, line) =>
                      formatMoney(
                        (Number(line.quantity || 0) * Number(line.unit_price || 0)).toFixed(2),
                        form.currency,
                      ),
                  },
                  {
                    title: t('purchase.contract.field.lineRemark'),
                    key: 'remark',
                    width: 200,
                    render: (_, line) => (
                      <Input
                        aria-label={t('purchase.contract.form.lineRemarkAria', {
                          name: line.product_name,
                        })}
                        value={line.remark}
                        onChange={(event) =>
                          updateContractLine(line.key, 'remark', event.target.value)
                        }
                      />
                    ),
                  },
                  {
                    title: t('purchase.contract.field.actions'),
                    key: 'actions',
                    width: 80,
                    render: (_, line) => (
                      <Button danger size="small" onClick={() => removeContractLine(line.key)}>
                        {t('purchase.contract.action.remove')}
                      </Button>
                    ),
                  },
                ]}
                dataSource={form.lines}
                locale={{ emptyText: t('purchase.contract.form.linesEmpty') }}
                pagination={false}
                rowKey="key"
                scroll={{ x: 1200 }}
                size="small"
              />
            </form>
          ) : (
            <form
              className="record-form entity-modal-form contract-modal-form accessory-form generation-form"
              onSubmit={onSubmitGenerate}
            >
              <PanelTitle
                icon={<FileStack size={18} />}
                title={t('purchase.contract.form.generateFromApprovedTitle')}
              />
              <div className="form-row">
                <label>
                  {t('purchase.contract.field.purchaseContractCode')}
                  <Input
                    readOnly
                    value={generateForm.code}
                    placeholder={t('purchase.contract.form.codeAutoGenerated')}
                  />
                </label>
                <label>
                  {t('purchase.contract.field.contractDate')}
                  <Input
                    type="date"
                    value={generateForm.contract_date}
                    onInput={(event) =>
                      setGenerateForm({
                        ...generateForm,
                        contract_date: event.currentTarget.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('purchase.contract.form.selectSupplier')}
                  {renderSupplierSelect(
                    generateForm.supplier_id,
                    generateForm.supplier_name,
                    applySupplier,
                    'generate',
                  )}
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t('purchase.contract.field.factoryName')}
                  <Input
                    value={generateForm.supplier_name}
                    onChange={(event) =>
                      setGenerateForm({ ...generateForm, supplier_name: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t('purchase.contract.field.exportContractA')}
                  <Select
                    allowClear
                    showSearch
                    loading={loadingExportContracts}
                    optionFilterProp="label"
                    value={generateForm.source_contract_id_a || undefined}
                    placeholder={t('purchase.contract.form.exportContractPlaceholder')}
                    notFoundContent={t('purchase.contract.form.noExportContracts')}
                    onChange={(value) =>
                      setGenerateForm({ ...generateForm, source_contract_id_a: value ?? '' })
                    }
                  >
                    {exportContracts.map((contract) => (
                      <Select.Option key={contract.id} value={contract.id} label={contract.code}>
                        <div className="remote-select-option">
                          <span className="remote-select-option-title">{contract.code}</span>
                          <span className="remote-select-option-desc">
                            {[contract.customer_name, contract.currency].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </label>
                <label>
                  {t('purchase.contract.field.exportContractB')}
                  <Select
                    allowClear
                    showSearch
                    loading={loadingExportContracts}
                    optionFilterProp="label"
                    value={generateForm.source_contract_id_b || undefined}
                    placeholder={t('purchase.contract.form.exportContractPlaceholder')}
                    notFoundContent={t('purchase.contract.form.noExportContracts')}
                    onChange={(value) =>
                      setGenerateForm({ ...generateForm, source_contract_id_b: value ?? '' })
                    }
                  >
                    {exportContracts.map((contract) => (
                      <Select.Option key={contract.id} value={contract.id} label={contract.code}>
                        <div className="remote-select-option">
                          <span className="remote-select-option-title">{contract.code}</span>
                          <span className="remote-select-option-desc">
                            {[contract.customer_name, contract.currency].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t('purchase.contract.field.buyer')}
                  <Select
                    allowClear
                    showSearch
                    loading={loadingAssignableUsers}
                    optionFilterProp="label"
                    value={generateForm.buyer_user_id || undefined}
                    placeholder={t('purchase.contract.form.buyerSelectPlaceholder')}
                    notFoundContent={
                      loadingAssignableUsers
                        ? t('purchase.contract.form.loadingUsers')
                        : t('purchase.contract.form.noUsers')
                    }
                    onChange={applyBuyerToGenerateForm}
                  >
                    {renderAssignableUserOptions(assignableUsers)}
                  </Select>
                </label>
                <label>
                  {t('purchase.contract.field.qcUser')}
                  <Select
                    allowClear
                    showSearch
                    loading={loadingAssignableUsers}
                    optionFilterProp="label"
                    value={generateForm.qc_user_id || undefined}
                    placeholder={t('purchase.contract.form.userSelectPlaceholder')}
                    notFoundContent={
                      loadingAssignableUsers
                        ? t('purchase.contract.form.loadingUsers')
                        : t('purchase.contract.form.noUsers')
                    }
                    onChange={applyQcUserToGenerateForm}
                  >
                    {renderAssignableUserOptions(assignableUsers)}
                  </Select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t('purchase.contract.field.currency')}
                  <Input
                    value={generateForm.currency}
                    onChange={(event) =>
                      setGenerateForm({ ...generateForm, currency: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t('purchase.contract.field.deliveryDate')}
                  <Input
                    type="date"
                    value={generateForm.delivery_date}
                    onInput={(event) =>
                      setGenerateForm({
                        ...generateForm,
                        delivery_date: event.currentTarget.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('purchase.contract.field.accessoryUnitPrice')}
                  <Input
                    min="0"
                    step="0.0001"
                    type="number"
                    value={generateForm.unit_price}
                    onChange={(event) =>
                      setGenerateForm({ ...generateForm, unit_price: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t('purchase.contract.field.paymentTerms')}
                  <Input
                    value={generateForm.payment_terms}
                    onChange={(event) =>
                      setGenerateForm({ ...generateForm, payment_terms: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t('purchase.contract.field.generateRemarks')}
                  <Input
                    value={generateForm.remarks}
                    onChange={(event) =>
                      setGenerateForm({ ...generateForm, remarks: event.target.value })
                    }
                  />
                </label>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <PurchaseContractProductDrawer
        loading={loadingProducts}
        open={productDrawerOpen}
        pendingProductIds={pendingProductIds}
        products={products}
        search={productSearch}
        selectedProductIds={selectedProductIds}
        onAdd={onAddPendingProducts}
        onClose={onCloseProductDrawer}
        onSearchChange={onProductSearchChange}
        onToggle={onTogglePendingProduct}
      />
    </>
  )
}
