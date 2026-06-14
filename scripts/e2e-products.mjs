import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-products.png')
const productCode = `P-E2E-${Date.now()}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })

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
    response.url().includes('/api/v1/masterdata/products') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('link', { name: '商品资料' }).click()
  await listResponse
  await page.getByRole('heading', { name: '商品资料和配件明细' }).waitFor()

  await page.getByLabel('产品编号').fill(productCode)
  await page.getByLabel('中文名称').fill('端到端环保购物袋')
  await page.getByLabel('英文名称').fill('E2E Eco Shopping Bag')
  await page.getByLabel('规格').fill('45x38cm')
  await page.getByLabel('型号').fill('E2E-BAG')
  await page.getByLabel('海关编码').fill('4202920000')
  await page.getByLabel('税率', { exact: true }).fill('0.13')
  await page.getByLabel('退税率', { exact: true }).fill('0.09')
  await page.getByLabel('包装资料').fill('100 pcs/carton, 5 cartons/master carton')
  await page.getByLabel('商品单位').fill('pcs')
  await page.getByLabel('图片地址').fill('')
  await page.getByLabel('配件名称', { exact: true }).fill('棉绳')
  await page.getByLabel('单耗', { exact: true }).fill('0.45')
  await page.getByLabel('配件单位', { exact: true }).fill('m')
  await page.getByLabel('默认供应商', { exact: true }).fill('端到端辅料供应商')

  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/masterdata/products') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  const refreshResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/products') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('button', { name: '新增商品' }).click()
  await createResponse
  await refreshResponse

  await page.getByText(productCode).first().waitFor()
  await page.getByText('端到端环保购物袋').first().waitFor()
  await page.getByText('棉绳').first().waitFor()

  await page.getByLabel('追加配件名称').fill('拉链头')
  await page.getByLabel('追加单耗').fill('1')
  await page.getByLabel('追加单位').fill('pcs')
  await page.getByLabel('追加供应商').fill('端到端五金供应商')

  const accessoryResponse = page.waitForResponse((response) =>
    response.url().includes('/accessories') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await page.getByRole('button', { name: '追加配件' }).click()
  await accessoryResponse
  await page.getByRole('cell', { name: '拉链头' }).waitFor()

  const exportResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/products/export') && response.ok(),
  )
  await page.getByRole('button', { name: '导出' }).click()
  await exportResponse
  await page.getByText('CSV 已生成：products.csv').waitFor()
  await page.getByText(productCode).first().waitFor()

  assert.ok(
    (await page.getByText('拉链头').count()) >= 1,
    'appending an accessory should add a visible row for it',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Products E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
