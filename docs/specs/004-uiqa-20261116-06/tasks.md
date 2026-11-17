# UIQA-20261116-06 四项缺陷修复 · 任务清单

- 关联方案：`docs/specs/004-uiqa-20261116-06/spec.md`
- 规则：每项独立提交并推送 `origin/main`；每项完成后更新对应 QA 缺陷单。

## T1 Q06-01 商品清空筛选

- [x] T1.1 `useProductsPage.ts`：`submitSearch` 调用 `loadProducts(undefined, 1, undefined, query)` 显式传关键字
- [x] T1.2 前端测试覆盖“无匹配 → 清空 → 恢复”
- [x] T1.3 8080 三档浏览器复验并截图
- [x] T1.4 更新 `Q06-01.md`（根因/修复/复验/提交号）
- [x] T1.5 提交推送

## T2 Q06-02 发票登记关联选择

- [x] T2.1 `RemoteSelect.tsx`：`onChange` 透传选中选项
- [x] T2.2 `entityOptions.ts`：新增开票通知、采购合同选项加载器
- [x] T2.3 `PaymentsView.tsx`：供应商/开票通知/采购合同改为选择并回填 id+编号/名称
- [x] T2.4 `zh-CN.json`、`en-US.json`：字段标签改为业务名称
- [x] T2.5 浏览器验证选择 A→B→清空→取消重开（不提交）
- [x] T2.6 更新 `Q06-02.md`
- [x] T2.7 提交推送
- [x] T2.8 补测发现业务编号未回填，修复 `RemoteSelect` 选项回调并三档复验（`2e2370e`）

## T3 Q06-04 状态标签对比度

- [x] T3.1 `design-system-apply.css`：`.ant-tag-success` / `.ant-tag-green` 前景改 `#17603C`
- [x] T3.2 复测商品“启用”、付款“已付清”对比度 ≥4.5:1
- [x] T3.3 抽查其它绿色标签未回归
- [x] T3.4 更新 `Q06-04.md`
- [x] T3.5 提交推送

## T4 Q06-05 出货合同编号筛选

- [x] T4.1 `api/export.ts` `listShipments`：改传 `contract_no`
- [x] T4.2 `useShipmentsList.ts`：改传 `contract_no`
- [x] T4.3 后端 `shipments.py`：新增 `contract_no` 查询参数
- [x] T4.4 后端 `services.py`：透传 `contract_no`
- [x] T4.5 后端 `repositories.py`：按 `ShipmentLine.contract_no` 包含匹配
- [x] T4.6 后端测试：命中/未命中/旧 `contract_id`
- [x] T4.7 8080 三档浏览器复验 EC-F8D7RX → SP-DAEPEG
- [x] T4.8 更新 `Q06-05.md`
- [x] T4.9 提交推送

## T5 门禁与收口

- [x] T5.1 前端 typecheck / lint / test / build
- [x] T5.2 后端相关 pytest
- [x] T5.3 部署 8080 并确认资源哈希变化
- [x] T5.4 更新 `docs/uiqa/UIQA-20261116-06/README.md` 结论
