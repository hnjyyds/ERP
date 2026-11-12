# Tasks：组件尺寸与对齐修复（2026-11-12）

对应 [spec.md](spec.md)。状态只用「待办 / 已完成」。

## [x] T1 控件高度基座（ALIGN-07 / ALIGN-08 前置）

- 文件：`frontend/src/styles/antd-and-login.css`
- 改动：`.ant-input` / `.ant-input-affix-wrapper` / `.ant-input-number` / `.ant-picker` 的 `height`、`min-height` 34px → `var(--ui-control-height)`；`.ant-select-selector` 同步；`textarea.ant-input` 不参与单行高度约束。
- 验收：单行控件实测 36px。
- 状态：已完成

## [x] T2 表单尺寸契约层（ALIGN-03 / ALIGN-06 / ALIGN-07）

- 文件：`frontend/src/styles/design-system-apply.css`（末尾新增「表单尺寸契约」区块）
- 改动：字段容器内控件 `width:100%; max-width:none`；TextArea `height:auto !important; min-height:88px`；复合数字控件 `.ant-input-number-group-wrapper` 统一 36px；`label` 行轨 `align-content:start`。
- 验收：商品弹窗海关编码与税率输入 top 均为 311、高 36px；包装资料 TextArea 99px。
- 状态：已完成

## [x] T3 列表操作组（ALIGN-05）

- 文件：`frontend/src/styles/design-system-apply.css`、`frontend/src/styles/workspace-shell.css`
- 改动：`body .inline-filters > .ant-btn` 内容定宽、靠右；工作流筛选按钮 38px → token。
- 验收：收款查询 85px、水单录入 111px，同一行靠右相邻。
- 状态：已完成

## [x] T4 样品筛选布局（ALIGN-04）

- 文件：`frontend/src/styles/sample-pages.css`
- 改动：`.list-panel .inline-filters` 改为 Grid（`minmax(200px,1.8fr) repeat(auto-fit,minmax(148px,1fr))`）；按钮高度取 token。
- 验收：1440 宽下 4 个筛选同排（279 / 155 × 4），表头 y=370，进入首屏。
- 状态：已完成

## [x] T5 库存盘点布局（ALIGN-01）

- 文件：`frontend/src/styles/warehouse-pages.css`
- 改动：补齐 `.form-grid`、`.stocktake-lines`、`.stocktake-line`、行尾删除按钮与新增明细按钮；760px 以下单列。
- 验收：3 列字段盒 y 对齐；明细五列 x=64/353/563/691/860；390 宽无横向溢出。
- 状态：已完成

## [x] T6 合同辅助新增按钮（ALIGN-02）

- 文件：`frontend/src/styles/shared-primitives.css`、`frontend/src/styles/ux-pass.css`
- 改动：`.contract-modal-form .form-row > label .ant-btn` 与 `.inline-create-link.ant-btn` 内容定宽、贴左、紧凑高度。
- 验收：按钮 94×32px，同列选择框 340px，未超出其右边界。
- 状态：已完成

## [x] T7 残留 34px / 38px 清理（ALIGN-08）

- 文件：`frontend/src/styles/shared-primitives.css`、`frontend/src/styles/shared-page-primitives.css`、`frontend/src/styles/masterdata-pages.css`
- 改动：常规控件与操作按钮的 34px / 38px 全部改为 `var(--ui-control-height)`。
- 验收：业务页常规控件与按钮统一 36px。
- 状态：已完成

## [x] T8 静态检查

- 命令：`cd frontend && npx tsc --noEmit && npm run lint && npm run test`
- 结果：tsc、lint 通过；384 项测试通过（1 条既有 `window is not defined` 未处理错误，与本次无关）。
- 状态：已完成

## [x] T9 容器重建与浏览器实测

- 命令：`docker compose up -d --build frontend`
- 实测：1440 / 960 / 390 宽复查库存盘点、样品登记、收款、商品弹窗与采购合同；数据见 docs/22「修复记录与验收」。
- 状态：已完成

## [x] T10 文档联动

- 文件：`docs/22-组件尺寸与对齐盘点.md`、`docs/14-仓库结构与功能盘点.md`、`docs/15-前端结构审计与分阶段整理方案.md`、`outputs/frontend-ui-report-20261107/index.html`
- 改动：ALIGN-01 ~ ALIGN-08 逐条标注「已完成」及修复位置；同步本轮状态说明。
- 状态：已完成
