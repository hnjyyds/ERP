# 报价 → 样品 → 出口合同 链路打通 · 方案（待审批）

- 状态：待确认（含 4 项产品决策）
- 关联：`docs/specs/001-masterdata-validation/spec.md`（已实施）
- 约束：后端单文件 ≤700 行（`backend/tests/architecture/test_backend_file_boundaries.py`）；新增文案走中英文案机制；不破坏既有 556 个后端测试与 379 个前端测试。

---

## 1. 目标

1. 报价 ↔ 打样：`sample_requests` 增加 `quotation_id` + `quotation_no` 快照，可从报价直接发起打样，报价详情展示打样单与进度。
2. 打样 → 样品登记：保留一次性转换，补齐来源可追溯（响应与页面展示来源单号）。
3. 样品登记 → 寄样单：寄样明细只选样品登记记录（ID + 编号快照服务端派生），留样扣减逻辑不变。
4. 报价 ↔ 寄样：寄样单存真实 `quotation_id`，报价详情按 ID 查寄样。
5. 报价 → 出口合同：保留一次性生成，补齐丢失字段（按产品决策）。
6. 样品三页客户/产品/供应商改为结构化引用（ID + 名称快照），复用 `MasterDataValidator`，下拉改服务端搜索。

非范围：导览第二章之后的内容、第三章；不改库存流水算法；不重做报价/合同审批流。

---

## 2. 现状核对（已确认）

| 位置 | 现状 |
| --- | --- |
| `backend/app/modules/sample/requests/models.py` | 已有 `customer_id/name`、`product_id/code/name`、`supplier_id/name`、`sales_user_id`；**无 quotation 字段** |
| `backend/app/modules/sample/requests/services.py:78` | `create_request` 已透传各 ID，但**未做存在性/停用校验** |
| `backend/app/modules/sample/requests/services.py:294` | `convert_request_to_record` 已写 `source_type/source_id/source_code`，用 `get_record_by_source` 防重（**无唯一约束，存在并发窗口**） |
| `backend/app/modules/sample/records/models.py` | 已有客户/产品/供应商 ID 与 `source_*` |
| `backend/app/modules/sample/deliveries/models.py:32` | 已有 `quote_id`、`quote_no`（均带索引） |
| `backend/app/modules/sample/deliveries/services.py:605` | `_add_delivery_children` 直接落库明细，**不校验 `sample_record_id` 是否存在、是否同客户、产品是否一致** |
| `backend/app/modules/sample/deliveries/services.py:633` | `_ensure_stock_available` 只校验留样量，未校验记录存在性 |
| `backend/app/modules/sales/quotations/services.py:500` | `get_sample_deliveries` 按「客户 ID + 报价首个产品」反查 |
| `backend/app/modules/sample/deliveries/repositories.py:583` | `list_quote_history` 即上述反查实现 |
| `backend/app/modules/sales/quotations/services.py:370` | `confirm_contract` 无重复生成防护；`_create_contract_from_quotation` 中 `payment_terms=""`、不带运费/采购参考价 |
| `backend/app/modules/sales/quotations/services.py:361` | `_ensure_not_contract_generated` 只用于撤回/驳回，未用于生成入口 |
| `backend/app/modules/sample/requests/services.py:227` | `request_fee_payment` 无幂等：重复点击会重复创建费用发票 + 付款申请 |
| `backend/migrations/versions/` | 最新为 `0014_notifications.py`，本次新增 `0015` |
| 行数红线 | `sample/deliveries/services.py` = 700、`repositories.py` = 699、`quotations/services.py` = 700 → **新增逻辑必须先拆分** |

---

## 3. 迁移设计（`0015_quotation_sample_link.py`）

### 3.1 表结构

1. `sample_requests`
   - `quotation_id VARCHAR(36) NULL`，索引 `ix_sample_requests_quotation_id`
   - `quotation_no VARCHAR(80) NULL`，索引 `ix_sample_requests_quotation_no`
   - 不建 FK（与 sample 模块既有 `customer_id` 等保持一致，引用由服务层校验）；同时建 `(quotation_id, created_at)` 无需，单列索引足够。
2. `sample_deliveries`
   - `quote_id` → `quotation_id`、`quote_no` → `quotation_no`：**重命名列 + 重命名索引**（数据原样保留）。
   - 理由：语义从「手填文本」变为「真实外键」，保留旧名会让后续维护者误判；一次性窗口内前后端同步升级，不做双写兼容。
3. 唯一约束（幂等兜底）
   - `sample_records(source_type, source_id)`：PostgreSQL 部分唯一索引 `uq_sample_records_source`，条件 `source_type IS NOT NULL AND source_id IS NOT NULL`。覆盖「打样 → 样品登记」重复转换。
   - `export_contracts.source_quotation_id`：**不建唯一索引**（合同重开 `reissued_from_id` 场景可能复用来源），改用第 6 节的行级 CAS。
   - `sample_fees`：不新增唯一约束，用状态 CAS（见 6.2）。
4. 迁移需兼容 SQLite 测试库：使用 `op.batch_alter_table` 执行重命名，`create_index(..., postgresql_where=...)` 在 SQLite 分支退化为普通索引（迁移内按 dialect 分支）。

### 3.2 存量回填口径

原则：**只做确定性匹配，不猜**；匹配不上的全部留下并出清单。

| 数据 | 口径 | 匹配不上 |
| --- | --- | --- |
| `sample_deliveries.quote_no`（原手填） | 去空格后与 `export_quotations.code` **精确匹配**；唯一命中才写 `quotation_id`，`quotation_no` 保留原文本 | 保留 `quotation_no`、`quotation_id` 留空，进入清单 |
| `sample_records.customer_id/product_id/supplier_id` | 按名称精确匹配主数据（`customers.cn_name/en_name`、`products.name/code`、`suppliers.name`）；仅唯一命中才回填 | 留空，进入清单 |
| `sample_requests.customer_id/product_id/supplier_id` | 同上 | 留空，进入清单 |
| `sample_requests.quotation_id` | 存量无任何报价文本 → **一律留空**（不做「客户+产品」反查，避免错链） | 全部为未关联，不列入异常清单 |

实现：迁移只改结构；回填用独立脚本 `backend/migrations/backfill_sample_links.py`：
- `--dry-run` 输出 CSV 清单（表名、记录 ID、编号、原文本、候选数、原因）；
- 正式执行包在单事务内，逐表提交前打印统计；
- 清单默认输出到 `docs/specs/002-quotation-sample-contract-link/backfill-report.csv`，由用户确认后再落库。

---

## 4. 后端改动点

### 4.1 拆分（先做，保证 700 行）

| 文件 | 动作 |
| --- | --- |
| `sample/deliveries/services.py` | 抽 `_add_delivery_children`、`_ensure_stock_available`、行校验到新文件 `deliveries/line_validation.py`；统计/导出方法抽到 `deliveries/statistics.py` |
| `sample/deliveries/repositories.py` | 新建 `deliveries/quotation_queries.py` 放 `list_by_quotation_id` 等纯查询 |
| `sales/quotations/services.py` | 新建 `quotations/sample_links.py`（报价↔打样/寄样查询与发起打样），服务类组合调用 |

### 4.2 打样（`sample/requests`）

- `models.py`：加 `quotation_id`、`quotation_no`。
- `schemas.py`：
  - `SampleRequestCreate` 加 `quotation_id`、`quotation_no`（均选填）；
  - `SampleRequestResponse` 加两字段；
  - 列表查询参数加 `quotation_id`。
- `repositories.py`：`create_request` 透传两字段；`list_requests` 支持 `quotation_id` 过滤；`_apply_filters` 增加 `quotation_no` 的 `ilike` 命中。
- `services.create_request`：
  1. `MasterDataValidator` 校验 `customer_id/product_id/supplier_id/sales_user_id`（新建 `allow_inactive=False`）；
  2. 若传 `quotation_id`：查报价（存在 + 数据权限），`quotation_no` 以库内 `code` 覆盖客户端值；客户不一致直接 422（决策 D6）；
  3. 行内 `product_id` 同样校验。
- 新增接口：
  - `GET /sample/requests?quotation_id=`（在 `api/v1/sample_requests.py` 加参数）；
  - `POST /sales/quotations/{id}/sample-requests`：入参复用 `SampleRequestCreate`，服务端强制 `quotation_id=id` 并从报价带出客户与首行产品，调用同一 `create_request`（单一校验路径）。权限 `sample:request:edit`。

### 4.3 打样 → 样品登记（`sample/requests/services.py:294`）

- 已写 `source_*`；补齐：
  - 响应 `SampleRecordResponse` 确认返回 `source_type/source_id/source_code`（缺失则补）；
  - 新唯一索引兜底，捕获 `IntegrityError` → 抛既有 `SampleRecordAlreadyCreatedError`（409）；
  - `source_note` 追加报价号（有则 `来源报价：{quotation_no}`），不改表结构。

### 4.4 样品登记（`sample/records`）

- `services.create_record`：`MasterDataValidator` 校验客户/产品/供应商；`source_type/source_id` 成对出现校验。
- `repositories.list_records`：已支持 `q/sample_type/customer_id/limit/offset`，直接作为寄样行服务端搜索数据源，无需新接口。
- 前端补充「状态 / 剩余留样」展示直接取响应字段，不改接口。

### 4.5 寄样（`sample/deliveries`）

- `models.py`：列重命名。
- `schemas.py`：
  - `SampleDeliveryCreate`：`quote_id/quote_no` → `quotation_id/quotation_no`；
  - `SampleDeliveryLineCreate`：`sample_record_id` 必填保留；`sample_code/sample_type/product_code/product_name/unit` 改为**选填**（服务端派生并覆盖），新增前端不必再传；
  - `SampleDeliveryResponse/LineResponse`：字段同步重命名。
- `services.create_delivery` / `update_delivery`：
  1. 校验 `customer_id/supplier_id/factory_id`（`MasterDataValidator`，编辑态 `allow_inactive`）；
  2. 若有 `quotation_id`：查报价、覆盖 `quotation_no`、校验客户一致（决策 D6）；
  3. 逐行 `SampleRecordRepository.get_record(record_id)`：
     - 不存在 → 422；
     - 有客户时客户必须一致 → 422；
     - 用记录值填 `sample_code/sample_type/product_*/unit`（忽略客户端手填）；
  4. `_ensure_stock_available` 保持不变（仍按 `sample_record_id` 汇总数量）。
- `repositories.py`：新增 `list_by_quotation_id(quotation_id)`（状态范围沿用 `REPORTABLE_SAMPLE_DELIVERY_STATUSES`）；保留 `list_quote_history` 但不再被报价详情调用（可后续清理）。
- 报价侧 `sales/quotations/sample_links.py`：
  - `get_sample_deliveries` 改为 `list_by_quotation_id`；
  - 新增 `get_sample_requests`（按 `quotation_id` 取打样单 + 每单最新进度 + 是否已转样品登记）。
- 接口：`GET /sales/quotations/{id}/sample-requests`；现有 `/sample-deliveries` 行为改为按 ID。

### 4.6 报价 → 出口合同

- `confirm_contract` 改为：先 `_ensure_not_contract_generated`（复用 361 行逻辑）+ 行级锁，再生成。
- `_create_contract_from_quotation` 补字段：
  - `payment_terms`：按决策 D2；
  - 运费：按决策 D1（代码目前无运费字段可用，选项见第 8 节）；
  - `planned_ship_date`：保持 `valid_until or confirmed_at`（决策 D7）。
- 重复触发：见 6.3。

---

## 5. 前端改造点

| 页面/文件 | 改造 |
| --- | --- |
| `SampleRequestsPage.tsx`（636 行） | 客户/产品/供应商改 `Select`（`showSearch`、`filterOption={false}`、`onSearch` 防抖、每页 20、已选值 pin + 合成兜底 Option）；新增「报价号」列与服务端搜索报价；表单加报价选择，选中后自动带客户与首行产品 |
| `SampleRequestDetailPanel.tsx`（529 行） | 展示报价号（可跳转报价详情）、来源、进度；「转样品登记」按钮保留并展示来源单号 |
| `SampleRecordsPage.tsx`（1179 行，已超红线） | 先把新建/编辑表单抽到 `views/SampleRecordFormModal.tsx` 再改；客户/产品/供应商改服务端搜索 Select；列表展示来源单号 |
| `SampleDeliveriesPage.tsx`（609 行）/ `SampleDeliveryFormModal.tsx`（323 行） | 报价号改单个服务端搜索 Select（替换 `quote_no`/`quote_id` 两个 Input）；明细行改为选择样品登记（搜 `/sample/records?q=&customer_id=`），选中后自动填充编号/类型/产品/单位并展示剩余留样；删除手填样品标识字段 |
| `sampleDeliveryHelpers.ts`（270 行） | 表单模型与 payload 字段重命名为 `quotation_id/quotation_no`；明细 payload 精简为 `sample_record_id + quantity + unit + remark` |
| `ExportQuotationDetailPanel.tsx`（376 行） | 新增「打样单」区块（单号/状态/最新进度/是否已转登记）+「从该报价发起打样」；寄样区块改调按 ID 接口 |
| 新增 options hooks | `sample/options/useSampleRequestOptions.ts`、`sample/options/useSampleRecordOptions.ts`、`sample/options/useQuotationOptions.ts`（复用 `useExportContractOptions` 的模式） |
| `frontend/src/api/export.ts` / `sample.ts` | 报价类型加 `quotation_id/quotation_no` 与打样列表类型；寄样类型字段重命名；新增 `createSampleRequestFromQuotation`、`getQuotationSampleRequests` |
| i18n | 新增中英文案：报价关联、来源、留样提示、重复申请/重复生成错误提示 |

---

## 6. 幂等与一致性

### 6.1 打样 → 样品登记
- 应用层：`get_record_by_source` 保持；
- 数据库层：`uq_sample_records_source` 部分唯一索引兜底；
- 捕获 `IntegrityError` → 409 `SampleRecordAlreadyCreatedError`。

### 6.2 打样费用 → 付款申请（`requests/services.py:227`）
- 进入事务后先 CAS：
  `UPDATE sample_fees SET payment_status='requesting' WHERE id=:id AND payment_status='not_requested'`，影响行数 0 → 409 `SampleFeeAlreadyRequestedError`。
- CAS 与创建发票/付款申请在同一事务；任一步失败整体回滚，不会留下孤立的财务单据。
- 若需「失败后重试」，回滚即恢复 `not_requested`，天然可重试；已成功的不允许再次发起（决策 D10）。
- 补测试：连续两次调用第二次 409，且财务单据仅 1 张。

### 6.3 报价 → 出口合同（`quotations/services.py:370`）
- 入口先复用 `_ensure_not_contract_generated`（检查 `generated_contract_id` 与 `contract_exists_for_quotation`），再 `SELECT ... FOR UPDATE` 锁报价行；
- 生成后用 CAS 写回：`UPDATE export_quotations SET generated_contract_id=:cid, generated_contract_no=:code WHERE id=:id AND generated_contract_id IS NULL`；影响行数 0 → 抛异常回滚整个事务（合同不落库）；
- 并发双击只有一笔成功，另一笔 409。

### 6.4 寄样审核
- 已有 `delivery_no` 防止重复写库存流水，本次不改，仅补测试断言。

---

## 7. 测试与数据影响

新增/调整后端测试：
1. `tests/sample/test_sample_request_quotation.py`：报价引用校验、客户不一致 422、快照号以库内为准、列表按 `quotation_id` 过滤。
2. `tests/sample/test_sample_request_conversion.py`：并发/重复转换 → 409；`source_code` 正确；响应含来源字段。
3. `tests/sample/test_sample_delivery_links.py`：明细选择样品登记后服务端派生标识、跨客户 422、不存在 422、留样不足仍报错、按 `quotation_id` 查寄样。
4. `tests/sales/test_quotation_contract_idempotency.py`：重复生成 → 409，合同仅 1 份；字段补齐断言（按决策）。
5. `tests/sample/test_sample_fee_payment_idempotency.py`：重复申请 → 409，财务单据仅 1 份。
6. `tests/migrations/test_backfill_sample_links.py`：dry-run 清单条数与原因；幂等（重复执行不重复写）。

受影响既有测试（需同步改）：
- 后端所有构造寄样 payload 的用例（`quote_id/quote_no` 改名）；
- `tests/architecture/test_migrations.py`（新增 0015 后 head 唯一）；
- 前端 `SampleDeliveriesPage.test.tsx` 等 mock 中的 `quote_id/quote_no`；
- 前端下拉改服务端搜索后，相关页面测试需 mock 列表接口（参考 `masterdataOptions.test.tsx`）。

对既有数据：只做「精确匹配回填 + 留空」，不删除、不改写用户原文；寄样 `quotation_no` 原文本保留。

验收：后端全量测试通过（`uv run pytest`）；前端 `npm test -- --maxWorkers=2` 全绿；`tsc`、ESLint、ruff（仅允许既有长行豁免）通过；`test_backend_file_boundaries` 通过。

---

## 8. 产品决策（需确认）

| 编号 | 决策 | 默认建议 | 影响 |
| --- | --- | --- | --- |
| D1 | 运费是否带入出口合同 | **不带入**（合同无运费字段，报价总额已含运费） | 若带入需新增合同/明细运费字段与页面展示，工作量 +1 迁移 |
| D2 | 付款条件是否从客户信用档案带出 | **带出**（取 `customer_credit_profiles.payment_terms` 最新一条，取不到则空） | 只改服务层，无需迁移；风险是档案未维护时合同为空 |
| D3 | 寄样明细是否强制来自样品登记 | **强制**（`sample_record_id` 必填且校验） | 前端不能再手工录非登记样品；历史草稿编辑需先补登记 |
| D4 | 打样是否必须关联报价 | **不强制**（选填；关联则校验） | 保留临时打样场景 |
| D5 | 寄样单报价号是否必填 | **选填** | 无报价寄样（如展会样品）仍可用 |
| D6 | 关联报价时客户是否必须一致 | **必须一致**（不一致 422） | 防止串单；如需为客户变更留口子需另设流程 |
| D7 | 合同计划船期是否改用报价有效期 | **保持现状**（`valid_until` 兜底生成日） | 无迁移 |
| D8 | 存量打样单是否按「客户+产品」反查报价 | **不回填**（留空） | 避免错链；报价详情只能看到新单 |
| D9 | 报价已生成合同后是否允许再次生成 | **禁止**（409） | 需换合同走合同重开流程 |
| D10 | 打样费用已转付款申请后是否允许再次发起 | **禁止**（409） | 失败重试靠事务回滚；如需重发需财务侧撤销后置状态 |

---

## 9. 实施与提交计划（获批后）

1. 提交 A（迁移 + 后端链路）
   - 拆分超红线文件 → `0015` 迁移 → 回填脚本（先 dry-run 出清单）→ 打样/寄样/合同/费用幂等改造 → 后端测试 → 上报。
2. 提交 B（前端三页 + 报价详情）
   - 服务端搜索 hooks → 三页表单/明细改造 → 报价详情打样区块 → 前端测试 → 上报。
3. 回填脚本正式执行需用户看过 CSV 清单后单独确认。
