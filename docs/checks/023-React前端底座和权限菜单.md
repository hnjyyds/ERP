# 023 React 前端底座和权限菜单检查记录

## 对照范围

- `docs/03-架构设计.md 前端架构`：前端改为 `React + TypeScript + Vite + Ant Design`。
- `docs/06-React前端迁移和优化计划.md 第一阶段`：登录页、Token 保存、当前用户、权限菜单、主布局、工作桌面和财务角色菜单验证。

## 本次实现范围

- 前端工程从 Vue/Vite 切换为 React/Vite。
- 入口文件改为 `src/main.tsx`，应用根组件改为 `src/App.tsx`。
- 保留现有 `src/api.ts`，继续复用 FastAPI `ApiResponse[T]` 契约。
- 登录页支持用户名、密码、Token 保存和错误提示。
- 主布局支持后端权限菜单、用户信息、退出登录和工作桌面。
- 工作桌面展示公告、待办、未读提醒、今日日程、快捷入口统计，以及待办、消息、日程、公告表格。
- 非首页模块先提供 React 工作台入口，后续按模块逐步迁移完整业务页面。

## 完整性检查

| 要求 | 状态 | 证据 |
| --- | --- | --- |
| React 工程可构建 | 已实现 | `npm run build` |
| 前端技术栈文档改为 React | 已实现 | `README.md`、`docs/03-架构设计.md`、`docs/05-实现步骤.md` |
| 迁移计划单独成文 | 已实现 | `docs/06-React前端迁移和优化计划.md` |
| 登录页可用 | 已实现 | `node scripts/e2e-auth.mjs` 覆盖登录 |
| 权限菜单来自后端 | 已实现 | React 调用 `/api/v1/auth/login` 和 `/api/v1/auth/me` |
| 财务角色菜单隔离 | 已实现 | E2E 验证财务只看到工作桌面、财务管理 |
| 工作桌面可见 | 已实现 | in-app browser 验证 `工作桌面`、待办、提醒、日程、公告 |
| 依赖安全审计 | 已实现 | `npm audit --audit-level=high` 返回 0 漏洞 |

## 自动化验证

- 前端构建：`npm run build`
- 前端依赖审计：`npm audit --audit-level=high`
- 权限菜单 E2E：`node scripts/e2e-auth.mjs`

## 浏览器验证

- 打开 `http://127.0.0.1:5173/`。
- 业务主管登录后可见工作桌面、完整业务菜单、待办、消息提醒、我的日程和公司公告。
- 新 React 页面实际 DOM 中存在 `主导航`、工作桌面标题和四个工作桌面表格区。

## 后续优化

- Ant Design 当前进入主 bundle，后续按模块路由拆包降低首屏 JS 体积。
- 继续按 `docs/06-React前端迁移和优化计划.md` 迁移基础资料模块，并为每个迁移模块保留对应 E2E。
