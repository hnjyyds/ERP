import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-document-parties.png')
const partyCode = `DP-E2E-${Date.now()}`
const customerId = `customer-e2e-${Date.now()}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1180 } })

async function selectWrappedField(labelText, value) {
  await page.locator('label').filter({ hasText: labelText }).first().locator('select').selectOption(value)
}

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
    response.url().includes('/api/v1/masterdata/document-parties') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('link', { name: '单证资料' }).click()
  await listResponse
  await page.getByRole('heading', { name: '单证资料和常用引用' }).waitFor()

  await page.getByLabel('单证资料编号', { exact: true }).fill(partyCode)
  await selectWrappedField('单证资料状态', 'active')
  await selectWrappedField('单证资料类型', 'consignee')
  await page.getByLabel('单证资料国家', { exact: true }).fill('Germany')
  await page.getByLabel('单证资料名称', { exact: true }).fill('E2E Hamburg Consignee')
  await page.getByLabel('关联客户标识', { exact: true }).fill(customerId)
  await page.getByLabel('关联客户名称', { exact: true }).fill('端到端客户')
  await page.getByLabel('单证资料地址', { exact: true }).fill('Hamburg Trade Center')
  await page.getByLabel('单证联系人', { exact: true }).fill('Anna Schmidt')
  await page.getByLabel('单证联系电话', { exact: true }).fill('+49-40-2222')
  await page.getByLabel('单证联系邮箱', { exact: true }).fill('anna.e2e@example.com')
  await page.getByLabel('税号', { exact: true }).fill('DE-E2E-001')

  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/masterdata/document-parties') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  const refreshResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/document-parties') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '新增单证资料' }).click()
  await createResponse
  await refreshResponse

  await page.getByText(partyCode).first().waitFor()
  await page.getByText('E2E Hamburg Consignee').first().waitFor()
  await page.getByRole('cell', { name: '收货人' }).first().waitFor()
  await page.getByText('快速引用').waitFor()
  await page.getByRole('cell', { name: 'E2E Hamburg Consignee' }).first().waitFor()

  await selectWrappedField('编辑单证资料类型', 'notify_party')
  await page.getByLabel('编辑单证资料名称', { exact: true }).fill('E2E Bremen Notify')
  await page.getByLabel('编辑单证资料国家', { exact: true }).fill('Germany')
  await page.getByLabel('编辑单证联系人', { exact: true }).fill('Mia Chen')
  await page.getByLabel('编辑单证资料地址', { exact: true }).fill('Bremen Logistics Center')

  const updateResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/document-parties/') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '更新单证资料' }).click()
  await updateResponse
  await page.getByText(`已更新单证资料 ${partyCode}`).waitFor()
  await page.getByRole('cell', { name: '通知人' }).first().waitFor()
  await page.getByText('Mia Chen').first().waitFor()
  await page.getByText('Bremen Logistics Center').first().waitFor()

  assert.ok(
    (await page.getByRole('cell', { name: partyCode }).count()) >= 1,
    'created document party should remain visible in the list',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Document parties E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
