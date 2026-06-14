# Semi Design 前端 UI 重构设计

## 设计来源和边界

本文档用于把当前 React 页面从“功能验证型 CRUD 模板”重构为 Semi Design 风格的外贸 ERP 工作台。设计不新增 PDF 之外的业务功能，不改后端 API 契约，先解决当前页面高度同质化、信息层级弱、业务页面缺少工作流结构的问题。

依据：

- 原始需求：`docs/reference/远景外贸业务管理系统产品介绍-含仓库管理.pdf`。
- PDF 结构化拆分：`docs/00-需求范围.md`、`docs/05-实现步骤.md`。
- 当前实际菜单：`backend/app/modules/system/auth/seed.py` 中 23 个 `MenuItem`。
- 当前前端路由实现：`frontend/src/App.tsx` 中 `LoginPage`、`DashboardPage`、`ProductsPage`、`FinancePage`、`ReportingPage` 等页面函数。
- 当前 API 契约：`frontend/src/api.ts` 中 `login`、`getCurrentSession`、`listProducts`、`createExportContract`、`listReportingStatistics` 等 typed client。
- 当前验收记录：`docs/checks/001-032`。

边界：

- 本轮文档覆盖未登录入口 `LoginPage`，以及当前已进入菜单和 React 路由的 23 个业务页面。
- PDF 阶段 7 的信用证、报关、结汇、进仓通知、客户索赔尚未进入当前菜单，本文只给后续页面形态，不写成已完成页面。
- 当前 Ant Design 页面仍是已实现事实；Semi Design 是下一步 UI 重构目标。

## 为什么不能继续复制同一模板

当前大量页面共享了“指标条 + 左侧表格 + 右侧新增表单”的骨架。这适合第一阶段快速验证 API、字段、权限和 E2E，但不适合作为最终工作台。

重构硬规则：

- 基础资料页可以共享“主数据表 + 详情抽屉”骨架，但不能所有字段常驻右侧表单。
- 单据页必须有状态流、明细行编辑器、审批/生成动作区，不能只像普通资料表。
- 样品、采购跟单、QC、仓库页面必须体现流程、节点、异常和库存影响。
- 财务页必须是台账式工作台，按收款、付款、核销、结算分区，不做超长单页堆叠。
- 经理查询必须是仪表盘和下钻报表，不做普通列表页。
- 登录页必须是可信赖的工作系统入口，不做营销落地页，也不能只是一个居中的默认表单。

## Semi Design 全局 UI 架构

```text
AppShell
├─ SideNav：按业务域分组的左侧导航
├─ TopWorkspaceBar：当前模块、刷新、用户、全局搜索
└─ PageSurface
   ├─ PageHeader：标题、状态摘要、主操作
   ├─ FilterBar：轻量筛选，支持展开高级条件
   ├─ ContentRegion：按页面类型变化
   └─ SideSheet / Drawer：新增、编辑、详情、审批动作
```

Semi Design 组件使用方向：

- `Layout`、`Nav`：主布局和业务域导航。
- `Table`：主数据、台账、明细行、报表下钻。
- `Form`、`Select`、`DatePicker`、`Input`、`TextArea`：查询和编辑。
- `Tabs`：同一业务对象下的信息分层。
- `SideSheet`：新增、编辑、审批、登记动作，减少常驻右侧大表单。
- `Descriptions`：只读详情。
- `Tag`、`Badge`、`Progress`：状态、风险、进度。
- `Timeline`、`Steps`：样品、跟单、QC、仓库节点。
- `Banner`、`Toast`、`Popconfirm`：提醒、成功反馈、危险确认。

建议目录：

```text
frontend/src
  components
    shell/AppShell.tsx
    shell/PageHeader.tsx
    data/FilterBar.tsx
    data/MetricStrip.tsx
    data/StatusTag.tsx
    data/EntityTable.tsx
    forms/EntitySideSheet.tsx
    documents/LineItemEditor.tsx
    documents/ApprovalRail.tsx
    workflow/NodeTimeline.tsx
    finance/LedgerWorkspace.tsx
    reporting/ReportCanvas.tsx
  modules
    dashboard
    masterdata/products
    masterdata/customers
    masterdata/suppliers
    masterdata/partners
    masterdata/document-parties
    sample/requests
    sample/records
    sample/deliveries
    sales/quotations
    sales/contracts
    sales/shipments
    purchase/inquiries
    purchase/contracts
    purchase/invoice-notices
    followup
    quality
    warehouse/inbound-plans
    warehouse/inbound-orders
    warehouse/outbound-plans
    warehouse/outbound-orders
    finance
    reporting
```

## 页面类型总览

| 页面类型 | 适用路由 | 结构目标 |
| --- | --- | --- |
| 未登录入口 | 未登录状态渲染 `LoginPage` | 清楚、安全、可信赖，解释当前进入的是外贸 ERP 工作台 |
| 工作桌面 | `/` | 待办、提醒、日程、快捷入口在首屏形成当天工作地图 |
| 主数据管理 | 商品、客户、供应商、合作伙伴、单证资料 | 表格为主，新增/编辑进入 SideSheet，详情通过 Tabs 分层 |
| 样品流程 | 打样、样品、寄样 | 以流程、库存、费用、物流为核心，而不是纯资料表 |
| 销售单据 | 报价、合同、出货 | 状态流 + 单据头 + 明细行 + 关联信息 + 审批动作 |
| 采购单据 | 询价、采购合同、开票通知 | 供应商比较、来源追溯、提醒和跟单联动 |
| 流程异常 | 采购跟单、QC | 节点进度、逾期、异常、来源事件 |
| 仓库操作 | 入库计划、入库、出库计划、出库 | 计划和实际操作分离，突出库存影响 |
| 财务台账 | `/finance` | 收款、付款、费用、核销、结算、利润分工作区 |
| 经理报表 | `/reporting` | KPI、趋势/排行、审批查询、下钻表格 |

## 页面级设计规格

### 0. 登录页 `LoginPage`

依据：PDF 权限和工作桌面要求、检查记录 002。当前实现位置：`frontend/src/App.tsx` 的 `LoginPage`。当前 API：`login`、`setAuthToken`、`getCurrentSession`。

结构图：

```text
┌ LoginShell：浅色、安静、全屏工作入口 ┐
├ 左侧：系统身份区
│  ├ 品牌：新裴贸易业务管理系统
│  ├ 工作流摘要：销售、采购、仓库、财务、经理查询
│  └ 安全提示：账号权限由组织角色控制
├ 右侧：登录面板
│  ├ 用户名
│  ├ 密码
│  ├ 登录错误 Banner
│  ├ 登录按钮
│  └ 演示账号提示，仅开发环境显示
└ 底部：当前环境、版本或部署标识
```

包含：

- 用户名、密码、登录按钮、错误提示。
- 登录成功保存 token 并进入工作桌面。
- 登录状态失效时展示明确错误，不暴露技术堆栈。
- 开发环境可显示演示账号；生产环境不显示默认账号密码。
- 当前系统身份和权限口径提示，帮助用户确认进入的是业务系统而不是普通网站。

实现：

- 使用 Semi `Form`、`Input`、`Button`、`Banner`、`Typography`。
- 桌面端使用左右两栏：左侧是低干扰系统身份区，右侧是登录面板；移动端改为单列，先表单后辅助信息。
- 登录按钮在提交中显示 loading，禁止重复提交。
- 错误提示使用 `Banner` 放在表单上方，并保留当前 `formError` 逻辑。
- 不做大幅营销 Hero，不使用装饰性大图、渐变字、漂浮卡片；视觉重点是可信、精准、可进入工作。
- 登录后仍走当前流程：`login(username, password)`、`setAuthToken(nextSession.access_token)`、`onLogin(nextSession)`。

### 1. 工作桌面 `/`

依据：PDF `1.5.1 工作桌面`、定制日程管理、检查记录 001。当前 API：`getDashboard`、`createScheduleEvent`。

结构图：

```text
┌ PageHeader：今日工作 / 当前用户 / 刷新 ┐
├ 今日摘要：待办、逾期、提醒、日程、快捷入口 ┤
├─ 左：待办队列 Table/List ─┬─ 中：提醒 Timeline ─┬─ 右：日程 Calendar/List ┤
├─ 下：公司公告 + 常用入口 + 风险事项 Banner                         ┤
└ SideSheet：新增/编辑日程                                               ┘
```

包含：

- 公司公告、我的待办、消息提醒、我的日程、快捷入口、摘要数字。
- 60 秒自动刷新和手动刷新。
- 新增日程。

实现：

- 使用 Semi `Calendar` 或紧凑日期列表展示日程，`Timeline` 展示提醒。
- 待办列表按来源分组：审批、跟单、仓库、财务。
- `createScheduleEvent` 放在 SideSheet 中，不再占用主页面右栏。

### 2. 商品资料 `/masterdata/products`

依据：PDF `1.5.2.1 商品资料`、商品配件明细定制、检查记录 003。当前 API：`listProducts`、`createProduct`、`addProductAccessory`、`exportProducts`。

结构图：

```text
┌ PageHeader：商品资料 / 新增 / 导入导出 ┐
├ FilterBar：编号、中文名、英文名、海关编码、是否有配件 ┤
├ 主表 Table：商品编号、名称、规格、海关编码、税率、配件数、图片状态 ┤
└ SideSheet：商品详情
   ├ 基本信息
   ├ 海关和税率
   ├ 包装资料
   ├ 配件明细 Table + 追加配件
   ├ 图片资料
   └ 交易记录入口
```

包含：

- 商品列表、模糊查询、新增商品。
- 商品图片地址、规格型号、海关编码、税率、包装资料。
- 商品配件明细和单位耗料。
- 商品 CSV 导出预览。

实现：

- 主页面只保留查询、表格和关键 KPI，新增/编辑统一进入 `SideSheet`。
- 配件明细用 `Table` 行内展示，追加配件用嵌入式小表单或二级 SideSheet。
- 商品详情 Tabs 必须突出“配件明细”，因为它直接影响采购合同生成。

### 3. 客户资料 `/masterdata/customers`

依据：PDF `1.5.2.2 客户资料`、检查记录 004。当前 API：`listCustomers`、`createCustomer`、`updateCustomer`、`addCustomerContact`、`listCustomerTransactions`。

结构图：

```text
┌ PageHeader：客户资料 / 新增客户 ┐
├ FilterBar：关键字、国家、信用等级、主联系人 ┤
├ 主表 Table：客户编号、中文名、英文名、国家、信用等级、主联系人、付款条款 ┤
└ DetailDrawer
   ├ 概览：信用等级、授信额度、付款条款
   ├ 联系人：主联系人 + 联系人表
   ├ 信用信息：额度、账期、风险备注
   └ 交易记录：报价、合同、出货、收款入口
```

包含：

- 客户新增/编辑。
- 联系人维护和主联系人唯一规则。
- 信用等级、授信额度、付款条件。
- 交易记录入口。

实现：

- 不把新增客户表单常驻右侧，改为 `SideSheet`。
- 客户详情顶部显示信用摘要，风险色只用于超授信、停用、黑名单等状态。
- 交易记录当前可显示空状态，但结构必须预留给报价、合同、出货、收款。

### 4. 供应商资料 `/masterdata/suppliers`

依据：PDF `1.5.2.3 供应商资料`、检查记录 005。当前 API：`listSuppliers`、`createSupplier`、`updateSupplier`、`addSupplierContact`、`listSupplierTransactions`。

结构图：

```text
┌ PageHeader：供应商资料 / 新增供应商 ┐
├ FilterBar：关键字、国家、信用等级、主联系人 ┤
├ 主表 Table：供应商编号、名称、国家、信用等级、主联系人、付款条款 ┤
└ DetailDrawer
   ├ 供货概览：信用、付款条款、最近采购
   ├ 联系人
   ├ 信用信息
   └ 交易记录：询价、采购合同、入库、付款
```

包含：

- 供应商新增/编辑、联系人、信用资料。
- 供应商交易记录入口。
- 主联系人默认带入采购合同、开票通知、进仓通知。

实现：

- 页面结构和客户资料同属主数据，但文案和详情排序必须围绕“供货、付款、采购历史”。
- 供应商列表增加信用/交付风险状态列，为采购询价和合同选择提供判断。

### 5. 合作伙伴 `/masterdata/partners`

依据：PDF `1.5.2.4 合作伙伴`、检查记录 006。当前 API：`listPartners`、`createPartner`、`updatePartner`、`addPartnerContact`、`listPartnerFeeRecords`。

结构图：

```text
┌ PageHeader：合作伙伴 / 新增伙伴 ┐
├ Segment：全部、快件、货代、保险、运输 ┤
├ 主表 Table：伙伴编号、类型、名称、国家、主联系人、状态 ┤
└ DetailDrawer
   ├ 基本资料
   ├ 联系人
   └ 费用记录：费用发票、付费申请、出运单
```

包含：

- 快件公司、货代、保险公司、运输公司等类型。
- 合作伙伴联系人。
- 费用记录入口。

实现：

- 使用 `Tabs` 或 `Segmented` 按 partner_type 切换，而不是只靠下拉筛选。
- 费用记录表从 `listPartnerFeeRecords` 读取，未接入时保留空状态说明。

### 6. 单证资料 `/masterdata/document-parties`

依据：PDF `1.5.2.5 单证资料`、检查记录 007。当前 API：`listDocumentParties`、`createDocumentParty`、`updateDocumentParty`、`lookupDocumentParties`。

结构图：

```text
┌ PageHeader：单证资料 / 新增资料 ┐
├ TypeTabs：收货人、通知人、开证行、提单通知人 ┤
├ 主表 Table：类型、名称、国家、地址、关联客户、状态 ┤
└ SideSheet
   ├ 基本信息
   ├ 地址和联系信息
   └ 引用预览：报关、结汇、信用证字段
```

包含：

- 收货人、通知人、开证行、提单通知人。
- 常用单证资料选择能力。

实现：

- 类型是这个页面的主导航，不应藏在普通筛选里。
- `lookupDocumentParties` 作为后续单证/合同选择器的数据源。

### 7. 打样管理 `/sample/requests`

依据：PDF `1.5.3.1 打样管理`、检查记录 008。当前 API：`listSampleRequests`、`createSampleRequest`、`addSampleProgress`、`addSampleFee`、`requestSampleFeePayment`。

结构图：

```text
┌ PageHeader：打样管理 / 新建打样单 ┐
├ FilterBar：客户、供应商、状态、日期 ┤
├ 左：打样单 Table ─┬─ 右：打样详情
│                   ├ 要求明细
│                   ├ 进度 Timeline
│                   ├ 费用 Table
│                   └ 发起付款申请
└ SideSheet：新增打样 / 新增进度 / 新增费用
```

包含：

- 打样要求、内部/外发工厂、进度、费用。
- 费用支付申请入口。

实现：

- 用 `Timeline` 表示打样进度，费用作为详情页签，不放在新增表单下面。
- 付款申请动作只在有费用记录时显示。

### 8. 样品登记 `/sample/records`

依据：PDF `1.5.3.2 样品登记`、确认样/大货样回写定制、检查记录 009。当前 API：`listSampleRecords`、`createSampleRecord`、`addSampleRecordImage`、`addSampleRecordStockEvent`。

结构图：

```text
┌ PageHeader：样品登记 / 新增样品 ┐
├ FilterBar：样品编号、分类、客户、供应商、采购合同 ┤
├ 主表 Table：样品编号、分类、商品、客户/供应商、收样数、寄样数、留样数 ┤
└ DetailDrawer
   ├ 图片墙
   ├ 来源和关联单据
   ├ 库存事件流水
   └ 跟单回写事件：确认样、大货样
```

包含：

- 来样、确认样、大货样、留样。
- 图片、数量台账、来源单据。
- 确认样/大货样事件回写采购跟单。

实现：

- 样品数量用库存摘要卡片展示，明细用流水表。
- 确认样和大货样要用醒目但克制的状态标识，因为它们影响采购跟单节点。

### 9. 寄样管理 `/sample/deliveries`

依据：PDF `1.5.3.3`、`1.5.3.4`、检查记录 010。当前 API：`listSampleDeliveries`、`createSampleDelivery`、`updateSampleDelivery`、`submitSampleDelivery`、`approveSampleDelivery`、`updateSampleDeliveryTracking`、`getSampleDeliveryFeeStatistics`、`getSampleDeliverySampleHistory`、`getSampleDeliveryQuoteHistory`。

结构图：

```text
┌ PageHeader：寄样管理 / 新增寄样 ┐
├ 状态Tabs：草稿、待审核、已审核、已寄出、已退回 ┤
├ 左：寄样单 Table ─┬─ 右：寄样详情
│                   ├ 收件信息
│                   ├ 样品明细
│                   ├ 费用统计
│                   ├ 物流 Timeline
│                   └ 审核动作
└ 下：寄样历史 / 报价关联寄样
```

包含：

- 寄样记录、寄样审核、费用登记、物流跟踪。
- 寄样费用统计、样品寄样历史、报价关联寄样。

实现：

- 审核和物流更新用 SideSheet 动作，不和新增寄样表单混在一起。
- 费用统计放在详情右上角或页签内，避免和寄样单主表抢层级。

### 10. 出口报价 `/sales/quotations`

依据：PDF `1.5.4.1 出口报价`、检查记录 011。当前 API：`listExportQuotations`、`createExportQuotation`、`updateExportQuotation`、`submitExportQuotation`、`approveExportQuotation`、`confirmExportQuotationContract`、`getExportQuotationHistory`、`getExportQuotationPurchaseReferences`、`getExportQuotationSampleDeliveries`、`exportExportQuotation`。

结构图：

```text
┌ PageHeader：出口报价 / 新建报价 ┐
├ 状态流：草稿 → 待审批 → 已审批 → 已生成合同 ┤
├ 左：报价 Table ─┬─ 中：报价单据
│                 │  ├ 单据头
│                 │  ├ 商品明细 LineItemEditor
│                 │  └ 费用/贸易条款
│                 └─ 右：参考侧栏
│                    ├ 历史报价
│                    ├ 采购询价参考
│                    └ 寄样记录
└ 操作条：提交、审批、确认生成合同、导出
```

包含：

- 报价明细、运费、贸易条款、审批。
- 历史报价、采购询价参考、寄样关联。
- 确认生成出口合同。

实现：

- 报价是单据工作台，不使用普通主数据模板。
- 明细行使用可编辑表格组件，历史报价和采购参考放在右侧参考栏。

### 11. 出口合同 `/sales/contracts`

依据：PDF `1.5.4.2 出口合同`、检查记录 012。当前 API：`listExportContracts`、`createExportContract`、`updateExportContract`、`submitExportContract`、`approveExportContract`、`registerExportContractSignature`、`addExportContractAdvancePayment`、`exportExportContract`。

结构图：

```text
┌ PageHeader：出口合同 / 新建合同 ┐
├ 状态流：草稿 → 待审批 → 已审批 → 履约中 ┤
├ 左：合同列表 ─┬─ 中：合同详情
│               │  ├ 合同头
│               │  ├ 商品明细
│               │  ├ 客户回签
│               │  └ 预收款
│               └─ 右：履约侧栏
│                  ├ 采购情况
│                  ├ 出货情况
│                  └ 风险/提醒
└ 操作条：提交、审批、登记回签、登记预收款、导出
```

包含：

- 合同商品、客户、价格、出运日期。
- 回签、预收款、采购情况、出货情况。
- 审批和导出。

实现：

- 履约信息要常驻右侧或详情页签，避免合同看起来只是报价复制。
- 采购/出货统计优先做成小型进度条和数量金额摘要。

### 12. 出货明细 `/sales/shipments`

依据：PDF `1.5.4.3 出货明细`、检查记录 013。当前 API：`listShipments`、`generateShipmentFromContracts`、`submitShipment`、`approveShipment`、`listShipmentReminders`。

结构图：

```text
┌ PageHeader：出货明细 / 从合同生成 ┐
├ FilterBar：客户、业务员、状态、计划出货日 ┤
├ 左：出货单 Table ─┬─ 中：出货明细
│                   │  ├ 多合同来源
│                   │  ├ 商品明细
│                   │  ├ 应收/利润概览
│                   │  └ 审批记录
│                   └─ 右：提醒和合同进度
└ SideSheet：选择合同生成出货 / 审批
```

包含：

- 从已审批出口合同生成出货计划。
- 多合同合并出运。
- 出货审批、提醒、应收和利润概览。

实现：

- 生成动作必须是“选择合同”的向导式 SideSheet。
- 出货单详情显示合同来源，避免经理和单证人员无法追溯。

### 13. 采购询价 `/purchase/inquiries`

依据：PDF `1.5.5.1 采购询价`、检查记录 014。当前 API：`listPurchaseInquiries`、`createPurchaseInquiry`、`updatePurchaseInquiry`、`addPurchaseInquiryQuotation`、`sendPurchaseInquiryTemplate`、`listPurchaseInquirySupplierSamples`、`listPurchaseInquiryReferences`。

结构图：

```text
┌ PageHeader：采购询价 / 新建询价 ┐
├ FilterBar：商品、供应商、状态、询价日期 ┤
├ 左：询价单 Table ─┬─ 中：询价商品明细
│                   └─ 右：供应商报价对比
│                      ├ 报价明细
│                      ├ 样品证据
│                      └ 历史参考
└ 操作条：发送模板、录入报价、更新询价
```

包含：

- 采购询价、供应商报价、询价模板发送。
- 供应商样品关联、历史参考。

实现：

- 页面重点是“多供应商价格比较”，不能只是询价列表加新增表单。
- 报价对比用紧凑表格和价格高低标识。

### 14. 采购合同 `/purchase/contracts`

依据：PDF `1.5.5.2 采购合同`、配件生成采购合同定制、检查记录 015。当前 API：`listPurchaseContracts`、`createPurchaseContract`、`updatePurchaseContract`、`generatePurchaseContractFromExportContracts`、`submitPurchaseContract`、`approvePurchaseContract`、`listPurchaseContractReminders`。

结构图：

```text
┌ PageHeader：采购合同 / 新建或生成 ┐
├ 状态流：草稿 → 待审批 → 已审批 → 跟单中 ┤
├ 左：采购合同 Table ─┬─ 中：合同详情
│                     │  ├ 来源：出口合同/库存/手工
│                     │  ├ 商品或配件明细
│                     │  └ 付款/交货条款
│                     └─ 右：采购计划和提醒
│                        ├ 交货提醒
│                        ├ 付款提醒
│                        └ 跟单进度入口
└ SideSheet：从出口合同生成 / 库存采购 / 审批
```

包含：

- 手工采购、库存采购、从出口合同生成。
- 根据商品配件单位耗料生成采购明细。
- 采购合同审批、交货提醒、付款提醒。

实现：

- 生成采购合同时使用分步向导：选择出口合同、预览配件耗料、确认供应商和数量。
- 来源追溯是首要信息，放在合同头下方。

### 15. 开票通知 `/purchase/invoice-notices`

依据：PDF `1.5.5.3 开票通知`、检查记录 016。当前 API：`listPurchaseInvoiceNotices`、`generatePurchaseInvoiceNoticesFromDeclaration`、`sendPurchaseInvoiceNotice`、`receivePurchaseInvoiceNoticeTaxInvoice`、`listPurchaseInvoiceNoticeReminders`。

结构图：

```text
┌ PageHeader：开票通知 / 从报关生成 ┐
├ 状态Tabs：草稿、已发送、已收票、催收中 ┤
├ 左：通知 Table ─┬─ 右：通知详情
│                 ├ 供应商信息
│                 ├ 开票品名和数量
│                 ├ 税票状态
│                 └ 催收提醒
└ 操作条：生成、发送、登记收票
```

包含：

- 从报关数据生成供应商开票通知。
- 发送通知、登记税票、催收提醒。

实现：

- 通知列表按供应商聚合，详情强调税票是否收回。
- 催收提醒用 `Badge`/`Banner` 呈现，避免只在表格列里隐藏。

### 16. 采购跟单 `/purchase/followup`

依据：PDF 定制开发第 1、2、3 点、检查记录 017。当前 API：`listFollowupTemplates`、`createFollowupTemplate`、`updateFollowupTemplate`、`listFollowupPlans`、`generateFollowupPlanFromPurchaseContract`、`syncFollowupSampleEvents`、`syncFollowupSourceEvent`、`listFollowupOverdueNodes`。

结构图：

```text
┌ PageHeader：采购跟单 / 生成计划 / 同步事件 ┐
├ 风险条：逾期节点、今日到期、异常来源 ┤
├ 左：采购合同进度 Table ─┬─ 右：节点 Timeline
│                         ├ 合同下单确立
│                         ├ 确认样提交
│                         ├ 大货样提交
│                         ├ QC 查验
│                         ├ 入库
│                         └ 出库
└ 下：流程模板配置 Table + 编辑 SideSheet
```

包含：

- 跟单流程模板、节点天数、提前提醒。
- 采购合同跟单计划。
- 逾期节点预警。
- 样品、QC、入库、出库来源事件同步。

实现：

- 这是流程页，不是资料页。主视觉必须是节点时间线和逾期风险。
- 节点实际日期必须显示来源模块，不能让用户以为是手工填的。

### 17. QC 查验 `/quality/inspections`

依据：PDF 定制开发第 4 点、检查记录 018。当前 API：`listQualityInspections`、`createQualityInspection`、`updateQualityInspection`、`getQualityInboundEligibility`。

结构图：

```text
┌ PageHeader：QC 查验 / 新增查验 ┐
├ FilterBar：采购合同、供应商、结果、问题状态 ┤
├ 左：查验任务 Table ─┬─ 右：查验详情
│                     ├ 查验结果
│                     ├ 明细行
│                     ├ 异常问题
│                     ├ 附件
│                     └ 入库资格
└ SideSheet：登记查验 / 更新问题
```

包含：

- 采购合同 QC 查验日期、结果、异常、附件。
- QC 通过回写跟单节点。
- 入库资格判断。

实现：

- 结果状态使用固定语义色：通过、部分通过、待复检、不通过。
- 入库资格用 `Banner` 显示，直接告诉仓库是否可正式入库。

### 18. 入库计划 `/warehouse/inbound-plans`

依据：PDF `1.5.8.1 入库计划`、检查记录 019。当前 API：`listInboundPlans`、`generateInboundPlanFromPurchaseContract`、`scheduleInboundPlan`。

结构图：

```text
┌ PageHeader：入库计划 / 从采购合同生成 ┐
├ FilterBar：供应商、采购合同、入库类型、计划日期、状态 ┤
├ 主表 Table：计划号、供应商、计划日期、仓库、库位、状态、数量 ┤
└ DetailDrawer
   ├ 计划明细
   ├ 库位预安排
   └ 生成入库单入口
```

包含：

- 待入库清单、入库类型、库位预安排。
- 从采购合同交货期生成。

实现：

- 仓库计划页以日期和库位为核心，表格应支持按计划日期分组。
- 库位预安排使用 SideSheet，不常驻在页面右侧。

### 19. 货物入库 `/warehouse/inbound-orders`

依据：PDF `1.5.8.2 货物入库`、检查记录 020。当前 API：`listInboundOrders`、`generateInboundOrderFromPlan`、`submitInboundOrder`、`approveInboundOrder`、`listInventoryBalances`、`listInventoryLedgers`。

结构图：

```text
┌ PageHeader：货物入库 / 从计划生成 ┐
├ 状态流：草稿 → 待审批 → 已审批入库 ┤
├ 左：入库单 Table ─┬─ 中：入库详情
│                   │  ├ 入库类型：正式/待检
│                   │  ├ 商品明细
│                   │  └ 审批动作
│                   └─ 右：库存影响
│                      ├ 库存余额
│                      └ 库存流水
└ SideSheet：生成入库单 / 审批入库
```

包含：

- 从入库计划生成入库单。
- 待检入库、正式入库、入库审批。
- 库存余额和流水。

实现：

- 入库详情必须显示 QC 入库资格和库存入账影响。
- 库存余额/流水放在同页侧栏，方便仓库人员校验。

### 20. 出库计划 `/warehouse/outbound-plans`

依据：PDF `1.5.8.3 出库计划`、检查记录 021。当前 API：`listOutboundPlans`、`generateOutboundPlanFromShipment`、`scheduleOutboundPlan`。

结构图：

```text
┌ PageHeader：出库计划 / 从出货计划生成 ┐
├ FilterBar：客户、出货单、出库类型、计划日期、状态 ┤
├ 主表 Table：计划号、出货单、客户、计划日期、仓库、库位、状态 ┤
└ DetailDrawer
   ├ 待出库明细
   ├ 库位安排
   └ 生成出库单入口
```

包含：

- 待出库清单、出库类型。
- 从发货计划生成出库计划。

实现：

- 出库计划和入库计划保持同类仓库计划结构，但主筛选从供应商切换为客户/出货单。
- 待出库明细显示计划数量和库存可用数量。

### 21. 货物出库 `/warehouse/outbound-orders`

依据：PDF `1.5.8.4 货物出库`、检查记录 022。当前 API：`listOutboundOrders`、`generateOutboundOrderFromPlan`、`submitOutboundOrder`、`approveOutboundOrder`、`listInventoryBalances`、`listInventoryLedgers`。

结构图：

```text
┌ PageHeader：货物出库 / 从计划生成 ┐
├ 状态流：草稿 → 待审批 → 已出库 ┤
├ 左：出库单 Table ─┬─ 中：出库详情
│                   │  ├ 正式/异常出库
│                   │  ├ 商品明细
│                   │  └ 审批动作
│                   └─ 右：库存校验
│                      ├ 可用库存
│                      ├ 负库存拦截
│                      └ 出库流水
└ SideSheet：生成出库单 / 审批出库
```

包含：

- 从出库计划生成出库单。
- 正式出库、异常出库、出库审批。
- 禁止非授权负库存，写库存流水。

实现：

- 出库审批前必须在侧栏显示库存校验结果。
- 异常出库原因作为必填高亮字段，不和普通备注混在一起。

### 22. 财务管理 `/finance`

依据：PDF `1.5.7 财务管理`、利润核算定制、检查记录 024-030。当前 API：`getFinanceOverview`、`listBankReceipts`、`createBankReceipt`、`claimBankReceipt`、`allocateBankReceipt`、`listReceivables`、`listSupplierInvoices`、`createSupplierInvoice`、`listPaymentRequests`、`createPaymentRequest`、`approvePaymentRequest`、`listPayables`、`listPartnerFeeInvoices`、`createPartnerFeeInvoice`、`listFeePaymentRequests`、`createFeePaymentRequest`、`approveFeePaymentRequest`、`listFeePayables`、`listVerificationDocuments`、`createVerificationDocument`、`registerVerificationCustomsReceipt`、`registerVerification`、`registerTaxRefund`、`listVerificationUsage`、`listMiscFeeItems`、`createMiscFeeItem`、`listMiscFeeAllocations`、`createMiscFeeAllocation`、`listMiscFeeAllocationSummary`、`listFinancialSettlements`、`createFinancialSettlement`、`addManualProfitCost`、`listProfitCalculations`。

结构图：

```text
┌ PageHeader：财务管理 / 财务概览 ┐
├ KPI：收款、应收、应付、费用、核销、毛利 ┤
├ FinanceTabs
│  ├ 收款台账：银行水单、认领、分摊、应收查询
│  ├ 付款台账：供应商发票、付款申请、审批、应付查询
│  ├ 付费台账：合作伙伴费用、付费申请、审批、应付费用
│  ├ 核销退税：核销单、回单、核销、退税、使用情况
│  ├ 杂费分摊：杂费项目、单票分摊、分摊查询
│  └ 结算利润：单票结算、手工成本、利润核算
└ SideSheet：录入、认领、分摊、审批、登记、结算、手工成本
```

包含：

- 财务概览和利润概览。
- 收款、水单认领、分摊、应收查询。
- 供应商发票、付款申请、付款审批、应付查询。
- 合作伙伴费用发票、付费申请、付费审批、应付费用查询。
- 核销单、报关回单、核销登记、退税登记、使用情况。
- 杂费项目、单票杂费分摊、杂费分摊查询。
- 财务结算锁定、手工成本、利润核算表。

实现：

- 财务页必须拆成 Tabs/工作区，禁止所有表单和表格纵向堆在一个超长页面。
- 每个台账工作区采用“左表格 + 右详情 + SideSheet 动作”的结构。
- 金额列统一右对齐，状态列统一 Tag，所有金额口径在详情中可追溯。
- 利润核算表支持展开成本明细，结算锁定后费用 cutoff 用 Banner 提醒。

### 23. 经理查询 `/reporting`

依据：PDF `1.5.9 经理查询和统计分析`、检查记录 031-032。当前 API：`listApprovalDocuments`、`listReportingStatistics`。

结构图：

```text
┌ PageHeader：经理查询 / 导出 / 刷新 ┐
├ KPI：待审批、已审批、出口合同额、采购合同额、出货应收、出货利润 ┤
├ ReportTabs
│  ├ 审批查询
│  │  ├ FilterBar：单据类型、状态、申请人、日期
│  │  └ Table：审批单据 + 类型汇总
│  ├ 统计分析
│  │  ├ FilterBar：日期、状态、客户、供应商、业务员
│  │  ├ 合同状态金额
│  │  ├ 客户出货排行
│  │  └ 业务员月度出货
│  └ 原始单据追溯
│     ├ 出货单据
│     └ 出口合同
└ Drilldown：source_path 后续接实际详情路由
```

包含：

- 待审批/已审批单据查询和类型汇总。
- 出口合同、采购合同、出货应收、出货利润统计。
- 客户出货、业务员月度出货、合同状态金额、原始单据追溯。

实现：

- 经理页应是 dashboard，不应像普通资料页。
- 审批查询和统计分析分成 Tabs，KPI 固定在顶部。
- `source_path` 先展示为可点击占位，后续接真实详情路由。
- 风险视图后续接逾期跟单、异常 QC、异常出库、超授信客户。

## 尚未进入当前菜单的 PDF 后续页面

这些页面属于 `docs/05-实现步骤.md 阶段 7：单证管理`，当前没有菜单路由和 React 页面，不能写成已完成。后续实现时建议采用以下结构：

| 页面 | 建议结构 | 数据来源 |
| --- | --- | --- |
| 信用证管理 | 信用证列表 + 到期提醒 + 商品信息 + 改证/议付 Timeline | 后续 `documents/letters_of_credit` |
| 报关单证 | 从出货生成向导 + 托单商品明细 + 报关商品明细 + 导出动作 | 后续 `documents/customs` |
| 结汇单证 | 从出货/报关生成 + 商品明细 + 装箱明细 + 模板导出 | 后续 `documents/settlement` |
| 进仓通知 | 按供应商分组 + 进仓地址时间 + 通知导出/发送记录 | 后续 `documents/warehouse_entry_notices` |
| 客户索赔 | 索赔登记 + 处理任务 + 责任部门 Timeline + 处理结果 | 后续 `documents/claims` |

## 重构实施步骤

1. 引入 Semi Design 基础依赖和全局样式，先保留 API client 不动。
2. 先重构登录页，验证 Semi 表单、错误提示、移动端单列和 token 登录流程。
3. 抽出 `AppShell`、`PageHeader`、`FilterBar`、`MetricStrip`、`StatusTag`、`EntitySideSheet`。
4. 迁移主数据 5 个页面，验证 SideSheet 和详情 Tabs 模式。
5. 再迁移销售/采购单据页面，沉淀 `LineItemEditor`、`ApprovalRail`、`DocumentSourcePanel`。
6. 迁移样品、跟单、QC、仓库，沉淀 `NodeTimeline`、`InventoryImpactPanel`。
7. 拆分财务页为 Tabs 工作区，减少超长单页。
8. 重做经理查询为 dashboard + 下钻报表。
9. 每迁移一个页面保留原有 E2E，并补充视觉检查：桌面 1280px、移动 390px、无页面级横向滚动、无控制台错误。

## 验收标准

- 所有当前菜单仍能按权限展示，路由不变。
- 未登录状态能稳定进入登录页，登录成功后进入工作桌面，登录失败错误提示清晰。
- API 契约和后端测试不因 UI 重构改变。
- 每个页面的主操作、查询、列表、详情、状态、审批或登记动作都可找到。
- 主数据页、单据页、流程页、仓库页、财务页、经理页在结构上可明显区分。
- 页面不再出现大量常驻右侧新增表单；新增、编辑、审批、登记优先进入 SideSheet。
- E2E 截图能体现不同业务页面的信息结构差异。
