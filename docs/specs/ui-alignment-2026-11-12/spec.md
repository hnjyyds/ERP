# Spec：组件尺寸与对齐问题修复（2026-11-12）

依据：[22-组件尺寸与对齐盘点](../../22-组件尺寸与对齐盘点.md) 的 ALIGN-01 ~ ALIGN-08。
范围：只改共享样式与必要的页面布局，不改业务逻辑、接口与数据结构。

## 1. 已确认的根因（源码定位）

| 编号 | 根因 | 位置 |
| --- | --- | --- |
| ALIGN-01 | `.form-grid` / `.stocktake-lines` / `.stocktake-line` 有 JSX 无 CSS | `StocktakesPage.tsx:396,467,534`；全部 CSS 无定义 |
| ALIGN-02 | 合同字段 `label` 为纵向 flex，辅助按钮默认 stretch；按钮高度被 34px 覆盖 | `shared-primitives.css:555-580`、`ux-pass.css:318` |
| ALIGN-03 | 全局 `max-width:300px` 与字段容器列宽脱节 | `antd-and-login.css:91-105` |
| ALIGN-04 | 样品页把筛选容器覆盖为 flex，而 label 规则是 `width:100%; flex:none` | `sample-pages.css:80-89` + `design-system-apply.css:254-262` |
| ALIGN-05 | 按钮作为 `.inline-filters` Grid 子项被均分拉伸 | `design-system-apply.css:233-240` |
| ALIGN-06 | `InputNumber addonAfter="%"` 的复合包装层未纳入 36px 控件契约 | `ProductFormModal.tsx:96-120` |
| ALIGN-07 | `.ant-input{height:34px!important}` 同时命中 TextArea | `antd-and-login.css:91-101` |
| ALIGN-08 | 38px / 34px 旧规则残留，token 未被消费 | `workspace-shell.css:191`、`sample-pages.css:117`、`shared-page-primitives.css:199` |

## 2. 实施决策

统一原则：**尺寸事实源只用 `design-system.css` 的 `--ui-*` token；宽度由字段容器决定；单行、多行、复合控件分别定规格。** 不新增页面级 margin 或固定像素宽度，不逐页打补丁。

### 2.1 控件基座（ALIGN-03 / ALIGN-07 / ALIGN-08）

`frontend/src/styles/antd-and-login.css`

- `.ant-input`、`.ant-input-affix-wrapper`、`.ant-input-number`、`.ant-picker`：`height`、`min-height` 由 `34px` 改为 `var(--ui-control-height)`；保留 `max-width:300px` 作为旧页面兜底。
- `.ant-select-selector`：`height`、`min-height` 由 `34px` 改为 `var(--ui-control-height)`。
- 新增单行/多行分离规则（此文件在级联前部，最终覆盖放到 `design-system-apply.css`）：
  `textarea.ant-input { height: auto !important; line-height: 1.55; }`

`frontend/src/styles/design-system-apply.css`（末位契约层，追加一节「表单尺寸契约」）

- 字段容器填满列：
  `.record-form label`、`.entity-modal-form label`、`.form-grid label`、`.inline-filters label` 的直接子控件
  （`.ant-input`、`.ant-input-affix-wrapper`、`.ant-input-number`、`.ant-select`、`.ant-picker`、`select`、`textarea`）
  设 `width:100%; max-width:none;`。
- TextArea 独立规格：
  `body textarea.ant-input`、`body .record-form textarea`、`body .entity-modal-form textarea`、`body .sample-modal-form textarea`
  设 `height:auto !important; min-height:88px; line-height:1.55 !important; padding-block:8px !important; resize:vertical;`。
- 复合控件（税率/退税率）：
  `.ant-input-number-group-wrapper` 设 `display:inline-flex; align-items:stretch; width:100%; max-width:none;`
  内部 `.ant-input-number` 设 `height/min-height: var(--ui-control-height)`；
  `.ant-input-number-group-addon` 设 `display:inline-flex; align-items:center; min-height: var(--ui-control-height); padding-inline:8px;`
  保证与同行普通输入 top/bottom 一致。

### 2.2 合同辅助新增按钮（ALIGN-02）

`frontend/src/styles/shared-primitives.css`

- `.contract-modal-form .form-row > label .ant-btn`：增加 `align-self:flex-start; width:max-content; max-width:100%;`，高度改为 `auto` + `min-height:calc(var(--ui-control-height) - 4px)`，不再撑满 340px。

`frontend/src/styles/ux-pass.css`

- `.inline-create-link.ant-btn`：增加 `align-self:flex-start; width:max-content; max-width:100%; min-height:0; height:auto; line-height:1.5;`，与同列选择框左边界对齐、不增加行高。

### 2.3 列表操作按钮（ALIGN-05）

`frontend/src/styles/design-system-apply.css`

- 新增：`body .inline-filters > .ant-btn`（并覆盖 `section[class*="-page"]`）
  `justify-self:end; align-self:end; width:auto; min-width:0; min-height:var(--ui-control-height);`。
  按钮不再继承 190px/381px 搜索列宽，搜索与新增靠右成组。

`frontend/src/styles/workspace-shell.css:191`

- `.inline-filters .ant-btn` 的 `min-height:38px` 改为 `var(--ui-control-height)`。

### 2.4 样品筛选（ALIGN-04）

`frontend/src/styles/sample-pages.css:80-89`

- `.list-panel .inline-filters` 由 `display:flex` 改为
  `display:grid; grid-template-columns:minmax(200px,1.8fr) repeat(auto-fit,minmax(148px,1fr)); align-items:end; gap:12px;`。
- `.inline-filters .ant-btn` 的 `min-height:38px` 改为 `var(--ui-control-height)`，并加 `justify-self:end; width:auto;`。
- 保留 `.inline-filter-compact{flex:0 0 160px}`（Grid 下自动失效）与既有 label 宽度规则，不删除。

### 2.5 库存盘点布局（ALIGN-01）

`frontend/src/styles/warehouse-pages.css`（追加，仅盘点页使用）

- `.form-grid`：`display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px 16px; margin-bottom:16px;`
- `.form-grid > label`：纵向字段盒，`gap:6px; min-width:0; font-size:12.5px; font-weight:700; color:var(--ui-text-secondary);`
- `.form-grid > div`（详情弹窗只读信息）：`min-width:0; font-size:13px; line-height:1.6;`
- `.form-grid label > .ant-input / .ant-input-number / .ant-select`：`width:100%; max-width:none;`
- `.stocktake-lines`：`display:grid; gap:8px; margin-top:8px;`
- `.stocktake-line`：
  `display:grid; grid-template-columns:minmax(160px,1.4fr) minmax(0,1fr) minmax(88px,0.6fr) minmax(110px,0.8fr) 36px; gap:8px; align-items:center;`
  子控件 `width:100%; max-width:none;`；行尾删除按钮 `width:var(--ui-control-height); padding:0;`
- `.stocktake-lines > .ant-btn`（新增明细按钮）：`justify-self:start; width:auto; min-height:var(--ui-control-height);`
- `@media (max-width:760px)`：`.stocktake-line` 改为单列，删除按钮 `justify-self:end`。

### 2.6 常规高度与操作区（ALIGN-08）

- `shared-primitives.css`：`.record-form .ant-input...` 与 `.contract-modal-form .form-row > label .ant-input...`、`.contract-lines-table .ant-input` 的 `34px` 改为 `var(--ui-control-height)`。
- `shared-page-primitives.css:199`：`.workflow-modal-content .record-form > .ant-btn` 的 `38px` 改为 `var(--ui-control-height)`。
- 不搬迁各页提交按钮位置：验收只要求同高、同操作组布局，避免跨模块大改。

## 3. 不做的事

- 不改业务逻辑、API、字段校验、路由与文案。
- 不删除全局 `max-width:300px`（保留兜底），只在字段容器内解除。
- 不为单个像素写镜像断言；CSS 变更以浏览器实测验收。
- 不提交 git。

## 4. 验收标准

1. 库存盘点新建弹窗：每个字段形成「标签 + 控件」独立字段盒，两列以上对齐；明细行商品/编码/单位/实盘数/删除按钮逐列对齐，增删行后不错位；760px 以下单列可读。
2. 采购合同「新增供应商」、出口合同「新增客户」按钮宽度等于内容宽，右边界不超过同列选择框；行高增量不超过 40px。
3. 入库/入库计划/出库计划/合同弹窗中，字段盒宽与控件宽一致（控件填满列），无 130px 空白；紧凑数值字段仍可显式限宽。
4. 样品登记/打样/寄样：1512px 下筛选不再每项 1186px 独占一行，表格进入首屏可视区域中部。
5. 收款/报销/出口报价/出货明细：查询、新增按钮为内容宽，不出现 190px/381px 拉伸，操作靠右成组。
6. 商品税率/退税率：复合控件整体 36px，与同行普通输入 top/bottom 误差 ≤1px。
7. 商品包装资料、供应商/客户风险备注、QC 说明、出库异常原因、水单备注：TextArea 至少 3 行（≥88px），可纵向拖拽。
8. 常规控件与按钮统一 36px；工作流、QC、样品、报销的 38px 规则清除。
9. 1440px、1512px、390px 三档实测通过；`npx tsc --noEmit`、`npm run lint`、`npm run test` 通过；前端容器重建后生效。

## 5. 文档联动

- `docs/22-组件尺寸与对齐盘点.md`：为 ALIGN-01 ~ ALIGN-08 逐条标注状态（仅用「已完成 / 待办」）与修复位置。
- `docs/14-*`、`docs/15-*`、`outputs/frontend-ui-report-20261107/index.html`：同步本轮状态说明。

## 6. 审批

本 spec 需用户确认后开始改代码。确认即表示：按上述 6 个 CSS 文件范围修改，不扩展到业务代码。
