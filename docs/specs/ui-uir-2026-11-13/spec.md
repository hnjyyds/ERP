# 规格：修复 docs/26 确认的 8 类 UI 可达性与响应式缺陷（UIR-01~08）

- 来源：[docs/26-完整UI可达性与响应式复审.md](../../26-完整UI可达性与响应式复审.md)、[docs/27-完整UI逐页复审矩阵.md](../../27-完整UI逐页复审矩阵.md)
- 基线：`533c2f0`（工作台滚动修复已提交）
- 约束：不修改业务数据；不删除 QA261112 测试数据；不用 `body overflow:hidden` 掩盖溢出；表格允许局部横向滚动；不做全站无障碍认证。

## 已复测确认的现场数据（390×844，移动端模拟）

| 对象 | 实测 | 直接原因 |
| --- | --- | --- |
| 商品列表 `document.scrollWidth` | 1014px | 见下 |
| `.inline-filters.product-list-filters` 计算列 | 单列 384.09px，容器仅 328px | 操作组最小内容宽度撑破 `1fr` 轨道 |
| 导入 / 导出按钮 | 各 384.09px | `responsive-cascade.css:364-368` 在 ≤640px 给 `.toolbar-heading .ant-btn` 设 `width:100%`；叠加 `design-system-apply.css:885-888` 的 `flex-wrap:nowrap` |
| 商品新增弹窗 `.entity-modal-grid` | 三列各 76.66px | `masterdata-pages.css:185-190` 的 ≤760px 单列规则被同文件 247-255 行同优先级的三列规则覆盖 |

## 修改方案（逐项）

### UIR-02 手机表单单列（先做）

1. `frontend/src/styles/masterdata-pages.css`
   - 删除 185-190 行的 `@media (max-width:760px)` 块。
   - 在 `.entity-modal-grid`（247 行）与 `.entity-modal-grid.two`（253 行）定义之后新增同名断点块：
     ```css
     @media (max-width: 760px) {
       .entity-modal-grid,
       .entity-modal-grid.two {
         grid-template-columns: minmax(0, 1fr);
       }
     }
     ```
   - 只改列定义，不动 `gap`、`entity-modal-span`、`entity-modal-section`。
2. `frontend/src/styles/shared-primitives.css`
   - 在 `.contract-modal-form .form-row` 三列规则（548 行）之后新增：
     ```css
     @media (max-width: 760px) {
       .contract-modal-form .form-row {
         grid-template-columns: minmax(0, 1fr);
       }
     }
     ```
   - `.purchase-contract-modal .contract-modal-form .form-row`（ux-pass.css:363）只改 gap，不重设列，不冲突。
3. `frontend/src/styles/sample-pages.css`
   - 在 `.sample-modal-form`（256 行）与 `.form-pair`（275 行）之后新增：
     ```css
     @media (max-width: 760px) {
       .sample-modal-form {
         grid-template-columns: minmax(0, 1fr);
       }
     }
     ```
   - `.form-pair { display: contents }` 保持不变；单列下其子项自然各占一行。

验收：商品、供应商、客户、合作伙伴、单证、出口合同、采购合同、采购生成、样品登记/打样/寄样共 11 类弹窗，390px 下每个字段宽度 ≥ 220px（单列）。

### UIR-01 商品工具条不再撑宽整页

`frontend/src/styles/design-system-apply.css` 的 `@media (max-width:768px)` 块（804-938 行）内：

- 将 885-888 行改为：
  ```css
  body .product-page .product-filter-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
    width: 100%;
    min-width: 0;
  }
  ```
- 新增（紧随其后）：
  ```css
  body .product-page .product-filter-actions > .ant-btn {
    width: auto;
    min-width: 0;
    flex: 0 0 auto;
  }
  ```
  该选择器特异度 (0,3,1) 高于 `responsive-cascade.css` 的 `body .toolbar-heading .ant-btn` (0,2,1)，无需 `!important`。
- 保留 890-893 行主按钮规则，不重复。

验收：390px 下商品页 `document.scrollWidth == innerWidth`；导入/导出按钮宽度为内容宽度（约 70-80px）；商品表格仍在局部容器内横向滚动。

### UIR-03 金额不在小数中间断行

`frontend/src/styles/finance-reporting.css` 283-286 行：

```css
.compact-table th,
.compact-table td {
  overflow-wrap: break-word;
}
```

仅把 `anywhere` 改为 `break-word`：正常中文仍可换行，长串在放不下时才断；`250.00` 这类本可独占一行的数字不再从最后一位前断开。不使用 `nowrap`。

验收：采购合同详情“进度概览”在 390px 下为 `RMB` / `250.00` 或整段；不出现 `250.0` + `0`。

### UIR-04 “今日日程”按 Asia/Shanghai 当日统计

`backend/app/modules/system/dashboard/services.py`

- 增加 `from zoneinfo import ZoneInfo`。
- 新增模块级常量与函数（放在 `_to_utc_naive` 附近）：
  ```python
  _DASHBOARD_TIME_ZONE = ZoneInfo("Asia/Shanghai")

  def _today_utc_range() -> tuple[datetime, datetime]:
      """返回当前本地自然日的 [起, 止) UTC 时刻。"""
      local_now = datetime.now(_DASHBOARD_TIME_ZONE)
      start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
      return start.astimezone(UTC), (start + timedelta(days=1)).astimezone(UTC)

  def _overlaps_range(starts_at: datetime, ends_at: datetime, start: datetime, end: datetime) -> bool:
      return _as_utc(starts_at) < end and _as_utc(max(ends_at, starts_at)) >= start
  ```
  需同时 `from datetime import timedelta`。
- `get_dashboard` 中把 `today_schedule_count=len(schedule_events)` 改为：
  ```python
  today_start, today_end = _today_utc_range()
  today_schedule_count=sum(
      1 for row in schedule_events
      if _overlaps_range(row.starts_at, row.ends_at, today_start, today_end)
  )
  ```
- `schedule_events` 列表本身不改（“我的日程”仍展示全部日程），只修正计数口径。
- 边界：跨日事件（昨天开始、今天结束）计入今天；今天已结束但仍在今天的计入。

测试：`backend/tests/services/test_dashboard_service.py` 扩展
- 用 `DashboardRepository.create_schedule_event` 为同一用户写两条：昨天 19:00、今天 12:00（Asia/Shanghai），调用 `get_dashboard` 断言 `summary.today_schedule_count == 1`，且 `len(schedule_events) == 3`（含 seed 的 1 条历史日程）。
- 断言昨天事件仍在 `schedule_events` 中。

### UIR-05 `success` 状态中文化 + 兜底

1. `frontend/src/locales/zh-CN.json` 的 `common.severity` 增加：
   ```json
   "success": "已通过",
   "unknown": "其他"
   ```
2. `frontend/src/locales/en-US.json` 的 `common.severity` 增加：
   ```json
   "success": "Approved",
   "unknown": "Other"
   ```
3. `frontend/src/app/pages/helpers/statusTags.tsx` 的 `severityTag`：
   - `labelKeys` 增加 `success: 'common.severity.success'`。
   - 兜底改为 `translate(..., 'common.severity.unknown')`，不再回显原始状态码。
   - `color`：`success` → `green`；未知值保持 `blue`。
4. 不修改 `statusTag`（其值域为工作流状态，未在本次证据中泄漏）。

测试：`frontend/src/app/pages/__tests__/appHelpers.test.tsx` 的 `severityTag` 组增加两条：`success` → `已通过`；`mystery` → `其他`。

### UIR-06 搜索提示对比度

`frontend/src/styles/antd-and-login.css` 134-139 行：

```css
.ant-input::placeholder,
.ant-input-number::placeholder,
.ant-select-selection-placeholder {
  font-size: 13px;
  color: #6B7280;
}

.ant-input:disabled::placeholder,
.ant-input[disabled]::placeholder,
.ant-select-disabled .ant-select-selection-placeholder,
.ant-input-number-disabled .ant-input-number-input::placeholder {
  color: #A6ADBB;
}
```

移除原 `!important`，避免覆盖禁用态；正常提示 `#6B7280` 对白底约 4.8:1。

验收：商品搜索框 placeholder 计算色为 `rgb(107,114,128)`；禁用输入仍为浅色。

### UIR-07 手机通知浮层不越界

`frontend/src/styles/base-shell.css` 末尾新增：

```css
@media (max-width: 640px) {
  .ant-popover:has(.topbar-notification-panel) {
    right: auto !important;
    left: 12px !important;
    max-width: calc(100vw - 24px);
  }

  .ant-popover:has(.topbar-notification-panel) .ant-popover-arrow {
    display: none;
  }

  .topbar-notification-panel {
    width: min(320px, calc(100vw - 48px));
  }
}
```

理由：浮层原按触发器右缘对齐，宽 344px 时左缘落到 -12px；改为贴视口左安全边距并限宽，正文面板同步收窄。桌面端不变。

验收：390px 下打开通知，浮层左边界 ≥ 12px、右边界 ≤ 378px，列表可滚动。

### UIR-08 手机触摸目标 44px

`frontend/src/styles/design-system-apply.css` 的 `@media (max-width:768px)` 块内新增：

```css
body .toolbar-icon-button.ant-btn {
  width: var(--ui-touch-height);
  min-width: var(--ui-touch-height);
  height: var(--ui-touch-height);
}

body .nav-link,
body .nav-dashboard,
body .nav-group-items .nav-link,
body .nav-group-summary,
body .settings-summary {
  min-height: var(--ui-touch-height);
}
```

覆盖同文件 381-386 的 36px 规则与 126-131 的 38px 规则；导航项本身 `display:flex; align-items:center`，加高即可，不改行高。

验收：390px 商品工具图标按钮 44×44；展开导航后最后一项“开票通知”高度 ≥ 44px。

## 验证步骤

1. `cd frontend && npx tsc --noEmit && npm run lint && npm run test`
2. `backend/.venv/bin/python -m pytest backend/tests`
3. `docker compose up -d --build frontend backend`
4. 浏览器（ego-browser，CDP 390×844 / 1280×720 / 1440×900）逐项实测：
   - 商品页 `scrollWidth == innerWidth`、按钮尺寸、缺口
   - 11 类弹窗单列字段宽度
   - 采购合同详情“进度概览”金额不拆小数
   - 工作台“今日日程”数量与当天事件一致
   - 通知浮层边界、`success` 显示“已通过”
   - 搜索 placeholder 计算色
   - 图标按钮与导航末项 44px
5. 回归：1280/1440 下商品工具条、各弹窗仍为原多列布局；工作台可滚动到公告。
6. 更新 docs/26 八个条目状态为“已完成”并附实测值。

## 非目标

- 不改业务数据、不新增业务功能、不调整权限。
- 不处理 OBS-01（键盘 Tab 焦点）与浏览器插件浮标。
- 不做全站 200% 缩放与全角色覆盖。
