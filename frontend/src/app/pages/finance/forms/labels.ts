// 财务模块共用的选项标签解析

import { translate } from '@/locales'
import { getRuntimeSettings } from '@/app/pages/appHelpers'
import {
  type LocalizedOption,
  purchaseInvoiceNoticeStatusOptions,
  sampleFeeTypeOptions,
  shipmentStatusOptions,
} from '@/shared/formOptions'

export function optionLabel(options: LocalizedOption[], value: string): string {
  const option = options.find((item) => item.value === value)
  return option ? translate(getRuntimeSettings().language, option.labelKey) : value
}

export function shipmentStatusLabel(value: string): string {
  const option = shipmentStatusOptions.find((item) => item.value === value)
  return option ? translate(getRuntimeSettings().language, option.labelKey) : value
}

export function purchaseInvoiceNoticeStatusLabel(value: string): string {
  const option = purchaseInvoiceNoticeStatusOptions.find((item) => item.value === value)
  return option ? translate(getRuntimeSettings().language, option.labelKey) : value
}

export function samplePaymentStatusLabel(value: string): string {
  return optionLabel(sampleFeeTypeOptions, value)
}
