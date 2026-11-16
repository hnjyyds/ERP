# 规格：UI 一致性收口（日期范围 / 日期面板语言 / 商品弹窗滚动 / 手机删除命中区）

- 来源：用户 2026-11-15 汇总表（一次开发、一次验收）
- 范围：仅共享控件与上述 4 个待修项；已通过项只做回归，不重复改动
- 约束：不改业务数据；不逐页叠加位置补丁；日历浮层向左展开不算缺陷；不提交、不推送

## 现场复测结论（1440 / 1280）

| 项 | 实测 | 结论 |
| --- | --- | --- |
| 审计日志日期范围 | `.ant-picker-range`、两个 `input`、`.ant-picker-separator`、箭头 `path`、`.ant-picker-suffix` 圆心均为 226.65 | 当前构建已对齐；但居中规则只写在 `.audit-page .audit-filters` 下，属页面级补丁，换页面会退回 AntD 默认的 `inline-block + vertical-align: top` |
| 日期面板 | 头部 `2026年Nov`、`2026年Dec`，星期 `Su Mo Tu…` | 确认缺陷：antd locale 已切中文，但 dayjs 语言包未加载，`locale('zh_CN')` 静默回退英文 |
| 商品弹窗滚动 | 需按“编号 → 详情 → 编辑”路径打开，尚未复现测量 | 代码只重置 `<form>`；弹窗的真实滚动容器可能是 `.ant-modal-wrap` 或 `.ant-modal-body` |
| 手机删除按钮 | CSS 在 ≤768px 已声明 44px，但用户复查仍为 36×36 | 需在 390px 实测；若命中区仍偏小，改用“44px 透明命中盒 + 小尺寸圆形视觉” |

## 修改方案

### 1. 日期范围控件居中改为共享规则

文件：`frontend/src/styles/design-system-apply.css`

在 `body .ant-input-affix-wrapper, body .ant-picker { padding-inline: … }`（约 573-576 行）之后新增全局规则：

```css
/* 日期范围控件：开始/结束输入、分隔箭头、日历图标共享同一条水平中线。
   AntD 的分隔符是 inline-block + vertical-align: top 的 16px 盒，
   缺少这组规则时在部分页面会低于两侧文字。 */
body .ant-picker-range {
  display: inline-flex;
  align-items: center;
  padding-block: 0 !important;
}

body .ant-picker-range .ant-picker-input {
  display: flex;
  align-items: center;
  height: 100%;
}

body .ant-picker-range .ant-picker-input > input {
  height: 100%;
  padding-block: 0 !important;
}

body .ant-picker-range .ant-picker-separator,
body .ant-picker-range .ant-picker-suffix,
body .ant-picker-range .ant-picker-clear {
  display: inline-flex;
  align-items: center;
  align-self: center;
  height: auto;
  line-height: 1;
  vertical-align: middle;
}

body .ant-picker-range .ant-picker-separator > svg,
body .ant-picker-range .ant-picker-suffix > svg {
  display: block;
}
```

不改 `.audit-page .audit-filters` 的既有规则（选择器更具体，保留可作为页面例外，不与共享规则冲突）。

### 2. 中文日期面板

文件：`frontend/src/app/App.tsx`

1. 在 antd locale 导入后新增：

```tsx
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
```

2. 在 `const antdLocale = …` 之后同步 dayjs 全局语言（幂等，随语言设置生效）：

```tsx
// rc-picker 的月份缩写与星期名来自 dayjs 语言包；
// 只切 antd locale 会出现“2026年Nov”“Su/Mo”。
dayjs.locale(appSettings.language === 'en-US' ? 'en' : 'zh-cn')
```

不新增 package.json 依赖：dayjs 是 antd 的直接依赖且已提升到 `frontend/node_modules/dayjs`，与现有 `import type { Dayjs }` 同源。

### 3. 商品弹窗滚动复位

文件：`frontend/src/app/pages/masterdata/products/forms/ProductFormModal.tsx`

1. 模块级新增：

```tsx
// 弹窗可能是 form、ant-modal-body 或 ant-modal-wrap 在滚动，
// 三处一起复位，重新打开时编号、名称等首行字段必须可见。
function resetModalScroll(form: HTMLFormElement | null) {
  if (!form) return
  form.scrollTop = 0
  const body = form.closest('.ant-modal-body')
  const wrap = form.closest('.ant-modal-wrap')
  if (body instanceof HTMLElement) body.scrollTop = 0
  if (wrap instanceof HTMLElement) wrap.scrollTop = 0
}
```

2. 把现有 `useEffect(..., [mode])` 改为“同步复位 + 下一帧再复位”，覆盖 AntD 打开动画后的焦点滚动：

```tsx
useEffect(() => {
  if (!mode) return
  resetModalScroll(formRef.current)
  const frame = requestAnimationFrame(() => resetModalScroll(formRef.current))
  return () => cancelAnimationFrame(frame)
}, [mode])
```

3. `afterOpenChange` 的 `open` 分支改为 `requestAnimationFrame(() => resetModalScroll(formRef.current))`，不再只重置 `<form>`。

### 4. 手机图片删除命中区

先决条件：在 390px 实测 `.product-image-delete` 的 `getBoundingClientRect()`。若任一边 < 44，则替换 `design-system-apply.css` 中 ≤768px 的现有 44px 规则（约 926-933 行）为“透明命中盒 + 小圆形视觉”：

```css
/* 手机端删除入口：命中区 44×44，红色圆形视觉保持小尺寸。 */
body .product-image-delete {
  top: -10px;
  right: -10px;
  width: var(--ui-touch-height);
  height: var(--ui-touch-height);
  min-width: var(--ui-touch-height);
  min-height: var(--ui-touch-height) !important;
  border: 0;
  background: transparent;
  box-shadow: none;
}

body .product-image-delete::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: var(--erp-danger);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
}

body .product-image-delete:hover {
  background: transparent;
}

body .product-image-delete:hover::before {
  background: color-mix(in srgb, var(--erp-danger) 82%, #000);
}

body .product-image-delete svg {
  position: relative;
  z-index: 1;
}
```

若实测已 ≥44，仅保留现状并记录证据，不做无意义改动。

## 验收（一次完成）

1. 构建：`docker compose build frontend && docker compose up -d --no-deps frontend`，`curl` 返回 200。
2. 视口 1440、1280、390 各检查：审计日志筛选栏（字段 + 查询/重置同行、换行有序、固定标签、导出在列表标题右侧）、库存盘点筛选栏（控件等高、12px 间距、内部图标与文字同中线、标题/说明/筛选/表格间距）。
3. 控件状态：默认、聚焦、已填写、校验错误、禁用；错误聚焦仍是红框，补填后错误即时消失。
4. 日期：实际选择起止日期后，放大截图核对文字、箭头、日历图标的墨迹中心线一致（±0.5px）；打开面板确认月份为“11月/12月”、星期为“日/一/二…”，切换到英文后恢复 `Nov/Dec`、`Su/Mo`。
5. 长弹窗（1440，390 复测）：编辑 → 滚到底部 → 关闭 → 新增商品，首行“商品编号”可见且 `scrollTop = 0`；编辑 → 关闭 → 再次编辑同理。
6. 商品图片：多选上传、点击替换、逐图删除、保存、刷新后顺序与主图不变；失败保留原图并就地提示；390px 下删除按钮命中区 ≥44×44，图标保持小尺寸。
7. 回归：税率/退税率无框套框、相邻等宽；图片统计“有图商品 ×件”和“共×张”不变。
8. 静态检查：`npm run build`（含 tsc）通过；`git diff` 只包含本规格列出的文件；`docs/checks/*` 截图不进入提交。
