import { Alert, Button, Input, InputNumber, Modal, Select, Table, Tag } from 'antd'
import { ClipboardList, Eye, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  approveStocktake,
  createStocktake,
  getStocktake,
  listStocktakes,
  submitStocktake,
  type CurrentUser,
  type StocktakeOrder,
} from '@/api'
import { t } from '@/app/appI18n'
import { todayInputValue } from '@/app/pages/appHelpers'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import { showError, showSuccess } from '@/shared/errors'
import { ListPageShell, PanelTitle } from '@/shared/ui'
import { useTablePagination } from '@/shared/useTablePagination'

type Props = { currentUser: CurrentUser }

type LineForm = {
  key: string
  product_id: string
  product_code: string
  product_name: string
  unit: string
  actual_quantity: string
}

type CreateForm = {
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  count_date: string
  operator_name: string
  remark: string
  lines: LineForm[]
}

let lineSequence = 0

function newLine(): LineForm {
  lineSequence += 1
  return {
    key: `line-${lineSequence}`,
    product_id: '',
    product_code: '',
    product_name: '',
    unit: 'pcs',
    actual_quantity: '',
  }
}

function createInitialForm(): CreateForm {
  return {
    warehouse_id: '',
    warehouse_name: '',
    location_id: '',
    location_name: '',
    count_date: todayInputValue(),
    operator_name: '',
    remark: '',
    lines: [newLine()],
  }
}

function statusColor(status: string): string {
  if (status === 'approved') return 'green'
  if (status === 'submitted') return 'gold'
  return 'default'
}

function totalDifference(order: StocktakeOrder): number {
  return order.lines.reduce((sum, line) => sum + Number(line.difference_quantity), 0)
}

function differenceText(value: number): string {
  if (value > 0) return `+${value}`
  return String(value)
}

export function StocktakesPage({ currentUser }: Props) {
  const { page, pageSize, setTotal, resetPage, changePage, pagination } = useTablePagination()

  const [items, setItems] = useState<StocktakeOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(createInitialForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [detail, setDetail] = useState<StocktakeOrder | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [submitTarget, setSubmitTarget] = useState<StocktakeOrder | null>(null)
  const [reviewerId, setReviewerId] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [approveTarget, setApproveTarget] = useState<StocktakeOrder | null>(null)
  const [approving, setApproving] = useState(false)

  const canApprove = currentUser.permissions.includes('warehouse:stocktake:approve')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listStocktakes({
        q: keyword || undefined,
        status: statusFilter,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setItems(data.items)
      setTotal(data.total)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t('warehouse.stocktake.list.loadFailed'),
      )
    } finally {
      setLoading(false)
    }
  }, [keyword, page, pageSize, setTotal, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = useCallback(async (orderId: string) => {
    setDetailLoading(true)
    try {
      const data = await getStocktake(orderId)
      setDetail(data)
    } catch (caught) {
      showError(caught, t('warehouse.stocktake.list.loadFailed'))
    } finally {
      setDetailLoading(false)
    }
  }, [])

  function patchLine(key: string, patch: Partial<LineForm>) {
    setCreateForm((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    }))
  }

  async function handleCreate() {
    const form = createForm
    if (
      !form.warehouse_id.trim() ||
      !form.warehouse_name.trim() ||
      !form.location_id.trim() ||
      !form.location_name.trim() ||
      !form.count_date ||
      !form.operator_name.trim()
    ) {
      setCreateError(t('common.error.validation'))
      return
    }
    if (form.lines.length === 0) {
      setCreateError(t('warehouse.stocktake.create.emptyLines'))
      return
    }
    for (const line of form.lines) {
      if (!line.product_name.trim()) {
        setCreateError(t('warehouse.stocktake.create.productRequired'))
        return
      }
      if (!line.unit.trim()) {
        setCreateError(t('warehouse.stocktake.create.actualRequired'))
        return
      }
      if (!line.actual_quantity.trim()) {
        setCreateError(t('warehouse.stocktake.create.actualRequired'))
        return
      }
    }
    setCreating(true)
    setCreateError(null)
    try {
      await createStocktake({
        warehouse_id: form.warehouse_id.trim(),
        warehouse_name: form.warehouse_name.trim(),
        location_id: form.location_id.trim(),
        location_name: form.location_name.trim(),
        count_date: form.count_date,
        operator_name: form.operator_name.trim(),
        remark: form.remark.trim() || null,
        lines: form.lines.map((line) => ({
          product_id: line.product_id.trim() || null,
          product_code: line.product_code.trim() || null,
          product_name: line.product_name.trim(),
          unit: line.unit.trim(),
          actual_quantity: line.actual_quantity,
        })),
      })
      showSuccess(t('warehouse.stocktake.create.success'))
      setCreateOpen(false)
      setCreateForm(createInitialForm())
      resetPage()
      await load()
    } catch (caught) {
      setCreateError(
        caught instanceof Error
          ? caught.message
          : t('warehouse.stocktake.create.failed'),
      )
    } finally {
      setCreating(false)
    }
  }

  async function handleSubmit() {
    if (!submitTarget) return
    if (!reviewerId) {
      setSubmitError(t('warehouse.stocktake.submit.reviewerRequired'))
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const updated = await submitStocktake(submitTarget.id, { reviewer_id: reviewerId })
      showSuccess(t('warehouse.stocktake.submit.success'))
      setSubmitTarget(null)
      setReviewerId('')
      setDetail(updated)
      await load()
    } catch (caught) {
      setSubmitError(
        caught instanceof Error
          ? caught.message
          : t('warehouse.stocktake.submit.failed'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove() {
    if (!approveTarget) return
    setApproving(true)
    try {
      const updated = await approveStocktake(approveTarget.id, {
        approved_at: todayInputValue(),
      })
      showSuccess(t('warehouse.stocktake.approve.success'))
      setApproveTarget(null)
      setDetail(updated)
      await load()
    } catch (caught) {
      showError(caught, t('warehouse.stocktake.approve.failed'))
    } finally {
      setApproving(false)
    }
  }

  const detailDifference = useMemo(
    () => (detail ? totalDifference(detail) : 0),
    [detail],
  )

  return (
    <ListPageShell
      icon={<ClipboardList size={18} />}
      title={t('warehouse.stocktake.title')}
      toolbar={
        <div className="toolbar-actions">
          <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)} type="primary">
            {t('warehouse.stocktake.list.create')}
          </Button>
        </div>
      }
    >
      <p className="panel-subtitle">{t('warehouse.stocktake.subtitle')}</p>

      <div className="list-filters">
        <Input
          allowClear
          aria-label={t('warehouse.stocktake.list.searchPlaceholder')}
          placeholder={t('warehouse.stocktake.list.searchPlaceholder')}
          prefix={<Search size={16} />}
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          onPressEnter={() => {
            resetPage()
            setKeyword(keywordInput.trim())
          }}
        />
        <Select
          allowClear
          aria-label={t('warehouse.stocktake.list.statusFilter')}
          placeholder={t('warehouse.stocktake.list.allStatuses')}
          value={statusFilter}
          onChange={(value) => {
            resetPage()
            setStatusFilter(value)
          }}
          options={[
            { value: 'draft', label: t('warehouse.stocktake.status.draft') },
            { value: 'submitted', label: t('warehouse.stocktake.status.submitted') },
            { value: 'approved', label: t('warehouse.stocktake.status.approved') },
          ]}
        />
        <Button
          onClick={() => {
            resetPage()
            setKeyword(keywordInput.trim())
          }}
        >
          {t('warehouse.stocktake.list.search')}
        </Button>
      </div>

      {error ? <Alert message={error} showIcon type="error" /> : null}

      <Table<StocktakeOrder>
        dataSource={items}
        loading={loading || detailLoading}
        locale={{ emptyText: t('warehouse.stocktake.empty') }}
        pagination={{
          ...pagination,
          onChange: (nextPage, nextPageSize) => changePageTo(nextPage, nextPageSize),
        }}
        rowKey="id"
        columns={[
          { title: t('warehouse.stocktake.field.code'), dataIndex: 'code' },
          {
            title: t('warehouse.stocktake.field.warehouse'),
            render: (_, order) => `${order.warehouse_name} / ${order.location_name}`,
          },
          { title: t('warehouse.stocktake.field.countDate'), dataIndex: 'count_date' },
          {
            title: t('warehouse.stocktake.field.lineCount'),
            render: (_, order) => order.lines.length,
          },
          {
            title: t('warehouse.stocktake.field.difference'),
            render: (_, order) => differenceText(totalDifference(order)),
          },
          {
            title: t('warehouse.stocktake.field.status'),
            render: (_, order) => (
              <Tag color={statusColor(order.status)}>
                {t(`warehouse.stocktake.status.${order.status}` as never)}
              </Tag>
            ),
          },
          { title: t('warehouse.stocktake.field.operator'), dataIndex: 'operator_name' },
          {
            title: t('warehouse.stocktake.field.reviewer'),
            render: (_, order) => order.reviewer_name ?? '-',
          },
          {
            title: '',
            render: (_, order) => (
              <Button
                icon={<Eye size={15} />}
                onClick={() => void openDetail(order.id)}
                size="small"
                type="link"
              >
                {t('warehouse.stocktake.action.view')}
              </Button>
            ),
          },
        ]}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        cancelText={t('warehouse.stocktake.action.cancel')}
        confirmLoading={creating}
        okText={t('warehouse.stocktake.action.confirmCreate')}
        onCancel={() => {
          setCreateOpen(false)
          setCreateForm(createInitialForm())
          setCreateError(null)
        }}
        onOk={() => void handleCreate()}
        open={createOpen}
        title={t('warehouse.stocktake.create.title')}
        width={880}
      >
        <div className="form-grid">
          <label>
            <span className="required-label">{t('warehouse.stocktake.create.warehouseId')}</span>
            <Input
              value={createForm.warehouse_id}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, warehouse_id: event.target.value }))
              }
            />
          </label>
          <label>
            <span className="required-label">{t('warehouse.stocktake.create.warehouseName')}</span>
            <Input
              value={createForm.warehouse_name}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, warehouse_name: event.target.value }))
              }
            />
          </label>
          <label>
            <span className="required-label">{t('warehouse.stocktake.create.locationId')}</span>
            <Input
              value={createForm.location_id}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, location_id: event.target.value }))
              }
            />
          </label>
          <label>
            <span className="required-label">{t('warehouse.stocktake.create.locationName')}</span>
            <Input
              value={createForm.location_name}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, location_name: event.target.value }))
              }
            />
          </label>
          <label>
            <span className="required-label">{t('warehouse.stocktake.create.countDate')}</span>
            <Input
              type="date"
              value={createForm.count_date}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, count_date: event.target.value }))
              }
            />
          </label>
          <label>
            <span className="required-label">{t('warehouse.stocktake.create.operator')}</span>
            <Input
              value={createForm.operator_name}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, operator_name: event.target.value }))
              }
            />
          </label>
          <label>
            <span>{t('warehouse.stocktake.create.remark')}</span>
            <Input
              value={createForm.remark}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, remark: event.target.value }))
              }
            />
          </label>
        </div>

        <PanelTitle
          icon={<ClipboardList size={16} />}
          title={t('warehouse.stocktake.create.linesSection')}
        />
        <div className="stocktake-lines">
          {createForm.lines.map((line) => (
            <div className="stocktake-line" key={line.key}>
              <Input
                aria-label={t('warehouse.stocktake.field.product')}
                placeholder={t('warehouse.stocktake.field.product')}
                value={line.product_name}
                onChange={(event) => patchLine(line.key, { product_name: event.target.value })}
              />
              <Input
                aria-label={t('warehouse.stocktake.field.productCode')}
                placeholder={t('warehouse.stocktake.field.productCode')}
                value={line.product_code}
                onChange={(event) => patchLine(line.key, { product_code: event.target.value })}
              />
              <Input
                aria-label={t('warehouse.stocktake.field.unit')}
                placeholder={t('warehouse.stocktake.field.unit')}
                value={line.unit}
                onChange={(event) => patchLine(line.key, { unit: event.target.value })}
              />
              <InputNumber
                aria-label={t('warehouse.stocktake.field.actualQuantity')}
                min={0}
                placeholder={t('warehouse.stocktake.field.actualQuantity')}
                value={line.actual_quantity === '' ? null : Number(line.actual_quantity)}
                onChange={(value) =>
                  patchLine(line.key, {
                    actual_quantity: value === null ? '' : String(value),
                  })
                }
              />
              <Button
                disabled={createForm.lines.length <= 1}
                icon={<Trash2 size={15} />}
                onClick={() =>
                  setCreateForm((current) => ({
                    ...current,
                    lines: current.lines.filter((item) => item.key !== line.key),
                  }))
                }
                type="text"
              />
            </div>
          ))}
          <Button
            icon={<Plus size={15} />}
            onClick={() =>
              setCreateForm((current) => ({ ...current, lines: [...current.lines, newLine()] }))
            }
            type="dashed"
          >
            {t('warehouse.stocktake.action.addLine')}
          </Button>
        </div>
        {createError ? <Alert message={createError} showIcon type="error" /> : null}
      </Modal>

      <Modal
        footer={null}
        onCancel={() => setDetail(null)}
        open={detail !== null}
        title={detail ? `${detail.code}` : ''}
        width={880}
      >
        {detail ? (
          <div>
            <div className="form-grid">
              <div>
                {t('warehouse.stocktake.field.warehouse')}：{detail.warehouse_name} /{' '}
                {detail.location_name}
              </div>
              <div>
                {t('warehouse.stocktake.field.countDate')}：{detail.count_date}
              </div>
              <div>
                {t('warehouse.stocktake.field.status')}：
                <Tag color={statusColor(detail.status)}>
                  {t(`warehouse.stocktake.status.${detail.status}` as never)}
                </Tag>
              </div>
              <div>
                {t('warehouse.stocktake.field.operator')}：{detail.operator_name}
              </div>
              <div>
                {t('warehouse.stocktake.field.reviewer')}：{detail.reviewer_name ?? '-'}
              </div>
              <div>
                {t('warehouse.stocktake.field.difference')}：
                {differenceText(detailDifference)}
              </div>
            </div>
            <Table
              dataSource={detail.lines}
              pagination={false}
              rowKey="id"
              size="small"
              columns={[
                { title: t('warehouse.stocktake.field.product'), dataIndex: 'product_name' },
                { title: t('warehouse.stocktake.field.productCode'), dataIndex: 'product_code' },
                { title: t('warehouse.stocktake.field.unit'), dataIndex: 'unit' },
                { title: t('warehouse.stocktake.field.bookQuantity'), dataIndex: 'book_quantity' },
                {
                  title: t('warehouse.stocktake.field.actualQuantity'),
                  dataIndex: 'actual_quantity',
                },
                {
                  title: t('warehouse.stocktake.field.difference'),
                  dataIndex: 'difference_quantity',
                },
              ]}
            />
            <div className="toolbar-actions">
              {detail.status === 'draft' ? (
                <Button
                  onClick={() => {
                    setSubmitTarget(detail)
                    setReviewerId('')
                    setSubmitError(null)
                  }}
                  type="primary"
                >
                  {t('warehouse.stocktake.action.submit')}
                </Button>
              ) : null}
              {detail.status === 'submitted' &&
              canApprove &&
              detail.reviewer_id === currentUser.id ? (
                <Button onClick={() => setApproveTarget(detail)} type="primary">
                  {t('warehouse.stocktake.action.approve')}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        confirmLoading={submitting}
        okText={t('warehouse.stocktake.action.confirmSubmit')}
        onCancel={() => setSubmitTarget(null)}
        onOk={() => void handleSubmit()}
        open={submitTarget !== null}
        title={t('warehouse.stocktake.submit.title')}
      >
        <ApprovalAssigneeSelect
          currentUserId={currentUser.id}
          label={t('warehouse.stocktake.submit.reviewer')}
          onChange={(value) => setReviewerId(value)}
          requiredPermission="warehouse:stocktake:approve"
          value={reviewerId}
        />
        {submitError ? <Alert message={submitError} showIcon type="error" /> : null}
      </Modal>

      <Modal
        confirmLoading={approving}
        okText={t('warehouse.stocktake.action.confirmApprove')}
        onCancel={() => setApproveTarget(null)}
        onOk={() => void handleApprove()}
        open={approveTarget !== null}
        title={t('warehouse.stocktake.approve.title')}
      >
        <p>{t('warehouse.stocktake.approve.tip')}</p>
      </Modal>
    </ListPageShell>
  )

  function changePageTo(nextPage: number, nextPageSize: number) {
    changePage(nextPage, nextPageSize)
  }
}
