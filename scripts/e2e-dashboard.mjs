import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-dashboard.png')
const scheduleTitle = `端到端日程验证 ${Date.now()}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

try {
  await page.goto(frontendUrl)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('heading', { name: '登录工作台' }).waitFor()
  await page.getByLabel('用户名').fill('demo')
  await page.getByLabel('密码').fill('demo123')

  const loginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  const dashboardResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/dashboard') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await loginResponse
  await dashboardResponse

  await page.getByRole('heading', { name: '待办、提醒和日程' }).waitFor()
  await page.getByText('演示业务主管').waitFor()
  await page.getByText('审批出口合同 YJ-EC-202606-001').waitFor()
  await page.getByText('采购跟单节点临期').waitFor()
  await page.getByText('查看供应商大货样').waitFor()
  assert.ok(
    (await page.getByRole('link', { name: '出口合同' }).count()) >= 1,
    'dashboard should render export contract shortcut or navigation link',
  )
  assert.ok(
    (await page.getByRole('link', { name: '采购跟单' }).count()) >= 1,
    'dashboard should render purchase follow-up shortcut or navigation link',
  )

  const initialScheduleCount = await page.locator('.schedule-row').count()
  assert.ok(initialScheduleCount >= 1, 'dashboard should render existing schedule events')

  await page.getByLabel('标题').fill(scheduleTitle)
  await page.getByLabel('说明').fill('通过浏览器新增并回显')
  await page.getByLabel('开始').fill('2026-06-16T09:30')
  await page.getByLabel('结束').fill('2026-06-16T10:30')

  const createResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/schedules') && response.status() === 201,
  )
  const refreshResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/dashboard') && response.ok(),
  )
  await page.getByRole('button', { name: '新增日程' }).click()
  await createResponse
  await refreshResponse
  await page.getByText(scheduleTitle).waitFor()

  const nextScheduleCount = await page.locator('.schedule-row').count()
  assert.equal(
    nextScheduleCount,
    initialScheduleCount + 1,
    'creating a schedule should add one visible schedule row',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Dashboard E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
