import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-sample-records.png')
const sampleCode = `SM-E2E-${Date.now()}`
const deliveryNo = `SD-E2E-${Date.now()}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1500 } })

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
  await page.getByRole('button', { name: '登录' }).click()
  await loginResponse

  const listResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/sample/records') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('link', { name: '样品登记' }).click()
  await listResponse
  await page.getByRole('heading', { name: '样品登记和数量台账' }).waitFor()

  const formPanel = page.locator('.product-form-panel').filter({ hasText: '新增样品' })
  await formPanel.getByLabel('样品编号', { exact: true }).fill(sampleCode)
  await formPanel.getByLabel('样品分类', { exact: true }).selectOption('confirm_sample')
  await formPanel.getByLabel('样品状态', { exact: true }).selectOption('registered')
  await formPanel.getByLabel('收样数量', { exact: true }).fill('5')
  await formPanel.getByLabel('收样日期', { exact: true }).fill('2026-06-22')
  await formPanel.getByLabel('提交日期', { exact: true }).fill('2026-06-23')
  await formPanel.getByLabel('产品编号', { exact: true }).fill('BAG-40')
  await formPanel.getByLabel('产品名称', { exact: true }).fill('Eco Shopping Bag')
  await formPanel.getByLabel('客户货号', { exact: true }).fill('CUST-E2E-40')
  await formPanel.getByLabel('供应商货号', { exact: true }).fill('SUP-E2E-40')
  await formPanel.getByLabel('客户名称', { exact: true }).fill('端到端客户')
  await formPanel.getByLabel('供应商名称', { exact: true }).fill('华东包装制品厂')
  await formPanel.getByLabel('采购合同号', { exact: true }).fill('PC-E2E-001')
  await formPanel.getByLabel('单位', { exact: true }).fill('pcs')
  await formPanel.getByLabel('样品来源', { exact: true }).selectOption('sample_request')
  await formPanel.getByLabel('来源单号', { exact: true }).fill('SR-E2E-001')
  await formPanel.getByLabel('样品说明', { exact: true }).fill('端到端确认样')
  await formPanel.getByLabel('图片文件标识', { exact: true }).fill('file-e2e-front')
  await formPanel.getByLabel('图片文件名', { exact: true }).fill('confirm-front.jpg')
  await formPanel.getByLabel('图片地址', { exact: true }).fill('https://example.com/confirm-front.jpg')
  await formPanel.getByLabel('图片说明', { exact: true }).fill('正面图片')

  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/sample/records') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  const refreshResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/sample/records') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '新增样品' }).click()
  await createResponse
  await refreshResponse

  await page.getByText(sampleCode).first().waitFor()
  await page.getByRole('cell', { name: '确认样' }).first().waitFor()
  await page.getByRole('cell', { name: 'CUST-E2E-40' }).first().waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '样品明细' })
  await detailPanel.getByText('确认样提交').waitFor()
  await detailPanel.getByText('2026-06-23').first().waitFor()
  await detailPanel.getByRole('cell', { name: '5' }).first().waitFor()
  await detailPanel.getByRole('cell', { name: 'confirm-front.jpg', exact: true }).waitFor()

  await detailPanel.getByLabel('图片文件标识', { exact: true }).fill('file-e2e-side')
  await detailPanel.getByLabel('图片文件名', { exact: true }).fill('confirm-side.jpg')
  await detailPanel.getByLabel('图片地址', { exact: true }).fill('https://example.com/confirm-side.jpg')
  await detailPanel.getByLabel('图片说明', { exact: true }).fill('侧面图片')

  const imageResponse = page.waitForResponse((response) =>
    response.url().includes('/images') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await detailPanel.getByRole('button', { name: '追加样品图片' }).click()
  await imageResponse
  await detailPanel.getByRole('cell', { name: 'confirm-side.jpg', exact: true }).waitFor()

  await detailPanel.getByLabel('事件类型', { exact: true }).selectOption('delivered')
  await detailPanel.getByLabel('数量', { exact: true }).fill('2')
  await detailPanel.getByLabel('日期', { exact: true }).fill('2026-06-24')
  await detailPanel.getByLabel('单位', { exact: true }).fill('pcs')
  await detailPanel.getByLabel('寄样单号', { exact: true }).fill(deliveryNo)
  await detailPanel.getByLabel('接收方', { exact: true }).fill('端到端客户')
  await detailPanel.getByLabel('事件备注', { exact: true }).fill('寄送客户确认')

  const stockResponse = page.waitForResponse((response) =>
    response.url().includes('/stock-events') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await detailPanel.getByRole('button', { name: '登记样品数量' }).click()
  await stockResponse

  await detailPanel.getByRole('cell', { name: deliveryNo }).waitFor()
  await detailPanel.getByRole('cell', { name: '2' }).first().waitFor()
  await detailPanel.locator('table').first().getByRole('cell', { name: '3', exact: true }).waitFor()

  assert.ok(
    (await page.getByText(sampleCode).count()) >= 1,
    'created sample record should remain visible',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Sample records E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
