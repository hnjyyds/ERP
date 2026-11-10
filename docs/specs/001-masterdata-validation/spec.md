# 第一批：服务端主数据统一校验 + 下拉改服务端搜索

状态：待确认
范围依据：`docs/18-基础数据引用与幂等盘点.md`
批次：第一批（第二批幂等、第三批快照、第四批仓库/库位、第五批单证资料接入，均不在本 Spec 内）

## 1. 目标

1. 所有**由客户端显式提交**的产品、客户、供应商、合作伙伴、单证资料、员工引用，在服务层写入前统一校验。
2. 校验入口只有一个，不允许各服务各写一套查询。
3. 错误语义统一：引用不存在 → `422 VALIDATION_ERROR`；引用已停用 → `409 CONFLICT`。
4. 前端 4 处一次性下拉改为服务端关键字搜索 + 分页，删除“固定 50 条”兜底。
5. 单个 Python 文件不超过 700 行。

## 2. 口径决策（本批固定的行为）

| 决策 | 结论 | 理由 |
|---|---|---|
| 新建 | 客户端提交的主数据引用必须存在且 `status=active`，否则拒绝 | 停用数据不得被新单引用 |
| 编辑旧单 | 引用与单据当前值**相同** → 只校验存在；引用**发生变化** → 必须 `active` | “编辑旧单保留原有引用”，同时防止把旧单改指到另一个停用数据 |
| 服务端派生引用 | 从上游单据/当前登录人带出的引用只校验存在，不校验启用 | 上游单据是旧引用，停用后仍应能生成下游 |
| 可选引用为空 | `None` / 空字符串直接跳过 | 客户、合作伙伴、单证主体存在可空字段 |
| 列表/详情/打印/导出 | 不改，继续使用写入时快照 | 快照统一属于第三批 |
| 仓库/库位 | 不动 | 无主数据表，第四批建表后再校验 |
| 单证资料 → 合同/出货 | 不改 | 第五批 |
| 生成型接口幂等 | 不改 | 第二批 |
| 前端下拉 | 只做便利，不作为防线 | 用户硬要求 |

错误映射补充：

- `MasterDataReferenceError`（类名不含 NotFound）→ 走现有 `domain_exception_definition` 默认分支 → `422 VALIDATION_ERROR`。
- `MasterDataInactiveError` → 在 `app/api/error_handlers.py` 显式归入 `AppStatusCode.CONFLICT`（409）。
- 错误文案走现有 gettext 风格：服务层抛中文源串，`localize_message` 在错误边界翻译。

## 3. 后端设计

### 3.1 新增 `backend/app/modules/masterdata/validation.py`

```python
class MasterDataReferenceError(Exception):
    """引用的主数据不存在。HTTP 422。"""

class MasterDataInactiveError(Exception):
    """引用的主数据已停用。HTTP 409。"""

class MasterDataValidator:
    def __init__(self, session: AsyncSession) -> None: ...

    async def product(self, product_id: str | None, *, allow_inactive: bool = False) -> None
    async def customer(self, customer_id: str | None, *, allow_inactive: bool = False) -> None
    async def supplier(self, supplier_id: str | None, *, allow_inactive: bool = False) -> None
    async def partner(
        self,
        partner_id: str | None,
        *,
        allow_inactive: bool = False,
        expected_type: str | None = None,
        expected_name: str | None = None,
    ) -> None
    async def document_party(
        self,
        party_id: str | None,
        *,
        allow_inactive: bool = False,
    ) -> None
    async def user(self, user_id: str | None, *, allow_inactive: bool = False) -> None
```

实现要点：

- 只 `select(Model.id, Model.status)`，不加载整行；不存在抛 `MasterDataReferenceError`，`status != "active"` 且 `allow_inactive=False` 抛 `MasterDataInactiveError`。
- `partner` 额外校验 `partner_type`、`cn_name` 与提交值一致（沿用 `finance/fee_payments/services.py` 现有规则），不一致抛 `MasterDataReferenceError`。
- `user` 委托 `AuthRepository.get_user_identity_by_id`（已过滤停用）；为空统一抛 `MasterDataReferenceError("所选员工不存在或已停用")`。`allow_inactive` 对该方法无效，保持现状。
- 文案常量集中在模块顶部，避免各服务拼字符串。

新增文案（`backend/app/core/source_messages.py`）：

```
客户不存在 / 客户已停用
供应商不存在 / 供应商已停用
商品不存在 / 商品已停用
合作伙伴不存在 / 合作伙伴已停用
单证主体不存在 / 单证主体已停用
所选员工不存在或已停用
合作伙伴类型不一致 / 合作伙伴名称不一致
```

### 3.2 错误处理改动

`backend/app/api/error_handlers.py::domain_exception_definition`

- 在 `NotFound` 分支之前增加：`elif class_name == "MasterDataInactiveError": code = AppStatusCode.CONFLICT`。
- 不新增 `_EXCEPTION_DEFAULT_KEYS`，文案由异常携带。

### 3.3 接入点（逐个方法与校验字段）

所有服务在 `__init__` 中增加 `self._masterdata = MasterDataValidator(repository.session)`；不在方法内重复构造。

#### 销售

| 文件 / 方法 | 校验 | allow_inactive |
|---|---|---|
| `sales/quotations/services.py::create_quotation` | `customer_id`、`sales_user_id`、每个 `lines[].product_id` | 否 |
| `sales/quotations/services.py::update_quotation` | 表头客户、每行产品、销售员 | 与单据现有值相同则 True |
| `sales/contracts/services.py::create_contract` | `customer_id`、每个 `lines[].product_id` | 否 |
| `sales/contracts/services.py::update_contract` | 同上 | 与现有值相同则 True |

“现有值”通过 `repository.get_quotation/get_contract` 与 `repository.list_lines(...)` 获取。为控制行数，新增私有方法：

```python
async def _validate_references(
    self, payload, *, existing_customer_id: str | None = None,
    existing_product_ids: set[str] | None = None,
    existing_sales_user_id: str | None = None,
) -> None
```

#### 采购

| 文件 / 方法 | 校验 | allow_inactive |
|---|---|---|
| `purchase/inquiries/services.py::create_inquiry` | `supplier_id`、每个 `lines[].product_id` | 否 |
| `purchase/inquiries/services.py::update_inquiry` | 同上 | 与现有值相同则 True |
| `purchase/inquiries/services.py::add_supplier_quotation` | `supplier_id`、报价行 `product_id` | 否 |
| `purchase/contracts/services.py::create_contract` | `supplier_id`、每个 `lines[].product_id` | 否 |
| `purchase/contracts/services.py::update_contract` | 同上 | 与现有值相同则 True |
| `purchase/contracts/services.py::generate_from_export_contracts` | 客户端提交的 `supplier_id`；`_resolve_source_product_id` 解析出的每个产品 | 产品 True，供应商 False |

#### 单证资料

| 文件 / 方法 | 校验 | allow_inactive |
|---|---|---|
| `masterdata/document_parties/services.py::create_party` | 可选 `customer_id` | 否 |
| `masterdata/document_parties/services.py::update_party` | 可选 `customer_id` | 与现有值相同则 True |

#### 财务

| 文件 / 方法 | 校验 | allow_inactive |
|---|---|---|
| `finance/receipts/services.py::create_receipt` | 可选 `customer_id` | 否 |
| `finance/receipts/services.py` 认领方法 | 可选 `sales_user_id` | 否 |
| `finance/payments/services.py::create_supplier_invoice` | `supplier_id` | 否 |
| `finance/payments/services.py::create_payment_request` | `supplier_id` | 否 |
| `finance/fee_payments/services.py::create_partner_fee_invoice` | 改为调用 `MasterDataValidator.partner(..., expected_type, expected_name)` | 否 |
| `finance/fee_payments/services.py::create_fee_payment_request` | 同上 | 否 |

不在本批：报价/合同的派生出货单、入库计划/单、出库计划/单、QC、跟单、结算、核销单、杂费、口岸数据、报销。原因：引用全部来自上游单据或纯文本，上游已校验；幂等与快照分别由第二、三批处理。

### 3.4 700 行处理

`purchase/contracts/services.py` 当前 700 行。新增 `backend/app/modules/purchase/contracts/generation_types.py`，把 `_GeneratedLine`、`_SourceContractLine` 两个 dataclass 移出并改名为 `GeneratedLine`、`SourceContractLine`，原文件改为导入。预计降至约 680 行，容纳校验代码。

## 4. 前端设计

### 4.1 `RemoteSelect` 支持“回填已选旧值”

`frontend/src/shared/ui/RemoteSelect.tsx`

- 新增可选 prop `initialOption?: RemoteSelectOption`。
- 渲染时 `resolvedOptions` 先合并 `initialOption`，保证编辑旧单时即使该主数据已停用、搜索不到，也能显示原名称。
- 现有 `selectedOption` 计算逻辑删除（永远为 null，是死代码）。

### 4.2 4 处下拉改服务端搜索

统一 `fetchOptions(query)`，`limit: 20`，返回 `{ label, value, description }`：

| Hook | 变更 |
|---|---|
| `sales/hooks/useExportContractOptions.ts` | 删除 `customers`/`products` 数组与初始化加载；新增 `fetchCustomerOptions`（`listCustomers({ q, status: 'active', limit: 20 })`）与 `fetchProductOptions`（`listProducts({ q, limit: 20 })`）；保留 `assignableUsers` 逻辑 |
| `sales/hooks/useExportQuotationsList.ts` | 客户筛选项改为 `fetchCustomerOptions`，不再一次性加载 |
| `purchase/hooks/usePurchaseContractOptions.ts` | 产品、供应商改为 `fetchProductOptions` / `fetchSupplierOptions`（`listSuppliers({ q, status: 'active', limit: 20 })`） |

API 客户端无需改动：`listCustomers`、`listSuppliers`、`listProducts` 已支持 `q`/`limit`/`offset`，后端分页中间件已生效。

视图改动：

- `sales/ExportContractsPage.tsx`、`purchase/PurchaseContractsPage.tsx`：客户/供应商/商品选择改用 `RemoteSelect`，传入 `fetchOptions` 与 `initialOption`。
- `sales/hooks/useExportContractFormModal.ts`：客户选择从 `options.customers.find` 改为接收选中项（`onChange` 时用 label 填名称）；商品抽屉的本地 `filter` 改为服务端 `fetchProductOptions(productSearch)`，删除 `filteredProducts` 的内存过滤。
- `purchase/hooks/usePurchaseContractFormModal.ts`：商品/供应商选择同理。
- `sales/views/ExportQuotationListPanel.tsx`：客户筛选项改用 `RemoteSelect`。

约束：前端任何位置不得再对主数据列表做 `slice(0, 50)` 或依赖首次加载全量。

## 5. 测试

### 5.1 后端

新增 `backend/tests/services/test_masterdata_validation.py`：

1. 存在且启用 → 不抛。
2. 不存在 → `MasterDataReferenceError`。
3. 已停用 → `MasterDataInactiveError`。
4. `allow_inactive=True` + 已停用 → 不抛。
5. `None` → 不抛。
6. 合作伙伴类型/名称不一致 → `MasterDataReferenceError`。

新增 `backend/tests/api/test_masterdata_reference_validation.py`：

1. `POST /sales/quotations` 传不存在 `customer_id` → 422，`code=VALIDATION_ERROR`。
2. `POST /sales/quotations` 传已停用 `product_id` → 409，`code=CONFLICT`。
3. 编辑旧单：单据引用已停用客户，`PUT` 不修改客户，仅改备注 → 200 且引用保留。
4. 编辑旧单改成另一个停用客户 → 409。
5. `POST /purchase/contracts` 不存在 `supplier_id` → 422。
6. `POST /masterdata/document-parties` 不存在 `customer_id` → 422。
7. `POST /finance/receipts` 不存在 `customer_id` → 422。

下拉分页回归：`backend/tests/api/test_customers.py` 增加用例——创建 55 个客户后 `GET /masterdata/customers?q=<公共前缀>&limit=20&offset=40` 能返回第 51 条以后的数据，`total=55`。

既有测试兼容：新增 `backend/tests/fixtures/reference_data.py`，提供 `seed_reference_master_data(session)` 与 pytest fixture `reference_master_data`，按测试现有的固定 ID 插入主数据（`customer-a`、`customer-euro-home`、`product-a`、`product-bag`、`supplier-a`、`supplier-pack-a`、`partner-a` 等），编码统一 `TEST-` 前缀避免唯一键冲突。受影响的测试模块以 `pytestmark = pytest.mark.usefixtures("reference_master_data")` 一行接入；只改因新增校验而失败的模块，不批量铺开。

### 5.2 前端

- `frontend/src/shared/ui/__tests__/RemoteSelect.test.tsx`：`initialOption` 在搜索无结果时仍显示。
- `frontend/src/app/pages/__tests__/ExportContractsPage.test.tsx`、`PurchaseContractsPage.test.tsx`、`ExportQuotationsPage.test.tsx`：断言首次调用带 `{ q: '', status: 'active', limit: 20 }`；输入关键字后再次调用带 `q`。

## 6. 验证命令

```bash
cd backend && python -m pytest
cd backend && ruff check app tests
cd frontend && npm run test -- --run
cd frontend && npm run build
cd backend && python -m pytest tests/architecture/test_backend_file_boundaries.py
```

验收标准：全部通过；`backend/app` 无超过 700 行的文件；新增/修改文件均为中文注释风格，不引入与任务无关的重构。

## 7. 提交

单个提交，信息：

```
feat(masterdata): 统一服务端主数据校验并改造下拉为服务端搜索
```

提交后上报：改动文件清单、新增错误码语义、测试结果、遗留项（仓库/库位、单证资料下游、幂等、快照）。
