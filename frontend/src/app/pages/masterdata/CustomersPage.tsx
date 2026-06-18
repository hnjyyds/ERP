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
} from '../../../api'
import type { PartnerContactPayload, PartnerCreatePayload, PartnerUpdatePayload } from './tradingPartnerModel'
import { TradingPartnerPage } from './TradingPartnerPage'
import { customerPath, moduleDetailPath } from '../../routes'

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
      entityLabel="客户"
      kind="customer"
      detailId={detailId}
      detailPath={(id) => moduleDetailPath(customerPath, id)}
      listPath={customerPath}
      listEntity={(filters) => listCustomers(filters)}
      listTransactions={listCustomerTransactions}
      onNavigate={onNavigate}
      pageTitle="客户资料"
      searchPlaceholder="客户编号 / 中英文名称 / 联系人"
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
