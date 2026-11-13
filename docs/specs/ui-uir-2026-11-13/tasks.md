# 任务：UIR-01~08 修复

- [x] UIR-02 手机单列表单：`styles/masterdata-pages.css`、`styles/shared-primitives.css`、`styles/sample-pages.css` 在 760px 以下统一 `minmax(0,1fr)`；六类弹窗实测字段 270px。
- [x] UIR-01 商品工具条换行：`styles/design-system-apply.css` 小屏 `flex-wrap: wrap` + 按钮 `width:auto`；390px 下 `scrollWidth == innerWidth == 390`。
- [x] UIR-03 金额断行：`styles/finance-reporting.css` 由 `overflow-wrap:anywhere` 改 `break-word`，手机端收窄内边距/字号；`250.00` 整段换行。
- [x] UIR-04 今日日程口径：`backend/app/modules/system/dashboard/services.py` 按 Asia/Shanghai 自然日、跨日事件按区间重叠统计；工作台由 2 修正为 1。
- [x] UIR-04 回归测试：`backend/tests/services/test_dashboard_service.py` 覆盖昨天/跨日/今天/明天；`backend/tests/api/test_dashboard.py` 两处旧口径同步更新。
- [x] UIR-05 状态中文化：`locales/zh-CN.json`、`locales/en-US.json`、`app/pages/helpers/statusTags.tsx`；`success`→“已通过”，未知值→“其他”/“Other”。
- [x] UIR-05 回归测试：`app/pages/__tests__/appHelpers.test.tsx` 新增 success 与未知值用例。
- [x] UIR-06 placeholder 对比度：`styles/antd-and-login.css` 正常提示 `#6B7280`（实测 `rgb(107,114,128)`），禁用态 `#A6ADBB`。
- [x] UIR-07 通知浮层边界：`styles/base-shell.css` ≤640px 贴左 12px、总宽 344px；实测 left 12 / right 356。
- [x] UIR-08 触摸目标：`styles/design-system-apply.css` 图标按钮 44×44、导航项最小 44px；实测图标按钮 50×44、导航末项 44px。
- [x] 全量校验：`tsc` 通过、`lint` 通过、`vitest` 49 文件/398 用例通过、`pytest` 611 项通过。
- [x] 容器重建与浏览器实测：390/1280/1440 三档逐项通过，桌面多列布局与浮层定位无回归。
- [x] 文档收尾：`docs/26-完整UI可达性与响应式复审.md` 八项标注“已完成”并附实测值。

## 风险控制

- 只改响应式断点与状态映射，业务逻辑仅调整“今日日程”计数口径。
- 桌面端新增规则全部包在 `@media (max-width: 760px/768px/640px)` 内。
- 商品操作组使用更高特异度替代 `!important`。
- 不改 `statusTag`、不改通知列表数据来源。
