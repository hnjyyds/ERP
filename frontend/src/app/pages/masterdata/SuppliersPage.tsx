import {
  addSupplierContact,
  createSupplier,
  deactivateSupplier,
  deleteSupplierContact,
  listSupplierTransactions,
  listSuppliers,
  updateSupplierContact,
  updateSupplier,
  type SupplierContactPayload,
  type SupplierCreatePayload,
  type SupplierUpdatePayload,
} from '../../../api'
import type { PartnerContactPayload, PartnerCreatePayload, PartnerUpdatePayload } from './tradingPartnerModel'
import { TradingPartnerPage } from './TradingPartnerPage'
import { t } from '../../appI18n'
import { moduleDetailPath, supplierPath } from '../../routes'

type SuppliersPageProps = {
  detailId: string | null
  onNavigate: (path: string) => void
}

export function SuppliersPage({ detailId, onNavigate }: SuppliersPageProps) {
  return (
    <TradingPartnerPage
      className="supplier-page"
      createEntity={(payload) => createSupplier(asSupplierCreatePayload(payload))}
      createPrefix="S"
      deactivateEntity={deactivateSupplier}
      entityLabel={t('masterdata.supplier.entityLabel')}
      kind="supplier"
      detailId={detailId}
      detailPath={(id) => moduleDetailPath(supplierPath, id)}
      listPath={supplierPath}
      listEntity={(filters) => listSuppliers(filters)}
      listTransactions={listSupplierTransactions}
      onNavigate={onNavigate}
      pageTitle={t('masterdata.supplier.pageTitle')}
      searchPlaceholder={t('masterdata.supplier.searchPlaceholder')}
      updateEntity={(id, payload) => updateSupplier(id, asSupplierUpdatePayload(payload))}
      addContact={(id, payload) => addSupplierContact(id, asSupplierContactPayload(payload))}
      updateContact={(id, contactId, payload) =>
        updateSupplierContact(id, contactId, asSupplierContactPayload(payload))
      }
      deleteContact={deleteSupplierContact}
    />
  )
}

function asSupplierCreatePayload(payload: PartnerCreatePayload): SupplierCreatePayload {
  return payload as SupplierCreatePayload
}

function asSupplierUpdatePayload(payload: PartnerUpdatePayload): SupplierUpdatePayload {
  return payload as SupplierUpdatePayload
}

function asSupplierContactPayload(payload: PartnerContactPayload): SupplierContactPayload {
  return payload as SupplierContactPayload
}
