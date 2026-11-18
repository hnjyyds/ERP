# UIQA-20261117-05 剩余 6 项修复规格

## 目标与口径

- 台账基数 29 项 = 关闭 + 待复验 + 开放 + 页签收，页签收保持 0。
- Q05-22 补测前：关闭 22、待复验 1、开放 6、0 页签收。补测通过并补证后：关闭 23、待复验 0、开放 6。
- 缺陷关闭记录与新版规范项未测分开保留；缺陷关闭不等于规范整项通过。
- 本轮剩余 6 项：Q05-03、Q05-06、Q05-07、Q05-09、Q05-12、Q05-14。

## A. Q05-22 原失败路径补测（先做，不改代码）

已执行并通过（2026-11-18，admin 登录态，不保存权限）：

| 步骤 | 用户 | 期望角色 | 实测 |
| --- | --- | --- | --- |
| 1 | 演示财务主管 finance_manager | 财务 | 财务 |
| 2 | 演示采购专员 purchase | 采购专员 | 采购专员 |
| 3 | 再次打开演示财务主管 | 财务（不残留采购） | 财务 |

证据：`screenshots/Q05-22-purchase-role-Bawy-1440.png` 及控制台输出。

交付：
1. 新增 `q05-22-reverify-20261118.json`（三步用户、角色、无保存动作、视口 1440×900）。
2. Q05-22.md 追加“关闭复验（原失败路径）”章节，明确“连续切换两名用户后再次打开无残留”。
3. 台账同步：closed 23 / pending 0 / open 6；Q05-22 状态“已关闭”。

## B. 第一组：Q05-03 / Q05-09 / Q05-12（对比度与点击区域）

### B1. Q05-03 普通文字对比度

失败值 rgb(140,143,156)/#8C8F9C：白底约 3.22:1、#f7f8fa 约 3.03:1，低于 4.5:1。

统一修复：

1. `frontend/src/design-system.css` 第 12 行
   `--ui-text-muted: #7c8592` → `--ui-text-muted: #68707d`。
   实测对比度：白底约 5.0:1、#f7f8fa 约 4.67:1、#f4f6f8 约 4.56:1。
2. `frontend/src/styles/navigation-settings.css`
   - `.nav-group-summary, .settings-summary` 的 `color: #8C8F9C` → `var(--ui-text-secondary)`。
   - `.nav-group-summary svg, .settings-summary svg` 的 `color` 同步改为 `var(--ui-text-secondary)`。
3. `frontend/src/styles/organization.css`
   `.organization-company-field span` 的 `color: #8C8F9C` → `var(--ui-text-secondary)`（公司信息编辑字段标签）。
4. `frontend/src/styles/organization-members.css`
   - `.organization-permissions-head p` → `var(--ui-text-secondary)`（权限窗口普通说明）。
   - `.organization-permission-role-select > span` → `var(--ui-text-secondary)`（“配置角色”标签）。

不改：绿色状态标签、禁用控件、装饰边框/分隔线（不按文字缺陷计）。

逐布局验证（构建部署后，同一脚本内设置视口再测量）：

| 布局 | 视口 | 目标元素 | 通过标准 |
| --- | --- | --- | --- |
| 导航展开（商品/出货/付款） | 1440/1280/390 | `.nav-group-summary` 文字 | ≥4.5:1，opacity=1，非禁用 |
| 公司信息编辑 | 1440/1280/390 | `.organization-company-field span` | ≥4.5:1，可见无遮挡 |
| 权限窗口 | 1440/1280/390 | `.organization-permissions-head p`、`.organization-permission-role-select > span` | ≥4.5:1 |

### B2. Q05-09 列设置菜单点击区域

- 位置：`frontend/src/styles/design-system-apply.css` 的 `@media (max-width: 768px)` 块内新增：

```css
body .ant-dropdown-menu .ant-dropdown-menu-item {
  min-height: var(--ui-touch-height);
  display: flex;
  align-items: center;
}
```

- 影响面：商品、供应商、客户、合作伙伴四页共享 `ColumnViewControl`。
- 验证：390×844 真实展开菜单，测 `.ant-dropdown-menu-item` 高度 ≥44，宽度 ≥44；禁用“编号”不计失败；键盘 Enter 隐藏/恢复英文名称仍通过。

### B3. Q05-12 联系人主要标记点击区域

- 位置：`frontend/src/styles/design-system-apply.css` 手机媒体查询块内新增：

```css
body .record-form label.checkbox-label,
body .record-form label.checkbox-line,
body label.checkbox-label.entity-modal-span {
  min-height: var(--ui-touch-height);
  padding-block: var(--ui-space-1);
}
```

- 保留 16×16 复选框图形与原生 `input.labels` 关联，不加 `pointer-events` 覆盖。
- 验证：供应商/客户/合作伙伴联系人表单，390 下外层 label（`input.labels`）高度 ≥44；点击说明文字可切换；Space 可切换；保存前恢复未选中。

## C. 第二组：Q05-06 / Q05-07 / Q05-14

### C1. Q05-06 空态区分

共享组件 `frontend/src/shared/ui/ListEmptyState.tsx` 已支持 `filtered/onClearFilters`，本项只改调用方与恢复动作。

1. `frontend/src/app/pages/reporting/ReportingPage.tsx`
   - `approvalFiltered`（第 278-284 行）把默认审批状态视为筛选：条件改为
     `statusFilter.trim() !== ''`（替换 `statusFilter !== 'submitted'`）。
     “全部状态”= `''` 才可能是全库空态。
   - 新增 `clearApprovalFilters()`：清空单据类型、申请人、日期，并将审批状态置为 `''`（全部状态），调用 `listApprovalDocuments({})` 重载。
   - 两处审批 `ListEmptyState`（第 389、477 行附近）的 `onClearFilters` 改为 `clearApprovalFilters`。
   - 统计区 `statisticsFiltered` 逻辑保持不变。
2. `frontend/src/app/pages/finance/views/ReportsView.tsx`
   - 水单使用明细 `Table`（第 264 行）增加 `locale={{ emptyText: ... }}`，使用 `ListEmptyState`：
     `filtered={Boolean(reportDateFrom || reportDateTo || reportCurrency || reportReceiptNo)}`，
     `onClearFilters` 清空 `reportDateFrom/reportDateTo/reportCurrency/reportReceiptNo` 后重载当前报表。
   - 仅水单页签加空态；其他报表页签保持现状，除非同结构且已有明确证据。
3. 文案复用 `common.empty.noMatchTitle/noMatchDescription/clearFilters`。
4. 测试：`ReportingPage.test.tsx` 增加“默认待审批无结果 → 显示筛选无结果 + 清空后显示全部状态记录”。

### C2. Q05-07 商品图片文件名持久化

当前仅存 URL，刷新后无法辨识文件名。

后端：

1. `backend/app/modules/masterdata/products/models.py`
   Product 增加 `image_names: Mapped[str | None] = mapped_column(Text, nullable=True)`（JSON 字符串数组，与 `image_urls` 等长）。
2. 新迁移 `backend/migrations/versions/0021_product_image_names.py`
   `down_revision = '0020_product_images'`；`op.add_column('products', sa.Column('image_names', sa.Text(), nullable=True))`；downgrade 删除。
3. `backend/app/modules/masterdata/products/schemas.py`
   - `ProductCreate/ProductUpdate` 增加 `image_names: list[str] | None`。
   - `ProductRead` 增加 `image_names: list[str]`。
   - 校验：`image_names` 长度不得大于 `image_urls`；缺失位用 `''` 补齐；无 `image_urls` 时忽略。
4. `backend/app/modules/masterdata/products/repositories.py`
   - `create_product/update_product` 持久化 `image_names`；`update` 中 `None` 表示不管理（与 `image_urls` 同语义）。
   - 读取时与 `image_urls` 对齐；历史数据无名称时回退为 URL 最后一段的解码文件名。
5. `backend/app/modules/masterdata/products/services.py` 透传新字段。

前端：

1. `frontend/src/api/masterdata-products.ts`：`Product`/create/update 类型增加 `image_names?: string[]`。
2. `frontend/src/app/pages/masterdata/products/productHelpers.ts`
   - `ProductFormState` 增加 `image_names: string[]`；`initialProductForm()` 返回 `[]`。
   - `productToForm`、`formToCreatePayload`、`formToUpdatePayload` 同步该字段。
3. `frontend/src/app/pages/masterdata/ProductsPage.tsx`
   - `addProductImages` 同步 push `file.name`；`replaceProductImage` 改写对应下标；`removeProductImage` 同步 splice；保证与 `images` 等长。
4. `frontend/src/app/pages/masterdata/products/forms/ProductFormModal.tsx`
   - 缩略图下方显示文件名文本（新增 `product-image-name`），无名称时显示“图片 N”。
5. `frontend/src/app/pages/masterdata/products/views/ProductDetailView.tsx`
   - 缩略图显示文件名；`alt` 改为“商品名称 图片 第 N 张 文件名”，保证多图可访问名称可区分。
   - 大图 `preview` 保持可切换，不改图片加载与持久化逻辑。
6. 样式：`frontend/src/styles/masterdata-pages.css` 增加 `.product-image-name`（单行省略、12px、secondary）。

测试：`backend/tests/api/test_products.py` 增加创建/更新/查询 `image_names` 持久化与长度对齐；`ProductsPage.test.tsx` 断言上传后提交含 `image_names`。

### C3. Q05-14 业务枚举中文化

不改技术权限码、不改 `permission.code` 展示，只改业务可见枚举。

1. 往来资料业务记录来源
   - `frontend/src/app/pages/masterdata/TradingPartnerPage.tsx` 第 1007 行 `source_type` 列增加 `render`，调用新映射 `partnerTransactionSourceLabel(value)`。
   - 新增映射（同文件或 `masterdataHelpers.ts`）：`export_quotation` 出口报价、`export_contract` 出口合同、`shipment` 出货明细、`supplier_invoice` 供应商发票、`supplier_quotation` 供应商报价、`purchase_contract` 采购合同、`fee_invoice` 费用发票、`fee_payment_request` 费用付款申请；未知值回退原值。
   - 文案键：`masterdata.tradingPartner.sourceType.*`（zh-CN/en-US）。
2. 费用类型摘要
   - `backend/app/modules/masterdata/partners/repositories.py` 第 359、382 行摘要中的 `{fee_type}` 改为中文映射（`freight` 货代费、`insurance` 保险费、`transport` 运输费、`inspection` 查验费、`express` 快递费、`other` 其他费用），未知值回退原值。
   - 新增模块内私有 `_FEE_TYPE_LABELS`，不改 API 字段本身。
3. 寄样候选说明
   - `frontend/src/app/pages/sample/hooks/useSampleFormOptions.ts` 第 184 行 `record.sample_type` → `sampleRecordTypeLabel(record.sample_type)`（从 `../sampleDeliveryHelpers` 引入）。
4. 财务报表状态与费用类型
   - `frontend/src/app/pages/finance/views/ReportsView.tsx`
     - 货款支付情况 `status` 列（第 362 行）`render` → `t('finance.payment.requestStatus.' + value)`。
     - 费用支付情况 `fee_type` 列（第 389 行）`render` → `t('finance.fee.type.' + value)`；`status` 列（第 405 行）同上。
     - 未知值回退原值，避免空白。
5. 权限模块 Stocktake
   - `frontend/src/app/pages/organization/organizationHelpers.ts`
     - `permissionSectionLabelKeys` 增加 `'warehouse:stocktake': 'organization.permission.section.stocktake'`。
     - `sidebarPermissionCatalog` 的 `qualityWarehouse` 分组增加 `warehouse:stocktake` 小节。
     - `permissionSectionOrder` 增加 `'warehouse:stocktake'`（排在出库单之后）。
   - `locales/zh-CN.json`：`organization.permission.section.stocktake = 库存盘点`；en-US 对应 `Stocktake`。
   - 不修改 `permission.code` 的原始技术码展示。

测试：
- `TradingPartnerPage.test.tsx` 断言来源列显示中文而非 `export_quotation`。
- `backend/tests/services/test_partner_service.py` 断言费用摘要含“货代费”不含 `freight`。
- `backend/tests/api/test_finance_reports.py` 不改后端返回码；前端 `FinancePage.test.tsx` 断言报表页签显示“已审批”“货代费”。

## D. 自动化测试（本批后端改动）

1. `backend/tests/api/test_partners.py`：`GET /api/v1/masterdata/partners?country=中国` 仅返回中国伙伴（大小写/空白容错）；空参数返回全部。
2. `backend/tests/api/test_products.py`：`status=active|inactive` 过滤；无 `status` 默认仅 active；`status` 非法值回退默认。
3. `backend/tests/api/test_audit_logs.py`：CSV 导出时间列为 `YYYY-MM-DD HH:MM:SS+08:00`，表头含“Asia/Shanghai”。
4. `backend/tests/api/test_products.py`：`image_names` 持久化与刷新后可读。
5. 运行：`cd backend && uv run pytest tests/api/test_partners.py tests/api/test_products.py tests/api/test_audit_logs.py -q`；前端 `npm test -- --run`、`npx tsc --noEmit`、`npm run lint`。

## E. 构建、复验与台账

1. 构建部署：`docker compose up -d --build`，记录新 `assets/index-*.js`。
2. 三档复验（1440×900 / 1280×720 / 390×844），每项证据落 `docs/uiqa/UIQA-20261117-05/`：
   - Q05-03：三布局测量 JSON + 截图。
   - Q05-09：四页 `*-column-menu-targets.json`（高度 ≥44）。
   - Q05-12：三页 `*-contact-label-targets.json`（高度 ≥44）。
   - Q05-06：老板看板默认空态/清空后、财务报表日期无结果/清空后。
   - Q05-07：保存→刷新→详情文件名与多图可访问名称。
   - Q05-14：往来资料/寄样候选/财务报表/权限窗口四处文案。
3. 更新：6 份缺陷文档追加“关闭复验”、`ledger-summary.json`、`run-state.json`、`deployment.json`、`README.md`、`42页48项验收矩阵-index-*.csv`。
4. 台账最终口径：关闭 29、待复验 0、开放 0、0 页签收；若任一验证不通过，保持该缺陷开放并记录实际计数。
5. 提交并推送代码与台账（台账按既有做法不入库时保持未跟踪并说明）。
