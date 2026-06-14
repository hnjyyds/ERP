import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-sample-requests.png')
const sampleCode = `SR-E2E-${Date.now()}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1280 } })

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
    response.url().includes('/api/v1/sample/requests') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('link', { name: '打样管理' }).click()
  await listResponse
  await page.getByRole('heading', { name: '打样管理和费用进度' }).waitFor()

  const formPanel = page.locator('.product-form-panel').filter({ hasText: '新增打样单' })
  await formPanel.getByLabel('打样单号', { exact: true }).fill(sampleCode)
  await formPanel.getByLabel('打样状态', { exact: true }).selectOption('draft')
  await formPanel.getByLabel('打样日期', { exact: true }).fill('2026-06-20')
  await formPanel.getByLabel('要求完成日期', { exact: true }).fill('2026-06-28')
  await formPanel.getByLabel('打样客户标识', { exact: true }).fill('customer-e2e')
  await formPanel.getByLabel('打样客户名称', { exact: true }).fill('端到端客户')
  await formPanel.getByLabel('打样产品编号', { exact: true }).fill('BAG-40')
  await formPanel.getByLabel('打样产品名称', { exact: true }).fill('Eco Shopping Bag')
  await formPanel.getByLabel('打样供应商名称', { exact: true }).fill('华东包装制品厂')
  await formPanel.getByLabel('打样去向', { exact: true }).selectOption('factory')
  await formPanel.getByLabel('客户打样要求', { exact: true }).fill('环保材质确认样')
  await formPanel.getByLabel('明细产品编号', { exact: true }).fill('BAG-40')
  await formPanel.getByLabel('明细产品名称', { exact: true }).fill('Eco Shopping Bag')
  await formPanel.getByLabel('明细规格', { exact: true }).fill('40x35cm')
  await formPanel.getByLabel('明细数量', { exact: true }).fill('3')
  await formPanel.getByLabel('明细单位', { exact: true }).fill('pcs')
  await formPanel.getByLabel('明细要求', { exact: true }).fill('绿色样、自然色各一')

  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/sample/requests') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  const refreshResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/sample/requests') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '新增打样单' }).click()
  await createResponse
  await refreshResponse

  await page.getByText(sampleCode).first().waitFor()
  await page.getByText('端到端客户').first().waitFor()
  await page.getByRole('cell', { name: '外发工厂' }).first().waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '打样单明细' })
  await detailPanel.getByLabel('进度阶段', { exact: true }).selectOption('sent_to_factory')
  await detailPanel.getByLabel('进度状态', { exact: true }).selectOption('in_progress')
  await detailPanel.getByLabel('进度日期', { exact: true }).fill('2026-06-21')
  await detailPanel.getByLabel('进度经办人', { exact: true }).fill('Li Wei')
  await detailPanel.getByLabel('进度说明', { exact: true }).fill('已外发工厂打样')

  const progressResponse = page.waitForResponse((response) =>
    response.url().includes('/progress') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await page.getByRole('button', { name: '更新打样进度' }).click()
  await progressResponse
  await page.getByRole('cell', { name: '进行中' }).first().waitFor()
  await detailPanel.getByRole('cell', { name: '外发工厂' }).first().waitFor()

  await detailPanel.getByLabel('打样费用类型', { exact: true }).selectOption('sample_making')
  await detailPanel.getByLabel('打样费用金额', { exact: true }).fill('120.50')
  await detailPanel.getByLabel('打样费用币种', { exact: true }).fill('USD')
  await detailPanel.getByLabel('收款方类型', { exact: true }).selectOption('supplier')
  await detailPanel.getByLabel('收款方名称', { exact: true }).fill('华东包装制品厂')
  await detailPanel.getByLabel('打样费用备注', { exact: true }).fill('外发工厂打样费')

  const feeResponse = page.waitForResponse((response) =>
    response.url().includes('/fees') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await page.getByRole('button', { name: '登记打样费用' }).click()
  await feeResponse
  await page.getByRole('cell', { name: 'USD 120.50' }).first().waitFor()

  const paymentResponse = page.waitForResponse((response) =>
    response.url().includes('/payment-request') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '发起付款' }).click()
  await paymentResponse
  await page.getByText(/SAMPLE-FEE-/).waitFor()

  assert.ok(
    (await page.getByText(sampleCode).count()) >= 1,
    'created sample request should remain visible',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Sample requests E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
