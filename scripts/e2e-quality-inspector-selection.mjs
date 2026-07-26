import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:8080/'
const screenshotPath = resolve('artifacts/e2e-quality-inspector-selection.png')

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })

try {
  await page.goto(frontendUrl)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByLabel('用户名').fill('qc')
  await page.getByLabel('密码').fill('qc123')
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith('/api/v1/auth/login') && response.ok(),
    ),
    page.getByRole('button', { name: '登录' }).click(),
  ])

  await page.goto(new URL('/quality/inspections', frontendUrl).toString())
  const usersResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/users') && response.ok(),
  )
  await page.getByRole('button', { name: '新增 QC 单' }).click()
  await usersResponse

  const modal = page.getByRole('dialog', { name: '新增 QC 任务' })
  let createRequestCount = 0
  page.on('request', (request) => {
    if (
      request.url().endsWith('/api/v1/quality/inspections') &&
      request.method() === 'POST'
    ) {
      createRequestCount += 1
    }
  })

  await modal.getByRole('button', { name: '创建 QC 任务' }).click()
  await modal.getByText('请完善以下 1 项信息').waitFor()
  await modal.getByText('采购合同：请选择采购合同').waitFor()
  assert.equal(
    await modal.getByRole('combobox', { name: '采购合同' }).getAttribute('aria-invalid'),
    'true',
  )
  assert.equal(
    await modal.locator('label[for="quality-contract-id"] .form-required-mark').count(),
    1,
  )
  assert.equal(createRequestCount, 0)

  const inspectorSelect = modal.getByRole('combobox', { name: '负责人' })
  await inspectorSelect.click()
  await page.getByRole('option', { name: '演示仓库专员 / warehouse / 仓储部' }).click()

  const selectedInspector = modal.getByText('演示仓库专员 / warehouse / 仓储部')
  await selectedInspector.waitFor()
  assert.equal(await selectedInspector.count(), 1)

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`QC inspector selection E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
