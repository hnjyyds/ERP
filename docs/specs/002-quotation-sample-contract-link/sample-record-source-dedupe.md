# 样品登记来源防重：为什么停在应用层

> 关联：`spec.md` 第 5 节、`tasks.md` A2；结论为「不加数据库唯一约束」。

## 结论

「打样单 → 样品登记」只允许转换一次，当前由**应用层查询**保证：

- 服务层 `create_sample_record_from_request` 先查 `get_record_by_source(source_type="sample_request", source_id=<打样单 ID>)`，命中即抛 `SampleRecordAlreadyCreatedError`（409）。
- 数据库**没有** `uq_sample_records_source` 唯一索引，模型也没有对应约束。

## 为什么不加数据库唯一约束

`sample_records` 的来源字段不是「一对一」语义，而是「来源批次」语义：

- 批量导入路径 `POST /sample/records/import` 允许一批记录共用同一个 `source_type/source_id`（同一采购合同/同一来源批次导入多条样品）。
- 既有用例 `backend/tests/api/test_sample_records.py::test_sample_record_import_export_and_followup_sync` 就是用同一份 `source_id="sr-001"` 导入两条记录，并断言 `created_count == 2`。
- 加唯一索引会让这条既有用例直接失败，也会让「同批次导入多条」这一正常业务路径不可用，属于口径冲突而不是测试写错。

因此本链路只对**转换入口**做一次性约束，保留导入路径的多条语义。

## 并发窗口的实际范围

窗口位于 `create_sample_record_from_request` 的「查询 → 提交」之间：

1. 请求 A、B 同时进入：两者 `get_record_by_source` 都查不到记录；
2. 各自生成新的样品编号并写入 `sample_records`；
3. 各自写一条 `received` 库存事件。

窗口长度是一次查询加一次事务提交（毫秒级）。触发条件很窄：同一张已完成的打样单被并发触发转换（双击、两个标签页、脚本重放）。前端转换按钮已有 loading 态，正常操作几乎不会命中。

命中的后果：

- 出现两条 `source_type/source_id` 相同的样品登记，`source_code` 相同、`code` 不同；
- 两条各自带一条 `received` 库存事件，导致该来源的留样量被重复计入，后续寄样可能超发；
- 不会破坏单号唯一性，也不会写坏其他表。

失败方不存在部分写入：转换在 `UnitOfWork` 内完成，异常整体回滚。

## 如果将来要升级为数据库唯一约束

需要同时改三处，缺一不可：

1. 迁移新增**部分**唯一索引（`source_id` 为空的记录不参与）：
   `CREATE UNIQUE INDEX uq_sample_records_source ON sample_records (source_type, source_id) WHERE source_id IS NOT NULL`。
2. 模型 `backend/app/modules/sample/records/models.py` 增加对应的 `__table_args__`，保证建表与迁移一致。
3. 改既有用例语义：`backend/tests/api/test_sample_records.py` 的 `_sample_record_payload`（默认 `source_id="sr-001"`）与 `test_sample_record_import_export_and_followup_sync` 中同批两条记录，需要改成不同 `source_id` 或显式留空来源，否则导入会失败。

另外，导入路径 `import_records` 目前没有捕获 `IntegrityError`，加约束后若用户导入重复来源应捕获并返回 409（或按行跳过），否则会变成 500。

## 当前兜底

`create_sample_record_from_request` 已保留 `except IntegrityError → SampleRecordAlreadyCreatedError`，用于将来加约束后的并发兜底；在当前无约束的情况下该分支不会触发，409 完全由应用层查询产生。
