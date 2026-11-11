# 页面排版一致性修复 · 任务清单

- 关联方案：`docs/specs/003-layout-consistency/spec.md`
- 诊断依据：`docs/20-工作台排版一致性诊断报告.md`
- 规则：分批执行，每批完成上报实测坐标与截图后再进入下一批。

## 批次 1：样式基座 + 工作台

- [x] T1.1 `frontend/src/design-system.css`：新增 `--ui-page-gutter`、`--ui-card-inset`
- [x] T1.2 `frontend/src/styles/design-system-apply.css`：`.react-workspace` / `.react-topbar` 改用 gutter token
- [x] T1.3 `frontend/src/styles/design-system-apply.css`：`.metric-cell` 改 72 高 / 12 16 内边距
- [x] T1.4 `frontend/src/styles/design-system-apply.css`：`.dashboard-workbench` gap 16、board 2×2 + gap 16 + stretch、取消 `span 2`
- [x] T1.5 `frontend/src/styles/design-system-apply.css`：`.dashboard-panel` 恢复独立卡片外观，删除 `padding:16px 0` 覆盖，统一 `padding: var(--ui-card-inset)`
- [x] T1.6 `frontend/src/styles/design-system-apply.css`：标题区 48 高 / 12 下间距；1180、980 断点 gap 统一 16
- [x] T1.7 `frontend/src/styles/dashboard.css`：统计条改 4 等分网格（去渐变、clamp、4px padding）
- [x] T1.8 `frontend/src/styles/dashboard.css`：删除四张卡的局部 padding / 固定 min-height / 透明覆盖
- [x] T1.9 新增 `frontend/src/shared/ui/EmptyState.tsx` + `shared/ui/index.ts` 导出
- [x] T1.10 `frontend/src/styles/shared-primitives.css`：新增 `.ui-empty-state` 样式（page / compact）
- [x] T1.11 `DashboardOverviewPanels.tsx`：4 处空态换成 `EmptyState`；消息空态去「查看全部 →」
- [x] T1.12 `DashboardOverviewPanels.tsx`：新增日程 / 发布公告移入对应卡片标题区（保留权限判断）
- [x] T1.13 `DashboardPage.tsx`：删除 `.dashboard-toolbar`
- [x] T1.14 `DashboardShortcutsPanel.tsx` + 两份 locale：推荐入口小标题
- [x] T1.15 重建/刷新前端，测量工作台三层左边缘 + 统计条宽度 + 两列底边
- [x] T1.16 生成工作台修复后截图，与 `before-dashboard.png` 成对
- [x] T1.17 上报批次 1

## 批次 2：跨页统一（产品 / 客户）

- [x] T2.1 `masterdata-pages.css`：`.masterdata-page` gap 14 → 16
- [x] T2.2 契约层：`.panel-heading` / `.toolbar-heading` 下间距统一 12，去掉表格额外 margin-top
- [x] T2.3 `App.tsx` ConfigProvider 增加 `renderEmpty` → `EmptyState(size="page")`；新增 `common.noData` 文案
- [x] T2.4 全局搜索残留的卡片横向 padding 局部覆盖，结果写入报告
- [x] T2.5 实测产品 / 客户页 264 / 281 两条基线
- [x] T2.6 生成产品 / 客户修复后截图（成对）
- [x] T2.7 上报批次 2

## 批次 3：审计日志页

- [x] T3.1 `AuditLogsPage.tsx`：包 `.workspace-panel` + 标题区（复用 `ListPageShell`），gap 16
- [x] T3.2 空态接入统一 `EmptyState`
- [x] T3.3 实测审计页 264 / 281 基线
- [x] T3.4 生成审计页修复后截图（成对）
- [x] T3.5 上报批次 3

## 收尾

- [x] T4.1 `docs/20` 增加「修复前后坐标对比」章节与截图索引
- [x] T4.2 `git diff` 复核改动文件清单
- [x] T4.3 运行前端测试
- [x] T4.4 提交（含诊断报告与 spec）
