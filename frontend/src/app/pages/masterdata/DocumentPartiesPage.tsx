import { Alert, Button, Checkbox, Input, Modal, Select, Table, Tag } from 'antd'
import {
  Building2,
  FilePenLine,
  Landmark,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import {
  createDocumentParty,
  deactivateDocumentParty,
  listDocumentParties,
  updateDocumentParty,
  type DocumentParty,
  type DocumentPartyCreatePayload,
  type DocumentPartyUpdatePayload,
} from '../../../api'
import { showError, showWarningDialog } from '../../../shared/errors'
import { Metric, PanelTitle } from '../../../shared/ui'

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

const documentPartyTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'consignee', label: '收货人' },
  { value: 'notify_party', label: '通知人' },
  { value: 'issuing_bank', label: '开证行' },
  { value: 'bill_notify_party', label: '提单通知人' },
]

const documentPartyFormTypeOptions = documentPartyTypeOptions.filter((option) => option.value)

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
]

const formStatusOptions = statusOptions.filter((option) => option.value)

export function DocumentPartiesPage() {
  const [parties, setParties] = useState<DocumentParty[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState<DocumentPartyFormState>(() => initialDocumentPartyForm())

  const filteredParties = useMemo(
    () => parties.filter((item) => !statusFilter || item.status === statusFilter),
    [parties, statusFilter],
  )

  const selectedParty = useMemo(
    () => filteredParties.find((item) => item.id === selectedId) ?? filteredParties[0] ?? null,
    [filteredParties, selectedId],
  )

  useEffect(() => {
    void loadParties()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadParties() {
    setLoading(true)
    setError('')
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
      showError(caught, '单证资料加载失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm(initialDocumentPartyForm())
    setModalMode('create')
  }

  function openEdit() {
    if (!selectedParty) return
    setForm(documentPartyToForm(selectedParty))
    setModalMode('edit')
  }

  async function submitParty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    const validationMessage = validateDocumentPartyForm(form, modalMode === 'create')
    if (validationMessage) {
      showWarningDialog(validationMessage)
      return
    }
    setSubmitting(true)
    try {
      if (modalMode === 'edit' && selectedParty) {
        const updated = await updateDocumentParty(selectedParty.id, documentPartyUpdatePayload(form))
        setParties((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        setMessage('单证资料已保存')
      } else {
        const created = await createDocumentParty(documentPartyPayload(form))
        setParties((current) => [created, ...current])
        setSelectedId(created.id)
        setMessage('单证资料已新增')
      }
      setModalMode(null)
    } catch (caught) {
      showError(caught, '单证资料保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  function confirmDeactivate() {
    if (!selectedParty) return
    Modal.confirm({
      title: `停用单证资料 ${selectedParty.display_name}`,
      content: '停用后不会在业务单据中作为默认单证方，历史记录仍然保留。',
      okText: '停用',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const updated = await deactivateDocumentParty(selectedParty.id)
          setParties((current) => current.map((item) => (item.id === updated.id ? updated : item)))
          setMessage('单证资料已停用')
        } catch (caught) {
          showError(caught, '单证资料停用失败')
        }
      },
    })
  }

  return (
    <section className="masterdata-page document-party-page masterdata-entity-page">
      <div className="summary-strip" aria-label="单证资料概览">
        <Metric label="单证资料" value={parties.length} />
        <Metric label="默认资料" value={parties.filter((item) => item.is_default).length} />
        <Metric label="收货人" value={parties.filter((item) => item.party_type === 'consignee').length} />
        <Metric label="开证行" value={parties.filter((item) => item.party_type === 'issuing_bank').length} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid masterdata-entity-grid">
        <section className="workspace-panel list-panel masterdata-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="单证资料列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadParties()
              }}
            >
              <label className="inline-filter-search">
                搜索
                <Input
                  value={search}
                  placeholder="编号 / 名称 / 客户 / 银行 / 联系人"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                类型
                <Select options={documentPartyTypeOptions} value={typeFilter} onChange={setTypeFilter} />
              </label>
              <label className="inline-filter-compact">
                状态
                <Select options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button icon={<Plus size={16} />} onClick={openCreate}>
                新增单证资料
              </Button>
            </form>
          </div>

          <Table<DocumentParty>
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
              { title: '名称', dataIndex: 'display_name' },
              {
                title: '类型',
                dataIndex: 'party_type',
                width: 120,
                render: documentPartyTypeLabel,
              },
              { title: '客户', dataIndex: 'customer_name', render: (value) => value ?? '通用' },
              { title: '国家/地区', dataIndex: 'country', width: 120 },
              {
                title: '状态',
                dataIndex: 'status',
                width: 90,
                render: (value: string) => <StatusTag value={value} />,
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
        </section>

        <section className="workspace-panel masterdata-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Building2 size={18} />} title="单证资料明细" />
            {selectedParty ? (
              <div className="section-actions">
                <Button icon={<FilePenLine size={16} />} onClick={openEdit}>
                  编辑资料
                </Button>
                <Button danger icon={<Trash2 size={16} />} onClick={confirmDeactivate}>
                  停用
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
                  {selectedParty.is_default ? <Tag icon={<Star size={12} />} color="gold">默认</Tag> : null}
                  <StatusTag value={selectedParty.status} />
                </div>
              </div>

              <dl className="detail-list">
                <div>
                  <dt>关联客户</dt>
                  <dd>{selectedParty.customer_name ?? '通用资料'}</dd>
                </div>
                <div>
                  <dt>国家/地区</dt>
                  <dd>{selectedParty.country}</dd>
                </div>
                <div>
                  <dt>联系人</dt>
                  <dd>{selectedParty.contact_person ?? '未维护'}</dd>
                </div>
                <div>
                  <dt>联系方式</dt>
                  <dd>{selectedParty.email ?? selectedParty.phone ?? '未维护'}</dd>
                </div>
                <div>
                  <dt>地址</dt>
                  <dd>{selectedParty.address ?? '未维护'}</dd>
                </div>
                <div>
                  <dt>税号</dt>
                  <dd>{selectedParty.tax_id ?? '未维护'}</dd>
                </div>
                <div>
                  <dt>备注</dt>
                  <dd>{selectedParty.remarks ?? '无'}</dd>
                </div>
                <div>
                  <dt>负责人</dt>
                  <dd>{selectedParty.owner_user_id}</dd>
                </div>
              </dl>

              <section className="compact-section bank-card">
                <PanelTitle icon={<Landmark size={18} />} title="银行资料" />
                <dl className="detail-list">
                  <div>
                    <dt>银行名称</dt>
                    <dd>{selectedParty.bank_name ?? '未维护'}</dd>
                  </div>
                  <div>
                    <dt>SWIFT</dt>
                    <dd>{selectedParty.swift_code ?? '未维护'}</dd>
                  </div>
                  <div>
                    <dt>账号</dt>
                    <dd>{selectedParty.account_no ?? '未维护'}</dd>
                  </div>
                </dl>
              </section>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Building2 size={28} />
              <strong>暂无单证资料</strong>
              <span>请选择上方列表中的单证资料查看详情</span>
            </div>
          )}
        </section>
      </section>

      <Modal
        centered
        footer={null}
        open={Boolean(modalMode)}
        title={modalMode === 'edit' ? '编辑单证资料' : '新增单证资料'}
        width={1040}
        onCancel={() => setModalMode(null)}
      >
        <form className="record-form entity-modal-form" onSubmit={submitParty}>
          <div className="entity-modal-grid">
            <label>
              编号
              <Input
                disabled={modalMode === 'edit'}
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <label>
              类型
              <Select
                options={documentPartyFormTypeOptions}
                value={form.party_type}
                onChange={(value) => setForm({ ...form, party_type: value })}
              />
            </label>
            <label>
              状态
              <Select
                options={formStatusOptions}
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
              />
            </label>
            <label className="entity-modal-span">
              显示名称
              <Input
                value={form.display_name}
                onChange={(event) => setForm({ ...form, display_name: event.target.value })}
              />
            </label>
            <label>
              关联客户 ID
              <Input
                value={form.customer_id}
                onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
              />
            </label>
            <label>
              关联客户名称
              <Input
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </label>
            <label>
              国家/地区
              <Input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
            </label>
            <label className="entity-modal-span">
              地址
              <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
          </div>

          <div className="entity-modal-section">
            <div className="form-divider">联系人与银行资料</div>
            <div className="entity-modal-grid">
              <label>
                联系人
                <Input
                  value={form.contact_person}
                  onChange={(event) => setForm({ ...form, contact_person: event.target.value })}
                />
              </label>
              <label>
                邮箱
                <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>
                电话
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
              <label>
                银行名称
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
                账号
                <Input
                  value={form.account_no}
                  onChange={(event) => setForm({ ...form, account_no: event.target.value })}
                />
              </label>
              <label>
                税号
                <Input value={form.tax_id} onChange={(event) => setForm({ ...form, tax_id: event.target.value })} />
              </label>
              <label className="checkbox-label">
                <Checkbox
                  checked={form.is_default}
                  onChange={(event: CheckboxChangeEvent) =>
                    setForm({ ...form, is_default: event.target.checked })
                  }
                />
                设为默认资料
              </label>
              <label className="entity-modal-span">
                备注
                <Input.TextArea
                  rows={4}
                  value={form.remarks}
                  onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setModalMode(null)}>
              取消
            </button>
            <button className="inline-submit" disabled={submitting} type="submit">
              {modalMode === 'edit' ? '保存单证资料' : '新增单证资料'}
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

function initialDocumentPartyForm(): DocumentPartyFormState {
  return {
    code: `DP-${Date.now().toString().slice(-6)}`,
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
  if (requireCode && !form.code.trim()) return '请填写编号'
  if (!form.display_name.trim()) return '请填写显示名称'
  if (!form.country.trim()) return '请填写国家/地区'
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

function documentPartyTypeLabel(value: string): string {
  return documentPartyTypeOptions.find((item) => item.value === value)?.label ?? value
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
