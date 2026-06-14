import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-purchase-invoice-notices.png')
const runId = Date.now()
const customsId = `customs-e2e-${runId}`
const customsNo = `CD-E2E-${runId}`
const taxInvoiceNo = `VAT-E2E-${runId}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } })

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

  const noticeMenu = page.getByLabel('主导航').getByRole('link', { name: '开票通知' })
  await noticeMenu.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/purchase/invoice-notices' &&
        response.request().method() === 'GET' &&
        response.ok()
      )
    }),
    noticeMenu.click(),
  ])
  await page.getByRole('heading', { name: '开票通知和税票催收' }).waitFor()

  const formPanel = page.locator('.product-form-panel')
  await formPanel.locator('#purchase-invoice-customs-id').fill(customsId)
  await formPanel.locator('#purchase-invoice-customs-no').fill(customsNo)
  await formPanel.locator('#purchase-invoice-declaration-date').fill('2026-09-03')
  await formPanel.locator('#purchase-invoice-notice-date').fill('2026-09-04')
  await formPanel.locator('#purchase-invoice-currency').fill('CNY')
  await formPanel.locator('#purchase-invoice-remarks').fill('E2E 报关单证生成开票通知')
  await formPanel.locator('#purchase-invoice-supplier-id-a').fill('supplier-pack-a')
  await formPanel.locator('#purchase-invoice-supplier-name-a').fill('华东包装制品厂')
  await formPanel.locator('#purchase-invoice-contract-no-a').fill(`PC-PACK-${runId}`)
  await formPanel.locator('#purchase-invoice-product-code-a').fill('BAG-40')
  await formPanel.locator('#purchase-invoice-product-name-a').fill('Eco Shopping Bag')
  await formPanel.locator('#purchase-invoice-customs-name-a').fill('环保购物袋')
  await formPanel.locator('#purchase-invoice-name-a').fill('无纺布购物袋')
  await formPanel.locator('#purchase-invoice-quantity-a').fill('1000')
  await formPanel.locator('#purchase-invoice-unit-a').fill('pcs')
  await formPanel.locator('#purchase-invoice-amount-a').fill('5200.00')
  await formPanel.locator('#purchase-invoice-remark-a').fill('E2E 按报关品名开票')
  await formPanel.locator('#purchase-invoice-supplier-id-b').fill('supplier-label-a')
  await formPanel.locator('#purchase-invoice-supplier-name-b').fill('苏州标签印务厂')
  await formPanel.locator('#purchase-invoice-contract-no-b').fill(`PC-LABEL-${runId}`)
  await formPanel.locator('#purchase-invoice-product-code-b').fill('LABEL-01')
  await formPanel.locator('#purchase-invoice-product-name-b').fill('Hang Tag')
  await formPanel.locator('#purchase-invoice-customs-name-b').fill('纸制吊牌')
  await formPanel.locator('#purchase-invoice-name-b').fill('纸质吊牌')
  await formPanel.locator('#purchase-invoice-quantity-b').fill('450')
  await formPanel.locator('#purchase-invoice-unit-b').fill('pcs')
  await formPanel.locator('#purchase-invoice-amount-b').fill('360.00')
  await formPanel.locator('#purchase-invoice-remark-b').fill('E2E 吊牌随货开票')

  const generateResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/purchase/invoice-notices/from-customs-declaration') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await formPanel.getByRole('button', { name: '生成开票通知' }).click()
  const generated = await generateResponse
  const generatedBody = await generated.json()
  assert.equal(generatedBody.data.total, 2)

  await page.getByText(`已生成 2 条供应商开票通知`).waitFor()
  await page.getByText(customsNo).first().waitFor()
  await page.getByRole('cell', { name: '华东包装制品厂' }).first().waitFor()
  await page.getByRole('cell', { name: '苏州标签印务厂' }).first().waitFor()

  const packRow = page.getByRole('row').filter({ hasText: '华东包装制品厂' }).first()
  await packRow.click()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '开票通知明细' })
  await detailPanel.getByText('草稿 / 2026-09-04').waitFor()
  await detailPanel.getByText('无纺布购物袋').waitFor()
  await detailPanel.getByText('1000 pcs').waitFor()
  await detailPanel.getByText('CNY 5,200.00').first().waitFor()

  await detailPanel.locator('#purchase-invoice-sender').fill('演示业务主管')
  await detailPanel.locator('#purchase-invoice-sent-at').fill('2026-09-05')
  const sendResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/purchase/invoice-notices/') &&
    response.url().endsWith('/send') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '发送开票通知' }).click()
  await sendResponse
  await page.getByText('已发送开票通知').waitFor()
  await detailPanel.getByText('已发送 / 2026-09-04').waitFor()
  await detailPanel.getByText('税票催收提醒').first().waitFor()
  await detailPanel.getByText('待催收').first().waitFor()
  await detailPanel.getByText('2026-09-12').first().waitFor()

  await detailPanel.locator('#purchase-invoice-tax-no').fill(taxInvoiceNo)
  await detailPanel.locator('#purchase-invoice-received-at').fill('2026-09-09')
  const receiveResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/purchase/invoice-notices/') &&
    response.url().endsWith('/receive-tax-invoice') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '登记税票' }).click()
  await receiveResponse
  await page.getByText(`已登记税票 ${taxInvoiceNo}`).waitFor()
  await detailPanel.getByText('已收票 / 2026-09-04').waitFor()
  await detailPanel.getByText(taxInvoiceNo).waitFor()
  await detailPanel.getByText('已完成').first().waitFor()

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Purchase invoice notice E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
