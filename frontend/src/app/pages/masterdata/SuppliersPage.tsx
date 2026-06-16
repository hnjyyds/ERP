import {
  addSupplierContact,
  createSupplier,
  deactivateSupplier,
  listSupplierTransactions,
  listSuppliers,
  updateSupplier,
} from '../../../api'
import { TradingPartnerPage } from './TradingPartnerPage'

export function SuppliersPage() {
  return (
    <TradingPartnerPage
      className="supplier-page"
      createEntity={(payload) => createSupplier(payload)}
      createPrefix="S"
      deactivateEntity={deactivateSupplier}
      entityLabel="供应商"
      listEntity={(filters) => listSuppliers(filters)}
      listTransactions={listSupplierTransactions}
      pageTitle="供应商资料"
      searchPlaceholder="供应商编号 / 中英文名称 / 联系人"
      updateEntity={(id, payload) => updateSupplier(id, payload)}
      addContact={addSupplierContact}
    />
  )
}
