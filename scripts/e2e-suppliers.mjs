import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-suppliers.png')
const supplierCode = `S-E2E-${Date.now()}`

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
    response.url().includes('/api/v1/masterdata/suppliers') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('link', { name: '供应商资料' }).click()
  await listResponse
  await page.getByRole('heading', { name: '供应商资料和信用联系人' }).waitFor()

  await page.getByLabel('供应商编号', { exact: true }).fill(supplierCode)
  await page.getByLabel('供应商中文名称', { exact: true }).fill('端到端包装供应商')
  await page.getByLabel('供应商英文名称', { exact: true }).fill('E2E Packaging Supplier')
  await page.getByLabel('供应商国家', { exact: true }).fill('China')
  await page.getByLabel('供应商地址', { exact: true }).fill('Ningbo Industrial Zone')
  await page.getByLabel('供应商网址', { exact: true }).fill('https://example.com/e2e-supplier')
  await page.getByLabel('供应商主联系人姓名', { exact: true }).fill('Li Wei')
  await page.getByLabel('供应商主联系人职务', { exact: true }).fill('Sales Manager')
  await page.getByLabel('供应商主联系人邮箱', { exact: true }).fill('liwei.e2e@example.com')
  await page.getByLabel('供应商主联系人电话', { exact: true }).fill('+86-574-1234')
  await page.getByLabel('供应商信用等级', { exact: true }).fill('A')
  await page.getByLabel('供应商授信额度', { exact: true }).fill('80000')
  await page.getByLabel('供应商授信币种', { exact: true }).fill('CNY')
  await page.getByLabel('供应商付款条款', { exact: true }).fill('30% deposit, 70% before shipment')

  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/masterdata/suppliers') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  const refreshResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/suppliers') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '新增供应商' }).click()
  await createResponse
  await refreshResponse

  await page.getByText(supplierCode).first().waitFor()
  await page.getByText('端到端包装供应商').first().waitFor()
  await page.getByText('Li Wei').first().waitFor()

  await page.getByLabel('编辑供应商信用等级', { exact: true }).fill('B')
  await page.getByLabel('编辑供应商授信额度', { exact: true }).fill('96000')
  await page.getByLabel('编辑供应商付款条款', { exact: true }).fill(
    '20% deposit, 80% before shipment',
  )

  const updateResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/suppliers/') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '更新供应商' }).click()
  await updateResponse
  await page.getByText(`已更新供应商 ${supplierCode}`).waitFor()
  await page.getByText('20% deposit, 80% before shipment').first().waitFor()

  await page.getByLabel('追加供应商联系人姓名', { exact: true }).fill('Zhang Min')
  await page.getByLabel('追加供应商联系人职务', { exact: true }).fill('Production Planner')
  await page.getByLabel('追加供应商联系人邮箱', { exact: true }).fill('zhang.e2e@example.com')
  await page.getByLabel('追加供应商联系人电话', { exact: true }).fill('+86-574-5678')

  const contactResponse = page.waitForResponse((response) =>
    response.url().includes('/contacts') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await page.getByRole('button', { name: '追加供应商联系人' }).click()
  await contactResponse
  await page.getByText('Zhang Min').first().waitFor()
  await page.getByText('采购询价、采购合同、入库和付款模块接入后将在此汇总。').waitFor()

  assert.ok(
    (await page.getByRole('cell', { name: 'Zhang Min' }).count()) >= 1,
    'appending a supplier contact should add a visible contact row',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Suppliers E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
