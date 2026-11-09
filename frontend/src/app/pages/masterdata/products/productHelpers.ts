// 商品资料：表单状态、payload 映射、列视图与状态标签

import type {
  Product,
  ProductAccessoryPayload,
  ProductCreatePayload,
  ProductUpdatePayload,
} from '@/api'
import { emptyToNull } from '@/app/pages/appHelpers'
import { t, type TranslationKey } from '@/app/appI18n'
import type { ColumnOption } from '@/shared/ui'

export type ProductFormState = {
  code: string
  cn_name: string
  en_name: string
  specification: string
  model: string
  customs_code: string
  tax_rate: string
  rebate_rate: string
  package_info: string
  unit: string
  image_url: string
  status: string
  accessory_name: string
  accessory_unit_consumption: string
  accessory_unit: string
  accessory_supplier: string
  accessory_rule: string
}

export type ProductAccessoryFormState = {
  accessory_name: string
  unit_consumption: string
  unit: string
  supplier: string
  rule: string
}

export const maxProductImageBytes = 2_000_000

export function buildProductColumnOptions(): ColumnOption[] {
  return [
    { key: 'code', title: t('masterdata.product.field.code'), required: true },
    { key: 'cn_name', title: t('masterdata.product.field.cnName') },
    { key: 'en_name', title: t('masterdata.product.field.enName') },
    { key: 'customs_code', title: t('masterdata.product.field.customsCode') },
    { key: 'unit', title: t('masterdata.product.field.unit') },
    { key: 'status', title: t('masterdata.product.field.status') },
    { key: 'accessories', title: t('masterdata.product.field.accessories') },
  ]
}

export function productStatusOptions() {
  return [
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
  ]
}

export function accessoryRuleOptions() {
  return [
    { value: 'by_supplier', label: t('masterdata.product.accessoryRule.bySupplier') },
    { value: 'by_accessory', label: t('masterdata.product.accessoryRule.byAccessory') },
  ]
}

export function validateProductForm(form: ProductFormState): string | null {
  if (!form.code.trim()) return t('masterdata.product.validation.codeRequired')
  if (!form.cn_name.trim()) return t('masterdata.product.validation.cnNameRequired')
  if (!form.customs_code.trim()) return t('masterdata.product.validation.customsCodeRequired')
  if (!form.unit.trim()) return t('masterdata.product.validation.unitRequired')
  return null
}

export function initialProductForm(): ProductFormState {
  return {
    code: '',
    cn_name: '',
    en_name: '',
    specification: '',
    model: '',
    customs_code: '',
    tax_rate: '0.13',
    rebate_rate: '0.09',
    package_info: '',
    unit: 'pcs',
    image_url: '',
    status: 'active',
    accessory_name: '',
    accessory_unit_consumption: '1',
    accessory_unit: 'pcs',
    accessory_supplier: '',
    accessory_rule: 'by_supplier',
  }
}

export function initialProductAccessoryForm(): ProductAccessoryFormState {
  return {
    accessory_name: '',
    unit_consumption: '1',
    unit: 'pcs',
    supplier: '',
    rule: 'by_supplier',
  }
}

export function productToForm(product: Product): ProductFormState {
  return {
    code: product.code,
    cn_name: product.cn_name,
    en_name: product.en_name,
    specification: product.specification ?? '',
    model: product.model ?? '',
    customs_code: product.customs_code,
    tax_rate: product.tax_rate,
    rebate_rate: product.rebate_rate,
    package_info: product.package_info,
    unit: product.unit,
    image_url: product.image_url ?? '',
    status: product.status,
    accessory_name: '',
    accessory_unit_consumption: '1',
    accessory_unit: 'pcs',
    accessory_supplier: '',
    accessory_rule: 'by_supplier',
  }
}

export function productPayload(form: ProductFormState): ProductCreatePayload {
  const accessory = initialAccessoryPayload(form)
  return {
    code: form.code.trim(),
    cn_name: form.cn_name.trim(),
    en_name: form.en_name.trim(),
    specification: emptyToNull(form.specification),
    model: emptyToNull(form.model),
    customs_code: form.customs_code.trim(),
    tax_rate: form.tax_rate,
    rebate_rate: form.rebate_rate,
    package_info: form.package_info.trim(),
    unit: form.unit.trim(),
    image_url: emptyToNull(form.image_url),
    status: form.status,
    accessories: accessory.accessory_name ? [accessory] : [],
  }
}

export function productUpdatePayload(form: ProductFormState): ProductUpdatePayload {
  return {
    code: form.code.trim(),
    cn_name: form.cn_name.trim(),
    en_name: form.en_name.trim(),
    specification: emptyToNull(form.specification),
    model: emptyToNull(form.model),
    customs_code: form.customs_code.trim(),
    tax_rate: form.tax_rate,
    rebate_rate: form.rebate_rate,
    package_info: form.package_info.trim(),
    unit: form.unit.trim(),
    image_url: emptyToNull(form.image_url),
    status: form.status,
  }
}

export function initialAccessoryPayload(form: ProductFormState): ProductAccessoryPayload {
  return {
    accessory_name: form.accessory_name.trim(),
    unit_consumption: form.accessory_unit_consumption,
    unit: form.accessory_unit.trim(),
    default_supplier_name: emptyToNull(form.accessory_supplier),
    purchase_split_rule: form.accessory_rule,
  }
}

export function productAccessoryToForm(
  accessory: Product['accessories'][number],
): ProductAccessoryFormState {
  return {
    accessory_name: accessory.accessory_name,
    unit_consumption: accessory.unit_consumption,
    unit: accessory.unit,
    supplier: accessory.default_supplier_name ?? '',
    rule: accessory.purchase_split_rule,
  }
}

export function accessoryPayload(form: ProductAccessoryFormState): ProductAccessoryPayload {
  return {
    accessory_name: form.accessory_name.trim(),
    unit_consumption: form.unit_consumption,
    unit: form.unit.trim(),
    default_supplier_name: emptyToNull(form.supplier),
    purchase_split_rule: form.rule,
  }
}

export function accessoryRuleLabel(value: string): string {
  return value === 'by_accessory'
    ? t('masterdata.product.accessoryRule.byAccessory')
    : t('masterdata.product.accessoryRule.bySupplier')
}

export function productTransactionSourceLabel(value: string): string {
  const labels: Record<string, TranslationKey> = {
    export_quotation: 'masterdata.product.transactions.sourceType.exportQuotation',
    export_contract: 'masterdata.product.transactions.sourceType.exportContract',
    shipment: 'masterdata.product.transactions.sourceType.shipment',
    purchase_inquiry: 'masterdata.product.transactions.sourceType.purchaseInquiry',
    purchase_contract: 'masterdata.product.transactions.sourceType.purchaseContract',
    inventory_ledger: 'masterdata.product.transactions.sourceType.inventoryLedger',
  }
  const key = labels[value]
  return key ? t(key) : value
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error(t('masterdata.product.fileReadFailed')))
    }
    reader.onerror = () => reject(reader.error ?? new Error(t('masterdata.product.fileReadFailed')))
    reader.readAsDataURL(file)
  })
}
