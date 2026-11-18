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
  images: string[]
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

export type ProductFormError = {
  field:
    | 'code'
    | 'cn_name'
    | 'en_name'
    | 'customs_code'
    | 'unit'
    | 'package_info'
    | 'accessory_name'
    | 'accessory_unit_consumption'
  message: string
}

export function validateProductForm(
  form: ProductFormState,
  mode: 'create' | 'edit' = 'create',
): ProductFormError | null {
  if (!form.code.trim()) {
    return { field: 'code', message: t('masterdata.product.validation.codeRequired') }
  }
  if (!form.cn_name.trim()) {
    return { field: 'cn_name', message: t('masterdata.product.validation.cnNameRequired') }
  }
  // 新建时与服务端约束一致要求英文名与包装资料；编辑历史记录不因旧数据缺字段被拦截。
  if (mode === 'create' && !form.en_name.trim()) {
    return { field: 'en_name', message: t('masterdata.product.validation.enNameRequired') }
  }
  if (!form.customs_code.trim()) {
    return { field: 'customs_code', message: t('masterdata.product.validation.customsCodeRequired') }
  }
  if (!form.unit.trim()) {
    return { field: 'unit', message: t('masterdata.product.validation.unitRequired') }
  }
  if (mode === 'create' && !form.package_info.trim()) {
    return { field: 'package_info', message: t('masterdata.product.validation.packageInfoRequired') }
  }
  if (mode === 'create') {
    // 首个配件可整段留空；一旦填了单耗、单位、供应商等，就必须补名称，避免静默丢弃。
    if (!form.accessory_name.trim()) {
      const touchedAccessory =
        form.accessory_unit_consumption.trim() !== '1' ||
        form.accessory_unit.trim() !== 'pcs' ||
        Boolean(form.accessory_supplier.trim()) ||
        form.accessory_rule !== 'by_supplier'
      if (touchedAccessory) {
        return {
          field: 'accessory_name',
          message: t('masterdata.product.validation.accessoryNameOrClear'),
        }
      }
    } else if (!(Number(form.accessory_unit_consumption) > 0)) {
      return {
        field: 'accessory_unit_consumption',
        message: t('masterdata.product.validation.accessoryUnitConsumptionRequired'),
      }
    }
  }
  return null
}

export type ProductAccessoryFormError = {
  field: 'accessory_name' | 'unit_consumption' | 'unit'
  message: string
}

export function validateProductAccessoryForm(
  form: ProductAccessoryFormState,
): ProductAccessoryFormError | null {
  if (!form.accessory_name.trim()) {
    return {
      field: 'accessory_name',
      message: t('masterdata.product.validation.accessoryNameRequired'),
    }
  }
  const consumption = Number(form.unit_consumption)
  if (!form.unit_consumption.trim() || !Number.isFinite(consumption) || consumption <= 0) {
    return {
      field: 'unit_consumption',
      message: t('masterdata.product.validation.accessoryUnitConsumptionRequired'),
    }
  }
  if (!form.unit.trim()) {
    return { field: 'unit', message: t('masterdata.product.validation.unitRequired') }
  }
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
    images: [],
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
    images: productImages(product),
    status: product.status,
    accessory_name: '',
    accessory_unit_consumption: '1',
    accessory_unit: 'pcs',
    accessory_supplier: '',
    accessory_rule: 'by_supplier',
  }
}

export function productImages(
  product: Pick<Product, 'image_url' | 'image_urls'>,
): string[] {
  const urls = product.image_urls?.filter((url) => Boolean(url)) ?? []
  if (urls.length > 0) return urls
  return product.image_url ? [product.image_url] : []
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
    image_url: form.images[0] ?? null,
    image_urls: form.images,
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
    image_url: form.images[0] ?? null,
    image_urls: form.images,
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
