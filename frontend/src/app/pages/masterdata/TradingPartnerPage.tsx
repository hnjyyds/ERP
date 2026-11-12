import { Alert, Button, Checkbox, Input, Modal, Select, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ArrowLeft,
  FilePenLine,
  Funnel,
  History,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { FormEvent, MouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { showError, showWarningDialog } from '@/shared/errors'
import { useFormModal } from '@/shared/useFormModal'
import {
  ListPageShell,
  Metric,
  PanelTitle,
  useColumnView,
  type ColumnOption,
} from '@/shared/ui'
import { ListEmptyState } from '@/shared/ui/ListEmptyState'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { t } from '@/app/appI18n'
import {
  contactPayload,
  entityToForm,
  formCreditGradeOptions,
  formStatusOptions,
  initialContactForm,
  initialPartnerForm,
  partnerCreatePayload,
  partnerTypeLabel,
  partnerTypeOptions,
  partnerUpdatePayload,
  statusOptions,
  validatePartnerForm,
  type PartnerContact,
  type PartnerContactPayload,
  type PartnerCreatePayload,
  type PartnerEntity,
  type PartnerListResult,
  type PartnerListSummary,
  type PartnerTransaction,
  type PartnerUpdatePayload,
  type TradingPartnerKind,
  type TransactionListResult,
} from './tradingPartnerModel'

function buildColumnOptions(): ColumnOption[] {
  return [
    { key: 'code', title: t('masterdata.field.code'), required: true },
    { key: 'cn_name', title: t('masterdata.field.cnName') },
    { key: 'en_name', title: t('masterdata.field.enName') },
    { key: 'partner_type', title: t('masterdata.field.type') },
    { key: 'country', title: t('masterdata.field.country') },
    { key: 'contact', title: t('masterdata.field.contact') },
    { key: 'status', title: t('masterdata.field.status') },
  ]
}

export type TradingPartnerPageProps = {
  className: string
  entityLabel: string
  pageTitle: string
  searchPlaceholder: string
  createPrefix: string
  kind: TradingPartnerKind
  detailId: string | null
  listPath: string
  detailPath: (id: string) => string
  onNavigate: (path: string) => void
  listEntity: (filters?: PartnerListFilters) => Promise<PartnerListResult>
  createEntity: (payload: PartnerCreatePayload) => Promise<PartnerEntity>
  updateEntity: (id: string, payload: PartnerUpdatePayload) => Promise<PartnerEntity>
  deactivateEntity: (id: string) => Promise<PartnerEntity>
  addContact: (id: string, payload: PartnerContactPayload) => Promise<PartnerContact>
  updateContact: (
    id: string,
    contactId: string,
    payload: PartnerContactPayload,
  ) => Promise<PartnerContact>
  deleteContact: (id: string, contactId: string) => Promise<PartnerContact>
  listTransactions: (id: string) => Promise<TransactionListResult>
}

type PartnerListFilters = {
  q?: string
  country?: string
  credit_grade?: string
  partner_type?: string
  status?: string
  limit?: number
  offset?: number
}

function filtersFromUrl(params: URLSearchParams): PartnerListFilters {
  return {
    q: params.get('q')?.trim() || undefined,
    country: params.get('country')?.trim() || undefined,
    credit_grade: params.get('credit_grade') || undefined,
    partner_type: params.get('partner_type') || undefined,
    status: params.get('status') || undefined,
  }
}

export function TradingPartnerPage({
  className,
  entityLabel,
  pageTitle,
  searchPlaceholder,
  kind,
  detailId,
  listPath,
  detailPath,
  onNavigate,
  listEntity,
  createEntity,
  updateEntity,
  deactivateEntity,
  addContact,
  updateContact,
  deleteContact,
  listTransactions,
}: TradingPartnerPageProps) {
  const [rows, setRows] = useState<PartnerEntity[]>([])
  const [summary, setSummary] = useState<PartnerListSummary>({
    active_count: 0,
    contact_count: 0,
  })
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([])
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [country, setCountry] = useState(() => urlQuery.params.get('country') ?? '')
  const [creditGrade, setCreditGrade] = useState(
    () => urlQuery.params.get('credit_grade') ?? '',
  )
  const [partnerType, setPartnerType] = useState(
    () => urlQuery.params.get('partner_type') ?? '',
  )
  const [statusFilter, setStatusFilter] = useState(
    () => urlQuery.params.get('status') ?? '',
  )
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const {
    open: entityModalOpen,
    form,
    setForm,
    submitting: submittingEntity,
    openWith: openEntityModal,
    close: closeEntityModal,
    runSubmit: runEntitySubmit,
  } = useFormModal(() => initialPartnerForm())
  const {
    open: contactModalOpen,
    form: contactForm,
    setForm: setContactForm,
    submitting: submittingContact,
    openWith: openContactModal,
    close: closeContactModal,
    runSubmit: runContactSubmit,
  } = useFormModal(initialContactForm)
  const columnOptions =
    kind === 'partner'
      ? buildColumnOptions()
      : buildColumnOptions().filter((option) => option.key !== 'partner_type')
  const { isVisible: isColumnVisible, control: columnViewControl } = useColumnView(
    `masterdata-${kind}-columns`,
    columnOptions,
  )
  const showCreditFields = kind !== 'partner'
  const activeAdvancedFilterCount = [
    country.trim(),
    kind === 'partner' ? partnerType : creditGrade,
    statusFilter,
  ].filter(Boolean).length

  const partnerTypeSelectOptions = [
    { value: '', label: t('masterdata.field.allTypes') },
    ...partnerTypeOptions.map((option) => ({ value: option.value, label: t(option.labelKey) })),
  ]
  const formPartnerTypeOptions = partnerTypeOptions.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  const localizedStatusOptions = statusOptions.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  const localizedFormStatusOptions = formStatusOptions.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  const localizedCreditGradeOptions = [
    { value: '', label: t('masterdata.tradingPartner.allCreditGrades') },
    ...formCreditGradeOptions,
  ]

  const openDetail = useCallback(
    (record: PartnerEntity) => {
      setSelectedId(record.id)
      onNavigate(detailPath(record.id))
    },
    [detailPath, onNavigate],
  )

  const stopAndOpenDetail = useCallback(
    (event: MouseEvent<HTMLElement>, record: PartnerEntity) => {
      event.stopPropagation()
      openDetail(record)
    },
    [openDetail],
  )

  const columns: ColumnsType<PartnerEntity> = [
    ...(isColumnVisible('code')
      ? [
          {
            title: t('masterdata.field.code'),
            dataIndex: 'code',
            width: 130,
            render: (value: string, record: PartnerEntity) => (
              <button
                className="row-button"
                type="button"
                onClick={(event) => stopAndOpenDetail(event, record)}
              >
                {value}
              </button>
            ),
          },
        ]
      : []),
    ...(isColumnVisible('cn_name')
      ? [{ title: t('masterdata.field.cnName'), dataIndex: 'cn_name' }]
      : []),
    ...(isColumnVisible('en_name')
      ? [{ title: t('masterdata.field.enName'), dataIndex: 'en_name' }]
      : []),
    ...(kind === 'partner' && isColumnVisible('partner_type')
      ? [
          {
            title: t('masterdata.field.type'),
            dataIndex: 'partner_type',
            width: 120,
            render: (value: string) => partnerTypeLabel(value),
          },
        ]
      : []),
    ...(isColumnVisible('country')
      ? [{ title: t('masterdata.field.country'), dataIndex: 'country', width: 120 }]
      : []),
    ...(isColumnVisible('contact')
      ? [
          {
            title: t('masterdata.field.contact'),
            width: 140,
            render: (_: unknown, record: PartnerEntity) =>
              record.primary_contact?.name ??
              record.contacts[0]?.name ??
              t('masterdata.field.notMaintained'),
          },
        ]
      : []),
    ...(isColumnVisible('status')
      ? [
          {
            title: t('masterdata.field.status'),
            dataIndex: 'status',
            width: 90,
            render: (value: string) => <StatusTag value={value} />,
          },
        ]
      : []),
    {
      title: t('masterdata.field.entry'),
      key: 'detail',
      width: 110,
      render: (_: unknown, record: PartnerEntity) => (
        <Button size="small" onClick={(event) => stopAndOpenDetail(event, record)}>
          {t('masterdata.action.viewDetail')}
        </Button>
      ),
    },
  ]

  const selected = useMemo(
    () => {
      if (detailId) {
        return rows.find((item) => item.id === detailId) ?? null
      }
      return rows.find((item) => item.id === selectedId) ?? rows[0] ?? null
    },
    [detailId, rows, selectedId],
  )

  useEffect(() => {
    void loadRows()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    setSearch(urlQuery.params.get('q') ?? '')
    setCountry(urlQuery.params.get('country') ?? '')
    setCreditGrade(urlQuery.params.get('credit_grade') ?? '')
    setPartnerType(urlQuery.params.get('partner_type') ?? '')
    setStatusFilter(urlQuery.params.get('status') ?? '')
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadRows(nextPage, pageSize, filtersFromUrl(urlQuery.params))
  }, [urlQuery.search])

  useEffect(() => {
    if (!detailId || !selected) {
      setTransactions([])
      return
    }
    let cancelled = false
    setTransactionLoading(true)
    listTransactions(selected.id)
      .then((result) => {
        if (!cancelled) setTransactions(result.items)
      })
      .catch(() => {
        if (!cancelled) setTransactions([])
      })
      .finally(() => {
        if (!cancelled) setTransactionLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [detailId, listTransactions, selected])

  useEffect(() => {
    if (detailId && rows.length > 0 && !rows.some((item) => item.id === detailId)) {
      onNavigate(listPath)
    }
  }, [detailId, listPath, onNavigate, rows])

  async function loadRows(
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: PartnerListFilters,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    const filters = filtersOverride ?? currentFilters()
    setLoading(true)
    try {
      const result = await listEntity({
        ...filters,
        limit: resolvedPageSize,
        offset: (resolvedPage - 1) * resolvedPageSize,
      })
      setTotal(result.total)
      setSummary(result.summary)
      if (result.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadRows(prevPage, resolvedPageSize, filtersOverride)
        return
      }
      setRows(result.items)
      setSelectedId((current) => {
        if (current && result.items.some((item) => item.id === current)) return current
        return result.items[0]?.id ?? null
      })
    } catch (caught) {
      showError(caught, t('masterdata.tradingPartner.listLoadFailed', { entity: entityLabel }))
    } finally {
      setLoading(false)
    }
  }

  function currentFilters(): PartnerListFilters {
    return {
      q: search.trim() || undefined,
      country: country.trim() || undefined,
      credit_grade: showCreditFields ? creditGrade || undefined : undefined,
      partner_type: kind === 'partner' ? partnerType || undefined : undefined,
      status: statusFilter || undefined,
    }
  }

  function resetAdvancedFilters() {
    setCountry('')
    setCreditGrade('')
    setPartnerType('')
    setStatusFilter('')
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      country: null,
      credit_grade: null,
      partner_type: null,
      status: null,
      page: null,
    })
    void loadRows(1, pageSize, { q: search.trim() || undefined })
  }

  function clearAllFilters() {
    setSearch('')
    setCountry('')
    setCreditGrade('')
    setPartnerType('')
    setStatusFilter('')
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: null,
      country: null,
      credit_grade: null,
      partner_type: null,
      status: null,
      page: null,
    })
    void loadRows(1, pageSize, {})
  }

  function closeEntityForm() {
    setEditingEntityId(null)
    closeEntityModal()
  }

  function openCreate() {
    setEditingEntityId(null)
    setMessage('')
    openEntityModal()
  }

  function openEdit() {
    if (!selected) return
    setEditingEntityId(selected.id)
    openEntityModal(entityToForm(selected))
  }

  function openCreateContact() {
    if (!selected) return
    setEditingContactId(null)
    openContactModal()
  }

  function openEditContact(contact: PartnerContact) {
    setEditingContactId(contact.id)
    openContactModal(initialContactForm(contact))
  }

  function closeContactForm() {
    setEditingContactId(null)
    closeContactModal()
  }

  async function submitEntity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const isCreate = !editingEntityId
    const validationMessage = validatePartnerForm(form, isCreate, kind)
    if (validationMessage) {
      showWarningDialog(validationMessage)
      return
    }
    const saved = await runEntitySubmit(
      async () => {
        if (editingEntityId && selected) {
          const updated = await updateEntity(editingEntityId, partnerUpdatePayload(form, kind))
          setRows((current) => current.map((item) => (item.id === updated.id ? updated : item)))
          setMessage(t('masterdata.tradingPartner.saved', { entity: entityLabel }))
        } else {
          const created = await createEntity(partnerCreatePayload(form, kind))
          setSelectedId(created.id)
          setPage(1)
          appliedUrlSearchRef.current = urlQuery.update({ page: null })
          await loadRows(1, pageSize)
          setMessage(t('masterdata.tradingPartner.created', { entity: entityLabel }))
        }
      },
      (caught) => showError(caught, t('masterdata.tradingPartner.saveFailed', { entity: entityLabel })),
    )
    if (saved) closeEntityForm()
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setMessage('')
    if (!contactForm.name.trim()) {
      showWarningDialog(t('masterdata.tradingPartner.contactNameRequired'))
      return
    }
    const saved = await runContactSubmit(
      async () => {
        if (editingContactId) {
          await updateContact(selected.id, editingContactId, contactPayload(contactForm))
        } else {
          await addContact(selected.id, contactPayload(contactForm))
        }
        setMessage(
          editingContactId
            ? t('masterdata.tradingPartner.contactSaved')
            : t('masterdata.tradingPartner.contactCreated'),
        )
        await loadRows()
      },
      (caught) => showError(caught, t('masterdata.tradingPartner.contactSaveFailed')),
    )
    if (saved) closeContactForm()
  }

  function confirmDeleteContact(contact: PartnerContact) {
    if (!selected) return
    Modal.confirm({
      title: t('masterdata.tradingPartner.contactDeleteTitle', { name: contact.name }),
      content: t('masterdata.tradingPartner.contactDeleteContent'),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteContact(selected.id, contact.id)
          setMessage(t('masterdata.tradingPartner.contactDeleted'))
          await loadRows()
        } catch (caught) {
          showError(caught, t('masterdata.tradingPartner.contactDeleteFailed'))
        }
      },
    })
  }

  function confirmDeactivate() {
    if (!selected) return
    Modal.confirm({
      title: t('masterdata.tradingPartner.deactivateTitle', {
        entity: entityLabel,
        name: selected.cn_name,
      }),
      content: t('masterdata.tradingPartner.deactivateContent'),
      okText: t('masterdata.action.deactivate'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const updated = await deactivateEntity(selected.id)
          setRows((current) => current.map((item) => (item.id === updated.id ? updated : item)))
          setMessage(t('masterdata.tradingPartner.deactivated', { entity: entityLabel }))
        } catch (caught) {
          showError(caught, t('masterdata.tradingPartner.deactivateFailed', { entity: entityLabel }))
        }
      },
    })
  }

  return (
    <section className={`masterdata-page masterdata-entity-page ${className}`}>
      <div
        className="summary-strip"
        aria-label={t('masterdata.tradingPartner.overviewAria', { entity: entityLabel })}
      >
        <Metric label={entityLabel} value={total} />
        <Metric label={t('status.active')} value={summary.active_count} />
        <Metric
          label={t('masterdata.field.contact')}
          value={summary.contact_count}
        />
        <Metric
          label={
            showCreditFields
              ? t('masterdata.tradingPartner.withCreditProfile')
              : t('masterdata.tradingPartner.typeCount')
          }
          value={
            showCreditFields
              ? summary.credit_profile_count ?? 0
              : summary.partner_type_count ?? 0
          }
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
            title={t('masterdata.tradingPartner.listTitle', { entity: entityLabel })}
            toolbar={<form
              className="inline-filters partner-inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                setPage(1)
                appliedUrlSearchRef.current = urlQuery.update({
                  q: search.trim(),
                  country: country.trim(),
                  credit_grade: showCreditFields ? creditGrade : '',
                  partner_type: kind === 'partner' ? partnerType : '',
                  status: statusFilter,
                  page: null,
                })
                void loadRows(1, pageSize)
              }}
            >
              <div className="partner-filter-toolbar">
                <label className="inline-filter-search">
                  {t('masterdata.tradingPartner.searchLabel')}
                  <Input
                    value={search}
                    placeholder={searchPlaceholder}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <div className="partner-filter-actions">
                  <Tooltip
                    title={t('masterdata.tradingPartner.searchTooltip', { entity: entityLabel })}
                  >
                    <Button
                      aria-label={t('masterdata.tradingPartner.searchTooltip', {
                        entity: entityLabel,
                      })}
                      className="toolbar-icon-button"
                      htmlType="submit"
                      icon={<Search size={16} />}
                    />
                  </Tooltip>
                  <Button
                    htmlType="button"
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={openCreate}
                  >
                    {t('masterdata.tradingPartner.create', { entity: entityLabel })}
                  </Button>
                  <Tooltip
                    title={
                      activeAdvancedFilterCount > 0
                        ? t('masterdata.tradingPartner.advancedFilterActive', {
                            count: activeAdvancedFilterCount,
                          })
                        : t('masterdata.tradingPartner.advancedFilter')
                    }
                  >
                    <Button
                      aria-label={
                        activeAdvancedFilterCount > 0
                          ? t('masterdata.tradingPartner.advancedFilterActive', {
                              count: activeAdvancedFilterCount,
                            })
                          : t('masterdata.tradingPartner.advancedFilter')
                      }
                      aria-expanded={advancedFiltersOpen}
                      aria-pressed={advancedFiltersOpen}
                      className="toolbar-icon-button advanced-filter-toggle"
                      htmlType="button"
                      icon={<Funnel size={16} />}
                      onClick={() => setAdvancedFiltersOpen((current) => !current)}
                    >
                      {activeAdvancedFilterCount > 0 ? (
                        <span aria-hidden="true" className="advanced-filter-count">
                          {activeAdvancedFilterCount}
                        </span>
                      ) : null}
                    </Button>
                  </Tooltip>
                  {columnViewControl}
                </div>
              </div>

              {advancedFiltersOpen ? (
                <div
                  className="partner-advanced-filters"
                  aria-label={t('masterdata.tradingPartner.advancedFilterAria', {
                    entity: entityLabel,
                  })}
                >
                  <label>
                    {t('masterdata.field.country')}
                    <Input
                      value={country}
                      placeholder={t('masterdata.field.country')}
                      onChange={(event) => setCountry(event.target.value)}
                    />
                  </label>
                  <label>
                    {kind === 'partner'
                      ? t('masterdata.field.type')
                      : t('masterdata.tradingPartner.credit')}
                    {kind === 'partner' ? (
                      <Select
                        aria-label={t('masterdata.field.type')}
                        options={partnerTypeSelectOptions}
                        value={partnerType}
                        onChange={setPartnerType}
                      />
                    ) : (
                      <Select
                        aria-label={t('masterdata.tradingPartner.credit')}
                        options={localizedCreditGradeOptions}
                        value={creditGrade}
                        onChange={setCreditGrade}
                      />
                    )}
                  </label>
                  <label>
                    {t('masterdata.field.status')}
                    <Select
                      aria-label={t('masterdata.field.status')}
                      options={localizedStatusOptions}
                      value={statusFilter}
                      onChange={setStatusFilter}
                    />
                  </label>
                  <Tooltip title={t('masterdata.tradingPartner.resetAdvancedFilters')}>
                    <Button
                      aria-label={t('masterdata.tradingPartner.resetAdvancedFilters')}
                      className="toolbar-icon-button advanced-filter-reset"
                      disabled={activeAdvancedFilterCount === 0}
                      htmlType="button"
                      icon={<RotateCcw size={16} />}
                      onClick={resetAdvancedFilters}
                    />
                  </Tooltip>
                </div>
              ) : null}
            </form>}

          >
            <Table<PartnerEntity>
            columns={columns}
            dataSource={rows}
            locale={{
              emptyText: (
                <ListEmptyState
                  createLabel={t('masterdata.tradingPartner.createTitle', { entity: entityLabel })}
                  emptyDescription={t('masterdata.tradingPartner.listEmptyDescription', {
                    entity: entityLabel,
                  })}
                  emptyTitle={t('masterdata.tradingPartner.listEmptyTitle', {
                    entity: entityLabel,
                  })}
                  filtered={Boolean(search.trim()) || activeAdvancedFilterCount > 0}
                  onCreate={openCreate}
                  onClearFilters={clearAllFilters}
                />
              ),
            }}
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (nextPage, nextPageSize) => {
                const next = changePage(nextPage, nextPageSize)
                appliedUrlSearchRef.current = urlQuery.update({
                  page: next.page === 1 ? null : next.page,
                })
                void loadRows(next.page, next.pageSize)
              },
            }}
            rowClassName={(record) => (record.id === selected?.id ? 'selected-row' : '')}
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
            <PanelTitle icon={<UsersRound size={18} />} title={pageTitle} />
            {selected ? (
              <div className="section-actions">
                <Button
                  icon={<ArrowLeft size={16} />}
                  onClick={() => onNavigate(listPath)}
                >
                  {t('masterdata.action.backToList')}
                </Button>
                <Button icon={<Plus size={16} />} onClick={openCreateContact}>
                  {t('masterdata.tradingPartner.addContact')}
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

          {selected ? (
            <>
              <div className="entity-detail-hero">
                <div className="entity-avatar">{selected.cn_name.slice(0, 1)}</div>
                <div>
                  <span>{selected.code}</span>
                  <h2>{selected.cn_name}</h2>
                  <p>{selected.en_name}</p>
                </div>
                <StatusTag value={selected.status} />
              </div>

              <dl className="detail-list">
                <div>
                  <dt>{t('masterdata.field.country')}</dt>
                  <dd>{selected.country}</dd>
                </div>
                <div>
                  <dt>{t('masterdata.field.address')}</dt>
                  <dd>{selected.address ?? t('masterdata.field.notMaintained')}</dd>
                </div>
                <div>
                  <dt>{t('masterdata.field.website')}</dt>
                  <dd>{selected.website ?? t('masterdata.field.notMaintained')}</dd>
                </div>
                <div>
                  <dt>
                    {kind === 'partner'
                      ? t('masterdata.tradingPartner.partnerType')
                      : t('masterdata.tradingPartner.creditGrade')}
                  </dt>
                  <dd>
                    {kind === 'partner' && 'partner_type' in selected
                      ? partnerTypeLabel(selected.partner_type)
                      : 'credit_profile' in selected
                        ? selected.credit_profile?.credit_grade ??
                          t('masterdata.field.notMaintained')
                        : t('masterdata.field.notMaintained')}
                  </dd>
                </div>
                {showCreditFields && 'credit_profile' in selected ? (
                  <>
                    <div>
                      <dt>{t('masterdata.tradingPartner.creditLimit')}</dt>
                      <dd>
                        {selected.credit_profile?.credit_limit
                          ? `${selected.credit_profile.credit_limit} ${selected.credit_profile.currency}`
                          : t('masterdata.tradingPartner.creditUnavailable')}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('masterdata.tradingPartner.paymentTerms')}</dt>
                      <dd>
                        {selected.credit_profile?.payment_terms ||
                          t('masterdata.field.notMaintained')}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('masterdata.tradingPartner.riskNote')}</dt>
                      <dd>{selected.credit_profile?.risk_note ?? t('common.none')}</dd>
                    </div>
                  </>
                ) : null}
                <div>
                  <dt>{t('masterdata.field.owner')}</dt>
                  <dd>{selected.owner_user_id}</dd>
                </div>
              </dl>

              <section className="compact-section">
                <PanelTitle
                  icon={<UserRound size={18} />}
                  title={t('masterdata.tradingPartner.contactSection')}
                />
                <div className="contact-card-grid">
                  {selected.contacts.length > 0 ? (
                    selected.contacts.map((contact) => (
                      <article className="contact-card" key={contact.id}>
                        <strong>{contact.name}</strong>
                        <span>
                          {contact.title ?? t('masterdata.tradingPartner.contactTitleMissing')}
                        </span>
                        <p>
                          {contact.email ?? t('masterdata.tradingPartner.contactEmailMissing')}
                        </p>
                        <p>
                          {contact.phone ?? t('masterdata.tradingPartner.contactPhoneMissing')}
                        </p>
                        <div className="contact-card-footer">
                          {contact.is_primary ? (
                            <Tag color="gold">{t('masterdata.tradingPartner.primaryContact')}</Tag>
                          ) : (
                            <span />
                          )}
                          <div className="table-actions">
                            <Button size="small" onClick={() => openEditContact(contact)}>
                              {t('common.edit')}
                            </Button>
                            <Button danger size="small" onClick={() => confirmDeleteContact(contact)}>
                              {t('common.delete')}
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="module-state">{t('masterdata.tradingPartner.noContacts')}</div>
                  )}
                </div>
              </section>

              <section className="compact-section">
                <PanelTitle
                  icon={<History size={18} />}
                  title={
                    kind === 'partner'
                      ? t('masterdata.tradingPartner.feeRecords')
                      : t('masterdata.tradingPartner.businessRecords')
                  }
                />
                <Table<PartnerTransaction>
                  columns={[
                    {
                      title: t('masterdata.tradingPartner.transactionSource'),
                      dataIndex: 'source_type',
                      width: 120,
                    },
                    {
                      title: t('masterdata.tradingPartner.transactionCode'),
                      dataIndex: 'source_code',
                      width: 160,
                    },
                    {
                      title: t('masterdata.tradingPartner.transactionSummary'),
                      dataIndex: 'summary',
                    },
                    {
                      title: t('masterdata.tradingPartner.transactionAmount'),
                      dataIndex: 'amount',
                      width: 120,
                      render: (value) => value ?? '-',
                    },
                    {
                      title: t('masterdata.tradingPartner.transactionTime'),
                      dataIndex: 'occurred_at',
                      width: 160,
                    },
                  ]}
                  dataSource={transactions}
                  loading={transactionLoading}
                  pagination={false}
                  rowKey={(record) => `${record.source_type}-${record.source_code}-${record.occurred_at}`}
                  size="small"
                />
              </section>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <UsersRound size={28} />
              <strong>{t('masterdata.tradingPartner.emptyTitle', { entity: entityLabel })}</strong>
              <span>
                {t('masterdata.tradingPartner.emptyDescription', { entity: entityLabel })}
              </span>
            </div>
          )}
          </section>
        ) : null}
      </section>

      <Modal
        centered
        footer={null}
        open={entityModalOpen}
        title={
          editingEntityId
            ? t('masterdata.tradingPartner.editTitle', { entity: entityLabel })
            : t('masterdata.tradingPartner.createTitle', { entity: entityLabel })
        }
        width={1040}
        onCancel={closeEntityForm}
      >
        <form className="record-form entity-modal-form" onSubmit={submitEntity}>
          <div className="entity-modal-grid">
            <label>
              {t('masterdata.field.code')}
              <Input
                disabled={Boolean(editingEntityId)}
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.field.cnName')}
              <Input value={form.cn_name} onChange={(event) => setForm({ ...form, cn_name: event.target.value })} />
            </label>
            <label>
              {t('masterdata.field.enName')}
              <Input value={form.en_name} onChange={(event) => setForm({ ...form, en_name: event.target.value })} />
            </label>
            {kind === 'partner' ? (
              <label>
                {t('masterdata.tradingPartner.partnerTypeSection')}
                <Select
                  options={formPartnerTypeOptions}
                  value={form.partner_type}
                  onChange={(value) => setForm({ ...form, partner_type: value })}
                />
              </label>
            ) : null}
            <label>
              {t('masterdata.field.country')}
              <Input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
            </label>
            <label>
              {t('masterdata.field.status')}
              <Select
                options={localizedFormStatusOptions}
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
              />
            </label>
            <label>
              {t('masterdata.field.website')}
              <Input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
            </label>
            <label className="entity-modal-span">
              {t('masterdata.field.address')}
              <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
          </div>

          {showCreditFields ? (
            <div className="entity-modal-section">
              <div className="form-divider">{t('masterdata.tradingPartner.creditSection')}</div>
              <div className="entity-modal-grid">
                <label>
                  {t('masterdata.tradingPartner.creditGrade')}
                  <Select
                    options={formCreditGradeOptions}
                    value={form.credit_grade}
                    onChange={(value) => setForm({ ...form, credit_grade: value })}
                  />
                </label>
                <label>
                  {t('masterdata.tradingPartner.creditLimit')}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.credit_limit}
                    onChange={(event) => setForm({ ...form, credit_limit: event.target.value })}
                  />
                </label>
                <label>
                  {t('masterdata.tradingPartner.currency')}
                  <Input
                    value={form.currency}
                    onChange={(event) => setForm({ ...form, currency: event.target.value })}
                  />
                </label>
                <label className="entity-modal-span">
                  {t('masterdata.tradingPartner.paymentTerms')}
                  <Input
                    value={form.payment_terms}
                    onChange={(event) => setForm({ ...form, payment_terms: event.target.value })}
                  />
                </label>
                <label className="entity-modal-span">
                  {t('masterdata.tradingPartner.riskNote')}
                  <Input.TextArea
                    rows={3}
                    value={form.risk_note}
                    onChange={(event) => setForm({ ...form, risk_note: event.target.value })}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {!editingEntityId ? (
            <div className="entity-modal-section">
              <div className="form-divider">{t('masterdata.tradingPartner.firstContact')}</div>
              <div className="entity-modal-grid">
                <label>
                  {t('masterdata.tradingPartner.firstName')}
                  <Input
                    value={form.contact_name}
                    onChange={(event) => setForm({ ...form, contact_name: event.target.value })}
                  />
                </label>
                <label>
                  {t('masterdata.tradingPartner.jobTitle')}
                  <Input
                    value={form.contact_title}
                    onChange={(event) => setForm({ ...form, contact_title: event.target.value })}
                  />
                </label>
                <label>
                  {t('masterdata.tradingPartner.contactEmail')}
                  <Input
                    value={form.contact_email}
                    onChange={(event) => setForm({ ...form, contact_email: event.target.value })}
                  />
                </label>
                <label>
                  {t('masterdata.tradingPartner.contactPhone')}
                  <Input
                    value={form.contact_phone}
                    onChange={(event) => setForm({ ...form, contact_phone: event.target.value })}
                  />
                </label>
                <label className="checkbox-label">
                  <Checkbox
                    checked={form.contact_is_primary}
                    onChange={(event: CheckboxChangeEvent) =>
                      setForm({ ...form, contact_is_primary: event.target.checked })
                    }
                  />
                  {t('masterdata.tradingPartner.primaryContact')}
                </label>
              </div>
            </div>
          ) : null}

          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={closeEntityForm}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={submittingEntity} type="submit">
              {editingEntityId
                ? t('masterdata.tradingPartner.saveButton', { entity: entityLabel })
                : t('masterdata.tradingPartner.create', { entity: entityLabel })}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={contactModalOpen}
        title={
          editingContactId
            ? t('masterdata.tradingPartner.editContactTitle', { entity: entityLabel })
            : t('masterdata.tradingPartner.createContactTitle', { entity: entityLabel })
        }
        width={760}
        onCancel={closeContactForm}
      >
        <form className="record-form entity-modal-form" onSubmit={submitContact}>
          <div className="entity-modal-grid two">
            <label>
              {t('masterdata.tradingPartner.firstName')}
              <Input
                value={contactForm.name}
                onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.tradingPartner.jobTitle')}
              <Input
                value={contactForm.title}
                onChange={(event) => setContactForm({ ...contactForm, title: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.tradingPartner.contactEmail')}
              <Input
                value={contactForm.email}
                onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.tradingPartner.contactPhone')}
              <Input
                value={contactForm.phone}
                onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })}
              />
            </label>
            <label className="checkbox-label entity-modal-span">
              <Checkbox
                checked={contactForm.is_primary}
                onChange={(event: CheckboxChangeEvent) =>
                  setContactForm({ ...contactForm, is_primary: event.target.checked })
                }
              />
              {t('masterdata.tradingPartner.setPrimaryContact')}
            </label>
          </div>
          <div className="modal-actions">
            <button
              className="secondary-inline"
              type="button"
              onClick={closeContactForm}
            >
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={submittingContact} type="submit">
              {editingContactId
                ? t('masterdata.tradingPartner.saveContact')
                : t('masterdata.tradingPartner.addContact')}
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
