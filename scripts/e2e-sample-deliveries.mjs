import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-sample-deliveries.png')
const runId = Date.now()
const sampleCode = `SM-DEL-E2E-${runId}`
const deliveryCode = `SD-E2E-${runId}`
const quoteNo = `QT-E2E-${runId}`
const trackingNo = `DHL-E2E-${runId}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1700 } })

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

  const sampleRecord = await page.evaluate(async ({ code }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const response = await fetch('/api/v1/sample/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        code,
        sample_type: 'confirm_sample',
        status: 'registered',
        product_id: 'product-bag',
        product_code: 'BAG-40',
        product_name: 'Eco Shopping Bag',
        customer_id: 'customer-euro-home',
        customer_name: '欧陆家居用品有限公司',
        supplier_id: 'supplier-pack',
        supplier_name: '华东包装制品厂',
        customer_sku: `CUST-${code}`,
        supplier_sku: `SUP-${code}`,
        purchase_contract_id: 'pc-e2e-delivery',
        purchase_contract_no: 'PC-E2E-DEL',
        source_type: 'sample_request',
        source_id: 'sr-e2e-delivery',
        source_code: 'SR-E2E-DEL',
        source_note: '寄样管理端到端前置样品',
        received_at: '2026-06-22',
        submitted_at: '2026-06-23',
        quantity: '5',
        unit: 'pcs',
        description: '寄样管理端到端确认样',
        images: [
          {
            file_id: `file-${code}`,
            filename: `${code}.jpg`,
            url: 'https://example.com/sample-delivery.jpg',
            caption: '寄样前置样品',
            is_primary: true,
          },
        ],
      }),
    })
    if (!response.ok) {
      throw new Error(await response.text())
    }
    const body = await response.json()
    return body.data
  }, { code: sampleCode })

  const listResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/sample/deliveries') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('link', { name: '寄样管理' }).click()
  await listResponse
  await page.getByRole('heading', { name: '寄样管理和费用统计' }).waitFor()

  const formPanel = page.locator('.product-form-panel').filter({ hasText: '新增寄样单' })
  await formPanel.getByLabel('寄样单号', { exact: true }).fill(deliveryCode)
  await formPanel.getByLabel('寄样日期', { exact: true }).fill('2026-06-25')
  await formPanel.getByLabel('客户标识', { exact: true }).fill('customer-euro-home')
  await formPanel.getByLabel('客户名称', { exact: true }).fill('欧陆家居用品有限公司')
  await formPanel.getByLabel('供应商', { exact: true }).fill('华东包装制品厂')
  await formPanel.getByLabel('工厂', { exact: true }).fill('华东包装制品厂')
  await formPanel.getByLabel('收件人', { exact: true }).fill('Anna Schmidt')
  await formPanel.getByLabel('收件公司', { exact: true }).fill('Euro Home Retail Ltd.')
  await formPanel.getByLabel('收件地址', { exact: true }).fill('Hamburg Trade Center, HafenCity')
  await formPanel.getByLabel('快递公司', { exact: true }).fill('DHL')
  await formPanel.getByLabel('快递单号', { exact: true }).fill(trackingNo)
  await formPanel.getByLabel('报价单号', { exact: true }).fill(quoteNo)
  await formPanel.getByLabel('报价标识', { exact: true }).fill('quote-e2e-delivery')
  await formPanel.getByLabel('样品标识', { exact: true }).fill(sampleRecord.id)
  await formPanel.getByLabel('样品编号', { exact: true }).fill(sampleRecord.code)
  await formPanel.getByLabel('样品分类', { exact: true }).selectOption('confirm_sample')
  await formPanel.getByLabel('产品编号', { exact: true }).fill('BAG-40')
  await formPanel.getByLabel('产品名称', { exact: true }).fill('Eco Shopping Bag')
  await formPanel.getByLabel('寄样数量', { exact: true }).fill('2')
  await formPanel.getByLabel('单位', { exact: true }).fill('pcs')
  await formPanel.getByLabel('明细备注', { exact: true }).fill('客户确认样寄出')
  await formPanel.getByLabel('费用类型', { exact: true }).selectOption('express')
  await formPanel.getByLabel('金额', { exact: true }).fill('18.50')
  await formPanel.getByLabel('币种', { exact: true }).fill('USD')
  await formPanel.getByLabel('承担方', { exact: true }).selectOption('company')
  await formPanel.getByLabel('费用备注', { exact: true }).fill('DHL 国际快递')
  await formPanel.getByLabel('寄样备注', { exact: true }).fill('端到端寄样审核')

  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/sample/deliveries') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await formPanel.getByRole('button', { name: '新增寄样单' }).click()
  await createResponse
  await page.getByText(deliveryCode).first().waitFor()
  await page.getByRole('cell', { name: '草稿' }).first().waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '寄样明细' })
  await detailPanel.getByRole('button', { name: '载入编辑' }).click()
  await formPanel.getByLabel('寄样备注', { exact: true }).fill('端到端寄样草稿编辑')
  const updateResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/sample/deliveries/') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '保存草稿编辑' }).click()
  await updateResponse
  await detailPanel.getByText('端到端寄样草稿编辑').waitFor()

  const submitResponse = page.waitForResponse((response) =>
    response.url().includes('/submit') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '提交审核' }).click()
  await submitResponse
  await page.getByRole('cell', { name: '待审核' }).first().waitFor()

  const approveResponse = page.waitForResponse((response) =>
    response.url().includes('/approve') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '审核通过' }).click()
  await approveResponse
  await page.getByRole('cell', { name: '已审核' }).first().waitFor()
  await detailPanel.getByRole('cell', { name: 'USD 18.50' }).first().waitFor()
  await detailPanel.getByRole('cell', { name: quoteNo }).first().waitFor()
  await detailPanel.getByText('样品寄样历史').waitFor()
  await detailPanel.getByText('报价关联寄样').waitFor()

  const refreshedSampleRecord = await page.evaluate(async ({ id }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const response = await fetch(`/api/v1/sample/records/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!response.ok) {
      throw new Error(await response.text())
    }
    const body = await response.json()
    return body.data
  }, { id: sampleRecord.id })

  assert.equal(refreshedSampleRecord.stock_summary.received_quantity, '5')
  assert.equal(refreshedSampleRecord.stock_summary.delivered_quantity, '2')
  assert.equal(refreshedSampleRecord.stock_summary.retained_quantity, '3')
  assert.ok(
    refreshedSampleRecord.stock_events.some((event) => event.delivery_no === deliveryCode),
    'approval should create a delivered stock event linked to the delivery',
  )
  assert.ok(
    (await page.getByText(deliveryCode).count()) >= 2,
    'approved delivery should appear in list and history sections',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Sample deliveries E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
