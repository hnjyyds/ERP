import { useEffect, useMemo, useRef, useState } from 'react'
import {
  listFollowupOverdueNodes,
  listFollowupPlans,
  listFollowupTemplates,
  type FollowProcessTemplate,
  type PurchaseFollowOverdueNode,
  type PurchaseFollowPlan,
  type PurchaseFollowPlanListSummary,
} from '@/api'
import { followupPath, moduleDetailPath } from '@/app/routes'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { showError } from '@/shared/errors'
import { todayInputValue, type RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

export type FollowupFilters = {
  q: string
  status: string
  supplier: string
  contract: string
}

export function useFollowupWorkspace({
  detailId,
  onNavigate,
  targetNodeId,
}: RoutedDetailPageProps & { targetNodeId?: string | null }) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const [templates, setTemplates] = useState<FollowProcessTemplate[]>([])
  const [plans, setPlans] = useState<PurchaseFollowPlan[]>([])
  const [summary, setSummary] = useState<PurchaseFollowPlanListSummary>({
    completed_plan_count: 0,
    overdue_plan_count: 0,
    completed_node_count: 0,
    total_node_count: 0,
  })
  const [overdueNodes, setOverdueNodes] = useState<PurchaseFollowOverdueNode[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => urlQuery.params.get('status') ?? '')
  const [supplierFilter, setSupplierFilter] = useState(() => urlQuery.params.get('supplier') ?? '')
  const [contractFilter, setContractFilter] = useState(() => urlQuery.params.get('contract') ?? '')
  const [overdueAsOf, setOverdueAsOf] = useState(() => todayInputValue())
  const [loading, setLoading] = useState(false)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? templates[0] ?? null,
    [templates, selectedTemplateId],
  )
  const selectedPlan = useMemo(() => {
    if (detailId) return plans.find((item) => item.id === detailId) ?? null
    return plans.find((item) => item.id === selectedPlanId) ?? plans[0] ?? null
  }, [detailId, plans, selectedPlanId])

  useEffect(() => {
    void loadFollowupWorkspace()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextFilters = {
      q: urlQuery.params.get('q') ?? '',
      status: urlQuery.params.get('status') ?? '',
      supplier: urlQuery.params.get('supplier') ?? '',
      contract: urlQuery.params.get('contract') ?? '',
    }
    setSearch(nextFilters.q)
    setStatusFilter(nextFilters.status)
    setSupplierFilter(nextFilters.supplier)
    setContractFilter(nextFilters.contract)
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadFollowupWorkspace(undefined, undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    if (detailId && plans.length > 0 && !plans.some((item) => item.id === detailId)) {
      onNavigate(followupPath)
    }
  }, [detailId, onNavigate, plans])

  useEffect(() => {
    if (!targetNodeId || !selectedPlan?.nodes.some((node) => node.id === targetNodeId)) return
    document
      .getElementById(`followup-node-${targetNodeId}`)
      ?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }, [selectedPlan, targetNodeId])

  function openFollowupDetail(plan: PurchaseFollowPlan) {
    setSelectedPlanId(plan.id)
    onNavigate(moduleDetailPath(followupPath, plan.id))
  }

  async function loadFollowupWorkspace(
    preferredPlanId?: string,
    preferredTemplateId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: FollowupFilters,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    setLoading(true)
    try {
      const [templateResult, planResult, overdueResult] = await Promise.all([
        listFollowupTemplates(),
        listFollowupPlans({
          q: (filtersOverride?.q ?? search).trim() || undefined,
          overall_status: (filtersOverride?.status ?? statusFilter) || undefined,
          supplier_id: (filtersOverride?.supplier ?? supplierFilter).trim() || undefined,
          purchase_contract_id: (filtersOverride?.contract ?? contractFilter).trim() || undefined,
          limit: resolvedPageSize,
          offset: (resolvedPage - 1) * resolvedPageSize,
        }),
        listFollowupOverdueNodes(overdueAsOf),
      ])
      setTemplates(templateResult.items)
      setTotal(planResult.total)
      setSummary(planResult.summary)
      if (planResult.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadFollowupWorkspace(
          preferredPlanId,
          preferredTemplateId,
          prevPage,
          resolvedPageSize,
          filtersOverride,
        )
        return
      }
      setPlans(planResult.items)
      setOverdueNodes(overdueResult.items)

      const nextTemplateId =
        preferredTemplateId ??
        (templateResult.items.some((item) => item.id === selectedTemplateId)
          ? selectedTemplateId
          : null) ??
        templateResult.items[0]?.id ??
        null
      const nextPlanId =
        preferredPlanId ??
        (planResult.items.some((item) => item.id === selectedPlanId) ? selectedPlanId : null) ??
        planResult.items[0]?.id ??
        null
      setSelectedTemplateId(nextTemplateId)
      setSelectedPlanId(nextPlanId)
    } catch (caught) {
      showError(caught, t('purchase.followup.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function submitFilters() {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: search,
      status: statusFilter,
      supplier: supplierFilter,
      contract: contractFilter,
      page: null,
    })
    void loadFollowupWorkspace(undefined, undefined, 1)
  }

  function changeListPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadFollowupWorkspace(undefined, undefined, next.page, next.pageSize)
  }

  async function applyGeneratedPlan(plan: PurchaseFollowPlan) {
    setContractFilter(plan.purchase_contract_id)
    setSelectedPlanId(plan.id)
    await loadFollowupWorkspace(plan.id)
  }

  async function applySavedTemplate(templateId: string) {
    await loadFollowupWorkspace(selectedPlan?.id, templateId)
  }

  return {
    applyGeneratedPlan,
    applySavedTemplate,
    changeListPage,
    contractFilter,
    loading,
    loadFollowupWorkspace,
    openFollowupDetail,
    overdueAsOf,
    overdueNodes,
    pagination,
    plans,
    search,
    selectedPlan,
    selectedPlanId,
    selectedTemplate,
    setContractFilter,
    setOverdueAsOf,
    setOverdueNodes,
    setSearch,
    setSelectedPlanId,
    setStatusFilter,
    setSupplierFilter,
    statusFilter,
    submitFilters,
    summary,
    supplierFilter,
    templates,
    total,
  }
}
