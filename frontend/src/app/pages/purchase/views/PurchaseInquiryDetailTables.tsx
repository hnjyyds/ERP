import type { PurchaseInquiry, PurchaseInquiryReference, SupplierSampleEvidence } from '@/api'
import { formatDate, formatMoney } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import { sampleRecordStatusLabel } from '../purchaseInquiryHelpers'

type Props = {
  inquiry: PurchaseInquiry
  supplierSamples: SupplierSampleEvidence[]
  references: PurchaseInquiryReference[]
}

export function PurchaseInquiryDetailTables({ inquiry, supplierSamples, references }: Props) {
  return (
    <>
      <div className="accessory-heading">
        <strong>{t('purchase.inquiry.detail.linesTitle')}</strong>
        <span>{t('purchase.inquiry.detail.lineCount', { count: inquiry.lines.length })}</span>
      </div>
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>{t('purchase.inquiry.field.product')}</th>
            <th>{t('purchase.inquiry.field.specificationModel')}</th>
            <th>{t('purchase.inquiry.field.lineQuantity')}</th>
            <th>{t('purchase.inquiry.field.unit')}</th>
          </tr>
        </thead>
        <tbody>
          {inquiry.lines.map((line) => (
            <tr key={line.id}>
              <td>
                {line.product_code ?? t('purchase.inquiry.detail.notFilled')} / {line.product_name}
              </td>
              <td>
                {line.specification ?? t('purchase.inquiry.detail.notFilled')} /{' '}
                {line.model ?? t('purchase.inquiry.detail.notFilled')}
              </td>
              <td>{line.quantity}</td>
              <td>{line.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="accessory-heading">
        <strong>{t('purchase.inquiry.detail.quotationCompareTitle')}</strong>
        <span>
          {t('purchase.inquiry.detail.quotationCount', { count: inquiry.quotations.length })}
        </span>
      </div>
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>{t('purchase.inquiry.field.supplier')}</th>
            <th>{t('purchase.inquiry.field.product')}</th>
            <th>{t('purchase.inquiry.field.unitPrice')}</th>
            <th>{t('purchase.inquiry.field.leadTime')}</th>
            <th>{t('purchase.inquiry.field.minOrderQuantity')}</th>
            <th>{t('purchase.inquiry.field.sample')}</th>
            <th>{t('purchase.inquiry.field.remark')}</th>
          </tr>
        </thead>
        <tbody>
          {inquiry.quotations.map((quote) => (
            <tr key={quote.id}>
              <td>{quote.supplier_name}</td>
              <td>
                {quote.product_code ?? t('purchase.inquiry.detail.notFilled')} /{' '}
                {quote.product_name}
              </td>
              <td>{formatMoney(quote.unit_price, quote.currency)}</td>
              <td>
                {quote.lead_time_days != null
                  ? t('purchase.inquiry.detail.days', {
                      count: quote.lead_time_days,
                      days: quote.lead_time_days,
                    })
                  : t('purchase.inquiry.detail.notFilled')}
              </td>
              <td>{quote.min_order_quantity ?? t('purchase.inquiry.detail.notFilled')}</td>
              <td>
                {quote.has_sample
                  ? t('purchase.inquiry.detail.sampleAvailableYes')
                  : t('purchase.inquiry.detail.sampleNotProvided')}
              </td>
              <td>{quote.remark ?? t('purchase.inquiry.detail.notFilled')}</td>
            </tr>
          ))}
          {inquiry.quotations.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={7}>
                {t('purchase.inquiry.detail.noQuotations')}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="accessory-heading">
        <strong>{t('purchase.inquiry.detail.samplesTitle')}</strong>
        <span>{t('purchase.inquiry.detail.sampleCount', { count: supplierSamples.length })}</span>
      </div>
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>{t('purchase.inquiry.field.sampleCode')}</th>
            <th>{t('purchase.inquiry.field.supplier')}</th>
            <th>{t('purchase.inquiry.field.product')}</th>
            <th>{t('purchase.inquiry.field.receivedAt')}</th>
            <th>{t('purchase.inquiry.field.lineQuantity')}</th>
            <th>{t('purchase.inquiry.field.status')}</th>
          </tr>
        </thead>
        <tbody>
          {supplierSamples.map((sample) => (
            <tr key={sample.sample_record_id}>
              <td>{sample.sample_code}</td>
              <td>{sample.supplier_name ?? t('purchase.inquiry.detail.notFilled')}</td>
              <td>
                {sample.product_code ?? t('purchase.inquiry.detail.notFilled')} /{' '}
                {sample.product_name}
              </td>
              <td>{formatDate(sample.received_at)}</td>
              <td>
                {sample.quantity} {sample.unit}
              </td>
              <td>{sampleRecordStatusLabel(sample.status)}</td>
            </tr>
          ))}
          {supplierSamples.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={6}>
                {t('purchase.inquiry.detail.noSamples')}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="accessory-heading">
        <strong>{t('purchase.inquiry.detail.referencesTitle')}</strong>
        <span>{t('purchase.inquiry.detail.referenceCount', { count: references.length })}</span>
      </div>
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>{t('purchase.inquiry.field.inquiryNo')}</th>
            <th>{t('purchase.inquiry.field.product')}</th>
            <th>{t('purchase.inquiry.field.supplier')}</th>
            <th>{t('purchase.inquiry.field.referencePrice')}</th>
            <th>{t('purchase.inquiry.field.quotedDate')}</th>
          </tr>
        </thead>
        <tbody>
          {references.map((reference) => (
            <tr key={`${reference.source_inquiry_no}-${reference.supplier_name}`}>
              <td>{reference.source_inquiry_no}</td>
              <td>
                {reference.product_code ?? t('purchase.inquiry.detail.notFilled')} /{' '}
                {reference.product_name}
              </td>
              <td>{reference.supplier_name}</td>
              <td>{formatMoney(reference.reference_price, reference.currency)}</td>
              <td>{formatDate(reference.quote_date)}</td>
            </tr>
          ))}
          {references.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={5}>
                {t('purchase.inquiry.detail.noReferences')}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  )
}
