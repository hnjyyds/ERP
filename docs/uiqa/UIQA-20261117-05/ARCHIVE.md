# 验收证据归档说明

本目录是 UIQA-20261117-05 当前版本整体验收的可交接证据包。代码与验收依据进入同一 Git 仓库，避免“代码已推送、复验依据只留在本机未跟踪文件”。

## 固定部署标识

`449aaa0a`，前端入口 `assets/index-Bpsh7zKB.js`，服务地址 `http://127.0.0.1:8080`。页面级结论只对该入口成立；重新构建产生新入口后不得沿用。

## 已纳入版本库

- 台账：`ledger-summary.json`、`run-state.json`、`deployment.json`、`ledger-source.json`、`ledger-integrity-check.json`、五份 CSV 及各版本 `42页48项验收矩阵-index-*.csv`。
- 缺陷文档：`Q05-*.md`、用例与口径说明（`图片写入用例.md`、`付款闭环用例.md`、`台账口径与待测清单.md` 等）。
- 实测证据：本目录根下的 `P*.json` / `P*.txt` / 复验 `*-reverify-*.json`、`downloads/`、`fixtures/`、`ledger-previews/`。
- 截图：仅跟踪台账、缺陷文档、复验记录中实际引用的 PNG（清单由 `.gitignore` 否定项固化）。
- 页面级验收：`page-acceptance/` 下的逐页清单、测量与截图。

## 未纳入版本库

- `screenshots/` 中未被任何台账/文档引用的原始截图（约 1700 张、约 150MB）。它们只用于当时审阅，判定依据均已在被跟踪的 JSON/MD 中记录。
- 构建产物、`node_modules`、临时脚本。

## 已补齐

- `screenshots/q05-14-partner-Bpsh-390.png` 原被 `Q05-14.md` 引用但文件缺失，已在 2026-11-18 整页验收时于 390×844 重新采集（合作伙伴新增表单，类型显示“货代公司”）。当前台账引用的 462 张截图全部存在。

## 复现路径

1. 确认部署入口仍为 `assets/index-Bpsh7zKB.js`（`curl -s http://127.0.0.1:8080/ | grep index-`）。
2. 用被授权的 UIQA 测试账号登录，按 `page-acceptance/PAGE-xx-*.json` 中记录的 URL、视口、操作序列重跑。
3. 截图按记录的文件名追加到 `screenshots/`，并在 `.gitignore` 中加入对应否定项后提交。
