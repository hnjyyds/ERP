# UIQA-20261117-05 剩余 6 项任务清单

## 阶段 0：Q05-22 收尾（不改代码）

- [x] T01 新增 `q05-22-reverify-20261118.json`（finance_manager→财务、purchase→采购专员、再次 finance_manager→财务，无保存）
- [x] T02 `Q05-22.md` 追加“关闭复验（原失败路径）”
- [x] T03 台账先落补测前口径 22/1/6，再落补测后 23/0/6
- [x] T04 `run-state.json` open_defects 保持 6 项，pending 注明 Q05-22 已复验

## 阶段 1：Q05-03 对比度

- [x] T05 `design-system.css`：`--ui-text-muted` → `#68707d`
- [x] T06 `navigation-settings.css`：导航分组/设置分组文字与图标 → `var(--ui-text-secondary)`
- [x] T07 `organization.css`：`.organization-company-field span` → `var(--ui-text-secondary)`
- [x] T08 `organization-members.css`：权限说明 `p` 与“配置角色”标签 → `var(--ui-text-secondary)`
- [x] T09 三档测量导航展开、公司信息编辑、权限窗口，全部 ≥4.5:1

## 阶段 2：Q05-09 / Q05-12 点击区域

- [x] T10 `design-system-apply.css` 手机块：`.ant-dropdown-menu-item` min-height 44px
- [x] T11 `design-system-apply.css` 手机块：联系人主要标记外层 label min-height 44px
- [x] T12 四页列设置菜单 390 实测 ≥44×44
- [x] T13 供应商/客户/伙伴联系人 390 实测外层 label ≥44px，功能不受影响

## 阶段 3：Q05-06 空态

- [x] T14 `ReportingPage.tsx`：默认审批状态计入 filtered；新增 `clearApprovalFilters`
- [x] T15 `ReportsView.tsx`：水单使用明细接入 `ListEmptyState` + 日期清空
- [x] T16 `ReportingPage.test.tsx` 增加筛选空态与清空恢复用例
- [x] T17 桌面/手机实测两种空态文案与恢复入口

## 阶段 4：Q05-07 图片文件名

- [x] T18 后端新增 `products.image_names` 与迁移 `0021`
- [x] T19 后端 schema/repository/service 透传与长度对齐
- [x] T20 前端表单状态、上传/替换/移除同步文件名
- [x] T21 详情与表单显示文件名，多图 alt 区分序号与名称
- [x] T22 保存→刷新→详情复验文件名仍可辨识
- [x] T23 后端 + 前端图片文件名测试

## 阶段 5：Q05-14 枚举中文化

- [x] T24 往来资料来源类型中文映射
- [x] T25 后端费用摘要 fee_type 中文映射
- [x] T26 寄样候选说明 `sampleRecordTypeLabel`
- [x] T27 财务报表 status/fee_type 前端映射
- [x] T28 权限 `warehouse:stocktake` 并入质量仓储组并显示“库存盘点”
- [x] T29 四处文案三档复验

## 阶段 6：测试与收尾

- [x] T30 后端测试：partners country、products status、audit 时区、image_names
- [x] T31 前端全量测试、tsc、eslint
- [x] T32 构建部署并记录新 bundle
- [x] T33 更新 6 份缺陷文档、ledger、run-state、deployment、README、验收矩阵
- [x] T34 提交并推送代码；台账按既有做法处理
