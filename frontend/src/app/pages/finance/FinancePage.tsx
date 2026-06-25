import { downloadCsv } from '../../../shared/print'
import { Alert, Button, Descriptions, Input, Modal, Select, Skeleton, Table, Tag } from 'antd'
import { ArrowLeft, BarChart3, Coins, FileText, LayoutDashboard, Plus, Search , CheckCircle2, ChevronRight, ClipboardCheck, FileSpreadsheet, FileStack, Handshake, PackagePlus, Receipt, RefreshCw, Save, ShieldCheck, Ship, Wallet} from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { allocateBankReceipt, approveFeePaymentRequest, approvePaymentRequest, autoMatchCustomsReceipts, claimBankReceipt, addManualProfitCost, createBankReceipt, createFinancialSettlement, createFeePaymentRequest, createMiscFeeAllocation, createMiscFeeItem, createPartnerFeeInvoice, createPaymentRequest, createSupplierInvoice, createVerificationDocument, createPortImportBatch, createReimbursement, approveReimbursement, payReimbursement, getFinanceOverview, listBankReceipts, listFinancialSettlements, listFeePayables, listFeePaymentRequests, listMiscFeeAllocationSummary, listMiscFeeAllocations, listMiscFeeItems, listPartnerFeeInvoices, listPayables, listPaymentRequests, listProfitCalculations, listReceivables, listSupplierInvoices, listVerificationDocuments, listVerificationUsage, listReimbursements, listPortImportBatches, listCustomsDeclarationRecords, registerVerification, registerVerificationCustomsReceipt, registerTaxRefund, getReceiptUsageReport, getBankReceiptSummaryReport, getGoodsPaymentReport, getFeePaymentReport, getCustomsReceiptCollectionReport, getTaxRefundStatisticsReport, type BankReceipt, type BankReceiptAllocationPayload, type BankReceiptClaimPayload, type BankReceiptCreatePayload, type CustomsReceiptRegisterPayload, type FeePayableItem, type FeePaymentRequest, type FeePaymentRequestApprovePayload, type FeePaymentRequestCreatePayload, type FinancialSettlement, type FinancialSettlementCreatePayload, type ManualProfitCostCreatePayload, type PayableItem, type PaymentRequestApprovePayload, type PaymentRequestCreatePayload, type FinanceOverview, type PartnerFeeInvoice, type PartnerFeeInvoiceCreatePayload, type MiscFeeAllocation, type MiscFeeAllocationCreatePayload, type MiscFeeItem, type MiscFeeItemCreatePayload, type ProfitCostItem, type ReceivableItem, type SupplierInvoice, type SupplierInvoiceCreatePayload, type SupplierPaymentRequest, type TaxRefundRegisterPayload, type VerificationDocument, type VerificationDocumentCreatePayload, type VerificationRegisterPayload, type VerificationUsageItem, type Reimbursement, type ReimbursementCreatePayload, type PortImportBatch, type PortImportBatchCreatePayload, type CustomsDeclarationRecord, type ReceiptUsageDetailRow, type ReceiptUsageDetailReport, type BankReceiptCurrencySummary, type BankReceiptSummaryReport, type GoodsPaymentQueryRow, type GoodsPaymentQueryReport, type FeePaymentQueryRow, type FeePaymentQueryReport, type CustomsReceiptCollectionRow, type CustomsReceiptCollectionReport, type TaxRefundCurrencyTotal, type TaxRefundStatisticsReport , CustomsDeclarationRecordCreatePayload, FinanceCurrencySummary, FinancePartnerTypeSummary, FinanceReportDrilldown, FinanceReportExplanation, FinanceShipmentProfit, FinanceStatusAmount, exportBankReceiptSummaryReport, exportCustomsReceiptCollectionReport, exportFeePaymentReport, exportGoodsPaymentReport, exportReceiptUsageReport, exportTaxRefundStatisticsReport, drilldownFinanceReport, explainFinanceReport} from '../../../api'
import { financePath, financeOverviewPath, financeReceiptsPath, financePaymentsPath, financeFeesPath, financeTaxPath, financeMiscPath, financeSettlementPath, financeReimbursementsPath, financePortDataPath, financeReportsPath, financeModulePathByModule, financeDetailPath, isFinancePath, parseFinanceView, reportingPath, type FinanceModule, type FinanceView } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { receiptStatusOptions, receiptTypeOptions, allocationTypeOptions, supplierInvoiceStatusOptions, paymentRequestStatusOptions, paymentTypeOptions, partnerFeeInvoiceStatusOptions, feePaymentRequestStatusOptions, feeTypeOptions, verificationDocumentStatusOptions, verificationReminderStatusOptions, miscFeeCategoryOptions, miscFeeAllocationMethodOptions, miscFeeItemStatusOptions, settlementStatusOptions, profitCostTypeOptions, reportingDocumentTypeOptions, reportingStatusOptions , partnerTypeOptions, shipmentStatusOptions, purchaseInvoiceNoticeStatusOptions, sampleFeeTypeOptions} from '../../../shared/formOptions'
import { formatDate, formatDateTime, formatMoney, formatFinanceAmount, formatPercent, nullableText, todayInputValue, pageTitle, statusTag, severityTag, partnerTypeLabel, OperationFlowRail, type ModuleNavigationProps , emptyToNull} from '../appHelpers'
import { shipmentStatusLabel, purchaseInvoiceNoticeStatusLabel, samplePaymentStatusLabel, BankReceiptFormState, ReceiptClaimFormState, ReceiptAllocationFormState, SupplierInvoiceFormState, PaymentRequestFormState, PaymentApprovalFormState, PartnerFeeInvoiceFormState, FeePaymentRequestFormState, FeePaymentApprovalFormState, VerificationDocumentFormState, CustomsReceiptFormState, VerificationRegisterFormState, TaxRefundFormState, MiscFeeItemFormState, MiscFeeAllocationFormState, FinancialSettlementFormState, ManualProfitCostFormState, initialBankReceiptForm, initialReceiptClaimForm, initialReceiptAllocationForm, bankReceiptPayload, receiptClaimPayload, receiptAllocationPayload, receiptStatusLabel, receiptStatusColor, receiptStatusTag, receiptTypeLabel, allocationTypeLabel, receivableStatusLabel, receivableStatusTag, initialSupplierInvoiceForm, initialPaymentRequestForm, initialPaymentApprovalForm, supplierInvoicePayload, paymentRequestPayload, paymentApprovalPayload, supplierInvoiceStatusLabel, supplierInvoiceStatusTag, paymentRequestStatusLabel, paymentRequestStatusTag, paymentTypeLabel, initialPartnerFeeInvoiceForm, initialFeePaymentRequestForm, initialFeePaymentApprovalForm, partnerFeeInvoicePayload, feePaymentRequestPayload, feePaymentApprovalPayload, partnerFeeInvoiceStatusLabel, partnerFeeInvoiceStatusTag, feePaymentRequestStatusLabel, feePaymentRequestStatusTag, feeTypeLabel, initialVerificationDocumentForm, initialCustomsReceiptForm, initialVerificationRegisterForm, initialTaxRefundForm, verificationDocumentPayload, customsReceiptPayload, verificationRegisterPayload, taxRefundPayload, verificationDocumentStatusLabel, verificationDocumentStatusTag, verificationReminderStatusLabel, verificationReminderStatusTag, initialMiscFeeItemForm, initialMiscFeeAllocationForm, miscFeeItemPayload, miscFeeAllocationPayload, miscFeeCategoryLabel, miscFeeAllocationMethodLabel, miscFeeItemStatusLabel, miscFeeItemStatusTag, reimbursementCategoryLabel, reimbursementStatusTag, initialFinancialSettlementForm, initialManualProfitCostForm, financialSettlementPayload, manualProfitCostPayload, settlementStatusLabel, settlementStatusTag, approvalDocumentTypeLabel, approvalDocumentTypeTag, approvalStatusTag, sourcePathTag, profitCostTypeLabel, profitCostDirectionTag } from './financeHelpers'






type FinancePageProps = ModuleNavigationProps & {
  view: FinanceView
}

export function FinancePage({ view, onNavigate }: FinancePageProps) {
  const activeModule = view.module
  const detailId = view.id
  const goModule = (module: FinanceModule) => onNavigate(financeModulePathByModule[module])
  const goDetail = (module: FinanceModule, id: string) => onNavigate(financeDetailPath(module, id))
  const goFinanceHome = () => onNavigate(financePath)
  const [overview, setOverview] = useState<FinanceOverview | null>(null)
  const [receipts, setReceipts] = useState<BankReceipt[]>([])
  const [receivables, setReceivables] = useState<ReceivableItem[]>([])
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([])
  const [paymentRequests, setPaymentRequests] = useState<SupplierPaymentRequest[]>([])
  const [payables, setPayables] = useState<PayableItem[]>([])
  const [partnerFeeInvoices, setPartnerFeeInvoices] = useState<PartnerFeeInvoice[]>([])
  const [feePaymentRequests, setFeePaymentRequests] = useState<FeePaymentRequest[]>([])
  const [feePayables, setFeePayables] = useState<FeePayableItem[]>([])
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([])
  const [verificationUsage, setVerificationUsage] = useState<VerificationUsageItem[]>([])
  const [miscFeeItems, setMiscFeeItems] = useState<MiscFeeItem[]>([])
  const [miscFeeAllocations, setMiscFeeAllocations] = useState<MiscFeeAllocation[]>([])
  const [miscFeeAllocationSummary, setMiscFeeAllocationSummary] = useState<MiscFeeAllocation[]>([])
  const [financialSettlements, setFinancialSettlements] = useState<FinancialSettlement[]>([])
  const [profitCalculations, setProfitCalculations] = useState<FinancialSettlement[]>([])
  // ---- 报销管理 / 口岸数据 / 财务报表 ----
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [portImportBatches, setPortImportBatches] = useState<PortImportBatch[]>([])
  const [customsRecords, setCustomsRecords] = useState<CustomsDeclarationRecord[]>([])
  const [reimbursementsTotalAmount, setReimbursementsTotalAmount] = useState('0.00')
  const [selectedReimbursementId, setSelectedReimbursementId] = useState<string | null>(null)
  const [reimbursementSearch, setReimbursementSearch] = useState('')
  const [reimbursementStatusFilter, setReimbursementStatusFilter] = useState('')
  const [reimbursementCategoryFilter, setReimbursementCategoryFilter] = useState('')
  const [loadingReimbursements, setLoadingReimbursements] = useState(false)
  const [submittingReimbursement, setSubmittingReimbursement] = useState(false)
  const [submittingReimbursementAction, setSubmittingReimbursementAction] = useState(false)
  const [reimbursementForm, setReimbursementForm] = useState({
    reimbursement_no: '',
    applicant_user_id: '',
    applicant_user_name: '',
    department: '',
    category: 'travel',
    currency: 'CNY',
    amount: '',
    reason: '',
    remark: '',
  })
  const [reimbursementPayMethod, setReimbursementPayMethod] = useState('bank_transfer')
  const [loadingPortBatches, setLoadingPortBatches] = useState(false)
  const [loadingCustomsRecords, setLoadingCustomsRecords] = useState(false)
  const [submittingPortBatch, setSubmittingPortBatch] = useState(false)
  const [portBatchSourceFilter, setPortBatchSourceFilter] = useState('')
  const [customsDeclarationFilter, setCustomsDeclarationFilter] = useState('')
  const [customsReceiptFilter, setCustomsReceiptFilter] = useState('')
  const [customsTradeTypeFilter, setCustomsTradeTypeFilter] = useState('')
  const [portBatchForm, setPortBatchForm] = useState({
    batch_no: '',
    source: '',
    imported_at: '',
    remark: '',
  })
  const [portRecordForm, setPortRecordForm] = useState({
    declaration_no: '',
    customs_receipt_no: '',
    trade_type: 'export',
    export_contract_no: '',
    customs_date: '',
    product_name: '',
    hs_code: '',
    quantity: '',
    unit: '',
    amount: '',
    currency: 'USD',
    customer_or_supplier: '',
  })
  const [reportDateFrom, setReportDateFrom] = useState('')
  const [reportDateTo, setReportDateTo] = useState('')
  const [reportCurrency, setReportCurrency] = useState('')
  const [reportReceiptNo, setReportReceiptNo] = useState('')
  const [reportReceiptType, setReportReceiptType] = useState('')
  const [reportSupplierName, setReportSupplierName] = useState('')
  const [reportPartnerName, setReportPartnerName] = useState('')
  const [reportFeeType, setReportFeeType] = useState('')
  const [reportSalesUserId, setReportSalesUserId] = useState('')
  const [reportOwnerUserId, setReportOwnerUserId] = useState('')
  const [reportReminderStatus, setReportReminderStatus] = useState('')
  const [reportStatus, setReportStatus] = useState('')
  const [reportIncludeRegistered, setReportIncludeRegistered] = useState(false)
  const [activeReport, setActiveReport] = useState('receipt-usage')
  const [loadingReport, setLoadingReport] = useState(false)
  const [exportingReport, setExportingReport] = useState(false)
  const [loadingReportExplanation, setLoadingReportExplanation] = useState(false)
  const [reportExplanation, setReportExplanation] = useState<FinanceReportExplanation | null>(null)
  const [reportDrilldown, setReportDrilldown] = useState<FinanceReportDrilldown | null>(null)
  const [matchingCustomsReceipts, setMatchingCustomsReceipts] = useState(false)
  const [receiptUsageReport, setReceiptUsageReport] = useState<ReceiptUsageDetailReport | null>(null)
  const [bankReceiptSummaryReport, setBankReceiptSummaryReport] =
    useState<BankReceiptSummaryReport | null>(null)
  const [goodsPaymentReport, setGoodsPaymentReport] = useState<GoodsPaymentQueryReport | null>(null)
  const [feePaymentReport, setFeePaymentReport] = useState<FeePaymentQueryReport | null>(null)
  const [customsCollectionReport, setCustomsCollectionReport] =
    useState<CustomsReceiptCollectionReport | null>(null)
  const [taxRefundStatisticsReport, setTaxRefundStatisticsReport] =
    useState<TaxRefundStatisticsReport | null>(null)
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)
  const [selectedSupplierInvoiceId, setSelectedSupplierInvoiceId] = useState<string | null>(null)
  const [selectedPaymentRequestId, setSelectedPaymentRequestId] = useState<string | null>(null)
  const [selectedPartnerFeeInvoiceId, setSelectedPartnerFeeInvoiceId] = useState<string | null>(null)
  const [selectedFeePaymentRequestId, setSelectedFeePaymentRequestId] = useState<string | null>(null)
  const [selectedVerificationDocumentId, setSelectedVerificationDocumentId] = useState<string | null>(null)
  const [selectedMiscFeeItemId, setSelectedMiscFeeItemId] = useState<string | null>(null)
  const [selectedFinancialSettlementId, setSelectedFinancialSettlementId] = useState<string | null>(null)
  const [receiptSearch, setReceiptSearch] = useState('')
  const [receiptStatusFilter, setReceiptStatusFilter] = useState('')
  const [receiptCustomerFilter, setReceiptCustomerFilter] = useState('')
  const [receivableSearch, setReceivableSearch] = useState('')
  const [receivableContractFilter, setReceivableContractFilter] = useState('')
  const [receivableInvoiceFilter, setReceivableInvoiceFilter] = useState('')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('')
  const [invoiceSupplierFilter, setInvoiceSupplierFilter] = useState('')
  const [invoiceContractFilter, setInvoiceContractFilter] = useState('')
  const [paymentRequestSearch, setPaymentRequestSearch] = useState('')
  const [paymentRequestStatusFilter, setPaymentRequestStatusFilter] = useState('')
  const [paymentRequestTypeFilter, setPaymentRequestTypeFilter] = useState('')
  const [payableSearch, setPayableSearch] = useState('')
  const [payableStatusFilter, setPayableStatusFilter] = useState('')
  const [payableSupplierFilter, setPayableSupplierFilter] = useState('')
  const [payableContractFilter, setPayableContractFilter] = useState('')
  const [feeInvoiceSearch, setFeeInvoiceSearch] = useState('')
  const [feeInvoiceStatusFilter, setFeeInvoiceStatusFilter] = useState('')
  const [feeInvoiceTypeFilter, setFeeInvoiceTypeFilter] = useState('')
  const [feeInvoicePartnerFilter, setFeeInvoicePartnerFilter] = useState('')
  const [feeInvoiceShipmentFilter, setFeeInvoiceShipmentFilter] = useState('')
  const [feePaymentRequestSearch, setFeePaymentRequestSearch] = useState('')
  const [feePaymentRequestStatusFilter, setFeePaymentRequestStatusFilter] = useState('')
  const [feePaymentRequestTypeFilter, setFeePaymentRequestTypeFilter] = useState('')
  const [feePayableSearch, setFeePayableSearch] = useState('')
  const [feePayableStatusFilter, setFeePayableStatusFilter] = useState('')
  const [feePayableTypeFilter, setFeePayableTypeFilter] = useState('')
  const [feePayablePartnerFilter, setFeePayablePartnerFilter] = useState('')
  const [feePayableShipmentFilter, setFeePayableShipmentFilter] = useState('')
  const [verificationSearch, setVerificationSearch] = useState('')
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('')
  const [verificationReminderFilter, setVerificationReminderFilter] = useState('')
  const [verificationOwnerFilter, setVerificationOwnerFilter] = useState('')
  const [verificationShipmentFilter, setVerificationShipmentFilter] = useState('')
  const [verificationUsageSearch, setVerificationUsageSearch] = useState('')
  const [verificationUsageStatusFilter, setVerificationUsageStatusFilter] = useState('')
  const [verificationUsageReminderFilter, setVerificationUsageReminderFilter] = useState('')
  const [verificationUsageShipmentFilter, setVerificationUsageShipmentFilter] = useState('')
  const [miscFeeItemSearch, setMiscFeeItemSearch] = useState('')
  const [miscFeeItemCategoryFilter, setMiscFeeItemCategoryFilter] = useState('')
  const [miscFeeItemStatusFilter, setMiscFeeItemStatusFilter] = useState('')
  const [miscFeeAllocationSearch, setMiscFeeAllocationSearch] = useState('')
  const [miscFeeAllocationCategoryFilter, setMiscFeeAllocationCategoryFilter] = useState('')
  const [miscFeeAllocationShipmentFilter, setMiscFeeAllocationShipmentFilter] = useState('')
  const [miscFeeAllocationSalesFilter, setMiscFeeAllocationSalesFilter] = useState('')
  const [miscFeeSummaryShipmentFilter, setMiscFeeSummaryShipmentFilter] = useState('')
  const [miscFeeSummaryCategoryFilter, setMiscFeeSummaryCategoryFilter] = useState('')
  const [settlementSearch, setSettlementSearch] = useState('')
  const [settlementShipmentFilter, setSettlementShipmentFilter] = useState('')
  const [profitCalculationSearch, setProfitCalculationSearch] = useState('')
  const [profitCalculationShipmentFilter, setProfitCalculationShipmentFilter] = useState('')
  const [receiptForm, setReceiptForm] = useState<BankReceiptFormState>(() => initialBankReceiptForm())
  const [claimForm, setClaimForm] = useState<ReceiptClaimFormState>(() => initialReceiptClaimForm())
  const [allocationForm, setAllocationForm] = useState<ReceiptAllocationFormState>(() =>
    initialReceiptAllocationForm(),
  )
  const [supplierInvoiceForm, setSupplierInvoiceForm] = useState<SupplierInvoiceFormState>(() =>
    initialSupplierInvoiceForm(),
  )
  const [paymentRequestForm, setPaymentRequestForm] = useState<PaymentRequestFormState>(() =>
    initialPaymentRequestForm(),
  )
  const [paymentApprovalForm, setPaymentApprovalForm] = useState<PaymentApprovalFormState>(() =>
    initialPaymentApprovalForm(),
  )
  const [partnerFeeInvoiceForm, setPartnerFeeInvoiceForm] = useState<PartnerFeeInvoiceFormState>(() =>
    initialPartnerFeeInvoiceForm(),
  )
  const [feePaymentRequestForm, setFeePaymentRequestForm] = useState<FeePaymentRequestFormState>(() =>
    initialFeePaymentRequestForm(),
  )
  const [feePaymentApprovalForm, setFeePaymentApprovalForm] = useState<FeePaymentApprovalFormState>(() =>
    initialFeePaymentApprovalForm(),
  )
  const [verificationDocumentForm, setVerificationDocumentForm] =
    useState<VerificationDocumentFormState>(() => initialVerificationDocumentForm())
  const [customsReceiptForm, setCustomsReceiptForm] = useState<CustomsReceiptFormState>(() =>
    initialCustomsReceiptForm(),
  )
  const [verificationRegisterForm, setVerificationRegisterForm] =
    useState<VerificationRegisterFormState>(() => initialVerificationRegisterForm())
  const [taxRefundForm, setTaxRefundForm] = useState<TaxRefundFormState>(() => initialTaxRefundForm())
  const [miscFeeItemForm, setMiscFeeItemForm] = useState<MiscFeeItemFormState>(() =>
    initialMiscFeeItemForm(),
  )
  const [miscFeeAllocationForm, setMiscFeeAllocationForm] =
    useState<MiscFeeAllocationFormState>(() => initialMiscFeeAllocationForm())
  const [settlementForm, setSettlementForm] = useState<FinancialSettlementFormState>(() =>
    initialFinancialSettlementForm(),
  )
  const [manualProfitCostForm, setManualProfitCostForm] = useState<ManualProfitCostFormState>(() =>
    initialManualProfitCostForm(),
  )
  const [loading, setLoading] = useState(false)
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const [loadingReceivables, setLoadingReceivables] = useState(false)
  const [loadingSupplierInvoices, setLoadingSupplierInvoices] = useState(false)
  const [loadingPaymentRequests, setLoadingPaymentRequests] = useState(false)
  const [loadingPayables, setLoadingPayables] = useState(false)
  const [loadingPartnerFeeInvoices, setLoadingPartnerFeeInvoices] = useState(false)
  const [loadingFeePaymentRequests, setLoadingFeePaymentRequests] = useState(false)
  const [loadingFeePayables, setLoadingFeePayables] = useState(false)
  const [loadingVerificationDocuments, setLoadingVerificationDocuments] = useState(false)
  const [loadingVerificationUsage, setLoadingVerificationUsage] = useState(false)
  const [loadingMiscFeeItems, setLoadingMiscFeeItems] = useState(false)
  const [loadingMiscFeeAllocations, setLoadingMiscFeeAllocations] = useState(false)
  const [loadingMiscFeeSummary, setLoadingMiscFeeSummary] = useState(false)
  const [loadingFinancialSettlements, setLoadingFinancialSettlements] = useState(false)
  const [loadingProfitCalculations, setLoadingProfitCalculations] = useState(false)
  const [submittingReceipt, setSubmittingReceipt] = useState(false)
  const [submittingClaim, setSubmittingClaim] = useState(false)
  const [submittingAllocation, setSubmittingAllocation] = useState(false)
  const [submittingSupplierInvoice, setSubmittingSupplierInvoice] = useState(false)
  const [submittingPaymentRequest, setSubmittingPaymentRequest] = useState(false)
  const [submittingPaymentApproval, setSubmittingPaymentApproval] = useState(false)
  const [submittingPartnerFeeInvoice, setSubmittingPartnerFeeInvoice] = useState(false)
  const [submittingFeePaymentRequest, setSubmittingFeePaymentRequest] = useState(false)
  const [submittingFeePaymentApproval, setSubmittingFeePaymentApproval] = useState(false)
  const [submittingVerificationDocument, setSubmittingVerificationDocument] = useState(false)
  const [submittingCustomsReceipt, setSubmittingCustomsReceipt] = useState(false)
  const [submittingVerificationRegister, setSubmittingVerificationRegister] = useState(false)
  const [submittingTaxRefund, setSubmittingTaxRefund] = useState(false)
  const [submittingMiscFeeItem, setSubmittingMiscFeeItem] = useState(false)
  const [submittingMiscFeeAllocation, setSubmittingMiscFeeAllocation] = useState(false)
  const [submittingSettlement, setSubmittingSettlement] = useState(false)
  const [submittingManualProfitCost, setSubmittingManualProfitCost] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void loadOverview()
    void loadReceipts()
    void loadReceivables()
    void loadSupplierInvoices()
    void loadPaymentRequests()
    void loadPayables()
    void loadPartnerFeeInvoices()
    void loadFeePaymentRequests()
    void loadFeePayables()
    void loadVerificationDocuments()
    void loadVerificationUsage()
    void loadMiscFeeItems()
    void loadMiscFeeAllocations()
    void loadMiscFeeAllocationSummary()
    void loadFinancialSettlements()
    void loadProfitCalculations()
    void loadReimbursements()
    void loadPortImportBatches()
    void loadCustomsRecords()
  }, [])

  useEffect(() => {
    if (activeModule === 'reports') {
      void loadFinanceReport(activeReport)
      void loadReportExplanation(activeReport)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule, activeReport])

  // Keep the per-module selection in sync with the detail id in the URL so that
  // opening a detail page directly (or via the browser back/forward) selects the
  // matching record.
  useEffect(() => {
    if (!detailId) return
    switch (activeModule) {
      case 'receipts':
        setSelectedReceiptId(detailId)
        break
      case 'payments':
        setSelectedSupplierInvoiceId(detailId)
        break
      case 'fees':
        setSelectedPartnerFeeInvoiceId(detailId)
        break
      case 'tax':
        setSelectedVerificationDocumentId(detailId)
        break
      case 'misc':
        setSelectedMiscFeeItemId(detailId)
        break
      case 'settlement':
        setSelectedFinancialSettlementId(detailId)
        break
      case 'reimbursements':
        setSelectedReimbursementId(detailId)
        break
      default:
        break
    }
  }, [activeModule, detailId])

  const selectedReceipt = useMemo(
    () => receipts.find((item) => item.id === selectedReceiptId) ?? receipts[0] ?? null,
    [receipts, selectedReceiptId],
  )
  const selectedSupplierInvoice = useMemo(
    () => supplierInvoices.find((item) => item.id === selectedSupplierInvoiceId) ?? supplierInvoices[0] ?? null,
    [supplierInvoices, selectedSupplierInvoiceId],
  )
  const selectedPaymentRequest = useMemo(
    () => paymentRequests.find((item) => item.id === selectedPaymentRequestId) ?? paymentRequests[0] ?? null,
    [paymentRequests, selectedPaymentRequestId],
  )
  const selectedPartnerFeeInvoice = useMemo(
    () =>
      partnerFeeInvoices.find((item) => item.id === selectedPartnerFeeInvoiceId) ??
      partnerFeeInvoices[0] ??
      null,
    [partnerFeeInvoices, selectedPartnerFeeInvoiceId],
  )
  const selectedFeePaymentRequest = useMemo(
    () =>
      feePaymentRequests.find((item) => item.id === selectedFeePaymentRequestId) ??
      feePaymentRequests[0] ??
      null,
    [feePaymentRequests, selectedFeePaymentRequestId],
  )
  const selectedVerificationDocument = useMemo(
    () =>
      verificationDocuments.find((item) => item.id === selectedVerificationDocumentId) ??
      verificationDocuments[0] ??
      null,
    [verificationDocuments, selectedVerificationDocumentId],
  )
  const selectedMiscFeeItem = useMemo(
    () => miscFeeItems.find((item) => item.id === selectedMiscFeeItemId) ?? miscFeeItems[0] ?? null,
    [miscFeeItems, selectedMiscFeeItemId],
  )
  const selectedFinancialSettlement = useMemo(
    () =>
      financialSettlements.find((item) => item.id === selectedFinancialSettlementId) ??
      financialSettlements[0] ??
      null,
    [financialSettlements, selectedFinancialSettlementId],
  )

  useEffect(() => {
    if (!selectedSupplierInvoice) return
    setPaymentRequestForm((current) => ({
      ...current,
      supplier_invoice_id: selectedSupplierInvoice.id,
      requested_amount: selectedSupplierInvoice.unpaid_amount,
      currency: selectedSupplierInvoice.currency,
    }))
    setPaymentApprovalForm((current) => ({
      ...current,
      approved_amount: selectedSupplierInvoice.unpaid_amount,
    }))
  }, [selectedSupplierInvoice?.id, selectedSupplierInvoice?.unpaid_amount, selectedSupplierInvoice?.currency])

  useEffect(() => {
    if (!selectedPartnerFeeInvoice) return
    setFeePaymentRequestForm((current) => ({
      ...current,
      partner_fee_invoice_id: selectedPartnerFeeInvoice.id,
      requested_amount: selectedPartnerFeeInvoice.unpaid_amount,
      currency: selectedPartnerFeeInvoice.currency,
    }))
    setFeePaymentApprovalForm((current) => ({
      ...current,
      approved_amount: selectedPartnerFeeInvoice.unpaid_amount,
    }))
  }, [
    selectedPartnerFeeInvoice?.id,
    selectedPartnerFeeInvoice?.unpaid_amount,
    selectedPartnerFeeInvoice?.currency,
  ])

  useEffect(() => {
    if (!selectedVerificationDocument) return
    setTaxRefundForm((current) => ({
      ...current,
      amount: selectedVerificationDocument.unrefunded_amount,
      currency: selectedVerificationDocument.currency,
    }))
  }, [
    selectedVerificationDocument?.id,
    selectedVerificationDocument?.unrefunded_amount,
    selectedVerificationDocument?.currency,
  ])

  useEffect(() => {
    if (!selectedMiscFeeItem) return
    setMiscFeeAllocationForm((current) => ({
      ...current,
      item_id: selectedMiscFeeItem.id,
      allocation_method: selectedMiscFeeItem.default_allocation_method,
    }))
  }, [
    selectedMiscFeeItem?.id,
    selectedMiscFeeItem?.default_allocation_method,
  ])

  useEffect(() => {
    if (!selectedFinancialSettlement) return
    setManualProfitCostForm((current) => ({
      ...current,
      currency: selectedFinancialSettlement.currency,
      cost_date: selectedFinancialSettlement.settlement_date,
    }))
  }, [
    selectedFinancialSettlement?.id,
    selectedFinancialSettlement?.currency,
    selectedFinancialSettlement?.settlement_date,
  ])

  async function loadOverview() {
    setLoading(true)
    setError('')
    try {
      setOverview(await getFinanceOverview())
    } catch (caught) {
      showError(caught, '财务总览加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadReceipts(preferredId?: string) {
    setLoadingReceipts(true)
    setError('')
    try {
      const result = await listBankReceipts({
        q: receiptSearch.trim() || undefined,
        status: receiptStatusFilter || undefined,
        customer_id: receiptCustomerFilter.trim() || undefined,
      })
      setReceipts(result.items)
      const nextReceiptId =
        preferredId ??
        (result.items.some((item) => item.id === selectedReceiptId) ? selectedReceiptId : null) ??
        result.items[0]?.id ??
        null
      setSelectedReceiptId(nextReceiptId)
    } catch (caught) {
      showError(caught, '银行水单加载失败')
    } finally {
      setLoadingReceipts(false)
    }
  }

  async function loadReceivables() {
    setLoadingReceivables(true)
    setError('')
    try {
      const result = await listReceivables({
        q: receivableSearch.trim() || undefined,
        contract_no: receivableContractFilter.trim() || undefined,
        invoice_no: receivableInvoiceFilter.trim() || undefined,
      })
      setReceivables(result.items)
    } catch (caught) {
      showError(caught, '应收账款加载失败')
    } finally {
      setLoadingReceivables(false)
    }
  }

  async function loadSupplierInvoices(preferredId?: string) {
    setLoadingSupplierInvoices(true)
    setError('')
    try {
      const result = await listSupplierInvoices({
        q: invoiceSearch.trim() || undefined,
        status: invoiceStatusFilter || undefined,
        supplier_id: invoiceSupplierFilter.trim() || undefined,
        purchase_contract_no: invoiceContractFilter.trim() || undefined,
      })
      setSupplierInvoices(result.items)
      const nextInvoiceId =
        preferredId ??
        (result.items.some((item) => item.id === selectedSupplierInvoiceId) ? selectedSupplierInvoiceId : null) ??
        result.items[0]?.id ??
        null
      setSelectedSupplierInvoiceId(nextInvoiceId)
    } catch (caught) {
      showError(caught, '供应商发票加载失败')
    } finally {
      setLoadingSupplierInvoices(false)
    }
  }

  async function loadPaymentRequests(preferredId?: string) {
    setLoadingPaymentRequests(true)
    setError('')
    try {
      const result = await listPaymentRequests({
        q: paymentRequestSearch.trim() || undefined,
        status: paymentRequestStatusFilter || undefined,
        payment_type: paymentRequestTypeFilter || undefined,
        supplier_id: invoiceSupplierFilter.trim() || undefined,
      })
      setPaymentRequests(result.items)
      const nextRequestId =
        preferredId ??
        (result.items.some((item) => item.id === selectedPaymentRequestId) ? selectedPaymentRequestId : null) ??
        result.items[0]?.id ??
        null
      setSelectedPaymentRequestId(nextRequestId)
    } catch (caught) {
      showError(caught, '付款申请加载失败')
    } finally {
      setLoadingPaymentRequests(false)
    }
  }

  async function loadPayables() {
    setLoadingPayables(true)
    setError('')
    try {
      const result = await listPayables({
        q: payableSearch.trim() || undefined,
        status: payableStatusFilter || undefined,
        supplier_id: payableSupplierFilter.trim() || undefined,
        purchase_contract_no: payableContractFilter.trim() || undefined,
      })
      setPayables(result.items)
    } catch (caught) {
      showError(caught, '应付账款加载失败')
    } finally {
      setLoadingPayables(false)
    }
  }

  async function loadPartnerFeeInvoices(preferredId?: string) {
    setLoadingPartnerFeeInvoices(true)
    setError('')
    try {
      const result = await listPartnerFeeInvoices({
        q: feeInvoiceSearch.trim() || undefined,
        status: feeInvoiceStatusFilter || undefined,
        fee_type: feeInvoiceTypeFilter || undefined,
        partner_id: feeInvoicePartnerFilter.trim() || undefined,
        shipment_no: feeInvoiceShipmentFilter.trim() || undefined,
      })
      setPartnerFeeInvoices(result.items)
      const nextInvoiceId =
        preferredId ??
        (result.items.some((item) => item.id === selectedPartnerFeeInvoiceId)
          ? selectedPartnerFeeInvoiceId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedPartnerFeeInvoiceId(nextInvoiceId)
    } catch (caught) {
      showError(caught, '合作伙伴费用发票加载失败')
    } finally {
      setLoadingPartnerFeeInvoices(false)
    }
  }

  async function loadFeePaymentRequests(preferredId?: string) {
    setLoadingFeePaymentRequests(true)
    setError('')
    try {
      const result = await listFeePaymentRequests({
        q: feePaymentRequestSearch.trim() || undefined,
        status: feePaymentRequestStatusFilter || undefined,
        fee_type: feePaymentRequestTypeFilter || undefined,
        partner_id: feeInvoicePartnerFilter.trim() || undefined,
        shipment_no: feeInvoiceShipmentFilter.trim() || undefined,
      })
      setFeePaymentRequests(result.items)
      const nextRequestId =
        preferredId ??
        (result.items.some((item) => item.id === selectedFeePaymentRequestId)
          ? selectedFeePaymentRequestId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedFeePaymentRequestId(nextRequestId)
    } catch (caught) {
      showError(caught, '付费申请加载失败')
    } finally {
      setLoadingFeePaymentRequests(false)
    }
  }

  async function loadFeePayables() {
    setLoadingFeePayables(true)
    setError('')
    try {
      const result = await listFeePayables({
        q: feePayableSearch.trim() || undefined,
        status: feePayableStatusFilter || undefined,
        fee_type: feePayableTypeFilter || undefined,
        partner_id: feePayablePartnerFilter.trim() || undefined,
        shipment_no: feePayableShipmentFilter.trim() || undefined,
      })
      setFeePayables(result.items)
    } catch (caught) {
      showError(caught, '应付费用加载失败')
    } finally {
      setLoadingFeePayables(false)
    }
  }

  async function loadVerificationDocuments(preferredId?: string) {
    setLoadingVerificationDocuments(true)
    setError('')
    try {
      const result = await listVerificationDocuments({
        q: verificationSearch.trim() || undefined,
        status: verificationStatusFilter || undefined,
        owner_user_id: verificationOwnerFilter.trim() || undefined,
        shipment_no: verificationShipmentFilter.trim() || undefined,
        reminder_status: verificationReminderFilter || undefined,
      })
      setVerificationDocuments(result.items)
      const nextDocumentId =
        preferredId ??
        (result.items.some((item) => item.id === selectedVerificationDocumentId)
          ? selectedVerificationDocumentId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedVerificationDocumentId(nextDocumentId)
    } catch (caught) {
      showError(caught, '核销单加载失败')
    } finally {
      setLoadingVerificationDocuments(false)
    }
  }

  async function loadVerificationUsage() {
    setLoadingVerificationUsage(true)
    setError('')
    try {
      const result = await listVerificationUsage({
        q: verificationUsageSearch.trim() || undefined,
        status: verificationUsageStatusFilter || undefined,
        shipment_no: verificationUsageShipmentFilter.trim() || undefined,
        reminder_status: verificationUsageReminderFilter || undefined,
      })
      setVerificationUsage(result.items)
    } catch (caught) {
      showError(caught, '核销单使用情况加载失败')
    } finally {
      setLoadingVerificationUsage(false)
    }
  }

  async function loadMiscFeeItems(preferredId?: string) {
    setLoadingMiscFeeItems(true)
    setError('')
    try {
      const result = await listMiscFeeItems({
        q: miscFeeItemSearch.trim() || undefined,
        category: miscFeeItemCategoryFilter || undefined,
        status: miscFeeItemStatusFilter || undefined,
      })
      setMiscFeeItems(result.items)
      const nextItemId =
        preferredId ??
        (result.items.some((item) => item.id === selectedMiscFeeItemId) ? selectedMiscFeeItemId : null) ??
        result.items[0]?.id ??
        null
      setSelectedMiscFeeItemId(nextItemId)
    } catch (caught) {
      showError(caught, '杂费项目加载失败')
    } finally {
      setLoadingMiscFeeItems(false)
    }
  }

  async function loadMiscFeeAllocations() {
    setLoadingMiscFeeAllocations(true)
    setError('')
    try {
      const result = await listMiscFeeAllocations({
        q: miscFeeAllocationSearch.trim() || undefined,
        category: miscFeeAllocationCategoryFilter || undefined,
        shipment_no: miscFeeAllocationShipmentFilter.trim() || undefined,
        sales_user_id: miscFeeAllocationSalesFilter.trim() || undefined,
      })
      setMiscFeeAllocations(result.items)
    } catch (caught) {
      showError(caught, '杂费分摊加载失败')
    } finally {
      setLoadingMiscFeeAllocations(false)
    }
  }

  async function loadMiscFeeAllocationSummary() {
    setLoadingMiscFeeSummary(true)
    setError('')
    try {
      const result = await listMiscFeeAllocationSummary({
        shipment_no: miscFeeSummaryShipmentFilter.trim() || undefined,
        category: miscFeeSummaryCategoryFilter || undefined,
      })
      setMiscFeeAllocationSummary(result.items)
    } catch (caught) {
      showError(caught, '杂费分摊汇总加载失败')
    } finally {
      setLoadingMiscFeeSummary(false)
    }
  }

  async function loadFinancialSettlements(preferredId?: string) {
    setLoadingFinancialSettlements(true)
    setError('')
    try {
      const result = await listFinancialSettlements({
        q: settlementSearch.trim() || undefined,
        status: 'locked',
        shipment_no: settlementShipmentFilter.trim() || undefined,
      })
      setFinancialSettlements(result.items)
      const nextSettlementId =
        preferredId ??
        (result.items.some((item) => item.id === selectedFinancialSettlementId)
          ? selectedFinancialSettlementId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedFinancialSettlementId(nextSettlementId)
    } catch (caught) {
      showError(caught, '财务结算加载失败')
    } finally {
      setLoadingFinancialSettlements(false)
    }
  }

  async function loadProfitCalculations() {
    setLoadingProfitCalculations(true)
    setError('')
    try {
      const result = await listProfitCalculations({
        q: profitCalculationSearch.trim() || undefined,
        shipment_no: profitCalculationShipmentFilter.trim() || undefined,
      })
      setProfitCalculations(result.items)
    } catch (caught) {
      showError(caught, '利润核算加载失败')
    } finally {
      setLoadingProfitCalculations(false)
    }
  }

  async function loadReimbursements(preferredId?: string) {
    setLoadingReimbursements(true)
    setError('')
    try {
      const result = await listReimbursements({
        q: reimbursementSearch.trim() || undefined,
        status: reimbursementStatusFilter || undefined,
        category: reimbursementCategoryFilter || undefined,
      })
      setReimbursements(result.items)
      setReimbursementsTotalAmount(result.total_amount)
      const nextId =
        preferredId ??
        (result.items.some((item) => item.id === selectedReimbursementId)
          ? selectedReimbursementId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedReimbursementId(nextId)
    } catch (caught) {
      showError(caught, '报销单加载失败')
    } finally {
      setLoadingReimbursements(false)
    }
  }

  async function submitReimbursement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingReimbursement(true)
    setMessage('')
    setError('')
    try {
      const payload: ReimbursementCreatePayload = {
        reimbursement_no: reimbursementForm.reimbursement_no.trim(),
        applicant_user_id: reimbursementForm.applicant_user_id.trim(),
        applicant_user_name: reimbursementForm.applicant_user_name.trim(),
        department: reimbursementForm.department.trim(),
        category: reimbursementForm.category,
        currency: reimbursementForm.currency.trim(),
        amount: reimbursementForm.amount.trim(),
        reason: reimbursementForm.reason.trim() || undefined,
        remark: reimbursementForm.remark.trim() || undefined,
      }
      const created = await createReimbursement(payload)
      setMessage(`已登记报销单 ${created.reimbursement_no}`)
      setReimbursementForm({
        reimbursement_no: '',
        applicant_user_id: '',
        applicant_user_name: '',
        department: '',
        category: 'travel',
        currency: 'CNY',
        amount: '',
        reason: '',
        remark: '',
      })
      await loadReimbursements(created.id)
    } catch (caught) {
      showError(caught, '报销单登记失败')
    } finally {
      setSubmittingReimbursement(false)
    }
  }

  async function handleReimbursementApprove(approved: boolean) {
    if (!selectedReimbursementId) return
    setSubmittingReimbursementAction(true)
    setMessage('')
    setError('')
    try {
      const updated = await approveReimbursement(selectedReimbursementId, { approved })
      setMessage(`报销单 ${updated.reimbursement_no} 已${approved ? '审批通过' : '驳回'}`)
      await loadReimbursements(updated.id)
    } catch (caught) {
      showError(caught, '报销单审批失败')
    } finally {
      setSubmittingReimbursementAction(false)
    }
  }

  async function handleReimbursementPay() {
    if (!selectedReimbursementId) return
    setSubmittingReimbursementAction(true)
    setMessage('')
    setError('')
    try {
      const updated = await payReimbursement(selectedReimbursementId, {
        payment_method: reimbursementPayMethod,
      })
      setMessage(`报销单 ${updated.reimbursement_no} 已付款`)
      await loadReimbursements(updated.id)
    } catch (caught) {
      showError(caught, '报销单付款失败')
    } finally {
      setSubmittingReimbursementAction(false)
    }
  }

  async function loadPortImportBatches() {
    setLoadingPortBatches(true)
    setError('')
    try {
      const result = await listPortImportBatches({
        source: portBatchSourceFilter.trim() || undefined,
      })
      setPortImportBatches(result.items)
    } catch (caught) {
      showError(caught, '口岸导入批次加载失败')
    } finally {
      setLoadingPortBatches(false)
    }
  }

  async function loadCustomsRecords() {
    setLoadingCustomsRecords(true)
    setError('')
    try {
      const result = await listCustomsDeclarationRecords({
        declaration_no: customsDeclarationFilter.trim() || undefined,
        customs_receipt_no: customsReceiptFilter.trim() || undefined,
        trade_type: customsTradeTypeFilter || undefined,
      })
      setCustomsRecords(result.items)
    } catch (caught) {
      showError(caught, '进出口报关数据加载失败')
    } finally {
      setLoadingCustomsRecords(false)
    }
  }

  async function submitPortBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingPortBatch(true)
    setMessage('')
    setError('')
    try {
      const record: CustomsDeclarationRecordCreatePayload = {
        declaration_no: portRecordForm.declaration_no.trim(),
        customs_receipt_no: portRecordForm.customs_receipt_no.trim() || undefined,
        trade_type: portRecordForm.trade_type,
        export_contract_no: portRecordForm.export_contract_no.trim() || undefined,
        customs_date: portRecordForm.customs_date || undefined,
        product_name: portRecordForm.product_name.trim(),
        hs_code: portRecordForm.hs_code.trim() || undefined,
        quantity: portRecordForm.quantity.trim() || undefined,
        unit: portRecordForm.unit.trim() || undefined,
        amount: portRecordForm.amount.trim(),
        currency: portRecordForm.currency.trim(),
        customer_or_supplier: portRecordForm.customer_or_supplier.trim() || undefined,
      }
      const payload: PortImportBatchCreatePayload = {
        batch_no: portBatchForm.batch_no.trim(),
        source: portBatchForm.source.trim(),
        imported_at: portBatchForm.imported_at,
        record_count: 1,
        remark: portBatchForm.remark.trim() || undefined,
        records: [record],
      }
      const created = await createPortImportBatch(payload)
      setMessage(`已导入口岸数据批次 ${created.batch_no}`)
      setPortBatchForm({ batch_no: '', source: '', imported_at: '', remark: '' })
      setPortRecordForm({
        declaration_no: '',
        customs_receipt_no: '',
        trade_type: 'export',
        export_contract_no: '',
        customs_date: '',
        product_name: '',
        hs_code: '',
        quantity: '',
        unit: '',
        amount: '',
        currency: 'USD',
        customer_or_supplier: '',
      })
      await loadPortImportBatches()
      await loadCustomsRecords()
    } catch (caught) {
      showError(caught, '口岸数据导入失败')
    } finally {
      setSubmittingPortBatch(false)
    }
  }

  function financeReportFilters(report: string) {
    const base = {
      date_from: reportDateFrom || undefined,
      date_to: reportDateTo || undefined,
      currency: reportCurrency.trim() || undefined,
    }
    if (report === 'receipt-usage') {
      return { ...base, receipt_no: reportReceiptNo.trim() || undefined }
    }
    if (report === 'bank-receipt-summary') {
      return { ...base, receipt_type: reportReceiptType.trim() || undefined }
    }
    if (report === 'goods-payment') {
      return {
        ...base,
        supplier_name: reportSupplierName.trim() || undefined,
        status: reportStatus.trim() || undefined,
      }
    }
    if (report === 'fee-payment') {
      return {
        ...base,
        partner_name: reportPartnerName.trim() || undefined,
        fee_type: reportFeeType.trim() || undefined,
        sales_user_id: reportSalesUserId.trim() || undefined,
        status: reportStatus.trim() || undefined,
      }
    }
    if (report === 'customs-receipt-collection') {
      return {
        date_from: reportDateFrom || undefined,
        date_to: reportDateTo || undefined,
        owner_user_id: reportOwnerUserId.trim() || undefined,
        reminder_status: reportReminderStatus.trim() || undefined,
        include_registered: reportIncludeRegistered,
      }
    }
    return { ...base, status: reportStatus.trim() || undefined }
  }

  async function loadFinanceReport(report: string) {
    setLoadingReport(true)
    setError('')
    setReportDrilldown(null)
    const filters = financeReportFilters(report)
    try {
      if (report === 'receipt-usage') {
        setReceiptUsageReport(await getReceiptUsageReport(filters))
      } else if (report === 'bank-receipt-summary') {
        setBankReceiptSummaryReport(await getBankReceiptSummaryReport(filters))
      } else if (report === 'goods-payment') {
        setGoodsPaymentReport(await getGoodsPaymentReport(filters))
      } else if (report === 'fee-payment') {
        setFeePaymentReport(await getFeePaymentReport(filters))
      } else if (report === 'customs-receipt-collection') {
        setCustomsCollectionReport(await getCustomsReceiptCollectionReport(filters))
      } else if (report === 'tax-refund-statistics') {
        setTaxRefundStatisticsReport(await getTaxRefundStatisticsReport(filters))
      }
    } catch (caught) {
      showError(caught, '财务报表加载失败')
    } finally {
      setLoadingReport(false)
    }
  }

  async function exportFinanceReport(report: string) {
    setExportingReport(true)
    setMessage('')
    setError('')
    const filters = financeReportFilters(report)
    try {
      const exported =
        report === 'receipt-usage'
          ? await exportReceiptUsageReport(filters)
          : report === 'bank-receipt-summary'
            ? await exportBankReceiptSummaryReport(filters)
            : report === 'goods-payment'
              ? await exportGoodsPaymentReport(filters)
              : report === 'fee-payment'
                ? await exportFeePaymentReport(filters)
                : report === 'customs-receipt-collection'
                  ? await exportCustomsReceiptCollectionReport(filters)
                  : await exportTaxRefundStatisticsReport(filters)
      downloadCsv(exported.filename, exported.content)
      setMessage(`已导出 ${exported.total} 行财务报表`)
    } catch (caught) {
      showError(caught, '财务报表导出失败')
    } finally {
      setExportingReport(false)
    }
  }

  async function loadReportExplanation(report: string) {
    setLoadingReportExplanation(true)
    setError('')
    try {
      setReportExplanation(await explainFinanceReport(report))
    } catch (caught) {
      showError(caught, '报表口径加载失败')
    } finally {
      setLoadingReportExplanation(false)
    }
  }

  async function openFinanceReportDrilldown(report: string, sourceNo: string) {
    setError('')
    try {
      setReportDrilldown(await drilldownFinanceReport(report, sourceNo))
    } catch (caught) {
      showError(caught, '报表下钻失败')
    }
  }

  async function autoMatchPortCustomsReceipts() {
    setMatchingCustomsReceipts(true)
    setMessage('')
    setError('')
    try {
      const result = await autoMatchCustomsReceipts()
      setMessage(`已自动匹配 ${result.matched_count} 条报关回单`)
      await loadCustomsRecords()
      await loadFinanceReport('customs-receipt-collection')
    } catch (caught) {
      showError(caught, '报关回单自动匹配失败')
    } finally {
      setMatchingCustomsReceipts(false)
    }
  }

  async function submitReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingReceipt(true)
    setMessage('')
    setError('')
    try {
      const created = await createBankReceipt(bankReceiptPayload(receiptForm))
      setMessage(`已录入银行水单 ${created.receipt_no}`)
      setReceiptForm(initialBankReceiptForm())
      await loadReceipts(created.id)
    } catch (caught) {
      showError(caught, '银行水单录入失败')
    } finally {
      setSubmittingReceipt(false)
    }
  }

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedReceipt) return
    setSubmittingClaim(true)
    setMessage('')
    setError('')
    try {
      const claimed = await claimBankReceipt(selectedReceipt.id, receiptClaimPayload(claimForm))
      setMessage(`已认领银行水单 ${claimed.receipt_no}`)
      setClaimForm(initialReceiptClaimForm())
      setReceipts((current) => current.map((item) => (item.id === claimed.id ? claimed : item)))
      setSelectedReceiptId(claimed.id)
      await loadReceipts(claimed.id)
    } catch (caught) {
      showError(caught, '银行水单认领失败')
    } finally {
      setSubmittingClaim(false)
    }
  }

  async function submitAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedReceipt) return
    setSubmittingAllocation(true)
    setMessage('')
    setError('')
    try {
      const allocated = await allocateBankReceipt(
        selectedReceipt.id,
        receiptAllocationPayload(allocationForm),
      )
      setMessage(`已分摊银行水单 ${allocated.receipt_no}`)
      setAllocationForm(initialReceiptAllocationForm(allocated.currency))
      setReceipts((current) => current.map((item) => (item.id === allocated.id ? allocated : item)))
      setSelectedReceiptId(allocated.id)
      await loadReceipts(allocated.id)
      await loadReceivables()
    } catch (caught) {
      showError(caught, '收款分摊失败')
    } finally {
      setSubmittingAllocation(false)
    }
  }

  async function submitSupplierInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingSupplierInvoice(true)
    setMessage('')
    setError('')
    try {
      const created = await createSupplierInvoice(supplierInvoicePayload(supplierInvoiceForm))
      setMessage(`已登记供应商发票 ${created.invoice_no}`)
      setSupplierInvoiceForm(initialSupplierInvoiceForm())
      await loadSupplierInvoices(created.id)
      await loadPayables()
    } catch (caught) {
      showError(caught, '供应商发票登记失败')
    } finally {
      setSubmittingSupplierInvoice(false)
    }
  }

  async function submitPaymentRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingPaymentRequest(true)
    setMessage('')
    setError('')
    try {
      const created = await createPaymentRequest(paymentRequestPayload(paymentRequestForm))
      setMessage(`已新增付款申请 ${created.request_no}`)
      setPaymentRequestForm(initialPaymentRequestForm(selectedSupplierInvoice ?? undefined))
      await loadPaymentRequests(created.id)
    } catch (caught) {
      showError(caught, '付款申请新增失败')
    } finally {
      setSubmittingPaymentRequest(false)
    }
  }

  async function submitPaymentApproval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPaymentRequest) return
    setSubmittingPaymentApproval(true)
    setMessage('')
    setError('')
    try {
      const approved = await approvePaymentRequest(
        selectedPaymentRequest.id,
        paymentApprovalPayload(paymentApprovalForm),
      )
      setMessage(`已审批付款申请 ${approved.request_no}`)
      setPaymentApprovalForm(initialPaymentApprovalForm())
      await loadPaymentRequests(approved.id)
      await loadSupplierInvoices(selectedSupplierInvoice?.id)
      await loadPayables()
    } catch (caught) {
      showError(caught, '付款审批失败')
    } finally {
      setSubmittingPaymentApproval(false)
    }
  }

  async function submitPartnerFeeInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingPartnerFeeInvoice(true)
    setMessage('')
    setError('')
    try {
      const created = await createPartnerFeeInvoice(partnerFeeInvoicePayload(partnerFeeInvoiceForm))
      setMessage(`已登记合作伙伴费用发票 ${created.invoice_no}`)
      setPartnerFeeInvoiceForm(initialPartnerFeeInvoiceForm())
      await loadPartnerFeeInvoices(created.id)
      await loadFeePayables()
    } catch (caught) {
      showError(caught, '合作伙伴费用发票登记失败')
    } finally {
      setSubmittingPartnerFeeInvoice(false)
    }
  }

  async function submitFeePaymentRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingFeePaymentRequest(true)
    setMessage('')
    setError('')
    try {
      const created = await createFeePaymentRequest(feePaymentRequestPayload(feePaymentRequestForm))
      setMessage(`已新增付费申请 ${created.request_no}`)
      setFeePaymentRequestForm(initialFeePaymentRequestForm(selectedPartnerFeeInvoice ?? undefined))
      await loadFeePaymentRequests(created.id)
    } catch (caught) {
      showError(caught, '付费申请新增失败')
    } finally {
      setSubmittingFeePaymentRequest(false)
    }
  }

  async function submitFeePaymentApproval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedFeePaymentRequest) return
    setSubmittingFeePaymentApproval(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveFeePaymentRequest(
        selectedFeePaymentRequest.id,
        feePaymentApprovalPayload(feePaymentApprovalForm),
      )
      setMessage(`已审批付费申请 ${approved.request_no}`)
      setFeePaymentApprovalForm(initialFeePaymentApprovalForm())
      await loadFeePaymentRequests(approved.id)
      await loadPartnerFeeInvoices(selectedPartnerFeeInvoice?.id)
      await loadFeePayables()
    } catch (caught) {
      showError(caught, '付费审批失败')
    } finally {
      setSubmittingFeePaymentApproval(false)
    }
  }

  async function submitVerificationDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingVerificationDocument(true)
    setMessage('')
    setError('')
    try {
      const created = await createVerificationDocument(
        verificationDocumentPayload(verificationDocumentForm),
      )
      setMessage(`已领用核销单 ${created.document_no}`)
      setVerificationDocumentForm(initialVerificationDocumentForm())
      await loadVerificationDocuments(created.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, '核销单领用失败')
    } finally {
      setSubmittingVerificationDocument(false)
    }
  }

  async function submitCustomsReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingCustomsReceipt(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerVerificationCustomsReceipt(
        selectedVerificationDocument.id,
        customsReceiptPayload(customsReceiptForm),
      )
      setMessage(`已登记报关回单 ${updated.customs_receipt_no ?? updated.document_no}`)
      setCustomsReceiptForm(initialCustomsReceiptForm())
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, '报关回单登记失败')
    } finally {
      setSubmittingCustomsReceipt(false)
    }
  }

  async function submitVerificationRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingVerificationRegister(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerVerification(
        selectedVerificationDocument.id,
        verificationRegisterPayload(verificationRegisterForm),
      )
      setMessage(`已核销 ${updated.document_no}`)
      setVerificationRegisterForm(initialVerificationRegisterForm())
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, '核销登记失败')
    } finally {
      setSubmittingVerificationRegister(false)
    }
  }

  async function submitTaxRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingTaxRefund(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerTaxRefund(
        selectedVerificationDocument.id,
        taxRefundPayload(taxRefundForm),
      )
      setMessage(`已登记退税 ${updated.document_no}`)
      setTaxRefundForm(initialTaxRefundForm(updated.currency, updated.unrefunded_amount))
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
      await loadOverview()
    } catch (caught) {
      showError(caught, '退税登记失败')
    } finally {
      setSubmittingTaxRefund(false)
    }
  }

  async function submitMiscFeeItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingMiscFeeItem(true)
    setMessage('')
    setError('')
    try {
      const created = await createMiscFeeItem(miscFeeItemPayload(miscFeeItemForm))
      setMessage(`已配置杂费项目 ${created.name}`)
      setMiscFeeItemForm(initialMiscFeeItemForm())
      await loadMiscFeeItems(created.id)
    } catch (caught) {
      showError(caught, '杂费项目配置失败')
    } finally {
      setSubmittingMiscFeeItem(false)
    }
  }

  async function submitMiscFeeAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingMiscFeeAllocation(true)
    setMessage('')
    setError('')
    try {
      const created = await createMiscFeeAllocation(
        miscFeeAllocationPayload(miscFeeAllocationForm, selectedMiscFeeItem),
      )
      setMessage(`已分摊杂费 ${created.allocation_no}`)
      setMiscFeeAllocationForm(initialMiscFeeAllocationForm(selectedMiscFeeItem ?? undefined))
      await loadMiscFeeAllocations()
      await loadMiscFeeAllocationSummary()
      await loadOverview()
    } catch (caught) {
      showError(caught, '杂费分摊失败')
    } finally {
      setSubmittingMiscFeeAllocation(false)
    }
  }

  async function submitFinancialSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingSettlement(true)
    setMessage('')
    setError('')
    try {
      const created = await createFinancialSettlement(financialSettlementPayload(settlementForm))
      setMessage(`已锁定财务结算 ${created.settlement_no}`)
      setSettlementForm(initialFinancialSettlementForm())
      await loadFinancialSettlements(created.id)
      await loadProfitCalculations()
      await loadOverview()
    } catch (caught) {
      showError(caught, '财务结算锁定失败')
    } finally {
      setSubmittingSettlement(false)
    }
  }

  async function submitManualProfitCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedFinancialSettlement) return
    setSubmittingManualProfitCost(true)
    setMessage('')
    setError('')
    try {
      const updated = await addManualProfitCost(
        selectedFinancialSettlement.id,
        manualProfitCostPayload(manualProfitCostForm),
      )
      setMessage(`已关联手工成本 ${manualProfitCostForm.cost_no}`)
      setManualProfitCostForm(
        initialManualProfitCostForm(updated.currency, updated.settlement_date),
      )
      await loadFinancialSettlements(updated.id)
      await loadProfitCalculations()
    } catch (caught) {
      showError(caught, '手工成本关联失败')
    } finally {
      setSubmittingManualProfitCost(false)
    }
  }

  const summary = overview?.summary
  const currencyLabel = summary?.currency_label ?? '-'
  const profitAmount = Number(summary?.profit_amount ?? 0)
  const totalReceiptAmount = receipts.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalUnallocatedAmount = receipts.reduce((sum, item) => sum + Number(item.unallocated_amount || 0), 0)
  const selectedReceiptCanClaim = selectedReceipt?.status === 'unclaimed'
  const selectedReceiptCanAllocate = selectedReceipt
    ? selectedReceipt.status !== 'unclaimed' && Number(selectedReceipt.unallocated_amount) > 0
    : false
  const selectedPaymentRequestCanApprove = selectedPaymentRequest?.status === 'submitted'
  const selectedFeePaymentRequestCanApprove = selectedFeePaymentRequest?.status === 'submitted'
  const selectedVerificationCanRegisterCustoms =
    selectedVerificationDocument?.status === 'issued' ||
    selectedVerificationDocument?.status === 'customs_receipt_registered'
  const selectedVerificationCanVerify =
    selectedVerificationDocument?.status === 'customs_receipt_registered' ||
    selectedVerificationDocument?.status === 'verified'
  const selectedVerificationCanRefund =
    selectedVerificationDocument?.status === 'verified' ||
    (selectedVerificationDocument?.status === 'refunded' &&
      Number(selectedVerificationDocument.unrefunded_amount) > 0)
  const totalMiscFeeAmount = miscFeeAllocationSummary.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  )
  const totalSettlementSalesIncome = financialSettlements.reduce(
    (sum, item) => sum + Number(item.sales_income || 0),
    0,
  )
  const totalSettlementGrossProfit = financialSettlements.reduce(
    (sum, item) => sum + Number(item.gross_profit || 0),
    0,
  )
  const totalProfitCalculationGrossProfit = profitCalculations.reduce(
    (sum, item) => sum + Number(item.gross_profit || 0),
    0,
  )

  const summaryStrip = (
    <div className="summary-strip" aria-label="财务管理概览">
      <Metric label="出货单" value={summary?.shipment_count ?? 0} />
      <Metric label="应收金额" value={formatFinanceAmount(summary?.receivable_amount, currencyLabel)} />
      <Metric label="应付成本" value={formatFinanceAmount(summary?.payable_amount, currencyLabel)} />
      <Metric
        label="预计利润"
        value={formatFinanceAmount(summary?.profit_amount, currencyLabel)}
        intent={profitAmount < 0 ? 'danger' : 'normal'}
      />
      <Metric label="开票通知" value={summary?.invoice_notice_count ?? 0} />
      <Metric label="样品费用" value={formatFinanceAmount(summary?.sample_fee_amount, '多币种')} />
    </div>
  )

  const moduleAlerts = (
    <>
      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}
    </>
  )

  const financeModuleCards: {
    module: FinanceModule
    icon: ReactNode
    title: string
    caption: string
    metric: string
    metricLabel: string
  }[] = [
    {
      module: 'overview',
      icon: <BarChart3 size={20} />,
      title: '经营总览',
      caption: '出运利润 / 分币种 / 状态汇总',
      metric: formatFinanceAmount(summary?.profit_amount, currencyLabel),
      metricLabel: '预计利润',
    },
    {
      module: 'receipts',
      icon: <Wallet size={20} />,
      title: '收款管理',
      caption: '银行水单认领、分摊与应收账款',
      metric: formatFinanceAmount(summary?.receivable_amount, currencyLabel),
      metricLabel: '应收金额',
    },
    {
      module: 'payments',
      icon: <Coins size={20} />,
      title: '付款管理',
      caption: '供应商发票、付款申请与应付账款',
      metric: formatFinanceAmount(summary?.payable_amount, currencyLabel),
      metricLabel: '应付成本',
    },
    {
      module: 'fees',
      icon: <Handshake size={20} />,
      title: '付费管理',
      caption: '合作伙伴费用发票、付费申请与审批',
      metric: String(summary?.active_partner_count ?? 0),
      metricLabel: '启用伙伴',
    },
    {
      module: 'tax',
      icon: <ShieldCheck size={20} />,
      title: '核销退税',
      caption: '核销单领用、回单核销与退税登记',
      metric: String(verificationDocuments.length),
      metricLabel: '核销单',
    },
    {
      module: 'misc',
      icon: <FileStack size={20} />,
      title: '杂费管理',
      caption: '杂费项目配置与单票分摊查询',
      metric: String(miscFeeItems.length),
      metricLabel: '杂费项目',
    },
    {
      module: 'settlement',
      icon: <PackagePlus size={20} />,
      title: '结算核算',
      caption: '单票结算锁定、手工成本与利润核算',
      metric: String(financialSettlements.length),
      metricLabel: '锁定结算',
    },
    {
      module: 'reimbursements',
      icon: <Receipt size={20} />,
      title: '报销管理',
      caption: '员工报销单登记、审批与付款',
      metric: String(reimbursements.length),
      metricLabel: '报销单',
    },
    {
      module: 'portData',
      icon: <Ship size={20} />,
      title: '口岸数据导入',
      caption: '进出口报关数据导入与查询',
      metric: String(portImportBatches.length),
      metricLabel: '导入批次',
    },
    {
      module: 'reports',
      icon: <FileSpreadsheet size={20} />,
      title: '财务报表',
      caption: '水单、收付与退税统计报表',
      metric: '6',
      metricLabel: '报表',
    },
  ]

  if (activeModule === 'home') {
    return (
      <section className="finance-page finance-home">
        <OperationFlowRail
          activeLabel="银行水单"
          activePath={financeReceiptsPath}
          kind="finance"
          onNavigate={onNavigate}
        />

        {summaryStrip}
        {moduleAlerts}

        <section className="finance-module-cards" aria-label="财务模块入口">
          {financeModuleCards.map((card) => (
            <button
              key={card.module}
              className="finance-module-card"
              type="button"
              onClick={() => goModule(card.module)}
            >
              <span className="finance-module-card-icon">{card.icon}</span>
              <span className="finance-module-card-body">
                <strong>{card.title}</strong>
                <small>{card.caption}</small>
              </span>
              <span className="finance-module-card-metric">
                <em>{card.metric}</em>
                <span>{card.metricLabel}</span>
              </span>
              <ChevronRight className="finance-module-card-arrow" size={18} />
            </button>
          ))}
        </section>
      </section>
    )
  }

  const moduleHeader = (
    <div className="finance-subnav">
      <button className="finance-back-button" type="button" onClick={goFinanceHome}>
        <ArrowLeft size={16} />
        财务首页
      </button>
      <nav className="finance-tab-rail" aria-label="财务模块切换">
        {financeModuleCards.map((card) => (
          <button
            key={card.module}
            aria-current={card.module === activeModule ? 'page' : undefined}
            className={card.module === activeModule ? 'finance-tab active' : 'finance-tab'}
            type="button"
            onClick={() => goModule(card.module)}
          >
            {card.title}
          </button>
        ))}
      </nav>
    </div>
  )

  if (activeModule === 'overview') {
    return (
      <section className="finance-page">
        {moduleHeader}
        {summaryStrip}
        {moduleAlerts}
        {loading && !overview ? (
          <section className="workspace-panel">
            <Skeleton active paragraph={{ rows: 8 }} />
          </section>
        ) : (
          <section className="finance-grid">
          <section className="workspace-panel finance-profit-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Wallet size={18} />} title="出运利润明细" />
            </div>
            <Table<FinanceShipmentProfit>
              columns={[
                { title: '出货单', dataIndex: 'code', render: (value: string) => <strong>{value}</strong> },
                { title: '客户', dataIndex: 'customer_name' },
                { title: '状态', dataIndex: 'approval_status', render: shipmentStatusLabel },
                { title: '出货日期', dataIndex: 'shipment_date', render: formatDate },
                { title: '计划出运', dataIndex: 'planned_ship_date', render: formatDate },
                {
                  title: '应收',
                  dataIndex: 'receivable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '应付',
                  dataIndex: 'payable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '利润',
                  dataIndex: 'profit_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '利润率', dataIndex: 'profit_rate', render: formatPercent },
              ]}
              dataSource={overview?.shipment_profit_items ?? []}
              loading={loading}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </section>

          <section className="workspace-panel finance-side-panel">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="分币种汇总" />
            <Table<FinanceCurrencySummary>
              columns={[
                { title: '币种', dataIndex: 'currency' },
                { title: '出货', dataIndex: 'shipment_count' },
                {
                  title: '应收',
                  dataIndex: 'receivable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '利润',
                  dataIndex: 'profit_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '利润率', dataIndex: 'profit_rate', render: formatPercent },
              ]}
              dataSource={overview?.currency_summaries ?? []}
              pagination={false}
              rowKey="currency"
              size="small"
            />
          </section>

          <section className="workspace-panel finance-side-panel">
            <PanelTitle icon={<CheckCircle2 size={18} />} title="开票和付款状态" />
            <div className="finance-status-stack">
              <div>
                <strong>采购开票通知</strong>
                <Table<FinanceStatusAmount>
                  columns={[
                    { title: '状态', dataIndex: 'status', render: purchaseInvoiceNoticeStatusLabel },
                    { title: '数量', dataIndex: 'count' },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      render: (value: string, record) => formatFinanceAmount(value, record.currency),
                    },
                  ]}
                  dataSource={overview?.invoice_notice_statuses ?? []}
                  pagination={false}
                  rowKey={(record) => `${record.status}-${record.currency}`}
                  size="small"
                />
              </div>
              <div>
                <strong>样品费用付款</strong>
                <Table<FinanceStatusAmount>
                  columns={[
                    { title: '状态', dataIndex: 'status', render: samplePaymentStatusLabel },
                    { title: '数量', dataIndex: 'count' },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      render: (value: string, record) => formatFinanceAmount(value, record.currency),
                    },
                  ]}
                  dataSource={overview?.sample_fee_statuses ?? []}
                  pagination={false}
                  rowKey={(record) => `${record.status}-${record.currency}`}
                  size="small"
                />
              </div>
            </div>
          </section>

          <section className="workspace-panel finance-side-panel">
            <PanelTitle icon={<ShieldCheck size={18} />} title="合作伙伴费用入口" />
            <dl className="finance-compact-list">
              <div>
                <dt>合作伙伴</dt>
                <dd>{summary?.partner_count ?? 0}</dd>
              </div>
              <div>
                <dt>启用伙伴</dt>
                <dd>{summary?.active_partner_count ?? 0}</dd>
              </div>
              <div>
                <dt>待收税票金额</dt>
                <dd>{formatFinanceAmount(summary?.invoice_notice_amount, '多币种')}</dd>
              </div>
            </dl>
            <Table<FinancePartnerTypeSummary>
              columns={[
                { title: '伙伴类型', dataIndex: 'partner_type', render: partnerTypeLabel },
                { title: '数量', dataIndex: 'count' },
              ]}
              dataSource={overview?.partner_type_summaries ?? []}
              pagination={false}
              rowKey="partner_type"
              size="small"
            />
          </section>
        </section>
        )}
      </section>
    )
  }

  if (activeModule === 'receipts') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('receipts')}>
              <ArrowLeft size={16} />
              收款管理
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-receipt-grid'}
          aria-label="收款管理"
        >
        {!detailId ? (
        <section className="workspace-panel finance-receipt-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="银行水单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadReceipts()
              }}
            >
              <label>
                水单搜索
                <Input
                  value={receiptSearch}
                  placeholder="水单号 / 付款人 / 客户"
                  onChange={(event) => setReceiptSearch(event.target.value)}
                />
              </label>
              <label>
                水单状态
                <FormSelect
                  value={receiptStatusFilter}
                  onChange={(event) => setReceiptStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {receiptStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                客户标识
                <Input
                  value={receiptCustomerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setReceiptCustomerFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>

          <div className="finance-receipt-strip">
            <span>本次列表 {receipts.length} 条</span>
            <strong>{formatFinanceAmount(totalReceiptAmount.toFixed(2), receipts[0]?.currency ?? 'USD')}</strong>
            <span>未分摊 {formatFinanceAmount(totalUnallocatedAmount.toFixed(2), receipts[0]?.currency ?? 'USD')}</span>
          </div>

          <Table<BankReceipt>
            columns={[
              {
                title: '水单号',
                dataIndex: 'receipt_no',
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: receiptStatusTag },
              { title: '性质', dataIndex: 'receipt_type', render: receiptTypeLabel },
              { title: '收款日', dataIndex: 'received_at', render: formatDate },
              { title: '付款人', dataIndex: 'payer_name' },
              { title: '客户', dataIndex: 'customer_name', render: nullableText },
              {
                title: '金额',
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '未分摊',
                dataIndex: 'unallocated_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={receipts}
            loading={loadingReceipts}
            pagination={false}
            rowClassName={(record) => (record.id === selectedReceipt?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedReceiptId(record.id)
                setAllocationForm(initialReceiptAllocationForm(record.currency))
                goDetail('receipts', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-receipt-form-panel">
          <PanelTitle icon={<Wallet size={18} />} title="水单录入" />
          <form className="record-form" onSubmit={submitReceipt}>
            <div className="form-pair two">
              <label>
                银行水单号
                <Input
                  value={receiptForm.receipt_no}
                  onChange={(event) => setReceiptForm({ ...receiptForm, receipt_no: event.target.value })}
                />
              </label>
              <label>
                收款日期
                <Input
                  type="date"
                  value={receiptForm.received_at}
                  onChange={(event) => setReceiptForm({ ...receiptForm, received_at: event.target.value })}
                />
              </label>
            </div>
            <label>
              付款人
              <Input
                value={receiptForm.payer_name}
                onChange={(event) => setReceiptForm({ ...receiptForm, payer_name: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                客户标识
                <Input
                  value={receiptForm.customer_id}
                  onChange={(event) => setReceiptForm({ ...receiptForm, customer_id: event.target.value })}
                />
              </label>
              <label>
                客户名称
                <Input
                  value={receiptForm.customer_name}
                  onChange={(event) => setReceiptForm({ ...receiptForm, customer_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                收款金额
                <Input
                  value={receiptForm.amount}
                  onChange={(event) => setReceiptForm({ ...receiptForm, amount: event.target.value })}
                />
              </label>
              <label>
                币种
                <Input
                  value={receiptForm.currency}
                  onChange={(event) => setReceiptForm({ ...receiptForm, currency: event.target.value })}
                />
              </label>
              <label>
                收款性质
                <FormSelect
                  value={receiptForm.receipt_type}
                  onChange={(event) => setReceiptForm({ ...receiptForm, receipt_type: event.target.value })}
                >
                  {receiptTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <label>
              收款银行账号
              <Input
                value={receiptForm.bank_account}
                onChange={(event) => setReceiptForm({ ...receiptForm, bank_account: event.target.value })}
              />
            </label>
            <label>
              银行流水号
              <Input
                value={receiptForm.reference_no}
                onChange={(event) => setReceiptForm({ ...receiptForm, reference_no: event.target.value })}
              />
            </label>
            <label>
              备注
              <Input.TextArea
                rows={2}
                value={receiptForm.remark}
                onChange={(event) => setReceiptForm({ ...receiptForm, remark: event.target.value })}
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingReceipt}>
              保存水单
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-receipt-detail-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="认领和分摊" />
          {selectedReceipt ? (
            <>
              <dl className="detail-list finance-receipt-detail-list">
                <div>
                  <dt>当前水单</dt>
                  <dd>{selectedReceipt.receipt_no}</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{receiptStatusLabel(selectedReceipt.status)}</dd>
                </div>
                <div>
                  <dt>已分摊</dt>
                  <dd>{formatFinanceAmount(selectedReceipt.allocated_amount, selectedReceipt.currency)}</dd>
                </div>
                <div>
                  <dt>未分摊</dt>
                  <dd>{formatFinanceAmount(selectedReceipt.unallocated_amount, selectedReceipt.currency)}</dd>
                </div>
              </dl>
              <div className="finance-receipt-actions">
                <form className="record-form compact-section" onSubmit={submitClaim}>
                  <div className="form-divider">水单认领</div>
                  <div className="form-pair two">
                    <label>
                      认领日期
                      <Input
                        type="date"
                        value={claimForm.claimed_at}
                        onChange={(event) => setClaimForm({ ...claimForm, claimed_at: event.target.value })}
                      />
                    </label>
                    <label>
                      业务员标识
                      <Input
                        value={claimForm.sales_user_id}
                        onChange={(event) => setClaimForm({ ...claimForm, sales_user_id: event.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    业务员姓名
                    <Input
                      value={claimForm.sales_user_name}
                      onChange={(event) => setClaimForm({ ...claimForm, sales_user_name: event.target.value })}
                    />
                  </label>
                  <label>
                    认领说明
                    <Input
                      value={claimForm.note}
                      onChange={(event) => setClaimForm({ ...claimForm, note: event.target.value })}
                    />
                  </label>
                  <Button
                    htmlType="submit"
                    icon={<CheckCircle2 size={16} />}
                    loading={submittingClaim}
                    disabled={!selectedReceiptCanClaim}
                  >
                    确认认领
                  </Button>
                </form>

                <form className="record-form compact-section" onSubmit={submitAllocation}>
                  <div className="form-divider">收款分摊</div>
                  <div className="form-pair two">
                    <label>
                      分摊类型
                      <FormSelect
                        value={allocationForm.allocation_type}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, allocation_type: event.target.value })
                        }
                      >
                        {allocationTypeOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </FormSelect>
                    </label>
                    <label>
                      分摊日期
                      <Input
                        type="date"
                        value={allocationForm.allocated_at}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, allocated_at: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      出口合同标识
                      <Input
                        value={allocationForm.contract_id}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, contract_id: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      出口合同号
                      <Input
                        value={allocationForm.contract_no}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, contract_no: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair three">
                    <label>
                      发票号
                      <Input
                        value={allocationForm.invoice_no}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, invoice_no: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      分摊金额
                      <Input
                        value={allocationForm.amount}
                        onChange={(event) => setAllocationForm({ ...allocationForm, amount: event.target.value })}
                      />
                    </label>
                    <label>
                      币种
                      <Input
                        value={allocationForm.currency}
                        onChange={(event) => setAllocationForm({ ...allocationForm, currency: event.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    分摊备注
                    <Input
                      value={allocationForm.remark}
                      onChange={(event) => setAllocationForm({ ...allocationForm, remark: event.target.value })}
                    />
                  </label>
                  <Button
                    htmlType="submit"
                    icon={<Save size={16} />}
                    loading={submittingAllocation}
                    disabled={!selectedReceiptCanAllocate}
                  >
                    保存分摊
                  </Button>
                </form>
              </div>
              {selectedReceipt.allocations.length > 0 ? (
                <section className="finance-allocation-history">
                  <strong>分摊记录</strong>
                  <Table<BankReceipt['allocations'][number]>
                    columns={[
                      { title: '类型', dataIndex: 'allocation_type', render: allocationTypeLabel },
                      { title: '合同号', dataIndex: 'contract_no', render: nullableText },
                      { title: '发票号', dataIndex: 'invoice_no', render: nullableText },
                      {
                        title: '金额',
                        dataIndex: 'amount',
                        render: (value: string, record) => formatFinanceAmount(value, record.currency),
                      },
                      { title: '日期', dataIndex: 'allocated_at', render: formatDate },
                    ]}
                    dataSource={selectedReceipt.allocations}
                    pagination={false}
                    rowKey="id"
                    size="small"
                  />
                </section>
              ) : null}
            </>
          ) : (
            <div className="module-state">暂无银行水单</div>
          )}
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-receivable-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="应收账款查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadReceivables()
              }}
            >
              <label>
                应收搜索
                <Input
                  value={receivableSearch}
                  placeholder="合同号 / 客户 / 报价号"
                  onChange={(event) => setReceivableSearch(event.target.value)}
                />
              </label>
              <label>
                出口合同号
                <Input
                  value={receivableContractFilter}
                  onChange={(event) => setReceivableContractFilter(event.target.value)}
                />
              </label>
              <label>
                发票号
                <Input
                  value={receivableInvoiceFilter}
                  onChange={(event) => setReceivableInvoiceFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<ReceivableItem>
            columns={[
              { title: '出口合同', dataIndex: 'contract_no', render: (value: string) => <strong>{value}</strong> },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '业务员', dataIndex: 'sales_user_name', render: nullableText },
              {
                title: '合同金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已收款',
                dataIndex: 'received_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '应收余额',
                dataIndex: 'receivable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '状态', dataIndex: 'status', render: receivableStatusTag },
            ]}
            dataSource={receivables}
            loading={loadingReceivables}
            pagination={false}
            rowKey="contract_id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'payments') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('payments')}>
              <ArrowLeft size={16} />
              付款管理
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-payment-grid'}
          aria-label="付款管理"
        >
        {!detailId ? (
        <section className="workspace-panel finance-payment-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="供应商发票列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadSupplierInvoices()
              }}
            >
              <label>
                发票搜索
                <Input value={invoiceSearch} onChange={(event) => setInvoiceSearch(event.target.value)} />
              </label>
              <label>
                付款状态
                <FormSelect
                  value={invoiceStatusFilter}
                  onChange={(event) => setInvoiceStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {supplierInvoiceStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                供应商标识
                <Input
                  value={invoiceSupplierFilter}
                  onChange={(event) => setInvoiceSupplierFilter(event.target.value)}
                />
              </label>
              <label>
                采购合同号
                <Input
                  value={invoiceContractFilter}
                  onChange={(event) => setInvoiceContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<SupplierInvoice>
            columns={[
              {
                title: '供应商发票',
                dataIndex: 'invoice_no',
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: supplierInvoiceStatusTag },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '采购合同', dataIndex: 'purchase_contract_no', render: nullableText },
              {
                title: '发票金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '未付',
                dataIndex: 'unpaid_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={supplierInvoices}
            loading={loadingSupplierInvoices}
            pagination={false}
            rowClassName={(record) => (record.id === selectedSupplierInvoice?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedSupplierInvoiceId(record.id)
                setPaymentRequestForm(initialPaymentRequestForm(record))
                setPaymentApprovalForm(initialPaymentApprovalForm(record.unpaid_amount))
                goDetail('payments', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-payment-form-panel">
          <PanelTitle icon={<Wallet size={18} />} title="供应商发票登记" />
          <form className="record-form" onSubmit={submitSupplierInvoice}>
            <div className="form-pair two">
              <label>
                供应商发票号
                <Input
                  value={supplierInvoiceForm.invoice_no}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, invoice_no: event.target.value })
                  }
                />
              </label>
              <label>
                发票日期
                <Input
                  type="date"
                  value={supplierInvoiceForm.invoice_date}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, invoice_date: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                供应商标识
                <Input
                  value={supplierInvoiceForm.supplier_id}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, supplier_id: event.target.value })
                  }
                />
              </label>
              <label>
                供应商名称
                <Input
                  value={supplierInvoiceForm.supplier_name}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, supplier_name: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                开票通知标识
                <Input
                  value={supplierInvoiceForm.purchase_invoice_notice_id}
                  onChange={(event) =>
                    setSupplierInvoiceForm({
                      ...supplierInvoiceForm,
                      purchase_invoice_notice_id: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                开票通知编号
                <Input
                  value={supplierInvoiceForm.purchase_invoice_notice_code}
                  onChange={(event) =>
                    setSupplierInvoiceForm({
                      ...supplierInvoiceForm,
                      purchase_invoice_notice_code: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                采购合同标识
                <Input
                  value={supplierInvoiceForm.purchase_contract_id}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, purchase_contract_id: event.target.value })
                  }
                />
              </label>
              <label>
                采购合同号
                <Input
                  value={supplierInvoiceForm.purchase_contract_no}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, purchase_contract_no: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                发票金额
                <Input
                  value={supplierInvoiceForm.total_amount}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, total_amount: event.target.value })
                  }
                />
              </label>
              <label>
                币种
                <Input
                  value={supplierInvoiceForm.currency}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, currency: event.target.value })
                  }
                />
              </label>
              <label>
                到期日
                <Input
                  type="date"
                  value={supplierInvoiceForm.due_date}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, due_date: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              备注
              <Input
                value={supplierInvoiceForm.remark}
                onChange={(event) =>
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, remark: event.target.value })
                }
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingSupplierInvoice}>
              登记供应商发票
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-payment-request-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="付款申请和审批" />
          {selectedSupplierInvoice ? (
            <dl className="detail-list finance-payment-detail-list">
              <div>
                <dt>当前发票</dt>
                <dd>{selectedSupplierInvoice.invoice_no}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>{supplierInvoiceStatusLabel(selectedSupplierInvoice.status)}</dd>
              </div>
              <div>
                <dt>已付</dt>
                <dd>{formatFinanceAmount(selectedSupplierInvoice.paid_amount, selectedSupplierInvoice.currency)}</dd>
              </div>
              <div>
                <dt>未付</dt>
                <dd>{formatFinanceAmount(selectedSupplierInvoice.unpaid_amount, selectedSupplierInvoice.currency)}</dd>
              </div>
            </dl>
          ) : (
            <div className="module-state">暂无供应商发票</div>
          )}
          <div className="finance-receipt-actions">
            <form className="record-form compact-section" onSubmit={submitPaymentRequest}>
              <div className="form-divider">付款申请新增</div>
              <div className="form-pair two">
                <label>
                  付款申请号
                  <Input
                    value={paymentRequestForm.request_no}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, request_no: event.target.value })
                    }
                  />
                </label>
                <label>
                  供应商发票标识
                  <Input
                    value={paymentRequestForm.supplier_invoice_id}
                    onChange={(event) =>
                      setPaymentRequestForm({
                        ...paymentRequestForm,
                        supplier_invoice_id: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  付款类别
                  <FormSelect
                    value={paymentRequestForm.payment_type}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, payment_type: event.target.value })
                    }
                  >
                    {paymentTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  申请日期
                  <Input
                    type="date"
                    value={paymentRequestForm.request_date}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, request_date: event.target.value })
                    }
                  />
                </label>
                <label>
                  申请金额
                  <Input
                    value={paymentRequestForm.requested_amount}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, requested_amount: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  币种
                  <Input
                    value={paymentRequestForm.currency}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, currency: event.target.value })
                    }
                  />
                </label>
                <label>
                  申请备注
                  <Input
                    value={paymentRequestForm.remark}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, remark: event.target.value })
                    }
                  />
                </label>
              </div>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingPaymentRequest}
                disabled={!selectedSupplierInvoice}
              >
                新增付款申请
              </Button>
            </form>
            <form className="record-form compact-section" onSubmit={submitPaymentApproval}>
              <div className="form-divider">付款审批</div>
              <div className="form-pair two">
                <label>
                  审批金额
                  <Input
                    value={paymentApprovalForm.approved_amount}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, approved_amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  审批日期
                  <Input
                    type="date"
                    value={paymentApprovalForm.approved_at}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, approved_at: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  审批人
                  <Input
                    value={paymentApprovalForm.reviewer_name}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, reviewer_name: event.target.value })
                    }
                  />
                </label>
                <label>
                  付款账号
                  <Input
                    value={paymentApprovalForm.payment_account}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, payment_account: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                审批备注
                <Input
                  value={paymentApprovalForm.remark}
                  onChange={(event) =>
                    setPaymentApprovalForm({ ...paymentApprovalForm, remark: event.target.value })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<CheckCircle2 size={16} />}
                loading={submittingPaymentApproval}
                disabled={!selectedPaymentRequestCanApprove}
              >
                审批付款
              </Button>
            </form>
          </div>
          <section className="finance-allocation-history">
            <strong>付款申请列表</strong>
            <Table<SupplierPaymentRequest>
              columns={[
                {
                  title: '申请号',
                  dataIndex: 'request_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: '状态', dataIndex: 'status', render: paymentRequestStatusTag },
                { title: '类别', dataIndex: 'payment_type', render: paymentTypeLabel },
                { title: '供应商', dataIndex: 'supplier_name' },
                { title: '发票号', dataIndex: 'supplier_invoice_no' },
                {
                  title: '申请金额',
                  dataIndex: 'requested_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已付',
                  dataIndex: 'paid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={paymentRequests}
              loading={loadingPaymentRequests}
              pagination={false}
              rowClassName={(record) => (record.id === selectedPaymentRequest?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedPaymentRequestId(record.id)
                  setPaymentApprovalForm(initialPaymentApprovalForm(record.requested_amount))
                },
              })}
            />
          </section>
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-payable-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="应付账款查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadPayables()
              }}
            >
              <label>
                应付搜索
                <Input value={payableSearch} onChange={(event) => setPayableSearch(event.target.value)} />
              </label>
              <label>
                应付状态
                <FormSelect
                  value={payableStatusFilter}
                  onChange={(event) => setPayableStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {supplierInvoiceStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                供应商标识
                <Input
                  value={payableSupplierFilter}
                  onChange={(event) => setPayableSupplierFilter(event.target.value)}
                />
              </label>
              <label>
                采购合同号
                <Input
                  value={payableContractFilter}
                  onChange={(event) => setPayableContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<PayableItem>
            columns={[
              { title: '供应商发票', dataIndex: 'invoice_no', render: (value: string) => <strong>{value}</strong> },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '采购合同', dataIndex: 'purchase_contract_no', render: nullableText },
              {
                title: '发票金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已付款',
                dataIndex: 'paid_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '应付余额',
                dataIndex: 'payable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '状态', dataIndex: 'status', render: supplierInvoiceStatusTag },
            ]}
            dataSource={payables}
            loading={loadingPayables}
            pagination={false}
            rowKey="supplier_invoice_id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'fees') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('fees')}>
              <ArrowLeft size={16} />
              付费管理
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-fee-grid'}
          aria-label="付费管理"
        >
        {!detailId ? (
        <section className="workspace-panel finance-fee-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Wallet size={18} />} title="合作伙伴费用发票" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadPartnerFeeInvoices()
              }}
            >
              <label>
                费用发票搜索
                <Input value={feeInvoiceSearch} onChange={(event) => setFeeInvoiceSearch(event.target.value)} />
              </label>
              <label>
                发票状态
                <FormSelect
                  value={feeInvoiceStatusFilter}
                  onChange={(event) => setFeeInvoiceStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {partnerFeeInvoiceStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                费用类型
                <FormSelect value={feeInvoiceTypeFilter} onChange={(event) => setFeeInvoiceTypeFilter(event.target.value)}>
                  <option value="">全部类型</option>
                  {feeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                合作伙伴标识
                <Input
                  value={feeInvoicePartnerFilter}
                  onChange={(event) => setFeeInvoicePartnerFilter(event.target.value)}
                />
              </label>
              <label>
                出运单号
                <Input
                  value={feeInvoiceShipmentFilter}
                  onChange={(event) => setFeeInvoiceShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<PartnerFeeInvoice>
            columns={[
              {
                title: '费用发票',
                dataIndex: 'invoice_no',
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: partnerFeeInvoiceStatusTag },
              { title: '合作伙伴', dataIndex: 'partner_name' },
              { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
              { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
              {
                title: '发票金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '未付',
                dataIndex: 'unpaid_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={partnerFeeInvoices}
            loading={loadingPartnerFeeInvoices}
            pagination={false}
            rowClassName={(record) => (record.id === selectedPartnerFeeInvoice?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedPartnerFeeInvoiceId(record.id)
                setFeePaymentRequestForm(initialFeePaymentRequestForm(record))
                setFeePaymentApprovalForm(initialFeePaymentApprovalForm(record.unpaid_amount))
                goDetail('fees', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-fee-form-panel">
          <PanelTitle icon={<Wallet size={18} />} title="费用发票登记" />
          <form className="record-form" onSubmit={submitPartnerFeeInvoice}>
            <div className="form-pair two">
              <label>
                费用发票号
                <Input
                  value={partnerFeeInvoiceForm.invoice_no}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, invoice_no: event.target.value })
                  }
                />
              </label>
              <label>
                发票日期
                <Input
                  type="date"
                  value={partnerFeeInvoiceForm.invoice_date}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, invoice_date: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                合作伙伴标识
                <Input
                  value={partnerFeeInvoiceForm.partner_id}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, partner_id: event.target.value })
                  }
                />
              </label>
              <label>
                合作伙伴名称
                <Input
                  value={partnerFeeInvoiceForm.partner_name}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, partner_name: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                合作伙伴类型
                <FormSelect
                  value={partnerFeeInvoiceForm.partner_type}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, partner_type: event.target.value })
                  }
                >
                  <option value="">自动匹配</option>
                  {partnerTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                费用类型
                <FormSelect
                  value={partnerFeeInvoiceForm.fee_type}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, fee_type: event.target.value })
                  }
                >
                  {feeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <div className="form-pair two">
              <label>
                出运单标识
                <Input
                  value={partnerFeeInvoiceForm.shipment_plan_id}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, shipment_plan_id: event.target.value })
                  }
                />
              </label>
              <label>
                出运单号
                <Input
                  value={partnerFeeInvoiceForm.shipment_no}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, shipment_no: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                业务员标识
                <Input
                  value={partnerFeeInvoiceForm.sales_user_id}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, sales_user_id: event.target.value })
                  }
                />
              </label>
              <label>
                业务员姓名
                <Input
                  value={partnerFeeInvoiceForm.sales_user_name}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, sales_user_name: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                发票金额
                <Input
                  value={partnerFeeInvoiceForm.total_amount}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, total_amount: event.target.value })
                  }
                />
              </label>
              <label>
                币种
                <Input
                  value={partnerFeeInvoiceForm.currency}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, currency: event.target.value })
                  }
                />
              </label>
              <label>
                到期日
                <Input
                  type="date"
                  value={partnerFeeInvoiceForm.due_date}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, due_date: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              备注
              <Input
                value={partnerFeeInvoiceForm.remark}
                onChange={(event) =>
                  setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, remark: event.target.value })
                }
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingPartnerFeeInvoice}>
              登记费用发票
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-fee-request-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="付费申请和审批" />
          {selectedPartnerFeeInvoice ? (
            <dl className="detail-list finance-fee-detail-list">
              <div>
                <dt>当前费用发票</dt>
                <dd>{selectedPartnerFeeInvoice.invoice_no}</dd>
              </div>
              <div>
                <dt>费用类型</dt>
                <dd>{feeTypeLabel(selectedPartnerFeeInvoice.fee_type)}</dd>
              </div>
              <div>
                <dt>已付</dt>
                <dd>{formatFinanceAmount(selectedPartnerFeeInvoice.paid_amount, selectedPartnerFeeInvoice.currency)}</dd>
              </div>
              <div>
                <dt>未付</dt>
                <dd>{formatFinanceAmount(selectedPartnerFeeInvoice.unpaid_amount, selectedPartnerFeeInvoice.currency)}</dd>
              </div>
            </dl>
          ) : (
            <div className="module-state">暂无合作伙伴费用发票</div>
          )}
          <div className="finance-receipt-actions">
            <form className="record-form compact-section" onSubmit={submitFeePaymentRequest}>
              <div className="form-divider">付费申请新增</div>
              <div className="form-pair two">
                <label>
                  付费申请号
                  <Input
                    value={feePaymentRequestForm.request_no}
                    onChange={(event) =>
                      setFeePaymentRequestForm({ ...feePaymentRequestForm, request_no: event.target.value })
                    }
                  />
                </label>
                <label>
                  费用发票标识
                  <Input
                    value={feePaymentRequestForm.partner_fee_invoice_id}
                    onChange={(event) =>
                      setFeePaymentRequestForm({
                        ...feePaymentRequestForm,
                        partner_fee_invoice_id: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  申请日期
                  <Input
                    type="date"
                    value={feePaymentRequestForm.request_date}
                    onChange={(event) =>
                      setFeePaymentRequestForm({ ...feePaymentRequestForm, request_date: event.target.value })
                    }
                  />
                </label>
                <label>
                  申请金额
                  <Input
                    value={feePaymentRequestForm.requested_amount}
                    onChange={(event) =>
                      setFeePaymentRequestForm({ ...feePaymentRequestForm, requested_amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  币种
                  <Input
                    value={feePaymentRequestForm.currency}
                    onChange={(event) =>
                      setFeePaymentRequestForm({ ...feePaymentRequestForm, currency: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                申请备注
                <Input
                  value={feePaymentRequestForm.remark}
                  onChange={(event) =>
                    setFeePaymentRequestForm({ ...feePaymentRequestForm, remark: event.target.value })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingFeePaymentRequest}
                disabled={!selectedPartnerFeeInvoice}
              >
                新增付费申请
              </Button>
            </form>
            <form className="record-form compact-section" onSubmit={submitFeePaymentApproval}>
              <div className="form-divider">付费审批</div>
              <div className="form-pair two">
                <label>
                  审批金额
                  <Input
                    value={feePaymentApprovalForm.approved_amount}
                    onChange={(event) =>
                      setFeePaymentApprovalForm({ ...feePaymentApprovalForm, approved_amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  审批日期
                  <Input
                    type="date"
                    value={feePaymentApprovalForm.approved_at}
                    onChange={(event) =>
                      setFeePaymentApprovalForm({ ...feePaymentApprovalForm, approved_at: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  审批人
                  <Input
                    value={feePaymentApprovalForm.reviewer_name}
                    onChange={(event) =>
                      setFeePaymentApprovalForm({ ...feePaymentApprovalForm, reviewer_name: event.target.value })
                    }
                  />
                </label>
                <label>
                  付款账号
                  <Input
                    value={feePaymentApprovalForm.payment_account}
                    onChange={(event) =>
                      setFeePaymentApprovalForm({
                        ...feePaymentApprovalForm,
                        payment_account: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                审批备注
                <Input
                  value={feePaymentApprovalForm.remark}
                  onChange={(event) =>
                    setFeePaymentApprovalForm({ ...feePaymentApprovalForm, remark: event.target.value })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<CheckCircle2 size={16} />}
                loading={submittingFeePaymentApproval}
                disabled={!selectedFeePaymentRequestCanApprove}
              >
                审批付费
              </Button>
            </form>
          </div>
          <section className="finance-allocation-history">
            <strong>付费申请列表</strong>
            <Table<FeePaymentRequest>
              columns={[
                {
                  title: '申请号',
                  dataIndex: 'request_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: '状态', dataIndex: 'status', render: feePaymentRequestStatusTag },
                { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
                { title: '合作伙伴', dataIndex: 'partner_name' },
                { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                {
                  title: '申请金额',
                  dataIndex: 'requested_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已付',
                  dataIndex: 'paid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={feePaymentRequests}
              loading={loadingFeePaymentRequests}
              pagination={false}
              rowClassName={(record) => (record.id === selectedFeePaymentRequest?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedFeePaymentRequestId(record.id)
                  setFeePaymentApprovalForm(initialFeePaymentApprovalForm(record.requested_amount))
                },
              })}
            />
          </section>
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-fee-payable-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="应付费用查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadFeePayables()
              }}
            >
              <label>
                应付费用搜索
                <Input value={feePayableSearch} onChange={(event) => setFeePayableSearch(event.target.value)} />
              </label>
              <label>
                应付状态
                <FormSelect
                  value={feePayableStatusFilter}
                  onChange={(event) => setFeePayableStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {partnerFeeInvoiceStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                费用类型
                <FormSelect value={feePayableTypeFilter} onChange={(event) => setFeePayableTypeFilter(event.target.value)}>
                  <option value="">全部类型</option>
                  {feeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                合作伙伴标识
                <Input
                  value={feePayablePartnerFilter}
                  onChange={(event) => setFeePayablePartnerFilter(event.target.value)}
                />
              </label>
              <label>
                出运单号
                <Input
                  value={feePayableShipmentFilter}
                  onChange={(event) => setFeePayableShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<FeePayableItem>
            columns={[
              { title: '费用发票', dataIndex: 'invoice_no', render: (value: string) => <strong>{value}</strong> },
              { title: '合作伙伴', dataIndex: 'partner_name' },
              { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
              { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
              {
                title: '发票金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已付费',
                dataIndex: 'paid_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '应付余额',
                dataIndex: 'payable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '状态', dataIndex: 'status', render: partnerFeeInvoiceStatusTag },
            ]}
            dataSource={feePayables}
            loading={loadingFeePayables}
            pagination={false}
            rowKey="partner_fee_invoice_id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'tax') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('tax')}>
              <ArrowLeft size={16} />
              核销退税
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-tax-grid'}
          aria-label="核销退税"
        >
        {!detailId ? (
        <section className="workspace-panel finance-tax-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="核销单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadVerificationDocuments()
              }}
            >
              <label>
                核销单搜索
                <Input value={verificationSearch} onChange={(event) => setVerificationSearch(event.target.value)} />
              </label>
              <label>
                进度状态
                <FormSelect
                  value={verificationStatusFilter}
                  onChange={(event) => setVerificationStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {verificationDocumentStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                提醒状态
                <FormSelect
                  value={verificationReminderFilter}
                  onChange={(event) => setVerificationReminderFilter(event.target.value)}
                >
                  <option value="">全部提醒</option>
                  {verificationReminderStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                业务员标识
                <Input
                  value={verificationOwnerFilter}
                  onChange={(event) => setVerificationOwnerFilter(event.target.value)}
                />
              </label>
              <label>
                出运单号
                <Input
                  value={verificationShipmentFilter}
                  onChange={(event) => setVerificationShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<VerificationDocument>
            columns={[
              {
                title: '核销单',
                dataIndex: 'document_no',
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: verificationDocumentStatusTag },
              { title: '提醒', dataIndex: 'reminder_status', render: verificationReminderStatusTag },
              { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
              { title: '有效期', dataIndex: 'valid_until', render: formatDate },
              {
                title: '可退税',
                dataIndex: 'refundable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已退税',
                dataIndex: 'refunded_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={verificationDocuments}
            loading={loadingVerificationDocuments}
            pagination={false}
            rowClassName={(record) => (record.id === selectedVerificationDocument?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedVerificationDocumentId(record.id)
                setTaxRefundForm(initialTaxRefundForm(record.currency, record.unrefunded_amount))
                goDetail('tax', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-tax-form-panel">
          <PanelTitle icon={<Save size={18} />} title="核销单领用" />
          <form className="record-form" onSubmit={submitVerificationDocument}>
            <div className="form-pair two">
              <label>
                核销单号
                <Input
                  value={verificationDocumentForm.document_no}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      document_no: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                领用日期
                <Input
                  type="date"
                  value={verificationDocumentForm.received_at}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      received_at: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                出运单标识
                <Input
                  value={verificationDocumentForm.shipment_plan_id}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      shipment_plan_id: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                出运单号
                <Input
                  value={verificationDocumentForm.shipment_no}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      shipment_no: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                业务员标识
                <Input
                  value={verificationDocumentForm.owner_user_id}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      owner_user_id: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                业务员姓名
                <Input
                  value={verificationDocumentForm.owner_user_name}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      owner_user_name: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                客户名称
                <Input
                  value={verificationDocumentForm.customer_name}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      customer_name: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                有效期至
                <Input
                  type="date"
                  value={verificationDocumentForm.valid_until}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      valid_until: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                可退税金额
                <Input
                  value={verificationDocumentForm.refundable_amount}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      refundable_amount: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                币种
                <Input
                  value={verificationDocumentForm.currency}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      currency: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <label>
              备注
              <Input
                value={verificationDocumentForm.remark}
                onChange={(event) =>
                  setVerificationDocumentForm({
                    ...verificationDocumentForm,
                    remark: event.target.value,
                  })
                }
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingVerificationDocument}>
              领用核销单
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-tax-process-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="回单、核销和退税登记" />
          {selectedVerificationDocument ? (
            <dl className="detail-list finance-tax-detail-list">
              <div>
                <dt>当前核销单</dt>
                <dd>{selectedVerificationDocument.document_no}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>{verificationDocumentStatusLabel(selectedVerificationDocument.status)}</dd>
              </div>
              <div>
                <dt>未退税</dt>
                <dd>
                  {formatFinanceAmount(
                    selectedVerificationDocument.unrefunded_amount,
                    selectedVerificationDocument.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt>提醒日</dt>
                <dd>{formatDate(selectedVerificationDocument.reminder_date)}</dd>
              </div>
            </dl>
          ) : (
            <div className="module-state">暂无核销单</div>
          )}
          <div className="finance-tax-actions">
            <form className="record-form compact-section" onSubmit={submitCustomsReceipt}>
              <div className="form-divider">报关回单登记</div>
              <div className="form-pair two">
                <label>
                  报关单号
                  <Input
                    value={customsReceiptForm.customs_declaration_no}
                    onChange={(event) =>
                      setCustomsReceiptForm({
                        ...customsReceiptForm,
                        customs_declaration_no: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  回单号
                  <Input
                    value={customsReceiptForm.customs_receipt_no}
                    onChange={(event) =>
                      setCustomsReceiptForm({
                        ...customsReceiptForm,
                        customs_receipt_no: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  回单日期
                  <Input
                    type="date"
                    value={customsReceiptForm.received_at}
                    onChange={(event) =>
                      setCustomsReceiptForm({ ...customsReceiptForm, received_at: event.target.value })
                    }
                  />
                </label>
                <label>
                  回单备注
                  <Input
                    value={customsReceiptForm.remark}
                    onChange={(event) =>
                      setCustomsReceiptForm({ ...customsReceiptForm, remark: event.target.value })
                    }
                  />
                </label>
              </div>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingCustomsReceipt}
                disabled={!selectedVerificationCanRegisterCustoms}
              >
                登记回单
              </Button>
            </form>

            <form className="record-form compact-section" onSubmit={submitVerificationRegister}>
              <div className="form-divider">核销登记</div>
              <div className="form-pair two">
                <label>
                  核销编号
                  <Input
                    value={verificationRegisterForm.verification_no}
                    onChange={(event) =>
                      setVerificationRegisterForm({
                        ...verificationRegisterForm,
                        verification_no: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  核销日期
                  <Input
                    type="date"
                    value={verificationRegisterForm.verified_at}
                    onChange={(event) =>
                      setVerificationRegisterForm({
                        ...verificationRegisterForm,
                        verified_at: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                核销备注
                <Input
                  value={verificationRegisterForm.remark}
                  onChange={(event) =>
                    setVerificationRegisterForm({
                      ...verificationRegisterForm,
                      remark: event.target.value,
                    })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<CheckCircle2 size={16} />}
                loading={submittingVerificationRegister}
                disabled={!selectedVerificationCanVerify}
              >
                登记核销
              </Button>
            </form>

            <form className="record-form compact-section" onSubmit={submitTaxRefund}>
              <div className="form-divider">退税登记</div>
              <div className="form-pair two">
                <label>
                  退税编号
                  <Input
                    value={taxRefundForm.refund_no}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, refund_no: event.target.value })
                    }
                  />
                </label>
                <label>
                  退税日期
                  <Input
                    type="date"
                    value={taxRefundForm.refunded_at}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, refunded_at: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  退税金额
                  <Input
                    value={taxRefundForm.amount}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  币种
                  <Input
                    value={taxRefundForm.currency}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, currency: event.target.value })
                    }
                  />
                </label>
                <label>
                  银行水单号
                  <Input
                    value={taxRefundForm.bank_receipt_no}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, bank_receipt_no: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                退税备注
                <Input
                  value={taxRefundForm.remark}
                  onChange={(event) =>
                    setTaxRefundForm({ ...taxRefundForm, remark: event.target.value })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingTaxRefund}
                disabled={!selectedVerificationCanRefund}
              >
                登记退税
              </Button>
            </form>
          </div>
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-tax-usage-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="核销单使用情况查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadVerificationUsage()
              }}
            >
              <label>
                使用情况搜索
                <Input
                  value={verificationUsageSearch}
                  onChange={(event) => setVerificationUsageSearch(event.target.value)}
                />
              </label>
              <label>
                进度状态
                <FormSelect
                  value={verificationUsageStatusFilter}
                  onChange={(event) => setVerificationUsageStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {verificationDocumentStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                提醒状态
                <FormSelect
                  value={verificationUsageReminderFilter}
                  onChange={(event) => setVerificationUsageReminderFilter(event.target.value)}
                >
                  <option value="">全部提醒</option>
                  {verificationReminderStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                出运单号
                <Input
                  value={verificationUsageShipmentFilter}
                  onChange={(event) => setVerificationUsageShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<VerificationUsageItem>
            columns={[
              { title: '核销单', dataIndex: 'document_no', render: (value: string) => <strong>{value}</strong> },
              { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
              { title: '业务员', dataIndex: 'owner_user_name', render: nullableText },
              { title: '状态', dataIndex: 'status', render: verificationDocumentStatusTag },
              { title: '提醒', dataIndex: 'reminder_status', render: verificationReminderStatusTag },
              {
                title: '可退税',
                dataIndex: 'refundable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已退税',
                dataIndex: 'refunded_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '回单号', dataIndex: 'customs_receipt_no', render: nullableText },
              { title: '核销编号', dataIndex: 'verification_no', render: nullableText },
            ]}
            dataSource={verificationUsage}
            loading={loadingVerificationUsage}
            pagination={false}
            rowKey="verification_document_id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'misc') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('misc')}>
              <ArrowLeft size={16} />
              杂费管理
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-misc-grid'}
          aria-label="杂费管理"
        >
        {!detailId ? (
        <section className="workspace-panel finance-misc-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="杂费项目配置" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadMiscFeeItems()
              }}
            >
              <label>
                项目搜索
                <Input value={miscFeeItemSearch} onChange={(event) => setMiscFeeItemSearch(event.target.value)} />
              </label>
              <label>
                项目分类
                <FormSelect
                  value={miscFeeItemCategoryFilter}
                  onChange={(event) => setMiscFeeItemCategoryFilter(event.target.value)}
                >
                  <option value="">全部分类</option>
                  {miscFeeCategoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                启停状态
                <FormSelect
                  value={miscFeeItemStatusFilter}
                  onChange={(event) => setMiscFeeItemStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {miscFeeItemStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<MiscFeeItem>
            columns={[
              {
                title: '项目编码',
                dataIndex: 'code',
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '项目名称', dataIndex: 'name' },
              { title: '分类', dataIndex: 'category', render: miscFeeCategoryLabel },
              {
                title: '默认分摊',
                dataIndex: 'default_allocation_method',
                render: miscFeeAllocationMethodLabel,
              },
              { title: '状态', dataIndex: 'status', render: miscFeeItemStatusTag },
            ]}
            dataSource={miscFeeItems}
            loading={loadingMiscFeeItems}
            pagination={false}
            rowClassName={(record) => (record.id === selectedMiscFeeItem?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedMiscFeeItemId(record.id)
                setMiscFeeAllocationForm(initialMiscFeeAllocationForm(record))
                goDetail('misc', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-misc-form-panel">
          <PanelTitle icon={<Save size={18} />} title="新增杂费项目" />
          <form className="record-form" onSubmit={submitMiscFeeItem}>
            <div className="form-pair two">
              <label>
                项目编码
                <Input
                  value={miscFeeItemForm.code}
                  onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, code: event.target.value })}
                />
              </label>
              <label>
                项目名称
                <Input
                  value={miscFeeItemForm.name}
                  onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                项目分类
                <FormSelect
                  value={miscFeeItemForm.category}
                  onChange={(event) =>
                    setMiscFeeItemForm({ ...miscFeeItemForm, category: event.target.value })
                  }
                >
                  {miscFeeCategoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                默认分摊方式
                <FormSelect
                  value={miscFeeItemForm.default_allocation_method}
                  onChange={(event) =>
                    setMiscFeeItemForm({
                      ...miscFeeItemForm,
                      default_allocation_method: event.target.value,
                    })
                  }
                >
                  {miscFeeAllocationMethodOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={miscFeeItemForm.is_active}
                onChange={(event) =>
                  setMiscFeeItemForm({ ...miscFeeItemForm, is_active: event.target.checked })
                }
              />
              启用项目
            </label>
            <label>
              备注
              <Input
                value={miscFeeItemForm.remark}
                onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, remark: event.target.value })}
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingMiscFeeItem}>
              保存项目
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-misc-allocation-panel">
          <PanelTitle icon={<Wallet size={18} />} title="单票杂费分摊" />
          {selectedMiscFeeItem ? (
            <dl className="detail-list finance-misc-detail-list">
              <div>
                <dt>当前项目</dt>
                <dd>{selectedMiscFeeItem.name}</dd>
              </div>
              <div>
                <dt>分类</dt>
                <dd>{miscFeeCategoryLabel(selectedMiscFeeItem.category)}</dd>
              </div>
              <div>
                <dt>默认方式</dt>
                <dd>{miscFeeAllocationMethodLabel(selectedMiscFeeItem.default_allocation_method)}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>{miscFeeItemStatusLabel(selectedMiscFeeItem.status)}</dd>
              </div>
            </dl>
          ) : (
            <div className="module-state">暂无杂费项目</div>
          )}
          <form className="record-form" onSubmit={submitMiscFeeAllocation}>
            <div className="form-pair two">
              <label>
                分摊单号
                <Input
                  value={miscFeeAllocationForm.allocation_no}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      allocation_no: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                项目标识
                <Input
                  value={miscFeeAllocationForm.item_id}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({ ...miscFeeAllocationForm, item_id: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                出运单标识
                <Input
                  value={miscFeeAllocationForm.shipment_plan_id}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      shipment_plan_id: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                出运单号
                <Input
                  value={miscFeeAllocationForm.shipment_no}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({ ...miscFeeAllocationForm, shipment_no: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                业务员标识
                <Input
                  value={miscFeeAllocationForm.sales_user_id}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      sales_user_id: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                业务员姓名
                <Input
                  value={miscFeeAllocationForm.sales_user_name}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      sales_user_name: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                分摊日期
                <Input
                  type="date"
                  value={miscFeeAllocationForm.allocated_at}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      allocated_at: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                金额
                <Input
                  value={miscFeeAllocationForm.amount}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({ ...miscFeeAllocationForm, amount: event.target.value })
                  }
                />
              </label>
              <label>
                币种
                <Input
                  value={miscFeeAllocationForm.currency}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({ ...miscFeeAllocationForm, currency: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              分摊方式
              <FormSelect
                value={miscFeeAllocationForm.allocation_method}
                onChange={(event) =>
                  setMiscFeeAllocationForm({
                    ...miscFeeAllocationForm,
                    allocation_method: event.target.value,
                  })
                }
              >
                {miscFeeAllocationMethodOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              分摊依据
              <Input
                value={miscFeeAllocationForm.basis}
                onChange={(event) =>
                  setMiscFeeAllocationForm({ ...miscFeeAllocationForm, basis: event.target.value })
                }
              />
            </label>
            <label>
              备注
              <Input
                value={miscFeeAllocationForm.remark}
                onChange={(event) =>
                  setMiscFeeAllocationForm({ ...miscFeeAllocationForm, remark: event.target.value })
                }
              />
            </label>
            <Button
              htmlType="submit"
              icon={<Save size={16} />}
              loading={submittingMiscFeeAllocation}
              disabled={!selectedMiscFeeItem}
            >
              保存分摊
            </Button>
          </form>
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-misc-summary-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="杂费分摊查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadMiscFeeAllocations()
                void loadMiscFeeAllocationSummary()
              }}
            >
              <label>
                分摊搜索
                <Input
                  value={miscFeeAllocationSearch}
                  onChange={(event) => setMiscFeeAllocationSearch(event.target.value)}
                />
              </label>
              <label>
                分类
                <FormSelect
                  value={miscFeeAllocationCategoryFilter}
                  onChange={(event) => {
                    setMiscFeeAllocationCategoryFilter(event.target.value)
                    setMiscFeeSummaryCategoryFilter(event.target.value)
                  }}
                >
                  <option value="">全部分类</option>
                  {miscFeeCategoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                出运单号
                <Input
                  value={miscFeeAllocationShipmentFilter}
                  onChange={(event) => {
                    setMiscFeeAllocationShipmentFilter(event.target.value)
                    setMiscFeeSummaryShipmentFilter(event.target.value)
                  }}
                />
              </label>
              <label>
                业务员标识
                <Input
                  value={miscFeeAllocationSalesFilter}
                  onChange={(event) => setMiscFeeAllocationSalesFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <div className="finance-receipt-strip">
            <span>分摊记录 {miscFeeAllocations.length} 条</span>
            <strong>{formatFinanceAmount(totalMiscFeeAmount.toFixed(2), miscFeeAllocations[0]?.currency ?? 'USD')}</strong>
            <span>已进入单票利润成本</span>
          </div>
          <Table<MiscFeeAllocation>
            columns={[
              {
                title: '分摊单号',
                dataIndex: 'allocation_no',
                render: (value: string) => <strong>{value}</strong>,
              },
              { title: '杂费项目', dataIndex: 'item_name' },
              { title: '分类', dataIndex: 'item_category', render: miscFeeCategoryLabel },
              { title: '出运单', dataIndex: 'shipment_no' },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '业务员', dataIndex: 'sales_user_name', render: nullableText },
              { title: '分摊日', dataIndex: 'allocated_at', render: formatDate },
              {
                title: '金额',
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '方式', dataIndex: 'allocation_method', render: miscFeeAllocationMethodLabel },
            ]}
            dataSource={miscFeeAllocations}
            loading={loadingMiscFeeAllocations || loadingMiscFeeSummary}
            pagination={false}
            rowKey="id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'settlement') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('settlement')}>
              <ArrowLeft size={16} />
              结算核算
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-settlement-grid'}
          aria-label="财务结算和利润核算"
        >
        {!detailId ? (
        <section className="workspace-panel finance-settlement-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Wallet size={18} />} title="财务结算列表" />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadFinancialSettlements()
            }}
          >
            <label>
              结算搜索
              <Input
                value={settlementSearch}
                placeholder="结算单 / 出运单 / 客户"
                onChange={(event) => setSettlementSearch(event.target.value)}
              />
            </label>
            <label>
              出运单号
              <Input
                value={settlementShipmentFilter}
                onChange={(event) => setSettlementShipmentFilter(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>
              查询
            </Button>
          </form>
          <div className="finance-receipt-strip">
            <span>锁定结算 {financialSettlements.length} 单</span>
            <strong>{formatFinanceAmount(totalSettlementSalesIncome.toFixed(2), financialSettlements[0]?.currency ?? 'USD')}</strong>
            <span>毛利 {formatFinanceAmount(totalSettlementGrossProfit.toFixed(2), financialSettlements[0]?.currency ?? 'USD')}</span>
          </div>
          <Table<FinancialSettlement>
            columns={[
              {
                title: '结算单',
                dataIndex: 'settlement_no',
                render: (value: string) => <strong>{value}</strong>,
              },
              { title: '出运单', dataIndex: 'shipment_no' },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '结算日', dataIndex: 'settlement_date', render: formatDate },
              {
                title: '收入',
                dataIndex: 'sales_income',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '成本',
                dataIndex: 'purchase_cost_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '退税',
                dataIndex: 'tax_refund_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '杂费',
                dataIndex: 'misc_fee_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '手工成本',
                dataIndex: 'manual_cost_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '毛利',
                dataIndex: 'gross_profit',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '毛利率', dataIndex: 'gross_profit_rate', render: formatPercent },
              { title: '状态', dataIndex: 'status', render: settlementStatusTag },
            ]}
            dataSource={financialSettlements}
            loading={loadingFinancialSettlements}
            pagination={false}
            rowClassName={(record) => (record.id === selectedFinancialSettlement?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedFinancialSettlementId(record.id)
                setManualProfitCostForm(initialManualProfitCostForm(record.currency, record.settlement_date))
                goDetail('settlement', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-settlement-form-panel">
          <PanelTitle icon={<Save size={18} />} title="单票结算锁定" />
          <form className="record-form" onSubmit={submitFinancialSettlement}>
            <label>
              结算单号
              <Input
                required
                value={settlementForm.settlement_no}
                onChange={(event) => setSettlementForm({ ...settlementForm, settlement_no: event.target.value })}
              />
            </label>
            <label>
              出运单 ID
              <Input
                required
                value={settlementForm.shipment_plan_id}
                onChange={(event) => setSettlementForm({ ...settlementForm, shipment_plan_id: event.target.value })}
              />
            </label>
            <label>
              出运单号
              <Input
                value={settlementForm.shipment_no}
                onChange={(event) => setSettlementForm({ ...settlementForm, shipment_no: event.target.value })}
              />
            </label>
            <label>
              结算日期
              <Input
                required
                type="date"
                value={settlementForm.settlement_date}
                onChange={(event) => setSettlementForm({ ...settlementForm, settlement_date: event.target.value })}
              />
            </label>
            <label>
              备注
              <textarea
                rows={3}
                value={settlementForm.remark}
                onChange={(event) => setSettlementForm({ ...settlementForm, remark: event.target.value })}
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingSettlement}>
              锁定结算
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-manual-cost-panel">
          <PanelTitle icon={<PackagePlus size={18} />} title="手工成本关联" />
          {selectedFinancialSettlement ? (
            <Descriptions
              bordered
              className="finance-settlement-descriptions"
              column={2}
              items={[
                { key: 'settlement_no', label: '结算单', children: selectedFinancialSettlement.settlement_no },
                { key: 'shipment_no', label: '出运单', children: selectedFinancialSettlement.shipment_no },
                {
                  key: 'gross_profit',
                  label: '当前毛利',
                  children: formatFinanceAmount(
                    selectedFinancialSettlement.gross_profit,
                    selectedFinancialSettlement.currency,
                  ),
                },
                {
                  key: 'manual_cost_amount',
                  label: '手工成本',
                  children: formatFinanceAmount(
                    selectedFinancialSettlement.manual_cost_amount,
                    selectedFinancialSettlement.currency,
                  ),
                },
              ]}
              size="small"
            />
          ) : (
            <div className="module-state">暂无可关联结算单</div>
          )}
          <form className="record-form compact-section" onSubmit={submitManualProfitCost}>
            <label>
              成本单号
              <Input
                required
                value={manualProfitCostForm.cost_no}
                onChange={(event) => setManualProfitCostForm({ ...manualProfitCostForm, cost_no: event.target.value })}
              />
            </label>
            <label>
              成本类型
              <FormSelect
                value={manualProfitCostForm.cost_type}
                onChange={(event) =>
                  setManualProfitCostForm({ ...manualProfitCostForm, cost_type: event.target.value })
                }
              >
                <option value="other_cost">其他成本</option>
              </FormSelect>
            </label>
            <label>
              成本日期
              <Input
                required
                type="date"
                value={manualProfitCostForm.cost_date}
                onChange={(event) =>
                  setManualProfitCostForm({ ...manualProfitCostForm, cost_date: event.target.value })
                }
              />
            </label>
            <div className="form-pair two">
              <label>
                金额
                <Input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={manualProfitCostForm.amount}
                  onChange={(event) =>
                    setManualProfitCostForm({ ...manualProfitCostForm, amount: event.target.value })
                  }
                />
              </label>
              <label>
                币种
                <Input
                  required
                  value={manualProfitCostForm.currency}
                  onChange={(event) =>
                    setManualProfitCostForm({ ...manualProfitCostForm, currency: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              来源单号
              <Input
                value={manualProfitCostForm.source_no}
                onChange={(event) =>
                  setManualProfitCostForm({ ...manualProfitCostForm, source_no: event.target.value })
                }
              />
            </label>
            <label>
              原因
              <Input
                required
                value={manualProfitCostForm.reason}
                onChange={(event) =>
                  setManualProfitCostForm({ ...manualProfitCostForm, reason: event.target.value })
                }
              />
            </label>
            <label>
              备注
              <textarea
                rows={3}
                value={manualProfitCostForm.remark}
                onChange={(event) =>
                  setManualProfitCostForm({ ...manualProfitCostForm, remark: event.target.value })
                }
              />
            </label>
            <Button
              htmlType="submit"
              icon={<Save size={16} />}
              loading={submittingManualProfitCost}
              disabled={!selectedFinancialSettlement}
            >
              关联成本
            </Button>
          </form>
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-profit-calculation-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<CheckCircle2 size={18} />} title="利润核算表" />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadProfitCalculations()
            }}
          >
            <label>
              核算搜索
              <Input
                value={profitCalculationSearch}
                placeholder="结算单 / 出运单 / 客户"
                onChange={(event) => setProfitCalculationSearch(event.target.value)}
              />
            </label>
            <label>
              出运单号
              <Input
                value={profitCalculationShipmentFilter}
                onChange={(event) => setProfitCalculationShipmentFilter(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>
              查询
            </Button>
          </form>
          <div className="finance-receipt-strip">
            <span>核算单票 {profitCalculations.length} 单</span>
            <strong>{formatFinanceAmount(totalProfitCalculationGrossProfit.toFixed(2), profitCalculations[0]?.currency ?? 'USD')}</strong>
            <span>按结算锁定口径展开成本明细</span>
          </div>
          <Table<FinancialSettlement>
            columns={[
              {
                title: '结算单',
                dataIndex: 'settlement_no',
                render: (value: string) => <strong>{value}</strong>,
              },
              { title: '出运单', dataIndex: 'shipment_no' },
              { title: '客户', dataIndex: 'customer_name' },
              {
                title: '收入',
                dataIndex: 'sales_income',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '总成本',
                render: (_, record) =>
                  formatFinanceAmount(
                    (
                      Number(record.purchase_cost_amount || 0) +
                      Number(record.partner_fee_amount || 0) +
                      Number(record.misc_fee_amount || 0) +
                      Number(record.manual_cost_amount || 0)
                    ).toFixed(2),
                    record.currency,
                  ),
              },
              {
                title: '退税',
                dataIndex: 'tax_refund_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '毛利',
                dataIndex: 'gross_profit',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '毛利率', dataIndex: 'gross_profit_rate', render: formatPercent },
            ]}
            dataSource={profitCalculations}
            expandable={{
              expandedRowRender: (record) => (
                <Table<ProfitCostItem>
                  columns={[
                    { title: '类型', dataIndex: 'cost_type', render: profitCostTypeLabel },
                    { title: '方向', dataIndex: 'direction', render: profitCostDirectionTag },
                    { title: '来源', dataIndex: 'source_no', render: nullableText },
                    { title: '日期', dataIndex: 'cost_date', render: formatDate },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      render: (value: string, item) => formatFinanceAmount(value, item.currency),
                    },
                    { title: '原因', dataIndex: 'reason', render: nullableText },
                  ]}
                  dataSource={record.cost_items}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />
              ),
            }}
            loading={loadingProfitCalculations}
            pagination={false}
            rowKey="id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'reimbursements') {
    const selectedReimbursement =
      reimbursements.find((item) => item.id === selectedReimbursementId) ?? reimbursements[0] ?? null
    return (
      <section className="finance-page">
        {moduleHeader}
        {moduleAlerts}
        <section className="finance-settlement-grid" aria-label="报销管理">
          <section className="workspace-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Receipt size={18} />} title="报销单列表" />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadReimbursements()
                }}
              >
                <label>
                  搜索
                  <Input
                    value={reimbursementSearch}
                    placeholder="单号 / 申请人 / 部门"
                    onChange={(event) => setReimbursementSearch(event.target.value)}
                  />
                </label>
                <label>
                  状态
                  <FormSelect
                    value={reimbursementStatusFilter}
                    onChange={(event) => setReimbursementStatusFilter(event.target.value)}
                  >
                    <option value="">全部状态</option>
                    <option value="submitted">待审批</option>
                    <option value="approved">已审批</option>
                    <option value="rejected">已驳回</option>
                    <option value="paid">已付款</option>
                  </FormSelect>
                </label>
                <label>
                  分类
                  <FormSelect
                    value={reimbursementCategoryFilter}
                    onChange={(event) => setReimbursementCategoryFilter(event.target.value)}
                  >
                    <option value="">全部分类</option>
                    <option value="travel">差旅</option>
                    <option value="office">办公</option>
                    <option value="entertainment">招待</option>
                    <option value="other">其他</option>
                  </FormSelect>
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
              </form>
            </div>
            <Table<Reimbursement>
              columns={[
                { title: '报销单号', dataIndex: 'reimbursement_no' },
                { title: '申请人', dataIndex: 'applicant_user_name' },
                { title: '部门', dataIndex: 'department' },
                { title: '分类', dataIndex: 'category', render: reimbursementCategoryLabel },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '状态', dataIndex: 'status', render: reimbursementStatusTag },
              ]}
              dataSource={reimbursements}
              loading={loadingReimbursements}
              pagination={false}
              rowClassName={(record) =>
                record.id === selectedReimbursement?.id ? 'selected-row' : ''
              }
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedReimbursementId(record.id),
              })}
            />
            <div className="finance-receipt-strip">
              <span>报销单 {reimbursements.length} 条</span>
              <strong>{formatFinanceAmount(reimbursementsTotalAmount, 'CNY')}</strong>
            </div>
          </section>

          <section className="workspace-panel">
            <div className="panel-heading">
              <PanelTitle icon={<Plus size={18} />} title="新增报销单" />
            </div>
            <form className="record-form" onSubmit={submitReimbursement}>
              <label>
                报销单号
                <Input
                  value={reimbursementForm.reimbursement_no}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, reimbursement_no: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                申请人工号
                <Input
                  value={reimbursementForm.applicant_user_id}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, applicant_user_id: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                申请人姓名
                <Input
                  value={reimbursementForm.applicant_user_name}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({
                      ...prev,
                      applicant_user_name: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                部门
                <Input
                  value={reimbursementForm.department}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, department: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                分类
                <FormSelect
                  value={reimbursementForm.category}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                >
                  <option value="travel">差旅</option>
                  <option value="office">办公</option>
                  <option value="entertainment">招待</option>
                  <option value="other">其他</option>
                </FormSelect>
              </label>
              <label>
                币种
                <Input
                  value={reimbursementForm.currency}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, currency: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                金额
                <Input
                  value={reimbursementForm.amount}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                事由
                <Input
                  value={reimbursementForm.reason}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                />
              </label>
              <Button htmlType="submit" type="primary" loading={submittingReimbursement} icon={<Save size={16} />}>
                登记报销单
              </Button>
            </form>

            {selectedReimbursement ? (
              <div className="finance-action-block">
                <PanelTitle icon={<ClipboardCheck size={18} />} title="审批与付款" />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="报销单号">
                    {selectedReimbursement.reimbursement_no}
                  </Descriptions.Item>
                  <Descriptions.Item label="当前状态">
                    {reimbursementStatusTag(selectedReimbursement.status)}
                  </Descriptions.Item>
                  <Descriptions.Item label="金额">
                    {formatFinanceAmount(selectedReimbursement.amount, selectedReimbursement.currency)}
                  </Descriptions.Item>
                </Descriptions>
                <div className="finance-action-row">
                  <Button
                    disabled={selectedReimbursement.status !== 'submitted'}
                    loading={submittingReimbursementAction}
                    type="primary"
                    onClick={() => void handleReimbursementApprove(true)}
                  >
                    审批通过
                  </Button>
                  <Button
                    disabled={selectedReimbursement.status !== 'submitted'}
                    loading={submittingReimbursementAction}
                    danger
                    onClick={() => void handleReimbursementApprove(false)}
                  >
                    驳回
                  </Button>
                </div>
                <div className="finance-action-row">
                  <FormSelect
                    value={reimbursementPayMethod}
                    onChange={(event) => setReimbursementPayMethod(event.target.value)}
                  >
                    <option value="bank_transfer">银行转账</option>
                    <option value="cash">现金</option>
                    <option value="cheque">支票</option>
                    <option value="other">其他</option>
                  </FormSelect>
                  <Button
                    disabled={selectedReimbursement.status !== 'approved'}
                    loading={submittingReimbursementAction}
                    type="primary"
                    onClick={() => void handleReimbursementPay()}
                  >
                    确认付款
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </section>
      </section>
    )
  }

  if (activeModule === 'portData') {
    return (
      <section className="finance-page">
        {moduleHeader}
        {moduleAlerts}
        <section className="finance-settlement-grid" aria-label="口岸数据导入">
          <section className="workspace-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Ship size={18} />} title="进出口报关数据查询" />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadCustomsRecords()
                }}
              >
                <label>
                  报关单号
                  <Input
                    value={customsDeclarationFilter}
                    onChange={(event) => setCustomsDeclarationFilter(event.target.value)}
                  />
                </label>
                <label>
                  报关回单号
                  <Input
                    value={customsReceiptFilter}
                    onChange={(event) => setCustomsReceiptFilter(event.target.value)}
                  />
                </label>
                <label>
                  进出口
                  <FormSelect
                    value={customsTradeTypeFilter}
                    onChange={(event) => setCustomsTradeTypeFilter(event.target.value)}
                  >
                    <option value="">全部</option>
                    <option value="export">出口</option>
                    <option value="import">进口</option>
                  </FormSelect>
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
                <Button
                  htmlType="button"
                  icon={<RefreshCw size={16} />}
                  loading={matchingCustomsReceipts}
                  onClick={() => void autoMatchPortCustomsReceipts()}
                >
                  自动匹配回单
                </Button>
              </form>
            </div>
            <Table<CustomsDeclarationRecord>
              columns={[
                { title: '报关单号', dataIndex: 'declaration_no' },
                { title: '回单号', dataIndex: 'customs_receipt_no', render: nullableText },
                {
                  title: '进出口',
                  dataIndex: 'trade_type',
                  render: (value: string) => (value === 'import' ? '进口' : '出口'),
                },
                { title: '商品', dataIndex: 'product_name' },
                {
                  title: '匹配',
                  dataIndex: 'match_status',
                  render: (value: string) =>
                    value === 'matched' ? <Tag color="green">已匹配</Tag> : <Tag>未匹配</Tag>,
                },
                { title: '核销单', dataIndex: 'verification_document_no', render: nullableText },
                { title: '报关日期', dataIndex: 'customs_date', render: nullableText },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={customsRecords}
              loading={loadingCustomsRecords}
              pagination={false}
              rowKey="id"
              size="small"
            />
            <div className="finance-receipt-strip">
              <span>报关数据 {customsRecords.length} 条</span>
            </div>

            <div className="panel-heading">
              <PanelTitle icon={<FileText size={18} />} title="导入批次记录" />
            </div>
            <Table<PortImportBatch>
              columns={[
                { title: '批次号', dataIndex: 'batch_no' },
                { title: '来源', dataIndex: 'source' },
                { title: '导入日期', dataIndex: 'imported_at' },
                { title: '记录数', dataIndex: 'record_count' },
                { title: '状态', dataIndex: 'status' },
              ]}
              dataSource={portImportBatches}
              loading={loadingPortBatches}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </section>

          <section className="workspace-panel">
            <div className="panel-heading">
              <PanelTitle icon={<Plus size={18} />} title="导入口岸数据" />
            </div>
            <form className="record-form" onSubmit={submitPortBatch}>
              <label>
                批次号
                <Input
                  value={portBatchForm.batch_no}
                  onChange={(event) =>
                    setPortBatchForm((prev) => ({ ...prev, batch_no: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                数据来源
                <Input
                  value={portBatchForm.source}
                  placeholder="如：电子口岸 / 海关"
                  onChange={(event) =>
                    setPortBatchForm((prev) => ({ ...prev, source: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                导入日期
                <Input
                  type="date"
                  value={portBatchForm.imported_at}
                  onChange={(event) =>
                    setPortBatchForm((prev) => ({ ...prev, imported_at: event.target.value }))
                  }
                  required
                />
              </label>
              <div className="form-divider">报关数据明细</div>
              <label>
                报关单号
                <Input
                  value={portRecordForm.declaration_no}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, declaration_no: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                报关回单号
                <Input
                  value={portRecordForm.customs_receipt_no}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, customs_receipt_no: event.target.value }))
                  }
                />
              </label>
              <label>
                进出口类型
                <FormSelect
                  value={portRecordForm.trade_type}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, trade_type: event.target.value }))
                  }
                >
                  <option value="export">出口</option>
                  <option value="import">进口</option>
                </FormSelect>
              </label>
              <label>
                商品名称
                <Input
                  value={portRecordForm.product_name}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, product_name: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                报关金额
                <Input
                  value={portRecordForm.amount}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                币种
                <Input
                  value={portRecordForm.currency}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, currency: event.target.value }))
                  }
                  required
                />
              </label>
              <Button htmlType="submit" type="primary" loading={submittingPortBatch} icon={<Save size={16} />}>
                导入数据
              </Button>
            </form>
          </section>
        </section>
      </section>
    )
  }

  if (activeModule === 'reports') {
    const reportTabs: { key: string; label: string }[] = [
      { key: 'receipt-usage', label: '水单使用明细' },
      { key: 'bank-receipt-summary', label: '银行水单汇总' },
      { key: 'goods-payment', label: '货款支付情况' },
      { key: 'fee-payment', label: '费用支付情况' },
      { key: 'customs-receipt-collection', label: '报关回单催收' },
      { key: 'tax-refund-statistics', label: '申报退税统计' },
    ]
    return (
      <section className="finance-page">
        {moduleHeader}
        {moduleAlerts}
        <section className="workspace-panel" aria-label="财务统计报表">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<FileSpreadsheet size={18} />} title="财务统计报表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadFinanceReport(activeReport)
              }}
            >
              <label>
                起始日期
                <Input
                  type="date"
                  value={reportDateFrom}
                  onChange={(event) => setReportDateFrom(event.target.value)}
                />
              </label>
              <label>
                结束日期
                <Input
                  type="date"
                  value={reportDateTo}
                  onChange={(event) => setReportDateTo(event.target.value)}
                />
              </label>
              <label>
                币种
                <Input
                  value={reportCurrency}
                  placeholder="如 USD"
                  onChange={(event) => setReportCurrency(event.target.value)}
                />
              </label>
              {activeReport === 'receipt-usage' ? (
                <label>
                  水单号
                  <Input
                    value={reportReceiptNo}
                    onChange={(event) => setReportReceiptNo(event.target.value)}
                  />
                </label>
              ) : null}
              {activeReport === 'bank-receipt-summary' ? (
                <label>
                  收款性质
                  <FormSelect
                    value={reportReceiptType}
                    onChange={(event) => setReportReceiptType(event.target.value)}
                  >
                    <option value="">全部</option>
                    <option value="advance">预收</option>
                    <option value="normal">普通</option>
                    <option value="tax_refund">退税</option>
                  </FormSelect>
                </label>
              ) : null}
              {activeReport === 'goods-payment' ? (
                <label>
                  供应商
                  <Input
                    value={reportSupplierName}
                    onChange={(event) => setReportSupplierName(event.target.value)}
                  />
                </label>
              ) : null}
              {activeReport === 'fee-payment' ? (
                <>
                  <label>
                    合作伙伴
                    <Input
                      value={reportPartnerName}
                      onChange={(event) => setReportPartnerName(event.target.value)}
                    />
                  </label>
                  <label>
                    费用类型
                    <Input
                      value={reportFeeType}
                      onChange={(event) => setReportFeeType(event.target.value)}
                    />
                  </label>
                  <label>
                    业务员
                    <Input
                      value={reportSalesUserId}
                      onChange={(event) => setReportSalesUserId(event.target.value)}
                    />
                  </label>
                </>
              ) : null}
              {activeReport === 'customs-receipt-collection' ? (
                <>
                  <label>
                    业务员
                    <Input
                      value={reportOwnerUserId}
                      onChange={(event) => setReportOwnerUserId(event.target.value)}
                    />
                  </label>
                  <label>
                    催收状态
                    <FormSelect
                      value={reportReminderStatus}
                      onChange={(event) => setReportReminderStatus(event.target.value)}
                    >
                      <option value="">全部</option>
                      <option value="pending">待处理</option>
                      <option value="done">已完成</option>
                      <option value="overdue">已逾期</option>
                    </FormSelect>
                  </label>
                  <label>
                    包含已登记
                    <input
                      checked={reportIncludeRegistered}
                      type="checkbox"
                      onChange={(event) => setReportIncludeRegistered(event.target.checked)}
                    />
                  </label>
                </>
              ) : null}
              {['goods-payment', 'fee-payment', 'tax-refund-statistics'].includes(activeReport) ? (
                <label>
                  状态
                  <Input
                    value={reportStatus}
                    onChange={(event) => setReportStatus(event.target.value)}
                  />
                </label>
              ) : null}
              <Button htmlType="submit" icon={<Search size={16} />} loading={loadingReport}>
                查询
              </Button>
              <Button
                htmlType="button"
                icon={<FileSpreadsheet size={16} />}
                loading={exportingReport}
                onClick={() => void exportFinanceReport(activeReport)}
              >
                导出 CSV
              </Button>
            </form>
          </div>

          <nav className="finance-tab-rail" aria-label="报表切换">
            {reportTabs.map((tab) => (
              <button
                key={tab.key}
                aria-current={tab.key === activeReport ? 'page' : undefined}
                className={tab.key === activeReport ? 'finance-tab active' : 'finance-tab'}
                type="button"
                onClick={() => setActiveReport(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeReport === 'receipt-usage' ? (
            <Table<ReceiptUsageDetailRow>
              columns={[
                { title: '水单号', dataIndex: 'receipt_no' },
                { title: '收款日期', dataIndex: 'received_at' },
                { title: '付款方', dataIndex: 'payer_name' },
                { title: '分摊类型', dataIndex: 'allocation_type' },
                { title: '合同号', dataIndex: 'contract_no', render: nullableText },
                { title: '发票号', dataIndex: 'invoice_no', render: nullableText },
                {
                  title: '分摊金额',
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '下钻',
                  render: (_, record) => (
                    <Button
                      size="small"
                      onClick={() => void openFinanceReportDrilldown(activeReport, record.receipt_no)}
                    >
                      来源
                    </Button>
                  ),
                },
              ]}
              dataSource={receiptUsageReport?.rows ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey={(record) => `${record.receipt_no}-${record.invoice_no ?? record.contract_no ?? ''}-${record.allocated_at}`}
              size="small"
            />
          ) : null}

          {activeReport === 'bank-receipt-summary' ? (
            <Table<BankReceiptCurrencySummary>
              columns={[
                { title: '币种', dataIndex: 'currency' },
                { title: '水单数', dataIndex: 'receipt_count' },
                {
                  title: '合计金额',
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已分摊',
                  dataIndex: 'allocated_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '未分摊',
                  dataIndex: 'unallocated_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={bankReceiptSummaryReport?.currency_summaries ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey="currency"
              size="small"
            />
          ) : null}

          {activeReport === 'goods-payment' ? (
            <Table<GoodsPaymentQueryRow>
              columns={[
                { title: '付款单号', dataIndex: 'request_no' },
                { title: '日期', dataIndex: 'request_date' },
                { title: '供应商', dataIndex: 'supplier_name' },
                { title: '发票号', dataIndex: 'supplier_invoice_no' },
                {
                  title: '申请金额',
                  dataIndex: 'requested_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已付',
                  dataIndex: 'paid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '未付',
                  dataIndex: 'outstanding_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '状态', dataIndex: 'status' },
                {
                  title: '下钻',
                  render: (_, record) => (
                    <Button
                      size="small"
                      onClick={() => void openFinanceReportDrilldown(activeReport, record.request_no)}
                    >
                      来源
                    </Button>
                  ),
                },
              ]}
              dataSource={goodsPaymentReport?.rows ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey="request_no"
              size="small"
            />
          ) : null}

          {activeReport === 'fee-payment' ? (
            <Table<FeePaymentQueryRow>
              columns={[
                { title: '付费单号', dataIndex: 'request_no' },
                { title: '日期', dataIndex: 'request_date' },
                { title: '合作伙伴', dataIndex: 'partner_name' },
                { title: '费用类型', dataIndex: 'fee_type' },
                { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                {
                  title: '申请金额',
                  dataIndex: 'requested_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '未付',
                  dataIndex: 'outstanding_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '状态', dataIndex: 'status' },
                {
                  title: '下钻',
                  render: (_, record) => (
                    <Button
                      size="small"
                      onClick={() => void openFinanceReportDrilldown(activeReport, record.request_no)}
                    >
                      来源
                    </Button>
                  ),
                },
              ]}
              dataSource={feePaymentReport?.rows ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey="request_no"
              size="small"
            />
          ) : null}

          {activeReport === 'customs-receipt-collection' ? (
            <Table<CustomsReceiptCollectionRow>
              columns={[
                { title: '核销单号', dataIndex: 'document_no' },
                { title: '领用日期', dataIndex: 'received_at' },
                { title: '业务员', dataIndex: 'owner_user_name', render: nullableText },
                { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                { title: '报关单号', dataIndex: 'customs_declaration_no', render: nullableText },
                { title: '提醒日期', dataIndex: 'reminder_date' },
                { title: '催收状态', dataIndex: 'reminder_status' },
                {
                  title: '可退税额',
                  dataIndex: 'refundable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '下钻',
                  render: (_, record) => (
                    <Button
                      size="small"
                      onClick={() => void openFinanceReportDrilldown(activeReport, record.document_no)}
                    >
                      来源
                    </Button>
                  ),
                },
              ]}
              dataSource={customsCollectionReport?.rows ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey="document_no"
              size="small"
            />
          ) : null}

          {activeReport === 'tax-refund-statistics' ? (
            <Table<TaxRefundCurrencyTotal>
              columns={[
                { title: '币种', dataIndex: 'currency' },
                { title: '核销单数', dataIndex: 'document_count' },
                {
                  title: '可退税额',
                  dataIndex: 'refundable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已退税额',
                  dataIndex: 'refunded_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '待退税额',
                  dataIndex: 'outstanding_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={taxRefundStatisticsReport?.currency_totals ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey="currency"
              size="small"
            />
          ) : null}

          {reportExplanation ? (
            <section className="finance-action-block" aria-label="报表口径说明">
              <PanelTitle icon={<FileText size={18} />} title="统计口径" />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="数据来源">
                  {reportExplanation.source_tables.join('、')}
                </Descriptions.Item>
                <Descriptions.Item label="计算规则">
                  {reportExplanation.metric_rules.join('；')}
                </Descriptions.Item>
                <Descriptions.Item label="字段">
                  {reportExplanation.fields.map((field) => `${field.label}: ${field.formula}`).join('；')}
                </Descriptions.Item>
              </Descriptions>
              {loadingReportExplanation ? <Skeleton active paragraph={false} /> : null}
            </section>
          ) : null}

          {reportDrilldown ? (
            <section className="finance-action-block" aria-label="报表下钻">
              <PanelTitle icon={<ChevronRight size={18} />} title="来源下钻" />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="来源编号">{reportDrilldown.source_no}</Descriptions.Item>
                <Descriptions.Item label="来源类型">{reportDrilldown.source_type}</Descriptions.Item>
                <Descriptions.Item label="入口">
                  {reportDrilldown.items.length > 0
                    ? reportDrilldown.items
                        .map((item) => `${item.label}: ${item.value ?? ''} ${item.target_path ?? ''}`)
                        .join('；')
                    : '未找到可下钻来源'}
                </Descriptions.Item>
              </Descriptions>
            </section>
          ) : null}
        </section>
      </section>
    )
  }

  return null
}

