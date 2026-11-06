import {
  addPartnerContact,
  createPartner,
  deactivatePartner,
  deletePartnerContact,
  listPartnerFeeRecords,
  listPartners,
  updatePartner,
  updatePartnerContact,
  type PartnerContactPayload as ApiPartnerContactPayload,
  type PartnerCreatePayload as ApiPartnerCreatePayload,
  type PartnerUpdatePayload as ApiPartnerUpdatePayload,
} from '../../../api'
import { TradingPartnerPage } from './TradingPartnerPage'
import type { PartnerContactPayload, PartnerCreatePayload, PartnerUpdatePayload } from './tradingPartnerModel'
import { t } from '../../appI18n'
import { moduleDetailPath, partnerPath } from '../../routes'

type PartnersPageProps = {
  detailId: string | null
  onNavigate: (path: string) => void
}

export function PartnersPage({ detailId, onNavigate }: PartnersPageProps) {
  return (
    <TradingPartnerPage
      className="partner-page"
      createEntity={(payload) => createPartner(asPartnerCreatePayload(payload))}
      createPrefix="P"
      deactivateEntity={deactivatePartner}
      entityLabel={t('masterdata.partner.entityLabel')}
      kind="partner"
      detailId={detailId}
      detailPath={(id) => moduleDetailPath(partnerPath, id)}
      listPath={partnerPath}
      listEntity={(filters) => listPartners({ q: filters?.q, partner_type: filters?.partner_type })}
      listTransactions={listPartnerFeeRecords}
      onNavigate={onNavigate}
      pageTitle={t('masterdata.partner.pageTitle')}
      searchPlaceholder={t('masterdata.partner.searchPlaceholder')}
      updateEntity={(id, payload) => updatePartner(id, asPartnerUpdatePayload(payload))}
      addContact={(id, payload) => addPartnerContact(id, asPartnerContactPayload(payload))}
      updateContact={(id, contactId, payload) =>
        updatePartnerContact(id, contactId, asPartnerContactPayload(payload))
      }
      deleteContact={deletePartnerContact}
    />
  )
}

function asPartnerCreatePayload(payload: PartnerCreatePayload): ApiPartnerCreatePayload {
  return payload as ApiPartnerCreatePayload
}

function asPartnerUpdatePayload(payload: PartnerUpdatePayload): ApiPartnerUpdatePayload {
  return payload as ApiPartnerUpdatePayload
}

function asPartnerContactPayload(payload: PartnerContactPayload): ApiPartnerContactPayload {
  return payload as ApiPartnerContactPayload
}
