import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-customers.png')
const customerCode = `C-E2E-${Date.now()}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1180 } })

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
    response.url().includes('/api/v1/masterdata/customers') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('link', { name: '客户资料' }).click()
  await listResponse
  await page.getByRole('heading', { name: '客户资料和信用联系人' }).waitFor()

  await page.getByLabel('客户编号', { exact: true }).fill(customerCode)
  await page.getByLabel('客户中文名称', { exact: true }).fill('端到端欧洲客户')
  await page.getByLabel('客户英文名称', { exact: true }).fill('E2E Europe Buyer')
  await page.getByLabel('客户国家', { exact: true }).fill('Germany')
  await page.getByLabel('客户地址', { exact: true }).fill('Hamburg Trade Center')
  await page.getByLabel('客户网址', { exact: true }).fill('https://example.com/e2e-buyer')
  await page.getByLabel('主联系人姓名', { exact: true }).fill('Anna Schmidt')
  await page.getByLabel('主联系人职务', { exact: true }).fill('Sourcing Manager')
  await page.getByLabel('主联系人邮箱', { exact: true }).fill('anna.e2e@example.com')
  await page.getByLabel('主联系人电话', { exact: true }).fill('+49-40-1234')
  await page.getByLabel('信用等级', { exact: true }).fill('A')
  await page.getByLabel('授信额度', { exact: true }).fill('50000')
  await page.getByLabel('授信币种', { exact: true }).fill('USD')
  await page.getByLabel('付款条款', { exact: true }).fill('T/T 30 days')

  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/masterdata/customers') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  const refreshResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/customers') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '新增客户' }).click()
  await createResponse
  await refreshResponse

  await page.getByText(customerCode).first().waitFor()
  await page.getByText('端到端欧洲客户').first().waitFor()
  await page.getByText('Anna Schmidt').first().waitFor()

  await page.getByLabel('编辑信用等级', { exact: true }).fill('B')
  await page.getByLabel('编辑授信额度', { exact: true }).fill('62000')
  await page.getByLabel('编辑付款条款', { exact: true }).fill('T/T 45 days')

  const updateResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/customers/') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '更新客户' }).click()
  await updateResponse
  await page.getByText(`已更新客户 ${customerCode}`).waitFor()
  await page.getByText('T/T 45 days').first().waitFor()

  await page.getByLabel('追加联系人姓名', { exact: true }).fill('Bob Carter')
  await page.getByLabel('追加联系人职务', { exact: true }).fill('Import Director')
  await page.getByLabel('追加联系人邮箱', { exact: true }).fill('bob.e2e@example.com')
  await page.getByLabel('追加联系人电话', { exact: true }).fill('+1-212-0000')

  const contactResponse = page.waitForResponse((response) =>
    response.url().includes('/contacts') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await page.getByRole('button', { name: '追加联系人' }).click()
  await contactResponse
  await page.getByText('Bob Carter').first().waitFor()
  await page.getByText('报价、出口合同、出货和收款模块接入后将在此汇总。').waitFor()

  assert.ok(
    (await page.getByRole('cell', { name: 'Bob Carter' }).count()) >= 1,
    'appending a contact should add a visible contact row',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Customers E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
