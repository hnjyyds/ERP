import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const {
  chromium,
} = require('/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:8080/'
const runId = Date.now().toString()
const purchaseContractNo = `PC-DASHBOARD-${runId}`
const qualityCode = `QC-DASHBOARD-${runId}`
const artifactRoot = resolve('artifacts/dashboard-business-tasks')
const approvalScreenshot = resolve(artifactRoot, 'assigned-approval-on-dashboard.png')
const dashboardScreenshot = resolve(artifactRoot, 'qc-task-on-dashboard.png')
const taskScreenshot = resolve(artifactRoot, 'qc-task-opened.png')

await mkdir(artifactRoot, { recursive: true })

const browser = await chromium.launch({
  channel: 'chrome',
  headless: false,
  args: [
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=CalculateNativeWinOcclusion',
  ],
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
})
const page = await context.newPage()
const consoleErrors = []
const requestFailures = []
const serverErrors = []

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => consoleErrors.push(error.message))
page.on('requestfailed', (request) => {
  requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`)
})
page.on('response', (response) => {
  if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`)
})

async function login(username, password) {
  await page.goto(new URL('/login', frontendUrl).toString(), {
    waitUntil: 'domcontentloaded',
  })
  await page.getByRole('heading', { name: '登陆' }).waitFor()
  await page.getByLabel('用户名').fill(username)
  await page.getByLabel('密码').fill(password)
  const [, dashboardResponse] = await Promise.all([
    page.waitForResponse(
      (response) => response.url().endsWith('/api/v1/auth/login') && response.ok(),
    ),
    page.waitForResponse(
      (response) => response.url().endsWith('/api/v1/dashboard') && response.ok(),
    ),
    page.getByRole('button', { name: '登录' }).click(),
  ])
  await page.waitForURL((url) => url.pathname !== '/login')
  return dashboardResponse.json()
}

async function api(path, { method = 'GET', body } = {}) {
  return page.evaluate(
    async ({ path, method, body }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const response = await fetch(path, {
        method,
        headers: {
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(`${method} ${path} -> ${response.status}: ${JSON.stringify(payload)}`)
      }
      return payload?.data
    },
    { path, method, body },
  )
}

try {
  await page.goto(frontendUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => window.localStorage.clear())
  await login('demo', 'demo123')

  const contract = await api('/api/v1/purchase/contracts', {
    method: 'POST',
    body: {
      code: purchaseContractNo,
      contract_date: '2026-08-04',
      supplier_id: 'supplier-pack-a',
      supplier_name: '华东包装制品厂',
      buyer_user_id: 'u-001',
      buyer_user_name: '演示业务主管',
      qc_user_id: 'u-qc',
      qc_user_name: '演示 QC 专员',
      currency: 'USD',
      delivery_date: '2026-08-30',
      payment_terms: '30% 预付，70% 出货前',
      source_type: 'stock_purchase',
      remarks: '首页业务待办关联验证',
      lines: [
        {
          product_id: 'product-bag',
          product_code: 'BAG-40',
          product_name: 'Eco Shopping Bag',
          specification: '40x35cm',
          model: 'BAG-40',
          quantity: '1000',
          unit: 'pcs',
          unit_price: '1.20',
          source_export_contract_id: null,
          source_export_contract_no: null,
          source_export_contract_line_id: null,
          remark: '首页业务待办关联验证',
        },
      ],
    },
  })
  await api(`/api/v1/purchase/contracts/${contract.id}/submit`, {
    method: 'POST',
    body: { reviewer_id: 'u-admin' },
  })

  await page.evaluate(() => window.localStorage.clear())
  const approvalDashboard = await login('admin', 'admin123')
  const approvalTask = approvalDashboard.data.todos.find(
    (todo) =>
      todo.source_type === 'purchase_contract_approval' && todo.title.includes(purchaseContractNo),
  )
  assert.ok(approvalTask, 'designated reviewer should receive the purchase approval task')
  await page.screenshot({
    path: approvalScreenshot,
    animations: 'disabled',
    fullPage: false,
    timeout: 60000,
  })

  await api(`/api/v1/purchase/contracts/${contract.id}/approve`, {
    method: 'POST',
    body: { approved_at: '2026-08-04' },
  })

  const createdTask = await api('/api/v1/quality/inspections', {
    method: 'POST',
    body: {
      code: qualityCode,
      purchase_contract_id: contract.id,
      status: 'pending',
      scheduled_at: '2026-08-05T09:00:00',
      inspected_at: null,
      result: null,
      inspector_id: 'u-qc',
      inspector_name: '演示 QC 专员',
      issue_summary: '首页待办关联和负责人权限验证',
      attachment_group_id: null,
      lines: [],
      issues: [],
    },
  })

  await page.evaluate(() => window.localStorage.clear())
  const dashboardBody = await login('qc', 'qc123')
  const task = dashboardBody.data.todos.find(
    (todo) => todo.source_type === 'quality_inspection' && todo.title.includes(qualityCode),
  )
  assert.ok(task, 'assigned pending QC task should be included in dashboard todos')
  assert.equal(task.owner_user_id, 'u-qc')
  assert.equal(task.status, 'pending')

  const taskCard = page.locator('.dashboard-task').filter({ hasText: qualityCode })
  await taskCard.waitFor()
  await page.screenshot({
    path: dashboardScreenshot,
    animations: 'disabled',
    fullPage: false,
    timeout: 60000,
  })
  await taskCard.getByRole('button', { name: '去处理' }).click()
  await page.waitForURL((url) => url.pathname === '/quality/tasks')
  await page.getByText(qualityCode).first().waitFor()
  await page.screenshot({
    path: taskScreenshot,
    animations: 'disabled',
    fullPage: false,
    timeout: 60000,
  })

  assert.deepEqual(serverErrors, [], 'browser should not encounter 5xx responses')
  assert.deepEqual(requestFailures, [], 'browser should not encounter failed requests')
  assert.deepEqual(consoleErrors, [], 'browser should not encounter console errors')

  console.log(
    JSON.stringify(
      {
        contract: { id: contract.id, code: purchaseContractNo },
        approvalTask: { id: approvalTask.source_id, status: approvalTask.status },
        task: { id: createdTask.id, code: qualityCode, status: task.status },
        screenshots: [approvalScreenshot, dashboardScreenshot, taskScreenshot],
      },
      null,
      2,
    ),
  )
} finally {
  await context.close()
  await browser.close()
}
