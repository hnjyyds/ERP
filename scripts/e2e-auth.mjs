import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-auth-finance.png')

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto(frontendUrl)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('heading', { name: '登录工作台' }).waitFor()
  await page.getByLabel('用户名').fill('finance')
  await page.getByLabel('密码').fill('finance123')

  const loginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await loginResponse

  await page.getByText('演示财务').waitFor()
  await page.getByRole('link', { name: '工作桌面' }).waitFor()
  await page.getByRole('link', { name: '财务管理' }).waitFor()
  assert.equal(await page.getByRole('link', { name: '商品资料' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '客户资料' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '供应商资料' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '合作伙伴' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '单证资料' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '打样管理' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '样品登记' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '寄样管理' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '出口报价' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '出口合同' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '出货明细' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '采购询价' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '采购合同' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '开票通知' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '采购跟单' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '入库计划' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '货物入库' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '出库计划' }).count(), 0)
  assert.equal(await page.getByRole('link', { name: '货物出库' }).count(), 0)

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Auth E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
