import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-finance-receipts.png')
const runId = Date.now()
const contractNo = `EC-AR-E2E-${runId}`
const receiptNo = `BR-E2E-${runId}`
const invoiceNo = `INV-E2E-${runId}`

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

  const businessLoginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await businessLoginResponse

  const contract = await page.evaluate(async ({ contractNo }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    async function expectOk(response) {
      if (!response.ok) throw new Error(await response.text())
      return (await response.json()).data
    }

    const created = await expectOk(
      await fetch('/api/v1/sales/contracts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: contractNo,
          contract_date: '2026-08-01',
          customer_id: 'customer-euro-home',
          customer_name: '欧陆家居用品有限公司',
          sales_user_id: 'u-001',
          sales_user_name: '演示业务主管',
          currency: 'USD',
          trade_term: 'FOB Ningbo',
          planned_ship_date: '2026-09-10',
          payment_terms: '30% T/T in advance, balance before shipment',
          source_quotation_id: `quotation-${contractNo}`,
          source_quotation_no: `QT-${contractNo}`,
          remarks: '财务收款端到端前置合同',
          lines: [
            {
              product_id: 'product-bag',
              product_code: 'BAG-40',
              product_name: 'Eco Shopping Bag',
              specification: '40x35cm',
              model: 'BAG-40',
              quantity: '100',
              unit: 'pcs',
              unit_price: '12.00',
              purchased_quantity: '100',
              shipped_quantity: '0',
              image_url: 'https://example.test/product.png',
              remark: '财务收款合同',
            },
          ],
        }),
      }),
    )

    await expectOk(
      await fetch(`/api/v1/sales/contracts/${created.id}/submit`, {
        method: 'POST',
        headers,
      }),
    )

    return expectOk(
      await fetch(`/api/v1/sales/contracts/${created.id}/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-08-02' }),
      }),
    )
  }, { contractNo })

  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await page.getByRole('heading', { name: '登录工作台' }).waitFor()
  await page.getByLabel('用户名').fill('finance')
  await page.getByLabel('密码').fill('finance123')

  const financeLoginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await financeLoginResponse
  await page.getByText('演示财务').waitFor()

  const financeLink = page.getByLabel('主导航').getByRole('link', { name: '财务管理' })
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/v1/finance/overview') && response.ok(),
    ),
    financeLink.click(),
  ])
  await page.getByRole('heading', { name: '财务管理和利润概览' }).waitFor()
  await page.getByText('银行水单列表').waitFor()
  await page.getByText('水单录入').waitFor()
  await page.getByText('应收账款查询').waitFor()

  const receiptForm = page.locator('.finance-receipt-form-panel')
  await receiptForm.getByLabel('银行水单号').fill(receiptNo)
  await receiptForm.getByLabel('收款日期').fill('2026-08-05')
  await receiptForm.getByLabel('付款人').fill('Euro Home Retail Ltd.')
  await receiptForm.getByLabel('客户标识').fill('customer-euro-home')
  await receiptForm.getByLabel('客户名称').fill('欧陆家居用品有限公司')
  await receiptForm.getByLabel('收款金额').fill('500.00')
  await receiptForm.getByLabel('币种').fill('USD')
  await receiptForm.getByLabel('收款性质').selectOption('advance')
  await receiptForm.getByLabel('收款银行账号').fill('BOC 6222 ****')
  await receiptForm.getByLabel('银行流水号').fill(`SWIFT-${receiptNo}`)
  await receiptForm.getByLabel('备注').fill('客户预收款端到端')

  const createReceiptResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/finance/receipts') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await receiptForm.getByRole('button', { name: '保存水单' }).click()
  const createdReceipt = (await (await createReceiptResponse).json()).data
  await page.getByText(receiptNo).first().waitFor()
  await page.locator('.finance-receipt-list-panel .ant-tag').filter({ hasText: '待认领' }).first().waitFor()

  const detailPanel = page.locator('.finance-receipt-detail-panel')
  await detailPanel.getByText(receiptNo).waitFor()
  await detailPanel.getByLabel('认领日期').fill('2026-08-06')
  await detailPanel.getByLabel('业务员标识').fill('u-001')
  await detailPanel.getByLabel('业务员姓名').fill('演示业务主管')
  await detailPanel.getByLabel('认领说明').fill('确认客户预收款')

  const claimResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/v1/finance/receipts/${createdReceipt.id}/claim`) &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '确认认领' }).click()
  await claimResponse
  await page.locator('.finance-receipt-list-panel .ant-tag').filter({ hasText: '已认领' }).first().waitFor()

  await detailPanel.getByLabel('分摊类型').selectOption('contract')
  await detailPanel.getByLabel('分摊日期').fill('2026-08-07')
  await detailPanel.getByLabel('出口合同标识').fill(contract.id)
  await detailPanel.getByLabel('出口合同号').fill(contract.code)
  await detailPanel.getByLabel('发票号').fill('')
  await detailPanel.getByLabel('分摊金额').fill('300.00')
  await detailPanel.getByLabel('币种').fill('USD')
  await detailPanel.getByLabel('分摊备注').fill('分摊到出口合同')

  const firstAllocationResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/v1/finance/receipts/${createdReceipt.id}/allocations`) &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await detailPanel.getByRole('button', { name: '保存分摊' }).click()
  await firstAllocationResponse
  await page.locator('.finance-receipt-list-panel .ant-tag').filter({ hasText: '部分分摊' }).first().waitFor()
  await detailPanel.getByText('USD 200.00').waitFor()

  await detailPanel.getByLabel('分摊类型').selectOption('advance')
  await detailPanel.getByLabel('分摊日期').fill('2026-08-08')
  await detailPanel.getByLabel('出口合同标识').fill(contract.id)
  await detailPanel.getByLabel('出口合同号').fill(contract.code)
  await detailPanel.getByLabel('发票号').fill(invoiceNo)
  await detailPanel.getByLabel('分摊金额').fill('200.00')
  await detailPanel.getByLabel('币种').fill('USD')
  await detailPanel.getByLabel('分摊备注').fill('预收款分摊到出口发票')

  const secondAllocationResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/v1/finance/receipts/${createdReceipt.id}/allocations`) &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await detailPanel.getByRole('button', { name: '保存分摊' }).click()
  await secondAllocationResponse
  await page.locator('.finance-receipt-list-panel .ant-tag').filter({ hasText: '已分摊' }).first().waitFor()
  await detailPanel.getByText(invoiceNo).waitFor()

  const receivablePanel = page.locator('.finance-receivable-panel')
  await receivablePanel.getByLabel('出口合同号').fill(contract.code)
  await receivablePanel.getByLabel('发票号').fill(invoiceNo)
  const receivableResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/v1/finance/receivables' &&
      url.searchParams.get('contract_no') === contract.code &&
      url.searchParams.get('invoice_no') === invoiceNo &&
      response.ok()
    )
  })
  await receivablePanel.getByRole('button', { name: '查询' }).click()
  const receivables = (await (await receivableResponse).json()).data
  assert.equal(receivables.total, 1)
  assert.equal(receivables.items[0].contract_no, contract.code)
  assert.equal(receivables.items[0].received_amount, '500.00')
  assert.equal(receivables.items[0].receivable_amount, '700.00')

  await page.getByText(contract.code).last().waitFor()
  await receivablePanel.getByText('USD 700.00').waitFor()

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Finance receipts E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
