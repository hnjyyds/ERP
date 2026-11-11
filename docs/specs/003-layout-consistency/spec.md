# 页面排版一致性修复 · 方案（待审批）

- 状态：待确认
- 关联：`docs/20-工作台排版一致性诊断报告.md`（诊断已完成，含实测坐标）
- 约束：只改样式与展示结构，不改业务逻辑、接口、权限；保留现有中英文案机制；不引入新的 UI 库。

---

## 1. 目标与已确认决策

| 决策 | 结论 |
| --- | --- |
| 卡片模型 | **A：独立卡片**（1px 边框 + 6px 圆角 + 白底 + 16px 内边距），卡片间距 16px |
| 空状态 | **居中**：图标 + 一句说明 + 一个动作；去掉虚线框和底色；禁止右下「查看全部 →」 |
| 统计条 | **四等分铺满容器宽度**（不再固定 118px、不再 57.6px 间距、不再右侧 503px 空白） |

核心原则：**页面容器只加一次左右内边距，卡片内部不再重复加横向 margin；空状态不再自己叠 padding。**

非范围：不改后端、不改路由/权限、不重做列表页业务布局、不处理报告第 7 节「装饰性底色/色条」（只保留报告）。

---

## 2. Token 层（新增两个变量）

`frontend/src/design-system.css`，在 `--ui-space-8: 32px;` 之后新增：

```css
--ui-page-gutter: var(--ui-space-6);   /* 页面左右唯一内边距：24px */
--ui-card-inset: var(--ui-space-4);    /* 卡片内容内边距：16px */
```

`.react-workspace`、`.react-topbar`、列间距全部改为引用 `--ui-page-gutter`，改一处即全局生效。

---

## 3. 第一批：样式基座 + 工作台

### 3.1 `frontend/src/styles/design-system-apply.css`

| 行 | 现状 | 改为 |
| --- | --- | --- |
| 28 | `padding: var(--ui-space-5) var(--ui-space-6) var(--ui-space-8)` | `var(--ui-space-5) var(--ui-page-gutter) var(--ui-space-8)` |
| 30-33 | topbar `margin: calc(-1*20px) calc(-1*24px) 16px`、`padding: 12px 24px` | 两处 24px 改 `var(--ui-page-gutter)` |
| 977 | `.dashboard-workbench { gap: var(--ui-space-3) }` | `gap: var(--ui-space-4)`（16） |
| 989-992 | `.react-shell-home .metric-cell { min-height:58px; padding:8px 12px }` | `min-height: 72px; padding: var(--ui-space-3) var(--ui-card-inset);` |
| 1038-1045 | board `grid-template-rows: auto auto auto; gap: 0 var(--ui-space-6); align-items: start` | `grid-template-rows: auto auto; gap: var(--ui-space-4); align-items: stretch;` |
| 1051-1058 | 卡片被打回 `border:0; border-top:1px; radius:0; transparent` | `border:1px solid var(--ui-border); border-radius: var(--ui-radius-panel); background: var(--ui-bg-surface); box-shadow:none; overflow:visible; min-height:0;` |
| 1060-1066 | 四张卡 `padding: var(--ui-space-4) 0`（病根，漏掉 `.dashboard-shortcut-panel`） | **整段删除**，改由 1051 的 `.dashboard-panel` 统一 `padding: var(--ui-card-inset)` |
| 1070 | `.dashboard-panel-schedule { grid-row: 2 / span 2 }` | `grid-row: 2`（2×2，不再跨行拉伸） |
| 1073-1077 | 标题区 `min-height:32px; margin-bottom:12px` | `min-height: 48px; margin-bottom: var(--ui-space-3);` |
| 1293-1297 | `@media(max-width:1180px)` board `gap: 0 var(--ui-space-4)` | `gap: var(--ui-space-4)` |
| 1300-1313 | `@media(max-width:980px)` board `gap: 0` + 四卡 `padding-block` | `gap: var(--ui-space-4)`，删除 padding-block 覆盖 |

### 3.2 `frontend/src/styles/dashboard.css`

| 行 | 现状 | 改为 |
| --- | --- | --- |
| 14-26 | 米色渐变 + 上下装饰线 + `gap: clamp(24px,4vw,68px)` + `padding: 15px 4px 16px` | `display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1px; border:1px solid var(--ui-border); border-radius: var(--ui-radius-panel); background: var(--ui-border); padding:0; overflow:hidden;`（去掉渐变/上下线；gap 由底色透出 1px 分隔） |
| 73-77 | `.react-shell-home .metric-strip .metric-cell { min-width:118px; min-height:58px; padding:0 }` | `min-width:0; min-height:72px; background: var(--ui-bg-surface); padding: var(--ui-space-3) var(--ui-card-inset);`（图标 28 + 10 gap + label/value，基线由 `align-content:center` 保证） |
| 155-162 | `.react-shell-home .dashboard-panel` 打回透明无边框 | 删除（由契约层统一定义卡片外观） |
| 164-166、173-175 | `.dashboard-panel-primary{min-height:236px}`、`.dashboard-panel-schedule{min-height:390px}` | 删除固定最小高（会导致两列底部空档） |
| 184-192 | 四张卡 `padding: 18px 10px 18px 0` / `18px 18px 18px 24px` | 删除（横向 padding 不再由页面局部覆盖） |

### 3.3 空状态组件（新增）

`frontend/src/shared/ui/EmptyState.tsx`：

```tsx
type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  size?: 'page' | 'compact'
}
```

- 结构固定：图标（28）→ 标题（14/20）→ 说明（12/18）→ 一个动作；整体居中。
- `size="page"`：min-height 220（表格/详情）；`size="compact"`：min-height 96（工作台卡片）。
- 无虚线边框、无底色、无横向 padding（只给上下 24）。
- 样式写入 `frontend/src/styles/shared-primitives.css`（类名 `.ui-empty-state`），并在 `shared/ui/index.ts` 导出。

### 3.4 工作台组件

`frontend/src/app/pages/dashboard/views/DashboardOverviewPanels.tsx`

- 4 个 `.dashboard-empty` 全部替换为 `<EmptyState size="compact" icon={...} title={...} />`。
- 待办空态保留唯一动作「+ 新增待办」；消息空态删除「查看全部 →」（标题区已有）。
- 「新增日程」从页面工具栏移入**我的日程**卡片标题区右侧。
- 「发布公告」从页面工具栏移入**公司公告**卡片标题区右侧（保留 `canPublishAnnouncement` 权限判断），空态不再重复该按钮。

`frontend/src/app/pages/dashboard/DashboardPage.tsx`

- 删除 391-400 行无标签工具栏 `.dashboard-toolbar`（连同其两个按钮）。

`frontend/src/app/pages/dashboard/views/DashboardShortcutsPanel.tsx`

- 空态保留「还没有快捷入口」+ 说明，在推荐瓦片前加小标题「推荐入口」（新增文案 key `dashboard.shortcutRecommendedLabel`），消除「说没有却有四个入口」的矛盾。

`frontend/src/locales/zh-CN.json`、`en-US.json`

- 新增 `dashboard.shortcutRecommendedLabel`：推荐入口 / Recommended。

---

## 4. 第二批：跨页统一（工作台 + 产品 + 客户）

1. 页面纵向节奏统一 16px：`frontend/src/styles/masterdata-pages.css:17-22` `.masterdata-page { gap:14px }` → `var(--ui-space-4)`。
2. 标题区到内容统一 12px：在契约层为 `.panel-heading` / `.toolbar-heading` 增加 `margin-bottom: var(--ui-space-3)`，删除表格容器上的额外 `margin-top`（实测当前 16+12=28）。
3. 表格空态统一：`frontend/src/app/App.tsx` 的 `<ConfigProvider>` 增加
   `renderEmpty={() => <EmptyState size="page" title={t('common.noData')} />}`，
   让 AntD Table / Empty 的默认空态与页面同形；新增 `common.noData`（暂无数据 / No data）。
4. 逐页实测 3 层左边缘，确认 264 / 281 两条基准线，不再出现 280 / 291 / 307 / 308 混杂。
5. 抽查是否还有「页面局部横向 padding 覆盖」：全局搜索 `padding:.*\b0\b.*;` 在 `dashboard*.css`、`masterdata-pages.css` 的卡片选择器上，结果写入报告。

---

## 5. 第三批：审计日志页补齐卡片层级

`frontend/src/app/pages/system/AuditLogsPage.tsx`

- 180 行 `<section style={{display:'flex',flexDirection:'column',gap:16}}>` 改为 `<section className="workspace-panel list-panel">` + 标题区（复用 `ListPageShell`，标题「审计日志」），筛选与表格放入内容区。
- 表格空态复用第 4 节的 `renderEmpty`（不在页面里写字符串）。
- 只补卡片壳，不调整筛选字段、列定义与业务交互。

---

## 6. 验收标准（实测，不目测）

在 1440×900 视口、登录 admin 后测量：

| 指标 | 目标 |
| --- | --- |
| 工作台 h1 文本 left | 264.0 |
| 统计条外框 left / right | 264.0 / 1416.0 |
| 统计首格 left | 265.0（+1px 边框），内容 left 281.0 |
| 4 张内容卡片 left | 264.0 |
| 卡片标题区 left / 标题文本 left | 281.0 / 308.0（图标 18 + gap 9） |
| 产品 / 客户 / 审计三页卡片 left | 264.0，标题区 281.0，表格 281.0 |
| 四页三层左边缘差 | ≤ 1px（仅边框差） |
| 统计条 4 格宽度 | 均为 286.75 ± 0.5，右侧无空白 |
| 两列卡片底边 | 同一行内差 ≤ 1px；无跨行拉伸空档 |
| 390px 视口 | 统计条 2×2，`document.scrollWidth ≤ 390`，无横向滚动 |

截图：每批交付「修复前 / 修复后」成对截图（工作台整页 + 产品资料 + 客户资料；审计页在第三批补），文件放 `.screenshots/layout-consistency/`。

验证动作：

1. 前端构建：`docker compose up -d --build frontend`（或 HMR 生效时仅刷新）。
2. 运行既有前端测试：`cd frontend && npm run test -- --run`（以 `package.json` 实际脚本为准）。
3. 运行测量脚本（CDP，headless）输出 `after-*.json`，与诊断阶段 `probe.json` 对照。
4. `git diff` 复核，只含本节列出的文件。

---

## 7. 分批与提交

| 批次 | 内容 | 交付 |
| --- | --- | --- |
| 1 | Token + 样式基座 + 工作台（第 3 节） | 截图 + 实测坐标 |
| 2 | 跨页统一（第 4 节） | 产品/客户截图 + 实测坐标 |
| 3 | 审计页卡片化（第 5 节） | 审计截图 + 实测坐标 |
| 收尾 | `docs/20` 诊断报告 + 实测对比表入库 | 一并提交 |

每批完成后上报，确认无回归再进入下一批。三批均验证通过后，再更新 `docs/20` 的「修复前后坐标对比」章节并提交。

---

## 8. 风险与回滚

- 风险 1：`.metric-strip` 由 flex 改 grid，窄屏换行依赖 `@media(max-width:640px)` 已有 2 列规则，需实测 390px。
- 风险 2：AntD `renderEmpty` 影响全站表格空态；若某页显式传了 `emptyText` 则不受影响，需抽查 3 页。
- 风险 3：删除 `.dashboard-toolbar` 后「新增日程/发布公告」入口移动到卡片标题区，需确认权限为空时按钮不出现。
- 回滚：所有改动集中在 5 个 CSS 文件 + 5 个 TSX 文件，可按批次 `git checkout -- <file>` 单独回退。
