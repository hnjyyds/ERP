# 任务：UI 一致性收口

- [x] T1 共享日期范围居中：`frontend/src/styles/design-system-apply.css` 新增全局 `.ant-picker-range` / `.ant-picker-separator` 居中规则
- [x] T2 中文日期面板：`frontend/src/app/App.tsx` 引入 `dayjs` 与 `dayjs/locale/zh-cn`，按语言同步 `dayjs.locale`
- [x] T3 商品弹窗滚动复位：`ProductFormModal.tsx` 的 `resetModalScroll` 覆盖 form / modal-body / modal-wrap，`mode` 变化与 `afterOpenChange` 各复位一次
- [x] T4 手机删除命中区：390px 实测改为 44×44 透明方形命中盒 + `::before` 小圆形视觉，四角均可命中
- [x] T5 构建与回归：`docker compose build frontend` → 1440/1280/390 截图，覆盖日期选择/面板语言/弹窗滚动/多图操作/控件五态/审计与库存筛选栏
- [x] T6 静态检查与交付说明：前端 build 通过、diff 仅含上述文件、截图目录不入库
