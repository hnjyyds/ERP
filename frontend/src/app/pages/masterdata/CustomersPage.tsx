import {
  addCustomerContact,
  createCustomer,
  deactivateCustomer,
  deleteCustomerContact,
  listCustomerTransactions,
  listCustomers,
  updateCustomerContact,
  updateCustomer,
  type CustomerContactPayload,
  type CustomerCreatePayload,
  type CustomerUpdatePayload,
} from '@/api'
import type { PartnerContactPayload, PartnerCreatePayload, PartnerUpdatePayload } from './tradingPartnerModel'
import { TradingPartnerPage } from './TradingPartnerPage'
import { t } from '@/app/appI18n'
import { customerPath, moduleDetailPath } from '@/app/routes'

type CustomersPageProps = {
  detailId: string | null
  onNavigate: (path: string) => void
}

export function CustomersPage({ detailId, onNavigate }: CustomersPageProps) {
  return (
    <TradingPartnerPage
      className="customer-page"
      createEntity={(payload) => createCustomer(asCustomerCreatePayload(payload))}
      createPrefix="C"
      deactivateEntity={deactivateCustomer}
      entityLabel={t('masterdata.customer.entityLabel')}
      kind="customer"
      detailId={detailId}
      detailPath={(id) => moduleDetailPath(customerPath, id)}
      listPath={customerPath}
      listEntity={(filters) => listCustomers(filters)}
      listTransactions={listCustomerTransactions}
      onNavigate={onNavigate}
      pageTitle={t('masterdata.customer.pageTitle')}
      searchPlaceholder={t('masterdata.customer.searchPlaceholder')}
      updateEntity={(id, payload) => updateCustomer(id, asCustomerUpdatePayload(payload))}
      addContact={(id, payload) => addCustomerContact(id, asCustomerContactPayload(payload))}
      updateContact={(id, contactId, payload) =>
        updateCustomerContact(id, contactId, asCustomerContactPayload(payload))
      }
      deleteContact={deleteCustomerContact}
    />
  )
}

function asCustomerCreatePayload(payload: PartnerCreatePayload): CustomerCreatePayload {
  return payload as CustomerCreatePayload
}

function asCustomerUpdatePayload(payload: PartnerUpdatePayload): CustomerUpdatePayload {
  return payload as CustomerUpdatePayload
}

function asCustomerContactPayload(payload: PartnerContactPayload): CustomerContactPayload {
  return payload as CustomerContactPayload
}
