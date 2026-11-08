import { Alert, Button, Checkbox, Input, Modal, Select, Table, Tag } from 'antd'
import {
  ArrowLeft,
  Building2,
  FilePenLine,
  Landmark,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import {
  createDocumentParty,
  deactivateDocumentParty,
  listDocumentParties,
  updateDocumentParty,
  type DocumentParty,
  type DocumentPartyCreatePayload,
  type DocumentPartyUpdatePayload,
} from '@/api'
import { showError, showWarningDialog } from '@/shared/errors'
import { documentPartyTypeOptions, type LocalizedOption } from '@/shared/formOptions'
import { useFormModal } from '@/shared/useFormModal'
import { ListPageShell, Metric, PanelTitle } from '@/shared/ui'
import { t } from '@/app/appI18n'
import { documentPartyPath, moduleDetailPath } from '@/app/routes'

type DocumentPartyFormState = {
  code: string
  party_type: string
  display_name: string
  customer_id: string
  customer_name: string
  country: string
  address: string
  contact_person: string
  email: string
  phone: string
  bank_name: string
  swift_code: string
  account_no: string
  tax_id: string
  remarks: string
  is_default: boolean
  status: string
}

const statusKeys: LocalizedOption[] = [
  { value: 'active', labelKey: 'status.active' },
  { value: 'inactive', labelKey: 'status.inactive' },
]

type DocumentPartiesPageProps = {
  detailId: string | null
  onNavigate: (path: string) => void
}

export function DocumentPartiesPage({ detailId, onNavigate }: DocumentPartiesPageProps) {
  const [parties, setParties] = useState<DocumentParty[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null)
  const {
    open: partyModalOpen,
    form,
    setForm,
    submitting,
    openWith: openPartyModal,
    close: closePartyModal,
    runSubmit: runPartySubmit,
  } = useFormModal(initialDocumentPartyForm)

  const typeFilterOptions = [
    { value: '', label: t('masterdata.documentParty.allTypes') },
    ...documentPartyTypeOptions.map((option) => ({
      value: option.value,
      label: t(option.labelKey),
    })),
  ]
  const formTypeOptions = documentPartyTypeOptions.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  const statusFilterOptions = [
    { value: '', label: t('masterdata.field.allStatus') },
    ...statusKeys.map((option) => ({ value: option.value, label: t(option.labelKey) })),
  ]
  const formStatusOptions = statusKeys.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))

  function documentPartyTypeLabel(value: string): string {
    const option = documentPartyTypeOptions.find((item) => item.value === value)
    return option ? t(option.labelKey) : value
  }

  const filteredParties = useMemo(
    () => parties.filter((item) => !statusFilter || item.status === statusFilter),
    [parties, statusFilter],
  )

  const selectedParty = useMemo(
    () => {
      if (detailId) {
        return parties.find((item) => item.id === detailId) ?? null
      }
      return filteredParties.find((item) => item.id === selectedId) ?? filteredParties[0] ?? null
    },
    [detailId, filteredParties, parties, selectedId],
  )

  useEffect(() => {
    void loadParties()
  }, [])

  useEffect(() => {
    if (detailId && parties.length > 0 && !parties.some((item) => item.id === detailId)) {
      onNavigate(documentPartyPath)
    }
  }, [detailId, onNavigate, parties])

  function openDetail(party: DocumentParty) {
    setSelectedId(party.id)
    onNavigate(moduleDetailPath(documentPartyPath, party.id))
  }

  function stopAndOpenDetail(event: MouseEvent<HTMLElement>, party: DocumentParty) {
    event.stopPropagation()
    openDetail(party)
  }

  async function loadParties() {
    setLoading(true)
    try {
      const result = await listDocumentParties({
        q: search.trim() || undefined,
        party_type: typeFilter || undefined,
      })
      setParties(result.items)
      setSelectedId((current) => {
        if (current && result.items.some((item) => item.id === current)) return current
        return result.items[0]?.id ?? null
      })
    } catch (caught) {
      showError(caught, t('masterdata.documentParty.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function closePartyForm() {
    setEditingPartyId(null)
    closePartyModal()
  }

  function openCreate() {
    setEditingPartyId(null)
    setMessage('')
    openPartyModal()
  }

  function openEdit() {
    if (!selectedParty) return
    setEditingPartyId(selectedParty.id)
    openPartyModal(documentPartyToForm(selectedParty))
  }

  async function submitParty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const isCreate = !editingPartyId
    const validationMessage = validateDocumentPartyForm(form, isCreate)
    if (validationMessage) {
      showWarningDialog(validationMessage)
      return
    }
    const saved = await runPartySubmit(
      async () => {
        if (editingPartyId) {
          const updated = await updateDocumentParty(
            editingPartyId,
            documentPartyUpdatePayload(form),
          )
          setParties((current) => current.map((item) => (item.id === updated.id ? updated : item)))
          setMessage(t('masterdata.documentParty.saved'))
        } else {
          const created = await createDocumentParty(documentPartyPayload(form))
          setParties((current) => [created, ...current])
          setSelectedId(created.id)
          setMessage(t('masterdata.documentParty.created'))
        }
      },
      (caught) => showError(caught, t('masterdata.documentParty.saveFailed')),
    )
    if (saved) closePartyForm()
  }

  function confirmDeactivate() {
    if (!selectedParty) return
    Modal.confirm({
      title: t('masterdata.documentParty.deactivateTitle', { name: selectedParty.display_name }),
      content: t('masterdata.documentParty.deactivateContent'),
      okText: t('masterdata.action.deactivate'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const updated = await deactivateDocumentParty(selectedParty.id)
          setParties((current) => current.map((item) => (item.id === updated.id ? updated : item)))
          setMessage(t('masterdata.documentParty.deactivated'))
        } catch (caught) {
          showError(caught, t('masterdata.documentParty.deactivateFailed'))
        }
      },
    })
  }

  return (
    <section className="masterdata-page document-party-page masterdata-entity-page">
      <div className="summary-strip" aria-label={t('masterdata.documentParty.overviewAria')}>
        <Metric label={t('masterdata.documentParty.entityLabel')} value={parties.length} />
        <Metric
          label={t('masterdata.documentParty.defaultMetric')}
          value={parties.filter((item) => item.is_default).length}
        />
        <Metric
          label={t('masterdata.documentParty.consigneeMetric')}
          value={parties.filter((item) => item.party_type === 'consignee').length}
        />
        <Metric
          label={t('masterdata.documentParty.issuingBankMetric')}
          value={parties.filter((item) => item.party_type === 'issuing_bank').length}
        />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}

      <section
        className={
          detailId
            ? 'business-grid masterdata-entity-grid masterdata-detail-page-grid'
            : 'business-grid masterdata-entity-grid'
        }
      >
        {!detailId ? (
          <ListPageShell
            className="masterdata-list-panel"
            icon={<Search size={18} />}
            title={t('masterdata.documentParty.listTitle')}
            toolbar={<form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadParties()
              }}
            >
              <label className="inline-filter-search">
                {t('masterdata.documentParty.searchLabel')}
                <Input
                  value={search}
                  placeholder={t('masterdata.documentParty.searchPlaceholder')}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                {t('masterdata.field.type')}
                <Select options={typeFilterOptions} value={typeFilter} onChange={setTypeFilter} />
              </label>
              <label className="inline-filter-compact">
                {t('masterdata.field.status')}
                <Select options={statusFilterOptions} value={statusFilter} onChange={setStatusFilter} />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                {t('masterdata.documentParty.query')}
              </Button>
              <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
                {t('masterdata.documentParty.create')}
              </Button>
            </form>}

          >
            <Table<DocumentParty>
            columns={[
              {
                title: t('masterdata.field.code'),
                dataIndex: 'code',
                width: 130,
                render: (value: string, record: DocumentParty) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: t('masterdata.field.name'), dataIndex: 'display_name' },
              {
                title: t('masterdata.field.type'),
                dataIndex: 'party_type',
                width: 120,
                render: documentPartyTypeLabel,
              },
              {
                title: t('masterdata.documentParty.relatedCustomer'),
                dataIndex: 'customer_name',
                render: (value) => value ?? t('masterdata.documentParty.generic'),
              },
              { title: t('masterdata.field.country'), dataIndex: 'country', width: 120 },
              {
                title: t('masterdata.field.status'),
                dataIndex: 'status',
                width: 90,
                render: (value: string) => <StatusTag value={value} />,
              },
              {
                title: t('masterdata.field.entry'),
                key: 'detail',
                width: 110,
                render: (_value: unknown, record: DocumentParty) => (
                  <Button size="small" onClick={(event) => stopAndOpenDetail(event, record)}>
                    {t('masterdata.action.viewDetail')}
                  </Button>
                ),
              },
            ]}
            dataSource={filteredParties}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedParty?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedId(record.id),
            })}
          />
          </ListPageShell>
        ) : null}

        {detailId ? (
          <section className="workspace-panel masterdata-detail-panel masterdata-standalone-detail">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Building2 size={18} />} title={t('masterdata.documentParty.detailTitle')} />
            {selectedParty ? (
              <div className="section-actions">
                <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(documentPartyPath)}>
                  {t('masterdata.action.backToList')}
                </Button>
                <Button icon={<FilePenLine size={16} />} onClick={openEdit}>
                  {t('masterdata.action.editProfile')}
                </Button>
                <Button danger icon={<Trash2 size={16} />} onClick={confirmDeactivate}>
                  {t('masterdata.action.deactivate')}
                </Button>
              </div>
            ) : null}
          </div>

          {selectedParty ? (
            <>
              <div className="entity-detail-hero">
                <div className="entity-avatar">{selectedParty.display_name.slice(0, 1)}</div>
                <div>
                  <span>{selectedParty.code}</span>
                  <h2>{selectedParty.display_name}</h2>
                  <p>{documentPartyTypeLabel(selectedParty.party_type)}</p>
                </div>
                <div className="section-actions">
                  {selectedParty.is_default ? (
                    <Tag icon={<Star size={12} />} color="gold">
                      {t('masterdata.documentParty.defaultTag')}
                    </Tag>
                  ) : null}
                  <StatusTag value={selectedParty.status} />
                </div>
              </div>

              <dl className="detail-list">
                <div>
                  <dt>{t('masterdata.documentParty.relatedCustomer')}</dt>
                  <dd>{selectedParty.customer_name ?? t('masterdata.documentParty.genericProfile')}</dd>
                </div>
                <div>
                  <dt>{t('masterdata.field.country')}</dt>
                  <dd>{selectedParty.country}</dd>
                </div>
                <div>
                  <dt>{t('masterdata.field.contact')}</dt>
                  <dd>{selectedParty.contact_person ?? t('masterdata.field.notMaintained')}</dd>
                </div>
                <div>
                  <dt>{t('masterdata.documentParty.contactInfo')}</dt>
                  <dd>
                    {selectedParty.email ??
                      selectedParty.phone ??
                      t('masterdata.field.notMaintained')}
                  </dd>
                </div>
                <div>
                  <dt>{t('masterdata.field.address')}</dt>
                  <dd>{selectedParty.address ?? t('masterdata.field.notMaintained')}</dd>
                </div>
                <div>
                  <dt>{t('masterdata.field.taxId')}</dt>
                  <dd>{selectedParty.tax_id ?? t('masterdata.field.notMaintained')}</dd>
                </div>
                <div>
                  <dt>{t('masterdata.field.remarks')}</dt>
                  <dd>{selectedParty.remarks ?? t('common.none')}</dd>
                </div>
                <div>
                  <dt>{t('masterdata.field.owner')}</dt>
                  <dd>{selectedParty.owner_user_id}</dd>
                </div>
              </dl>

              <section className="compact-section bank-card">
                <PanelTitle
                  icon={<Landmark size={18} />}
                  title={t('masterdata.documentParty.bankSection')}
                />
                <dl className="detail-list">
                  <div>
                    <dt>{t('masterdata.documentParty.bankName')}</dt>
                    <dd>{selectedParty.bank_name ?? t('masterdata.field.notMaintained')}</dd>
                  </div>
                  <div>
                    <dt>SWIFT</dt>
                    <dd>{selectedParty.swift_code ?? t('masterdata.field.notMaintained')}</dd>
                  </div>
                  <div>
                    <dt>{t('masterdata.documentParty.accountNo')}</dt>
                    <dd>{selectedParty.account_no ?? t('masterdata.field.notMaintained')}</dd>
                  </div>
                </dl>
              </section>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Building2 size={28} />
              <strong>{t('masterdata.documentParty.emptyTitle')}</strong>
              <span>{t('masterdata.documentParty.emptyDescription')}</span>
            </div>
          )}
          </section>
        ) : null}
      </section>

      <Modal
        centered
        footer={null}
        open={partyModalOpen}
        title={
          editingPartyId
            ? t('masterdata.documentParty.editTitle')
            : t('masterdata.documentParty.createTitle')
        }
        width={1040}
        onCancel={closePartyForm}
      >
        <form className="record-form entity-modal-form" onSubmit={submitParty}>
          <div className="entity-modal-grid">
            <label>
              {t('masterdata.field.code')}
              <Input
                disabled={Boolean(editingPartyId)}
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.field.type')}
              <Select
                options={formTypeOptions}
                value={form.party_type}
                onChange={(value) => setForm({ ...form, party_type: value })}
              />
            </label>
            <label>
              {t('masterdata.field.status')}
              <Select
                options={formStatusOptions}
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
              />
            </label>
            <label className="entity-modal-span">
              {t('masterdata.documentParty.displayName')}
              <Input
                value={form.display_name}
                onChange={(event) => setForm({ ...form, display_name: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.documentParty.customerId')}
              <Input
                value={form.customer_id}
                onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.documentParty.customerName')}
              <Input
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.field.country')}
              <Input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
            </label>
            <label className="entity-modal-span">
              {t('masterdata.field.address')}
              <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
          </div>

          <div className="entity-modal-section">
            <div className="form-divider">{t('masterdata.documentParty.contactAndBankSection')}</div>
            <div className="entity-modal-grid">
              <label>
                {t('masterdata.field.contact')}
                <Input
                  value={form.contact_person}
                  onChange={(event) => setForm({ ...form, contact_person: event.target.value })}
                />
              </label>
              <label>
                {t('masterdata.field.email')}
                <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>
                {t('masterdata.field.phone')}
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
              <label>
                {t('masterdata.documentParty.bankName')}
                <Input
                  value={form.bank_name}
                  onChange={(event) => setForm({ ...form, bank_name: event.target.value })}
                />
              </label>
              <label>
                SWIFT
                <Input
                  value={form.swift_code}
                  onChange={(event) => setForm({ ...form, swift_code: event.target.value })}
                />
              </label>
              <label>
                {t('masterdata.documentParty.accountNo')}
                <Input
                  value={form.account_no}
                  onChange={(event) => setForm({ ...form, account_no: event.target.value })}
                />
              </label>
              <label>
                {t('masterdata.field.taxId')}
                <Input value={form.tax_id} onChange={(event) => setForm({ ...form, tax_id: event.target.value })} />
              </label>
              <label className="checkbox-label">
                <Checkbox
                  checked={form.is_default}
                  onChange={(event: CheckboxChangeEvent) =>
                    setForm({ ...form, is_default: event.target.checked })
                  }
                />
                {t('masterdata.documentParty.isDefault')}
              </label>
              <label className="entity-modal-span">
                {t('masterdata.field.remarks')}
                <Input.TextArea
                  rows={4}
                  value={form.remarks}
                  onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={closePartyForm}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={submitting} type="submit">
              {editingPartyId
                ? t('masterdata.documentParty.saveButton')
                : t('masterdata.documentParty.create')}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

function StatusTag({ value }: { value: string }) {
  return (
    <Tag color={value === 'active' ? 'success' : 'default'}>
      {value === 'active' ? t('status.active') : t('status.inactive')}
    </Tag>
  )
}

function initialDocumentPartyForm(): DocumentPartyFormState {
  return {
    code: '',
    party_type: 'consignee',
    display_name: '',
    customer_id: '',
    customer_name: '',
    country: '',
    address: '',
    contact_person: '',
    email: '',
    phone: '',
    bank_name: '',
    swift_code: '',
    account_no: '',
    tax_id: '',
    remarks: '',
    is_default: true,
    status: 'active',
  }
}

function documentPartyToForm(party: DocumentParty): DocumentPartyFormState {
  return {
    code: party.code,
    party_type: party.party_type,
    display_name: party.display_name,
    customer_id: party.customer_id ?? '',
    customer_name: party.customer_name ?? '',
    country: party.country,
    address: party.address ?? '',
    contact_person: party.contact_person ?? '',
    email: party.email ?? '',
    phone: party.phone ?? '',
    bank_name: party.bank_name ?? '',
    swift_code: party.swift_code ?? '',
    account_no: party.account_no ?? '',
    tax_id: party.tax_id ?? '',
    remarks: party.remarks ?? '',
    is_default: party.is_default,
    status: party.status,
  }
}

function validateDocumentPartyForm(form: DocumentPartyFormState, requireCode: boolean): string {
  if (requireCode && !form.code.trim()) return t('masterdata.documentParty.validation.codeRequired')
  if (!form.display_name.trim()) return t('masterdata.documentParty.validation.displayNameRequired')
  if (!form.country.trim()) return t('masterdata.documentParty.validation.countryRequired')
  return ''
}

function documentPartyPayload(form: DocumentPartyFormState): DocumentPartyCreatePayload {
  return {
    code: form.code.trim(),
    party_type: form.party_type,
    display_name: form.display_name.trim(),
    customer_id: emptyToNull(form.customer_id),
    customer_name: emptyToNull(form.customer_name),
    country: form.country.trim(),
    address: emptyToNull(form.address),
    contact_person: emptyToNull(form.contact_person),
    email: emptyToNull(form.email),
    phone: emptyToNull(form.phone),
    bank_name: emptyToNull(form.bank_name),
    swift_code: emptyToNull(form.swift_code),
    account_no: emptyToNull(form.account_no),
    tax_id: emptyToNull(form.tax_id),
    remarks: emptyToNull(form.remarks),
    is_default: form.is_default,
    status: form.status,
  }
}

function documentPartyUpdatePayload(form: DocumentPartyFormState): DocumentPartyUpdatePayload {
  const { code: _code, ...payload } = documentPartyPayload(form)
  return payload
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
