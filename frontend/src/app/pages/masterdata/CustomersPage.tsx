import {
  addCustomerContact,
  createCustomer,
  deactivateCustomer,
  listCustomerTransactions,
  listCustomers,
  updateCustomer,
} from '../../../api'
import { TradingPartnerPage } from './TradingPartnerPage'

export function CustomersPage() {
  return (
    <TradingPartnerPage
      className="customer-page"
      createEntity={(payload) => createCustomer(payload)}
      createPrefix="C"
      deactivateEntity={deactivateCustomer}
      entityLabel="客户"
      listEntity={(filters) => listCustomers(filters)}
      listTransactions={listCustomerTransactions}
      pageTitle="客户资料"
      searchPlaceholder="客户编号 / 中英文名称 / 联系人"
      updateEntity={(id, payload) => updateCustomer(id, payload)}
      addContact={addCustomerContact}
    />
  )
}
