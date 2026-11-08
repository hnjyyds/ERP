import {
  Alert,
  Button,
  Descriptions as _Descriptions,
  Input,
  Modal,
  Skeleton as _Skeleton,
  Table,
  Tag as _Tag,
} from 'antd'
import {
  ArrowLeft,
  LayoutDashboard,
  Plus,
  Search,
  Warehouse,
  CheckCircle2,
  Package,
  PackagePlus,
  Send,
} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  approveOutboundOrder,
  cancelOutboundOrder,
  generateOutboundOrderFromPlan,
  listOutboundOrders,
  submitOutboundOrder,
  type CurrentUser,
  type InventoryBalanceSummary,
  type OutboundOrder,
  type OutboundOrderApprovePayload,
  type OutboundOrderGeneratePayload,
  type OutboundOrderListSummary,
  InventoryBalance,
  InventoryLedger,
  OutboundPlan,
  listOutboundPlans,
  listInventoryBalances,
  listInventoryLedgers,
} from '@/api'
import { warehouseOutboundOrderPath, moduleDetailPath } from '@/app/routes'
import { FormModal, FormSelect, ListPageShell, Metric, PanelTitle } from '@/shared/ui'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { showError } from '@/shared/errors'
import {
  outboundOrderStatusOptions,
  outboundOrderModeOptions,
  outboundPlanTypeOptions,
  outboundPlanStatusOptions,
  outboundPlanSourceTypeOptions,
} from '@/shared/formOptions'
import {
  canApproveAssignedRecord,
  formatDate,
  formatMoney as _formatMoney,
  formatQuantity as _formatQuantity,
  nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
  trimDecimal,
} from '@/app/pages/appHelpers'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import { t } from '@/app/appI18n'

function outboundPlanStatusLabel(value: string): string {
  const option = outboundPlanStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function outboundPlanTypeLabel(value: string): string {
  const option = outboundPlanTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function outboundPlanSourceTypeLabel(value: string): string {
  const option = outboundPlanSourceTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function stockStatusLabel(value: string): string {
  if (value === 'available') return t('warehouse.outboundOrder.detail.stockStatusAvailable')
  if (value === 'pending_inspection')
    return t('warehouse.outboundOrder.detail.stockStatusPendingInspection')
  return value
}

function inventoryDirectionLabel(value: string): string {
  if (value === 'in') return t('warehouse.outboundOrder.detail.directionIn')
  if (value === 'out') return t('warehouse.outboundOrder.detail.directionOut')
  return value
}

type OutboundOrderFormState = {
  plan_id: string
  outbound_mode: string
  outbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  exception_reason: string
}

type OutboundOrderApprovalFormState = {
  reviewer_name: string
  approved_at: string
  allow_negative: boolean
}

function initialOutboundOrderForm(): OutboundOrderFormState {
  return {
    plan_id: '',
    outbound_mode: 'formal',
    outbound_at: todayInputValue(),
    warehouse_id: 'wh-ningbo',
    warehouse_name: '',
    location_id: 'loc-fg-01',
    location_name: '',
    operator_name: '',
    exception_reason: '',
  }
}

function initialOutboundOrderApprovalForm(): OutboundOrderApprovalFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
    allow_negative: false,
  }
}

function outboundOrderFormForPlan(
  plan: OutboundPlan,
  current: OutboundOrderFormState,
): OutboundOrderFormState {
  return {
    ...current,
    plan_id: plan.id,
    outbound_at: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? 'wh-ningbo',
    warehouse_name: plan.warehouse_name ?? '',
    location_id: plan.location_id ?? 'loc-fg-01',
    location_name: plan.location_name ?? '',
    operator_name: plan.operator_name ?? '',
  }
}

function outboundOrderToForm(order: OutboundOrder): OutboundOrderFormState {
  return {
    plan_id: order.plan_id,
    outbound_mode: order.outbound_mode,
    outbound_at: order.outbound_at,
    warehouse_id: order.warehouse_id,
    warehouse_name: order.warehouse_name,
    location_id: order.location_id,
    location_name: order.location_name,
    operator_name: order.operator_name,
    exception_reason: order.exception_reason ?? '',
  }
}

function outboundOrderPayload(form: OutboundOrderFormState): OutboundOrderGeneratePayload {
  return {
    plan_id: form.plan_id.trim(),
    outbound_mode: form.outbound_mode,
    outbound_at: form.outbound_at,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    operator_name: form.operator_name.trim(),
    exception_reason: emptyToNull(form.exception_reason),
    lines: [],
  }
}

function outboundOrderApprovePayload(
  form: OutboundOrderApprovalFormState,
): OutboundOrderApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
    allow_negative: form.allow_negative,
  }
}

function outboundOrderModeLabel(value: string): string {
  const option = outboundOrderModeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function outboundOrderStatusLabel(value: string): string {
  const option = outboundOrderStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function outboundOrderTotalQuantity(order: OutboundOrder): number {
  return order.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
}

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function OutboundOrdersPage({ currentUser, detailId, onNavigate }: Props) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const [orders, setOrders] = useState<OutboundOrder[]>([])
  const [summary, setSummary] = useState<OutboundOrderListSummary>({
    draft_count: 0,
    submitted_count: 0,
    approved_count: 0,
    outbound_quantity: '0',
  })
  const [inventorySummary, setInventorySummary] = useState<InventoryBalanceSummary>({
    available_quantity: '0',
    pending_inspection_quantity: '0',
  })
  const [outboundPlans, setOutboundPlans] = useState<OutboundPlan[]>([])
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([])
  const [inventoryLedgers, setInventoryLedgers] = useState<InventoryLedger[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => urlQuery.params.get('status') ?? '')
  const [modeFilter, setModeFilter] = useState(() => urlQuery.params.get('mode') ?? '')
  const [typeFilter, setTypeFilter] = useState(() => urlQuery.params.get('type') ?? '')
  const [customerFilter, setCustomerFilter] = useState(() => urlQuery.params.get('customer') ?? '')
  const [sourceIdFilter, setSourceIdFilter] = useState(() => urlQuery.params.get('source_id') ?? '')
  const [inventorySearch, setInventorySearch] = useState('')
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )
  const [form, setForm] = useState<OutboundOrderFormState>(() => initialOutboundOrderForm())
  const [reviewerId, setReviewerId] = useState('')
  const [approvalForm, setApprovalForm] = useState<OutboundOrderApprovalFormState>(() =>
    initialOutboundOrderApprovalForm(),
  )
  const [outboundOrderModalOpen, setOutboundOrderModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')

  const selectedOrder = useMemo(() => {
    if (detailId) return orders.find((item) => item.id === detailId) ?? null
    return orders.find((item) => item.id === selectedOrderId) ?? orders[0] ?? null
  }, [detailId, orders, selectedOrderId])

  useEffect(() => {
    void loadOutboundOrders()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextFilters = {
      q: urlQuery.params.get('q') ?? '',
      status: urlQuery.params.get('status') ?? '',
      mode: urlQuery.params.get('mode') ?? '',
      type: urlQuery.params.get('type') ?? '',
      customer: urlQuery.params.get('customer') ?? '',
      sourceId: urlQuery.params.get('source_id') ?? '',
    }
    setSearch(nextFilters.q)
    setStatusFilter(nextFilters.status)
    setModeFilter(nextFilters.mode)
    setTypeFilter(nextFilters.type)
    setCustomerFilter(nextFilters.customer)
    setSourceIdFilter(nextFilters.sourceId)
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadOutboundOrders(undefined, undefined, undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    if (!selectedOrder) return
    setForm(outboundOrderToForm(selectedOrder))
    setApprovalForm((current) => ({
      ...current,
      reviewer_name: selectedOrder.reviewer_name ?? '',
      approved_at: selectedOrder.approved_at ?? selectedOrder.outbound_at,
    }))
    setReviewerId(selectedOrder.reviewer_id ?? '')
  }, [selectedOrder?.id, selectedOrder?.status])

  useEffect(() => {
    if (detailId && orders.length > 0 && !orders.some((item) => item.id === detailId)) {
      onNavigate(warehouseOutboundOrderPath)
    }
  }, [detailId, onNavigate, orders])

  async function loadOutboundOrders(
    preferredOrderId?: string,
    preferredOrder?: OutboundOrder,
    inventoryQuery?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: {
      q: string
      status: string
      mode: string
      type: string
      customer: string
      sourceId: string
    },
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    const resolvedQ = filtersOverride?.q ?? search
    const resolvedStatus = filtersOverride?.status ?? statusFilter
    const resolvedMode = filtersOverride?.mode ?? modeFilter
    const resolvedType = filtersOverride?.type ?? typeFilter
    const resolvedCustomer = filtersOverride?.customer ?? customerFilter
    const resolvedSourceId = filtersOverride?.sourceId ?? sourceIdFilter
    setLoading(true)
    try {
      const [orderResult, planOptions] = await Promise.all([
        listOutboundOrders({
          q: preferredOrder?.code ?? (resolvedQ.trim() || undefined),
          status: resolvedStatus || undefined,
          outbound_mode: resolvedMode || undefined,
          outbound_type: resolvedType || undefined,
          customer_id: resolvedCustomer.trim() || undefined,
          source_id: resolvedSourceId.trim() || undefined,
          limit: resolvedPageSize,
          offset: (resolvedPage - 1) * resolvedPageSize,
        }),
        loadOutboundOrderPlanOptions(),
      ])
      setTotal(orderResult.total)
      setSummary(orderResult.summary)
      if (orderResult.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadOutboundOrders(
          preferredOrderId,
          preferredOrder,
          inventoryQuery,
          prevPage,
          resolvedPageSize,
          filtersOverride,
        )
        return
      }
      const nextOrders = preferredOrder
        ? [preferredOrder, ...orderResult.items.filter((item) => item.id !== preferredOrder.id)]
        : orderResult.items
      const nextOrderId =
        preferredOrderId ??
        (nextOrders.some((item) => item.id === selectedOrderId) ? selectedOrderId : null) ??
        nextOrders[0]?.id ??
        null
      const nextOrder = nextOrders.find((item) => item.id === nextOrderId) ?? null
      setOrders(nextOrders)
      setOutboundPlans(planOptions)
      setSelectedOrderId(nextOrderId)
      if (!nextOrder && planOptions[0]) {
        setForm((current) => outboundOrderFormForPlan(planOptions[0], current))
      }
      await loadOutboundInventorySnapshot(nextOrder, inventoryQuery)
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadOutboundOrderPlanOptions(): Promise<OutboundPlan[]> {
    const [allPlans, scheduledPlans, plannedPlans] = await Promise.all([
      listOutboundPlans({}),
      listOutboundPlans({ status: 'scheduled' }),
      listOutboundPlans({ status: 'planned' }),
    ])
    const planById = new Map<string, OutboundPlan>()
    for (const plan of [...scheduledPlans.items, ...plannedPlans.items, ...allPlans.items]) {
      planById.set(plan.id, plan)
    }
    return [...planById.values()]
  }

  async function loadOutboundInventorySnapshot(
    order: OutboundOrder | null = selectedOrder,
    inventoryQuery?: string,
  ) {
    const query =
      inventoryQuery ??
      (inventorySearch.trim() ||
        search.trim() ||
        order?.lines[0]?.product_code ||
        order?.lines[0]?.product_name ||
        undefined)
    const [balances, ledgers] = await Promise.all([
      listInventoryBalances({ q: query, limit: 50 }),
      listInventoryLedgers({
        q: query,
        source_id: order?.id,
      }),
    ])
    setInventoryBalances(balances.items)
    setInventorySummary(balances.summary)
    setInventoryLedgers(ledgers.items)
  }

  async function refreshOutboundInventorySnapshot(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    try {
      await loadOutboundInventorySnapshot(selectedOrder)
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.message.inventoryLoadFailed'))
    }
  }

  function handleOutboundOrderPlanChange(planId: string) {
    const plan = outboundPlans.find((item) => item.id === planId)
    setForm((current) =>
      plan ? outboundOrderFormForPlan(plan, current) : { ...current, plan_id: planId },
    )
  }

  function upsertOutboundOrder(order: OutboundOrder) {
    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id)
      return exists
        ? current.map((item) => (item.id === order.id ? order : item))
        : [order, ...current]
    })
    setSelectedOrderId(order.id)
  }

  function openOutboundOrderDetail(order: OutboundOrder) {
    setSelectedOrderId(order.id)
    onNavigate(moduleDetailPath(warehouseOutboundOrderPath, order.id))
  }

  function openOutboundOrderModal() {
    setForm(
      selectedOrder
        ? outboundOrderToForm(selectedOrder)
        : outboundPlans[0]
          ? outboundOrderFormForPlan(outboundPlans[0], initialOutboundOrderForm())
          : initialOutboundOrderForm(),
    )
    setApprovalForm(
      selectedOrder
        ? {
            reviewer_name: selectedOrder.reviewer_name ?? '',
            approved_at: selectedOrder.approved_at ?? selectedOrder.outbound_at,
            allow_negative: false,
          }
        : initialOutboundOrderApprovalForm(),
    )
    setReviewerId(selectedOrder?.reviewer_id ?? '')
    setOutboundOrderModalOpen(true)
  }

  function stopAndOpenOutboundOrderDetail(event: MouseEvent<HTMLElement>, order: OutboundOrder) {
    event.stopPropagation()
    openOutboundOrderDetail(order)
  }

  async function generateOutboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const order = await generateOutboundOrderFromPlan(outboundOrderPayload(form))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      const nextFilters = {
        q: order.code,
        status: '',
        mode: modeFilter,
        type: order.outbound_type,
        customer: order.customer_id ?? '',
        sourceId: order.source_id,
      }
      setSearch(nextFilters.q)
      setStatusFilter(nextFilters.status)
      setTypeFilter(nextFilters.type)
      setCustomerFilter(nextFilters.customer)
      setSourceIdFilter(nextFilters.sourceId)
      setInventorySearch(inventoryQuery)
      setPage(1)
      appliedUrlSearchRef.current = urlQuery.update({
        q: nextFilters.q || null,
        status: null,
        mode: nextFilters.mode || null,
        type: nextFilters.type || null,
        customer: nextFilters.customer || null,
        source_id: nextFilters.sourceId || null,
        page: null,
      })
      upsertOutboundOrder(order)
      setOutboundOrderModalOpen(false)
      await loadOutboundOrders(order.id, order, inventoryQuery, 1, pageSize, nextFilters)
      setMessage(t('warehouse.outboundOrder.message.generated', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.message.generateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSelectedOutboundOrder() {
    if (!selectedOrder) return
    if (!reviewerId) {
      showError(new Error(t('warehouse.outboundOrder.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const order = await submitOutboundOrder(selectedOrder.id, { reviewer_id: reviewerId })
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      upsertOutboundOrder(order)
      await loadOutboundOrders(order.id, order, inventoryQuery)
      setMessage(t('warehouse.outboundOrder.message.submitted', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openCancelModal() {
    setCancelReason('')
    setCancelReasonError('')
    setCancelModalOpen(true)
  }

  async function cancelSelectedOutboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    const reason = cancelReason.trim()
    if (!reason) {
      setCancelReasonError(t('warehouse.outboundOrder.validation.cancelReasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const order = await cancelOutboundOrder(selectedOrder.id, { reason })
      upsertOutboundOrder(order)
      setCancelModalOpen(false)
      await loadOutboundOrders(order.id, order)
      setMessage(t('warehouse.outboundOrder.message.cancelled', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.message.cancelFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedOutboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    if (selectedOrder.status !== 'submitted') return
    if (
      !canApproveAssignedRecord(
        currentUser,
        selectedOrder.reviewer_id,
        'warehouse:outbound_order:approve',
      )
    ) {
      showError(
        new Error(
          t('warehouse.outboundOrder.validation.reviewerMismatch', {
            name:
              selectedOrder.reviewer_name ??
              t('warehouse.outboundOrder.detail.reviewerFallback'),
          }),
        ),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const order = await approveOutboundOrder(
        selectedOrder.id,
        outboundOrderApprovePayload(approvalForm),
      )
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      const nextFilters = {
        q: search,
        status: 'approved',
        mode: modeFilter,
        type: typeFilter,
        customer: customerFilter,
        sourceId: sourceIdFilter,
      }
      setStatusFilter(nextFilters.status)
      setInventorySearch(inventoryQuery)
      setPage(1)
      appliedUrlSearchRef.current = urlQuery.update({
        status: nextFilters.status,
        page: null,
      })
      upsertOutboundOrder(order)
      setOutboundOrderModalOpen(false)
      await loadOutboundOrders(order.id, order, inventoryQuery, 1, pageSize, nextFilters)
      setMessage(
        order.outbound_mode === 'formal'
          ? t('warehouse.outboundOrder.message.approvedFormal', { code: order.code })
          : t('warehouse.outboundOrder.message.approvedException', { code: order.code }),
      )
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const draftCount = summary.draft_count
  const submittedCount = summary.submitted_count
  const approvedCount = summary.approved_count
  const outboundQuantity = Number(summary.outbound_quantity || 0)
  const availableQuantity = Number(inventorySummary.available_quantity || 0)

  return (
    <section className="outbound-order-page">
      <div className="summary-strip" aria-label={t('warehouse.outboundOrder.metric.overviewAria')}>
        <Metric label={t('warehouse.outboundOrder.metric.orderCount')} value={total} />
        <Metric label={t('warehouse.outboundOrder.metric.draftCount')} value={draftCount} />
        <Metric
          label={t('warehouse.outboundOrder.metric.submittedCount')}
          value={submittedCount}
          intent={submittedCount > 0 ? 'warning' : 'normal'}
        />
        <Metric label={t('warehouse.outboundOrder.metric.approvedCount')} value={approvedCount} />
        <Metric
          label={t('warehouse.outboundOrder.metric.outboundQuantity')}
          value={outboundQuantity.toFixed(2)}
        />
        <Metric
          label={t('warehouse.outboundOrder.metric.availableQuantity')}
          value={availableQuantity.toFixed(2)}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid outbound-order-grid">
        {!detailId ? (
          <ListPageShell
            className="product-list-panel"
            icon={<Search size={18} />}
            title={t('warehouse.outboundOrder.list.title')}
            toolbar={<form
              className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  const nextFilters = {
                    q: search,
                    status: statusFilter,
                    mode: modeFilter,
                    type: typeFilter,
                    customer: customerFilter,
                    sourceId: sourceIdFilter,
                  }
                  setPage(1)
                  appliedUrlSearchRef.current = urlQuery.update({
                    q: nextFilters.q || null,
                    status: nextFilters.status || null,
                    mode: nextFilters.mode || null,
                    type: nextFilters.type || null,
                    customer: nextFilters.customer || null,
                    source_id: nextFilters.sourceId || null,
                    page: null,
                  })
                  void loadOutboundOrders(undefined, undefined, undefined, 1, pageSize, nextFilters)
                }}
              >
                <label>
                  {t('warehouse.outboundOrder.list.searchLabel')}
                  <Input
                    value={search}
                    placeholder={t('warehouse.outboundOrder.list.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label htmlFor="outbound-order-status-filter">
                  {t('warehouse.outboundOrder.list.statusFilter')}
                  <FormSelect
                    id="outbound-order-status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('warehouse.outboundOrder.list.allStatuses')}</option>
                    {outboundOrderStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label htmlFor="outbound-order-mode-filter">
                  {t('warehouse.outboundOrder.list.modeFilter')}
                  <FormSelect
                    id="outbound-order-mode-filter"
                    value={modeFilter}
                    onChange={(event) => setModeFilter(event.target.value)}
                  >
                    <option value="">{t('warehouse.outboundOrder.list.allModes')}</option>
                    {outboundOrderModeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label htmlFor="outbound-order-type-filter">
                  {t('warehouse.outboundOrder.list.typeFilter')}
                  <FormSelect
                    id="outbound-order-type-filter"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="">{t('warehouse.outboundOrder.list.allTypes')}</option>
                    {outboundPlanTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('warehouse.outboundOrder.list.customerFilter')}
                  <Input
                    value={customerFilter}
                    placeholder={t('warehouse.outboundOrder.list.customerFilterPlaceholder')}
                    onChange={(event) => setCustomerFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('warehouse.outboundOrder.list.sourceIdFilter')}
                  <Input
                    value={sourceIdFilter}
                    placeholder={t('warehouse.outboundOrder.list.sourceIdFilterPlaceholder')}
                    onChange={(event) => setSourceIdFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('warehouse.outboundOrder.list.query')}
                </Button>
                <Button
                  htmlType="button"
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={openOutboundOrderModal}
                >
                  {t('warehouse.outboundOrder.list.generateOrApprove')}
                </Button>
              </form>}
            >

            <Table<OutboundOrder>
              columns={[
                {
                  title: t('warehouse.outboundOrder.field.code'),
                  dataIndex: 'code',
                  render: (value: string, record: OutboundOrder) => (
                    <button
                      className="row-button"
                      type="button"
                      onClick={(event) => stopAndOpenOutboundOrderDetail(event, record)}
                    >
                      {value}
                    </button>
                  ),
                },
                {
                  title: t('warehouse.outboundOrder.field.status'),
                  dataIndex: 'status',
                  render: outboundOrderStatusLabel,
                },
                {
                  title: t('warehouse.outboundOrder.field.mode'),
                  dataIndex: 'outbound_mode',
                  render: outboundOrderModeLabel,
                },
                {
                  title: t('warehouse.outboundOrder.field.outboundType'),
                  dataIndex: 'outbound_type',
                  render: outboundPlanTypeLabel,
                },
                { title: t('warehouse.outboundOrder.field.sourceCode'), dataIndex: 'source_code' },
                {
                  title: t('warehouse.outboundOrder.field.customer'),
                  dataIndex: 'customer_name',
                  render: nullableText,
                },
                {
                  title: t('warehouse.outboundOrder.field.outboundDate'),
                  dataIndex: 'outbound_at',
                  render: formatDate,
                },
                {
                  title: t('warehouse.outboundOrder.field.quantity'),
                  dataIndex: 'lines',
                  render: (_, order) => outboundOrderTotalQuantity(order).toFixed(2),
                },
                {
                  title: t('warehouse.outboundOrder.field.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: OutboundOrder) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenOutboundOrderDetail(event, record)}
                    >
                      {t('warehouse.outboundOrder.action.viewDetail')}
                    </Button>
                  ),
                },
              ]}
              dataSource={orders}
              loading={loading}
              pagination={{
                ...pagination,
                onChange: (nextPage, nextPageSize) => {
                  const next = changePage(nextPage, nextPageSize)
                  appliedUrlSearchRef.current = urlQuery.update({
                    page: next.page === 1 ? null : next.page,
                  })
                  void loadOutboundOrders(
                    undefined,
                    undefined,
                    undefined,
                    next.page,
                    next.pageSize,
                  )
                },
              }}
              rowClassName={(record) => (record.id === selectedOrder?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedOrderId(record.id),
              })}
            />
          </ListPageShell>
        ) : null}

        <Modal
          centered
          footer={null}
          open={outboundOrderModalOpen}
          title={t('warehouse.outboundOrder.form.modalTitle')}
          width={980}
          onCancel={() => setOutboundOrderModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
            <PanelTitle icon={<Warehouse size={18} />} title={t('warehouse.outboundOrder.form.sectionTitle')} />
            <form className="record-form" onSubmit={generateOutboundOrder}>
              <div className="form-divider">{t('warehouse.outboundOrder.form.fromPlan')}</div>
              <label htmlFor="outbound-order-plan-id">
                {t('warehouse.outboundOrder.field.outboundPlan')}
                <FormSelect
                  id="outbound-order-plan-id"
                  required
                  value={form.plan_id}
                  onChange={(event) => handleOutboundOrderPlanChange(event.target.value)}
                >
                  <option value="">{t('warehouse.outboundOrder.form.selectPlan')}</option>
                  {outboundPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.code} / {plan.source_code} / {outboundPlanStatusLabel(plan.status)}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-order-code">
                {t('warehouse.outboundOrder.field.codeNo')}
                <Input
                  id="outbound-order-code"
                  readOnly
                  value=""
                  placeholder={t('warehouse.outboundOrder.form.codeAutoGenerated')}
                />
              </label>
              <div className="form-pair two">
                <label htmlFor="outbound-order-mode">
                  {t('warehouse.outboundOrder.field.outboundMode')}
                  <FormSelect
                    id="outbound-order-mode"
                    value={form.outbound_mode}
                    onChange={(event) => setForm({ ...form, outbound_mode: event.target.value })}
                  >
                    {outboundOrderModeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label htmlFor="outbound-order-date">
                  {t('warehouse.outboundOrder.field.outboundAt')}
                  <Input
                    id="outbound-order-date"
                    required
                    type="date"
                    value={form.outbound_at}
                    onChange={(event) => setForm({ ...form, outbound_at: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label htmlFor="outbound-order-warehouse-id">
                  {t('warehouse.outboundOrder.field.warehouseId')}
                  <Input
                    id="outbound-order-warehouse-id"
                    required
                    value={form.warehouse_id}
                    onChange={(event) => setForm({ ...form, warehouse_id: event.target.value })}
                  />
                </label>
                <label htmlFor="outbound-order-warehouse-name">
                  {t('warehouse.outboundOrder.field.warehouse')}
                  <Input
                    id="outbound-order-warehouse-name"
                    required
                    value={form.warehouse_name}
                    onChange={(event) => setForm({ ...form, warehouse_name: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label htmlFor="outbound-order-location-id">
                  {t('warehouse.outboundOrder.field.locationId')}
                  <Input
                    id="outbound-order-location-id"
                    required
                    value={form.location_id}
                    onChange={(event) => setForm({ ...form, location_id: event.target.value })}
                  />
                </label>
                <label htmlFor="outbound-order-location-name">
                  {t('warehouse.outboundOrder.field.location')}
                  <Input
                    id="outbound-order-location-name"
                    required
                    value={form.location_name}
                    onChange={(event) => setForm({ ...form, location_name: event.target.value })}
                  />
                </label>
              </div>
              <label htmlFor="outbound-order-operator">
                {t('warehouse.outboundOrder.field.operator')}
                <Input
                  id="outbound-order-operator"
                  required
                  value={form.operator_name}
                  onChange={(event) => setForm({ ...form, operator_name: event.target.value })}
                />
              </label>
              <label htmlFor="outbound-exception-reason">
                {t('warehouse.outboundOrder.field.exceptionReason')}
                <Input.TextArea
                  id="outbound-exception-reason"
                  rows={3}
                  value={form.exception_reason}
                  onChange={(event) => setForm({ ...form, exception_reason: event.target.value })}
                />
              </label>
              <Button
                disabled={!form.plan_id}
                htmlType="submit"
                icon={<PackagePlus size={16} />}
                loading={submitting}
              >
                {t('warehouse.outboundOrder.action.generate')}
              </Button>
            </form>

            <form
              className="record-form accessory-form generation-form"
              onSubmit={approveSelectedOutboundOrder}
            >
              <div className="form-divider">{t('warehouse.outboundOrder.form.submitSection')}</div>
              {selectedOrder?.status === 'draft' ? (
                <ApprovalAssigneeSelect
                  currentUserId={currentUser.id}
                  label={t('warehouse.outboundOrder.field.reviewer')}
                  onChange={setReviewerId}
                  requiredPermission="warehouse:outbound_order:approve"
                  value={reviewerId}
                />
              ) : null}
              <Button
                disabled={!selectedOrder || selectedOrder.status !== 'draft' || !reviewerId}
                htmlType="button"
                icon={<Send size={16} />}
                loading={submitting}
                onClick={() => void submitSelectedOutboundOrder()}
              >
                {t('warehouse.outboundOrder.action.submit')}
              </Button>
              <div className="form-pair two">
                <label htmlFor="outbound-reviewer-name">
                  {t('warehouse.outboundOrder.field.reviewer')}
                  <Input
                    id="outbound-reviewer-name"
                    disabled
                    value={selectedOrder?.reviewer_name ?? ''}
                  />
                </label>
                <label htmlFor="outbound-approved-at">
                  {t('warehouse.outboundOrder.field.approvedAt')}
                  <Input
                    id="outbound-approved-at"
                    required
                    type="date"
                    value={approvalForm.approved_at}
                    onChange={(event) =>
                      setApprovalForm({ ...approvalForm, approved_at: event.target.value })
                    }
                  />
                </label>
              </div>
              <label className="checkbox-line" htmlFor="outbound-allow-negative">
                <input
                  aria-label={t('warehouse.outboundOrder.field.allowNegative')}
                  id="outbound-allow-negative"
                  type="checkbox"
                  checked={approvalForm.allow_negative}
                  onChange={(event) =>
                    setApprovalForm({ ...approvalForm, allow_negative: event.target.checked })
                  }
                />
                {t('warehouse.outboundOrder.field.allowNegative')}
              </label>
              <Button
                disabled={
                  !selectedOrder ||
                  selectedOrder.status !== 'submitted' ||
                  !canApproveAssignedRecord(
                    currentUser,
                    selectedOrder.reviewer_id,
                    'warehouse:outbound_order:approve',
                  )
                }
                htmlType="submit"
                icon={<CheckCircle2 size={16} />}
                loading={submitting}
                type="primary"
              >
                {t('warehouse.outboundOrder.action.approve')}
              </Button>
              {selectedOrder?.status === 'submitted' &&
              !canApproveAssignedRecord(
                currentUser,
                selectedOrder.reviewer_id,
                'warehouse:outbound_order:approve',
              ) ? (
                <Alert
                  message={t('warehouse.outboundOrder.message.waitingApproval', {
                    name:
                      selectedOrder.reviewer_name ??
                      t('warehouse.outboundOrder.detail.reviewerFallback'),
                  })}
                  showIcon
                  type="info"
                />
              ) : null}
            </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<LayoutDashboard size={18} />} title={t('warehouse.outboundOrder.detail.title')} />
              <div className="toolbar-actions">
                {selectedOrder && ['draft', 'submitted'].includes(selectedOrder.status) ? (
                  <Button danger onClick={openCancelModal}>
                    {t('warehouse.outboundOrder.action.cancel')}
                  </Button>
                ) : null}
                <Button
                  icon={<ArrowLeft size={16} />}
                  onClick={() => onNavigate(warehouseOutboundOrderPath)}
                >
                  {t('warehouse.outboundOrder.action.backToList')}
                </Button>
              </div>
            </div>
            {selectedOrder ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('warehouse.outboundOrder.field.sourceDocument')}</dt>
                    <dd>
                      {outboundPlanSourceTypeLabel(selectedOrder.source_type)} /{' '}
                      {selectedOrder.source_code}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.outboundOrder.field.customer')}</dt>
                    <dd>
                      {selectedOrder.customer_name ??
                        t('warehouse.outboundOrder.detail.customerNotSet')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.outboundOrder.field.outboundMode')}</dt>
                    <dd>{outboundOrderModeLabel(selectedOrder.outbound_mode)}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.outboundOrder.field.status')}</dt>
                    <dd>{outboundOrderStatusLabel(selectedOrder.status)}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.outboundOrder.field.outboundAt')}</dt>
                    <dd>{formatDate(selectedOrder.outbound_at)}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.outboundOrder.field.location')}</dt>
                    <dd>
                      {selectedOrder.warehouse_name} / {selectedOrder.location_name}
                    </dd>
                  </div>
                  {selectedOrder.status === 'cancelled' ? (
                    <>
                      <div>
                        <dt>{t('warehouse.outboundOrder.detail.cancelledAt')}</dt>
                        <dd>{selectedOrder.cancelled_at ? formatDate(selectedOrder.cancelled_at) : '-'}</dd>
                      </div>
                      <div>
                        <dt>{t('warehouse.outboundOrder.detail.cancelledBy')}</dt>
                        <dd>{selectedOrder.cancelled_by_name ?? '-'}</dd>
                      </div>
                      <div>
                        <dt>{t('warehouse.outboundOrder.detail.cancelReason')}</dt>
                        <dd>{selectedOrder.cancel_reason ?? '-'}</dd>
                      </div>
                    </>
                  ) : null}
                </dl>

                <div className="accessory-heading">
                  <strong>{t('warehouse.outboundOrder.detail.linesTitle')}</strong>
                  <span>
                    {t('warehouse.outboundOrder.detail.lineCount', {
                      count: selectedOrder.lines.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('warehouse.outboundOrder.field.product')}</th>
                      <th>{t('warehouse.outboundOrder.field.specification')}</th>
                      <th>{t('warehouse.outboundOrder.field.quantity')}</th>
                      <th>{t('warehouse.outboundOrder.field.stockStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.lines.map((line) => (
                      <tr key={line.id}>
                        <td>
                          {line.product_code ?? '-'} {line.product_name}
                        </td>
                        <td>
                          {line.specification ??
                            line.model ??
                            t('warehouse.outboundOrder.detail.notSet')}
                        </td>
                        <td>
                          {trimDecimal(line.quantity)} {line.unit}
                        </td>
                        <td>{stockStatusLabel(line.stock_status)}</td>
                      </tr>
                    ))}
                    {selectedOrder.lines.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={4}>
                          {t('warehouse.outboundOrder.detail.noLines')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <form
                  className="inline-filters inline-search inventory-search-form"
                  onSubmit={refreshOutboundInventorySnapshot}
                >
                  <label>
                    {t('warehouse.outboundOrder.detail.inventorySearchLabel')}
                    <Input
                      value={inventorySearch}
                      placeholder={t('warehouse.outboundOrder.detail.inventorySearchPlaceholder')}
                      onChange={(event) => setInventorySearch(event.target.value)}
                    />
                  </label>
                  <Button htmlType="submit" icon={<Search size={16} />}>
                    {t('warehouse.outboundOrder.action.searchInventory')}
                  </Button>
                </form>

                <div className="accessory-heading">
                  <strong>{t('warehouse.outboundOrder.detail.balancesTitle')}</strong>
                  <span>
                    {t('warehouse.outboundOrder.detail.balanceCount', {
                      count: inventoryBalances.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('warehouse.outboundOrder.field.product')}</th>
                      <th>{t('warehouse.outboundOrder.field.location')}</th>
                      <th>{t('warehouse.outboundOrder.field.available')}</th>
                      <th>{t('warehouse.outboundOrder.field.pendingInspection')}</th>
                      <th>{t('warehouse.outboundOrder.field.locked')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryBalances.map((balance) => (
                      <tr key={balance.id}>
                        <td>
                          {balance.product_code ?? '-'} {balance.product_name}
                        </td>
                        <td>
                          {balance.warehouse_name} / {balance.location_name}
                        </td>
                        <td>
                          {trimDecimal(balance.available_quantity)} {balance.unit}
                        </td>
                        <td>
                          {trimDecimal(balance.pending_inspection_quantity)} {balance.unit}
                        </td>
                        <td>
                          {trimDecimal(balance.locked_quantity)} {balance.unit}
                        </td>
                      </tr>
                    ))}
                    {inventoryBalances.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={5}>
                          {t('warehouse.outboundOrder.detail.noBalances')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('warehouse.outboundOrder.detail.ledgersTitle')}</strong>
                  <span>
                    {t('warehouse.outboundOrder.detail.ledgerCount', {
                      count: inventoryLedgers.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('warehouse.outboundOrder.field.date')}</th>
                      <th>{t('warehouse.outboundOrder.field.direction')}</th>
                      <th>{t('warehouse.outboundOrder.field.product')}</th>
                      <th>{t('warehouse.outboundOrder.field.quantity')}</th>
                      <th>{t('warehouse.outboundOrder.field.source')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryLedgers.map((ledger) => (
                      <tr key={ledger.id}>
                        <td>{formatDate(ledger.occurred_at)}</td>
                        <td>
                          {inventoryDirectionLabel(ledger.direction)} /{' '}
                          {stockStatusLabel(ledger.stock_status)}
                        </td>
                        <td>
                          {ledger.product_code ?? '-'} {ledger.product_name}
                        </td>
                        <td>
                          {trimDecimal(ledger.quantity)} {ledger.unit}
                        </td>
                        <td>{ledger.source_code}</td>
                      </tr>
                    ))}
                    {inventoryLedgers.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={5}>
                          {t('warehouse.outboundOrder.detail.noLedgers')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <Package size={28} />
                <strong>{t('warehouse.outboundOrder.detail.emptyTitle')}</strong>
                <span>{t('warehouse.outboundOrder.detail.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>

      <FormModal
        open={cancelModalOpen}
        submitDanger
        submitLabel={t('warehouse.outboundOrder.action.cancel')}
        submitting={submitting}
        title={t('warehouse.outboundOrder.action.cancel')}
        onCancel={() => setCancelModalOpen(false)}
        onSubmit={(event) => void cancelSelectedOutboundOrder(event)}
      >
        <p className="form-hint">{t('warehouse.outboundOrder.detail.cancelReason')}</p>
        <Input.TextArea
          aria-describedby={cancelReasonError ? 'outbound-cancel-reason-error' : undefined}
          aria-invalid={Boolean(cancelReasonError)}
          rows={3}
          value={cancelReason}
          onChange={(event) => {
            setCancelReason(event.target.value)
            if (cancelReasonError) setCancelReasonError('')
          }}
        />
        {cancelReasonError ? (
          <div className="form-field-error" id="outbound-cancel-reason-error">
            {cancelReasonError}
          </div>
        ) : null}
      </FormModal>
    </section>
  )
}
