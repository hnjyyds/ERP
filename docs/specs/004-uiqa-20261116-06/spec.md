# UIQA-20261116-06 四项缺陷修复 · 方案（待审批）

- 状态：已实施并于 8080 三档复验通过（2026-11-17）
- 关联缺陷：`docs/uiqa/UIQA-20261116-06/Q06-01.md`、`Q06-02.md`、`Q06-04.md`、`Q06-05.md`
- 约束：不改信息架构、不改权限模型、不写业务数据；只修已确认的 4 项缺陷；逐项独立提交并推送 `origin/main`；每项补齐对应 QA 缺陷单的根因、修复、复验与提交号。
- 非范围：Q06-03「身份信息藏在系统设置」仅是发现性建议，本轮只保留报告说明，不改入口。

---

## 1. Q06-01 商品清空筛选后未恢复列表（P2）

### 根因（已定位）

[useProductsPage.ts](file:///Users/dev/Documents/新裴贸易/frontend/src/app/pages/masterdata/products/hooks/useProductsPage.ts#L225-L230) 的 `submitSearch(query)`：

```ts
setSearch(query)
...
void loadProducts(undefined, 1)
```

`loadProducts` 在未传 `queryOverride` 时回退到闭包里的旧 `search`（React 状态更新是异步的），因此“清空筛选”仍用旧关键字重新查询，列表保持 0 条与空态；再点一次查询时 `search` 才是空串。

### 修改

`frontend/src/app/pages/masterdata/products/hooks/useProductsPage.ts`：

- `submitSearch` 内改为 `void loadProducts(undefined, 1, undefined, query)`，显式传入新关键字。
- 不改接口、不改空态组件、不改其它页面。

### 验证

- 新增/扩展前端测试：输入无匹配关键字查询 → 调用清空 → 断言第二次请求 `q` 为空且恢复列表。
- 浏览器 8080 复验 1440×900 / 1280×720 / 390×844：默认 5 条 → 无匹配 → 清空筛选 → 立即恢复 5 条，统计同步恢复。

---

## 2. Q06-02 发票登记缺关联资料选择（P2）

### 现状

[PaymentsView.tsx](file:///Users/dev/Documents/新裴贸易/frontend/src/app/pages/finance/views/PaymentsView.tsx#L308-L385) 的发票登记弹窗把 `supplier_id`、`purchase_invoice_notice_id/code`、`purchase_contract_id/no` 做成自由文本输入；用户必须手填内部标识。后端 [schemas.py](file:///Users/dev/Documents/新裴贸易/backend/app/modules/finance/payments/schemas.py#L13-L27) 必填 `supplier_name`，标识本身允许为空。

### 修改（仅前端，payload 字段不变）

1. `frontend/src/shared/ui/RemoteSelect.tsx`
   - `onChange` 类型改为 `(value: string, option: RemoteSelectOption | null) => void`；
   - 透传 antd Select 第二参数中的 `data`，无数据时传 `null`。既有单参数调用保持兼容。

2. `frontend/src/shared/entityOptions.ts` 新增两个选项加载器（`label` 为业务编号，`description` 为供应商名）：
   - `fetchPurchaseInvoiceNoticeOptions` → `listPurchaseInvoiceNotices({ q, limit: 20 })`，`value=notice.id`、`label=notice.code`、`description=notice.supplier_name`
   - `fetchPurchaseContractOptions` → `listPurchaseContracts({ q, limit: 20 })`，`value=contract.id`、`label=contract.code`、`description=contract.supplier_name`

3. `frontend/src/app/pages/finance/views/PaymentsView.tsx`
   - 供应商行：两个文本框合并为一个 `RemoteSelect`（`fetchSupplierSelectOptions`）；选择后同时写入 `supplier_id` 与 `supplier_name`（取选项 `label`）。
   - 开票通知行：合并为一个 `RemoteSelect`（新加载器）；选择后写入 `purchase_invoice_notice_id` 与 `purchase_invoice_notice_code`。
   - 采购合同行：合并为一个 `RemoteSelect`（新加载器）；选择后写入 `purchase_contract_id` 与 `purchase_contract_no`。
   - 三行合并为 `form-pair three` 一行，语义不变；`supplierInvoicePayload` 不改。

4. i18n（`zh-CN.json` / `en-US.json` 的 `finance.payment.field`）：
   - `supplierId`：供应商标识 → 供应商 / Supplier ID → Supplier
   - `invoiceNoticeId`：开票通知标识 → 开票通知 / Invoice Notice ID → Invoice notice
   - `purchaseContractId`：采购合同标识 → 采购合同 / Purchase Contract ID → Purchase contract
   - `supplierName`、`invoiceNoticeCode`、`purchaseContractNo` 保留（仍用于筛选与状态字段）。

### 验证

- 浏览器：选择供应商 A → 再选 B → 清空 → 取消并重开，确认无残留、名称随选择回填；开票通知、采购合同同理。
- 只做选择与取消，不提交，不写业务数据。
- 三档视口检查标签、选项名称与回填展示。

---

## 3. Q06-04 绿色状态文字对比度不足（P3）

### 根因

antd v6 的 `<Tag color="success">` 使用预设绿色 `#52C41A` 作为前景、`#F6FFED` 作为背景，实测对比度 2.21:1；项目主题 token `colorSuccess: #278257` 不作用于预设 Tag。

### 修改

`frontend/src/styles/design-system-apply.css`（现有 `body .ant-tag` 规则后）新增：

```css
body .ant-tag-success,
body .ant-tag-green {
  color: #17603c;
}
```

- `#17603C` 对 `#F6FFED` 约 7.36:1，满足 4.5:1。
- 不改 Tag 背景、字号与内边距；不改红色/金色状态。

### 验证

- 复测商品“启用”、付款“已付清”的前景/背景与计算对比度 ≥4.5:1。
- 抽查 `<Tag color="green">` 的位置（如工作台“已读”、港口数据“匹配”）颜色生效且布局不变。
- 三档视口截图与测量 JSON 归入 Q06-04 证据。

---

## 4. Q06-05 按出口合同编号查不到出货单（P2）

### 根因（已定位）

前端“出口合同编号”输入值被当作 `contract_id` 传给 `GET /sales/shipments`（[useShipmentsList.ts](file:///Users/dev/Documents/新裴贸易/frontend/src/app/pages/sales/hooks/useShipmentsList.ts#L101-L108)），后端 [repositories.py](file:///Users/dev/Documents/新裴贸易/backend/app/modules/sales/shipments/repositories.py#L314-L321) 用 `ShipmentLine.contract_id == contract_id` 精确匹配 UUID。界面收业务编号 `EC-F8D7RX`，契约不一致导致 0 条。

### 修改

1. 前端 `frontend/src/api/export.ts` `listShipments`：参数 `contract_id` 改为 `contract_no`，请求参数名改为 `contract_no`。
2. 前端 `useShipmentsList.ts`：`contract_id:` 改为 `contract_no:`，其余 URL 同步逻辑不变。
3. 后端 `app/api/v1/shipments.py`：新增 `contract_no: Annotated[str | None, Query(max_length=80)] = None`，透传 service；保留 `contract_id` 参数不变。
4. 后端 `app/modules/sales/shipments/services.py`：`list_shipments` 增加 `contract_no` 参数，传给 `list_plans` 与 `summarize_shipments`。
5. 后端 `app/modules/sales/shipments/repositories.py`：`list_plans`、`summarize_shipments`、`_shipment_conditions` 增加 `contract_no`；条件为

```python
contract_exists = (
    select(ShipmentLine.id)
    .where(ShipmentLine.shipment_id == ShipmentPlan.id)
    .where(ShipmentLine.contract_no.ilike(f"%{contract_no}%"))
    .exists()
)
```

- 业务编号支持包含匹配（输入完整 `EC-F8D7RX` 可命中）；`contract_id` 旧参数行为不变。

### 验证

- 后端测试：按 `contract_no=EC-...` 查询命中对应出货单；`contract_no` 不存在时 0 条；`contract_id` 旧参数仍工作。
- 浏览器 8080 三档：清空查询 → 确认 SP-DAEPEG → 输入 EC-F8D7RX → 查询仍保留 SP-DAEPEG 且汇总不为 0 → 清空恢复。

---

## 5. 门禁与交付

- 前端：`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`（基线 403 tests，0 unhandled errors）。
- 后端：`pytest tests/api/test_shipments.py tests/repositories/test_shipment_repository.py`（如有依赖，跑相关子集）。
- 部署：`docker compose build frontend && docker compose up -d --no-deps frontend`，确认 8080 `index-*.js` 哈希变化；后端仅在有镜像变更时重建。
- 提交：每项独立中文 conventional commit，推送 `origin/main`，不 force。
- 文档：更新 4 份缺陷单（根因/修复/复验/提交号）与 `docs/uiqa/UIQA-20261116-06/README.md` 结论；Q06-03 保持“建议，未改”。

## 6. 待确认事项

1. 同意按上述 4 项范围修复（Q06-03 不改）？
2. Q06-05 采用“新增 `contract_no` 参数、保留 `contract_id`”的兼容方案是否可以？
