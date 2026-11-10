# 验收清单 · 报价 → 样品 → 出口合同链路

## A. 迁移与后端

- [x] `sample_requests` 具备 `quotation_id` + `quotation_no` 快照（模型、schema、仓储、响应）
- [x] `sample_deliveries` 字段统一为 `quotation_id/quotation_no`，迁移 0015 在 SQLite 与 PostgreSQL 均可升降级
- [x] 回填脚本支持 `--dry-run/--apply/--report`，dry-run 不写库，报告为空说明无历史脏文本
- [x] `create_request` 接入 `MasterDataValidator`；关联报价客户不一致返回 422
- [x] `POST /sales/quotations/{id}/sample-requests` 可从报价直接发起打样
- [x] `GET /sales/quotations/{id}/sample-requests` 返回打样单及最新进度、来源样品登记
- [x] 打样转换样品登记保留一次性语义，重复转换返回 409，`source_note` 记录来源报价号
- [x] 寄样明细必须引用存在的样品登记；跨客户引用被拒；标识字段由服务端派生
- [x] 寄样单保存真实 `quotation_id`；报价详情寄样按 ID 查询，不再按「同客户 + 首个产品」反查
- [x] 报价生成合同具备前置防重 + CAS，重复生成返回 409
- [x] 合同付款条件按 D2 从客户信用档案带出，运费按 D1 不带入
- [x] 打样费用转付款申请为 CAS 幂等，重复发起返回 409
- [x] 新增文案均有中英文映射（静态 + 动态模板）
- [x] 后端单文件均 ≤700 行，`test_backend_file_boundaries` 通过
- [x] 后端测试全绿（571 passed）

## B. 前端

- [x] 样品三页的客户/产品/供应商改为服务端搜索下拉（`RemoteSelect`）
- [x] 打样页支持关联报价、按报价筛选、详情展示报价与来源
- [x] 样品登记页表单抽为 `SampleRecordFormModal`，来源可追溯
- [x] 寄样页明细改为选择样品登记记录，自动填充标识与产品，移除手填样品标识
- [x] 报价详情新增打样区块与「从该报价发起打样」，寄样关联按 ID
- [x] 新增文案均走 `zh-CN.json` / `en-US.json`，两语言键完全对齐
- [x] `npm run typecheck`、`npm run lint` 无错误
- [x] `npx vitest run --maxWorkers=2` 全绿（47 文件 / 383 用例）

## C. 遗留（待用户确认）

- [ ] 回填脚本正式执行（`--apply`）需用户确认 CSV 后运行
- [ ] 未建 `uq_sample_records_source` 唯一索引：既有导入测试允许同一来源多条记录，重复转换仍由应用层守卫
