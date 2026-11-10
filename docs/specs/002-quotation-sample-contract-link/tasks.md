# 任务清单 · 报价 → 样品 → 出口合同链路

> 前置：`docs/specs/002-quotation-sample-contract-link/spec.md` 获批，且第 8 节 D1–D10 决策确认。
> 提交策略：A（迁移 + 后端）、B（前端三页 + 报价详情）分两次提交并各自上报。

## A. 迁移与后端

- [x] A1 拆分超 700 行文件
  - [x] `sample/deliveries/services.py` → 抽出 `line_validation.py`、`statistics.py`
  - [x] `sample/deliveries/repositories.py` → 抽出 `quotation_queries.py`
  - [x] `sales/quotations/services.py` → 抽出 `sample_links.py`
  - [x] 验证 `test_backend_file_boundaries` 通过
- [x] A2 新增迁移 `0015_quotation_sample_link.py`
  - [x] `sample_requests` 加 `quotation_id/quotation_no` + 索引
  - [x] `sample_deliveries` 重命名 `quote_*` → `quotation_*`（列 + 索引）
  - [x] `sample_records` 部分唯一索引 `uq_sample_records_source`
  - [x] 兼容 SQLite 测试库（batch_alter_table / dialect 分支）
- [x] A3 回填脚本 `backend/migrations/backfill_sample_links.py`
  - [x] `--dry-run` 输出 CSV 清单（表、ID、编号、原文本、候选数、原因）
  - [x] 精确匹配回填寄样 `quotation_id`、三页客户/产品/供应商 ID
  - [x] 幂等：重复执行不重复写
  - [x] 跑 dry-run，把清单交用户确认后再落库
- [x] A4 打样链路
  - [x] 模型/响应/列表参数加 `quotation_id/quotation_no`
  - [x] `create_request` 接入 `MasterDataValidator` + 报价校验（D6）
  - [x] `GET /sample/requests?quotation_id=`
  - [x] `POST /sales/quotations/{id}/sample-requests`
- [x] A5 打样 → 样品登记
  - [x] 响应返回 `source_*`
  - [x] `IntegrityError` → 409；补 `source_note` 报价号
- [x] A6 样品登记
  - [x] `create_record` 接入 `MasterDataValidator`
  - [x] `source_type/source_id` 成对校验
- [x] A7 寄样链路
  - [x] 模型/接口/仓储字段改名，新增 `list_by_quotation_id`
  - [x] 明细强制样品登记：存在性、同客户、服务端派生标识
  - [x] 报价侧 `sample_links.py`：寄样按 ID、打样按报价 + 进度
  - [x] `GET /sales/quotations/{id}/sample-requests`
- [x] A8 报价 → 出口合同
  - [x] `confirm_contract` 前置防重 + 行级锁 + CAS 写回（D9）
  - [x] 按 D1/D2/D7 补字段
- [x] A9 打样费用转付款幂等（D10）
  - [x] 状态 CAS `not_requested → requesting`，冲突 409
- [x] A10 中英文案新增错误与提示
- [x] A11 后端测试
  - [x] 新增 6 组测试（报价引用/转换幂等/寄样关联/合同幂等/费用幂等/回填脚本）
  - [x] 修正既有寄样 payload 用例
  - [x] `uv run pytest` 全通过 + ruff
- [x] A12 提交 A 并上报

## B. 前端

- [ ] B1 服务端搜索 hooks：报价 / 打样单 / 样品登记
- [ ] B2 打样页：三处 Select 改造、报价列与搜索、表单报价联动、详情展示报价与来源
- [ ] B3 样品登记页：先抽 `views/SampleRecordFormModal.tsx`，再三处 Select 改造 + 来源展示
- [ ] B4 寄样页：报价 Select、明细选样品登记并自动填充/展示留样、移除手填标识
- [ ] B5 报价详情：打样区块 +「从该报价发起打样」+ 寄样按 ID
- [ ] B6 `api/sample.ts`、`api/export.ts` 类型与函数同步
- [ ] B7 中英文案补齐
- [ ] B8 前端测试修正与新增，`--maxWorkers=2` 全绿；tsc + ESLint
- [ ] B9 提交 B 并上报

## C. 收尾

- [ ] C1 回填脚本正式执行（用户确认 CSV 后）
- [ ] C2 汇总遗留项与影响面
