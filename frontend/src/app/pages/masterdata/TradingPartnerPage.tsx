import { Alert, Button, Checkbox, Input, Modal, Select, Table, Tag } from 'antd'
import {
  CreditCard,
  FilePenLine,
  History,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { Metric, PanelTitle } from '../../../shared/ui'
import {
  contactPayload,
  creditGradeOptions,
  entityToForm,
  formCreditGradeOptions,
  formStatusOptions,
  initialContactForm,
  initialPartnerForm,
  partnerCreatePayload,
  partnerUpdatePayload,
  statusOptions,
  validatePartnerForm,
  type ContactFormState,
  type PartnerContact,
  type PartnerContactPayload,
  type PartnerCreatePayload,
  type PartnerEntity,
  type PartnerFormState,
  type PartnerListResult,
  type PartnerTransaction,
  type PartnerUpdatePayload,
  type TransactionListResult,
} from './tradingPartnerModel'

type TradingPartnerPageProps = {
  className: string
  entityLabel: string
  pageTitle: string
  searchPlaceholder: string
  createPrefix: string
  listEntity: (filters?: {
    q?: string
    country?: string
    credit_grade?: string
  }) => Promise<PartnerListResult>
  createEntity: (payload: PartnerCreatePayload) => Promise<PartnerEntity>
  updateEntity: (id: string, payload: PartnerUpdatePayload) => Promise<PartnerEntity>
  deactivateEntity: (id: string) => Promise<PartnerEntity>
  addContact: (id: string, payload: PartnerContactPayload) => Promise<PartnerContact>
  listTransactions: (id: string) => Promise<TransactionListResult>
}

export function TradingPartnerPage({
  className,
  entityLabel,
  pageTitle,
  searchPlaceholder,
  createPrefix,
  listEntity,
  createEntity,
  updateEntity,
  deactivateEntity,
  addContact,
  listTransactions,
}: TradingPartnerPageProps) {
  const [rows, setRows] = useState<PartnerEntity[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([])
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [creditGrade, setCreditGrade] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [entityModalMode, setEntityModalMode] = useState<'create' | 'edit' | null>(null)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [form, setForm] = useState<PartnerFormState>(() => initialPartnerForm(createPrefix))
  const [contactForm, setContactForm] = useState<ContactFormState>(() => initialContactForm())

  const filteredRows = useMemo(
    () => rows.filter((row) => !statusFilter || row.status === statusFilter),
    [rows, statusFilter],
  )

  const selected = useMemo(
    () => filteredRows.find((item) => item.id === selectedId) ?? filteredRows[0] ?? null,
    [filteredRows, selectedId],
  )

  useEffect(() => {
    void loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selected) {
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
  }, [selected?.id, listTransactions, selected])

  async function loadRows() {
    setLoading(true)
    setError('')
    try {
      const result = await listEntity({
        q: search.trim() || undefined,
        country: country.trim() || undefined,
        credit_grade: creditGrade || undefined,
      })
      setRows(result.items)
      setSelectedId((current) => {
        if (current && result.items.some((item) => item.id === current)) return current
        return result.items[0]?.id ?? null
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `${entityLabel}列表加载失败`)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm(initialPartnerForm(createPrefix))
    setEntityModalMode('create')
  }

  function openEdit() {
    if (!selected) return
    setForm(entityToForm(selected))
    setEntityModalMode('edit')
  }

  function openContactModal() {
    if (!selected) return
    setContactForm(initialContactForm())
    setContactModalOpen(true)
  }

  async function submitEntity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    const validationMessage = validatePartnerForm(form, entityModalMode === 'create')
    if (validationMessage) {
      setError(validationMessage)
      return
    }
    setSubmitting(true)
    try {
      if (entityModalMode === 'edit' && selected) {
        const updated = await updateEntity(selected.id, partnerUpdatePayload(form))
        setRows((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        setMessage(`${entityLabel}已保存`)
      } else {
        const created = await createEntity(partnerCreatePayload(form))
        setRows((current) => [created, ...current])
        setSelectedId(created.id)
        setMessage(`${entityLabel}已新增`)
      }
      setEntityModalMode(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `${entityLabel}保存失败`)
    } finally {
      setSubmitting(false)
    }
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setMessage('')
    setError('')
    if (!contactForm.name.trim()) {
      setError('请填写联系人姓名')
      return
    }
    setSubmitting(true)
    try {
      await addContact(selected.id, contactPayload(contactForm))
      setContactModalOpen(false)
      setMessage('联系人已新增')
      await loadRows()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '联系人保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  function confirmDeactivate() {
    if (!selected) return
    Modal.confirm({
      title: `停用${entityLabel} ${selected.cn_name}`,
      content: '停用后不会作为后续业务的默认可选项，历史资料仍然保留。',
      okText: '停用',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const updated = await deactivateEntity(selected.id)
          setRows((current) => current.map((item) => (item.id === updated.id ? updated : item)))
          setMessage(`${entityLabel}已停用`)
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : `${entityLabel}停用失败`)
        }
      },
    })
  }

  return (
    <section className={`masterdata-entity-page ${className}`}>
      <div className="summary-strip" aria-label={`${entityLabel}概览`}>
        <Metric label={entityLabel} value={rows.length} />
        <Metric label="启用" value={rows.filter((item) => item.status === 'active').length} />
        <Metric label="联系人" value={rows.reduce((sum, item) => sum + item.contacts.length, 0)} />
        <Metric label="有信用资料" value={rows.filter((item) => Boolean(item.credit_profile)).length} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid masterdata-entity-grid">
        <section className="workspace-panel list-panel masterdata-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title={`${entityLabel}列表`} />
            <form
              className="inline-filters partner-inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadRows()
              }}
            >
              <div className="inline-filter-fields">
                <label className="inline-filter-search">
                  搜索
                  <Input
                    value={search}
                    placeholder={searchPlaceholder}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label>
                  国家/地区
                  <Input
                    value={country}
                    placeholder="国家/地区"
                    onChange={(event) => setCountry(event.target.value)}
                  />
                </label>
                <label>
                  信用
                  <Select options={creditGradeOptions} value={creditGrade} onChange={setCreditGrade} />
                </label>
                <label>
                  状态
                  <Select options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
                </label>
              </div>
              <div className="inline-filter-actions">
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
                <Button htmlType="button" icon={<RefreshCw size={16} />} onClick={() => void loadRows()}>
                  刷新
                </Button>
                <Button
                  className="toolbar-create-button"
                  htmlType="button"
                  icon={<Plus size={16} />}
                  onClick={openCreate}
                >
                  新增{entityLabel}
                </Button>
              </div>
            </form>
          </div>

          <Table<PartnerEntity>
            columns={[
              {
                title: '编号',
                dataIndex: 'code',
                width: 130,
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '中文名称', dataIndex: 'cn_name' },
              { title: '英文名称', dataIndex: 'en_name' },
              { title: '国家/地区', dataIndex: 'country', width: 120 },
              {
                title: '联系人',
                width: 140,
                render: (_, record) => record.primary_contact?.name ?? record.contacts[0]?.name ?? '未维护',
              },
              {
                title: '状态',
                dataIndex: 'status',
                width: 90,
                render: (value: string) => <StatusTag value={value} />,
              },
            ]}
            dataSource={filteredRows}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selected?.id ? 'selected-row' : '')}
            rowKey="id"
            size="middle"
            onRow={(record) => ({
              onClick: () => setSelectedId(record.id),
            })}
          />
        </section>

        <section className="workspace-panel masterdata-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<UsersRound size={18} />} title={pageTitle} />
            {selected ? (
              <div className="section-actions">
                <Button icon={<Plus size={16} />} onClick={openContactModal}>
                  新增联系人
                </Button>
                <Button icon={<FilePenLine size={16} />} onClick={openEdit}>
                  编辑资料
                </Button>
                <Button danger icon={<Trash2 size={16} />} onClick={confirmDeactivate}>
                  停用
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
                  <dt>国家/地区</dt>
                  <dd>{selected.country}</dd>
                </div>
                <div>
                  <dt>地址</dt>
                  <dd>{selected.address ?? '未维护'}</dd>
                </div>
                <div>
                  <dt>网站</dt>
                  <dd>{selected.website ?? '未维护'}</dd>
                </div>
                <div>
                  <dt>信用等级</dt>
                  <dd>{selected.credit_profile?.credit_grade ?? '未维护'}</dd>
                </div>
                <div>
                  <dt>授信额度</dt>
                  <dd>
                    {selected.credit_profile?.credit_limit
                      ? `${selected.credit_profile.credit_limit} ${selected.credit_profile.currency}`
                      : '无权限或未维护'}
                  </dd>
                </div>
                <div>
                  <dt>账期</dt>
                  <dd>{selected.credit_profile?.payment_terms ?? '未维护'}</dd>
                </div>
                <div>
                  <dt>风险备注</dt>
                  <dd>{selected.credit_profile?.risk_note ?? '无'}</dd>
                </div>
                <div>
                  <dt>负责人</dt>
                  <dd>{selected.owner_user_id}</dd>
                </div>
              </dl>

              <section className="compact-section">
                <PanelTitle icon={<UserRound size={18} />} title="联系人" />
                <div className="contact-card-grid">
                  {selected.contacts.length > 0 ? (
                    selected.contacts.map((contact) => (
                      <article className="contact-card" key={contact.id}>
                        <strong>{contact.name}</strong>
                        <span>{contact.title ?? '未填写职务'}</span>
                        <p>{contact.email ?? '未填写邮箱'}</p>
                        <p>{contact.phone ?? '未填写电话'}</p>
                        {contact.is_primary ? <Tag color="gold">主要联系人</Tag> : null}
                      </article>
                    ))
                  ) : (
                    <div className="module-state">暂无联系人</div>
                  )}
                </div>
              </section>

              <section className="compact-section">
                <PanelTitle icon={<History size={18} />} title="业务记录" />
                <Table<PartnerTransaction>
                  columns={[
                    { title: '来源', dataIndex: 'source_type', width: 120 },
                    { title: '编号', dataIndex: 'source_code', width: 160 },
                    { title: '摘要', dataIndex: 'summary' },
                    { title: '金额', dataIndex: 'amount', width: 120, render: (value) => value ?? '-' },
                    { title: '时间', dataIndex: 'occurred_at', width: 160 },
                  ]}
                  dataSource={transactions}
                  loading={transactionLoading}
                  pagination={false}
                  rowKey={(record) => `${record.source_type}-${record.source_code}-${record.occurred_at}`}
                  size="small"
                />
              </section>
            </>
          ) : null}
        </section>
      </section>

      <Modal
        centered
        footer={null}
        open={Boolean(entityModalMode)}
        title={entityModalMode === 'edit' ? `编辑${entityLabel}` : `新增${entityLabel}`}
        width={1040}
        onCancel={() => setEntityModalMode(null)}
      >
        <form className="record-form entity-modal-form" onSubmit={submitEntity}>
          <div className="entity-modal-grid">
            <label>
              编号
              <Input
                disabled={entityModalMode === 'edit'}
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <label>
              中文名称
              <Input value={form.cn_name} onChange={(event) => setForm({ ...form, cn_name: event.target.value })} />
            </label>
            <label>
              英文名称
              <Input value={form.en_name} onChange={(event) => setForm({ ...form, en_name: event.target.value })} />
            </label>
            <label>
              国家/地区
              <Input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
            </label>
            <label>
              状态
              <Select
                options={formStatusOptions}
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
              />
            </label>
            <label>
              网站
              <Input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
            </label>
            <label className="entity-modal-span">
              地址
              <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
          </div>

          <div className="entity-modal-section">
            <div className="form-divider">信用资料</div>
            <div className="entity-modal-grid">
              <label>
                信用等级
                <Select
                  options={formCreditGradeOptions}
                  value={form.credit_grade}
                  onChange={(value) => setForm({ ...form, credit_grade: value })}
                />
              </label>
              <label>
                授信额度
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.credit_limit}
                  onChange={(event) => setForm({ ...form, credit_limit: event.target.value })}
                />
              </label>
              <label>
                币种
                <Input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} />
              </label>
              <label className="entity-modal-span">
                账期
                <Input
                  value={form.payment_terms}
                  onChange={(event) => setForm({ ...form, payment_terms: event.target.value })}
                />
              </label>
              <label className="entity-modal-span">
                风险备注
                <Input.TextArea
                  rows={3}
                  value={form.risk_note}
                  onChange={(event) => setForm({ ...form, risk_note: event.target.value })}
                />
              </label>
            </div>
          </div>

          {entityModalMode === 'create' ? (
            <div className="entity-modal-section">
              <div className="form-divider">首个联系人</div>
              <div className="entity-modal-grid">
                <label>
                  姓名
                  <Input
                    value={form.contact_name}
                    onChange={(event) => setForm({ ...form, contact_name: event.target.value })}
                  />
                </label>
                <label>
                  职务
                  <Input
                    value={form.contact_title}
                    onChange={(event) => setForm({ ...form, contact_title: event.target.value })}
                  />
                </label>
                <label>
                  邮箱
                  <Input
                    value={form.contact_email}
                    onChange={(event) => setForm({ ...form, contact_email: event.target.value })}
                  />
                </label>
                <label>
                  电话
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
                  主要联系人
                </label>
              </div>
            </div>
          ) : null}

          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setEntityModalMode(null)}>
              取消
            </button>
            <button className="inline-submit" disabled={submitting} type="submit">
              {entityModalMode === 'edit' ? `保存${entityLabel}` : `新增${entityLabel}`}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={contactModalOpen}
        title={`新增${entityLabel}联系人`}
        width={760}
        onCancel={() => setContactModalOpen(false)}
      >
        <form className="record-form entity-modal-form" onSubmit={submitContact}>
          <div className="entity-modal-grid two">
            <label>
              姓名
              <Input
                value={contactForm.name}
                onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
              />
            </label>
            <label>
              职务
              <Input
                value={contactForm.title}
                onChange={(event) => setContactForm({ ...contactForm, title: event.target.value })}
              />
            </label>
            <label>
              邮箱
              <Input
                value={contactForm.email}
                onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
              />
            </label>
            <label>
              电话
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
              设为主要联系人
            </label>
          </div>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setContactModalOpen(false)}>
              取消
            </button>
            <button className="inline-submit" disabled={submitting} type="submit">
              新增联系人
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
      {value === 'active' ? '启用' : '停用'}
    </Tag>
  )
}
