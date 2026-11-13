# UI复审证据

本目录记录2026-11-13的UI滚动、裁切、响应式和内容可读性检查，不执行任何业务修复。

- `results.json`：42页×3种视口，126组。
- `modal-guarded-results.json`：33类创建/配置入口×2种视口，66组。
- `detail-results.json`：24类现有详情×2种视口，48组。
- `edit-results.json`：5类可用编辑模式×2种视口，10组；没有改字段或保存。
- `horizontal-results.json`：9个列表、14个可横滚表格。
- `extra-results.json`：全部导航分组和720×450可用区域模拟。
- `target-results.json`：跟单中段按钮、早期键盘观察和全局浮层。
- `keyboard-verified.json`：稳定后的键盘复测；Escape关闭正常，一次BODY焦点仍待确认。
- `notification-bounds.json`：明确核对390px视口且动画结束后的浮层边界。
- `placeholder.json`：非禁用商品搜索框的提示色、背景和不透明度。
- `summary.json`：范围和计数，不把测量成功等同全部UI通过。

`before`与`after`中的滚动位置是实际滚轮操作结果；`primaryHits/hits`表示命中测试，不是点击保存后的业务成功。多步骤表单上部按钮滚出视口不是缺陷，已另行回滚到中段核对。

正式表单测量安装了阻断fetch/XHR写方法与原生表单提交的本地保护，阻断记录为空；没有上传、审批、保存、发布或变更权限。早期把口岸直接提交按钮误列为弹窗入口，空必填字段被校验拦截；该入口随后从弹窗清单移除，正式66组记录不含这一点击。

浏览器翻译插件浮标不属于项目UI；历史QA账务异常不作为本轮新缺陷。完整图包只包含JSON、PNG和文本证据，未打包执行脚本或凭据。

本机完整图包：[ui-review-20261113.zip](/Users/dev/.codex/visualizations/2026/11/12/01a1ce98-f34d-7ed3-9cbd-624b517fc28f/ui-review-20261113.zip)。该绝对路径只适用于本机，仓库内关键截图可独立查看。
