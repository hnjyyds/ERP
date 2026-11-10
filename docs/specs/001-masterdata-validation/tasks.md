# 第一批任务清单

依据：`spec.md`。按顺序执行，每完成一项勾选。

## T1 后端统一校验基础设施

- [x] 新增 `backend/app/modules/masterdata/validation.py`：`MasterDataReferenceError`、`MasterDataInactiveError`、`MasterDataValidator`（product/customer/supplier/partner/document_party/user）。
- [x] `backend/app/api/error_handlers.py`：`MasterDataInactiveError` → `CONFLICT`。
- [x] `backend/app/core/source_messages.py`：补 10 条中文源串英文映射。
- [x] 新增 `backend/tests/services/test_masterdata_validation.py`（6 个用例）。

验证：`python -m pytest tests/services/test_masterdata_validation.py`

## T2 销售接入

- [x] `sales/quotations/services.py`：`create_quotation` / `update_quotation` 接入 `_validate_references`。
- [x] `sales/contracts/services.py`：`create_contract` / `update_contract` 接入。
- [x] 文件行数 ≤ 700。

验证：`python -m pytest tests/services/test_export_quotation_service.py tests/services/test_export_contract_service.py tests/api/test_export_quotations.py tests/api/test_export_contracts.py`

## T3 采购接入

- [x] `purchase/inquiries/services.py`：`create_inquiry` / `update_inquiry` / `add_supplier_quotation`。
- [x] 新增 `purchase/contracts/generation_types.py`，迁移两个 dataclass。
- [x] `purchase/contracts/services.py`：`create_contract` / `update_contract` / `generate_from_export_contracts`。
- [x] 文件行数 ≤ 700。

验证：`python -m pytest tests/services/test_purchase_inquiry_service.py tests/services/test_purchase_contract_service.py tests/api/test_purchase_contracts.py tests/api/test_purchase_inquiries.py`

## T4 单证资料与财务接入

- [x] `masterdata/document_parties/services.py`：`create_party` / `update_party` 校验 `customer_id`。
- [x] `finance/receipts/services.py`：`create_receipt` 校验客户，认领校验 `sales_user_id`。
- [x] `finance/payments/services.py`：`create_supplier_invoice` / `create_payment_request` 校验供应商。
- [x] `finance/fee_payments/services.py`：两处改用 `MasterDataValidator.partner`。

验证：`python -m pytest tests/api/test_document_parties.py tests/api/test_finance_receipts.py tests/api/test_finance_payments.py tests/api/test_finance_fee_payments.py`

## T5 后端测试与既有用例兼容

- [x] 新增 `backend/tests/api/test_masterdata_reference_validation.py`（7 个用例）。
- [x] `backend/tests/api/test_customers.py` 增加“第 51 条以后可搜到”用例。
- [x] 新增 `backend/tests/reference_data.py` 与 `reference_master_data` fixture，仅修复因校验失败的既有模块。
- [x] 全量 `python -m pytest` 通过。

## T6 前端下拉改造

- [x] `shared/ui/RemoteSelect.tsx`：新增 `initialOption`，删除死代码 `selectedOption`。
- [x] `sales/hooks/useExportContractOptions.ts`：改 `fetchCustomerOptions` / `fetchProductOptions`。
- [x] `sales/hooks/useExportQuotationsList.ts`：客户筛选改远程搜索。
- [x] `purchase/hooks/usePurchaseContractOptions.ts`：改 `fetchProductOptions` / `fetchSupplierOptions`。
- [x] `sales/ExportContractsPage.tsx`、`purchase/PurchaseContractsPage.tsx`、`sales/views/ExportQuotationListPanel.tsx`、两个 `use*FormModal.ts` 改用 `RemoteSelect` / 服务端搜索。
- [x] 删除前端截断与本地全量过滤。

## T7 前端测试与验证

- [x] 新增 `RemoteSelect` 的 `initialOption` 用例。
- [x] 更新 `ExportContractsPage.test.tsx`、`PurchaseContractsPage.test.tsx`、`ExportQuotationsPage.test.tsx`。
- [x] `npm run test -- --run`、`npm run build` 通过。

## T8 提交与上报

- [x] `python -m pytest tests/architecture/test_backend_file_boundaries.py` 通过。
- [x] 单次提交 `feat(masterdata): 统一服务端主数据校验并改造下拉为服务端搜索`。
- [x] 上报：改动清单、错误语义、测试结果、遗留项。

## T9 后续（不在本次提交）

- [ ] 写 `docs/17-功能页面导览.md` 第二章：报价 → 样品 → 出口合同。
