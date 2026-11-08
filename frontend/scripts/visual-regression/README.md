# 视觉回归脚本

对一组固定页面做「截图 + 计算样式」快照，用改动前后两份快照做逐元素样式比对和像素差比对。用于样式层叠、design token、分片拆分这类容易造成全局视觉退化的改动。

不接 CI：本地手动跑，用来在改样式前后快速确认没有未样式化块、控件错位、间距或颜色变化。

## 前置条件

1. 后端和前端开发服务器已启动（前端必须通过 Vite 代理访问后端，否则登录和接口会失败）：

   ```bash
   # 后端（仓库根目录）
   backend/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8020

   # 前端
   VITE_API_PROXY_TARGET=http://127.0.0.1:8020 ./node_modules/.bin/vite --host 127.0.0.1 --port 5181 --strictPort
   ```

2. 有一个可用的 Chromium 和 `playwright-core`。脚本按以下顺序查找：

   - `PLAYWRIGHT_MODULE` 环境变量指定的模块路径
   - 本地 `playwright-core` / `playwright`
   - `~/.cache/codex-runtimes/*/dependencies/node/node_modules/playwright-core`

   Chromium 查找顺序：`PLAYWRIGHT_CHROMIUM_PATH` → `~/Library/Caches/ms-playwright/chromium-*` → `~/.cache/ms-playwright/chromium-*`。

   如果都没有，执行 `npm i -D playwright-core && npx playwright install chromium`。

3. 数据库里有可展示的数据。详情页场景会用接口取第一条记录 id，取不到时自动跳过并打印 `[skip]`。

## 用法

```bash
# 1. 改动前：在干净的工作区生成基线
npm run visual:baseline

# 2. 改样式

# 3. 改动后：生成当前快照并与基线比对
npm run visual:regress
```

`npm run visual:regress` = `capture`（写入 `.visual-regression/current`）+ `compare`（基线 vs 当前）。

只跑部分场景：

```bash
node scripts/visual-regression/run.mjs capture --out .visual-regression/current --only finance-tax,sales-shipments
```

### 参数

`capture`

| 参数                    | 默认值                       | 说明                                               |
| ----------------------- | ---------------------------- | -------------------------------------------------- |
| `--out`                 | `.visual-regression/current` | 快照输出目录                                       |
| `--base-url`            | `http://127.0.0.1:5181`      | 前端地址，也可用 `VISUAL_BASE_URL`                 |
| `--api-base`            | `/api/v1`                    | 接口前缀，登录与取详情 id 用                       |
| `--user` / `--password` | `admin` / `admin123`         | 登录账号，也可用 `VISUAL_USER` / `VISUAL_PASSWORD` |
| `--only`                | 全部                         | 逗号分隔的场景名                                   |

`compare`

| 参数                | 默认值                        | 说明                                       |
| ------------------- | ----------------------------- | ------------------------------------------ |
| `--baseline`        | `.visual-regression/baseline` | 基线目录                                   |
| `--current`         | `.visual-regression/current`  | 当前目录                                   |
| `--max-pixel-ratio` | `0`                           | 允许的像素差比例，`0` 表示一个像素都不允许 |
| `--diff-dir`        | `.visual-regression/diff`     | 放红色像素差图                             |
| `--only`            | 全部                          | 逗号分隔的场景名，只比对指定场景           |

## 覆盖的场景

见 [scenarios.mjs](./scenarios.mjs)，共 28 个（3 个详情页依赖数据）：

- 登录页（不注入 token）
- 工作台、财务首页 / 收款 / 税务 / 报表（财务分片最多）
- 表格密集列表：商品、入库单、采购合同/询价/跟单/发票通知、打样申请/记录/发货、质量检验、入库计划、出库计划/出库单、报价、发货、出口合同
- 带弹窗表单：入库单「生成/审批入库单」弹窗
- 详情页：商品、出口合同、入库单
- 窄窗口：420px 入库单列表、768px 财务收款

每个场景采集：

- 整页截图（`<场景>.png`）
- 每个可见元素的 24 项计算样式 + `getBoundingClientRect`（`<场景>.json`）
- body 字体/背景、页面标题、样式表清单、页面运行错误

## 比对规则

`compare` 对每个场景输出：元素键差异、计算样式差异（按属性分组，列出前 3 条）、像素差比例与差异 bbox。

以下任一情况视为失败，退出码为 `1`：

- 基线缺少当前快照里的场景
- 元素键集合不一致（新增/删除了可见元素）
- 任一元素的计算样式或矩形发生变化
- 截图尺寸不一致
- 像素差比例超过 `--max-pixel-ratio`（默认 0）

差异图写到 `.visual-regression/diff/<场景>-diff.png`（红色为变化像素）。

## 注意

- `.visual-regression/` 已在 `.gitignore` 中，快照不入库；基线只对应当前机器、当前数据库数据。
- 时间、随机数、动画会干扰截图；脚本已禁用动画与过渡，并固定 locale/时区/设备像素比。如果页面本身展示「今天」，跨天跑基线会自然产生像素差，需要重新生成基线。
- 只覆盖上面列出的场景；新增页面或新增弹窗时，在 `scenarios.mjs` 里补一条。
