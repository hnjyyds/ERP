import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-partners.png')
const partnerCode = `P-E2E-${Date.now()}`

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
    response.url().includes('/api/v1/masterdata/partners') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('link', { name: '合作伙伴' }).click()
  await listResponse
  await page.getByRole('heading', { name: '合作伙伴和费用联系人' }).waitFor()

  await page.getByLabel('合作伙伴编号', { exact: true }).fill(partnerCode)
  await selectWrappedField('合作伙伴状态', 'active')
  await page.getByLabel('合作伙伴中文名称', { exact: true }).fill('端到端国际货代')
  await page.getByLabel('合作伙伴英文名称', { exact: true }).fill('E2E Global Forwarding')
  await selectWrappedField('合作伙伴类型', 'freight_forwarder')
  await page.getByLabel('合作伙伴国家', { exact: true }).fill('China')
  await page.getByLabel('合作伙伴地址', { exact: true }).fill('Shanghai Port Service Center')
  await page.getByLabel('合作伙伴网址', { exact: true }).fill('https://example.com/e2e-partner')
  await page.getByLabel('合作伙伴主联系人姓名', { exact: true }).fill('Grace Lin')
  await page.getByLabel('合作伙伴主联系人职务', { exact: true }).fill('Operation Manager')
  await page.getByLabel('合作伙伴主联系人邮箱', { exact: true }).fill('grace.e2e@example.com')
  await page.getByLabel('合作伙伴主联系人电话', { exact: true }).fill('+86-21-0000')

  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/masterdata/partners') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  const refreshResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/partners') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '新增合作伙伴' }).click()
  await createResponse
  await refreshResponse

  await page.getByText(partnerCode).first().waitFor()
  await page.getByText('端到端国际货代').first().waitFor()
  await page.getByText('Grace Lin').first().waitFor()
  await page.getByRole('cell', { name: '货代公司' }).first().waitFor()

  await page.getByLabel('编辑合作伙伴中文名称', { exact: true }).fill('端到端国际物流')
  await page.getByLabel('编辑合作伙伴英文名称', { exact: true }).fill('E2E Global Logistics')
  await selectWrappedField('编辑合作伙伴类型', 'carrier')
  await page.getByLabel('编辑合作伙伴国家', { exact: true }).fill('Singapore')

  const updateResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/partners/') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '更新合作伙伴' }).click()
  await updateResponse
  await page.getByText(`已更新合作伙伴 ${partnerCode}`).waitFor()
  await page.getByRole('cell', { name: '运输公司' }).first().waitFor()
  await page.getByRole('cell', { name: 'Singapore' }).first().waitFor()

  await page.getByLabel('追加合作伙伴联系人姓名', { exact: true }).fill('Mia Chen')
  await page.getByLabel('追加合作伙伴联系人职务', { exact: true }).fill('Account Executive')
  await page.getByLabel('追加合作伙伴联系人邮箱', { exact: true }).fill('mia.e2e@example.com')
  await page.getByLabel('追加合作伙伴联系人电话', { exact: true }).fill('+65-6000-0000')

  const contactResponse = page.waitForResponse((response) =>
    response.url().includes('/contacts') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await page.getByRole('button', { name: '追加合作伙伴联系人' }).click()
  await contactResponse
  await page.getByText('Mia Chen').first().waitFor()
  await page.getByText('费用申请、单证和付费管理模块接入后将在此汇总。').waitFor()

  assert.ok(
    (await page.getByRole('cell', { name: 'Mia Chen' }).count()) >= 1,
    'appending a partner contact should add a visible contact row',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Partners E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
