import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-sales-customer-chain.png')
const runId = Date.now()
const customerCode = `C-CHAIN-${runId}`
const customerName = `销售闭环客户-${runId}`
const quoteNo = `QT-CHAIN-${runId}`
const contractNo = `EC-CHAIN-${runId}`
const shipmentNo = `SP-CHAIN-${runId}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })

async function login() {
  await page.goto(frontendUrl)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await page.getByLabel('用户名').waitFor()
  await page.getByLabel('用户名').fill('demo')
  await page.getByLabel('密码').fill('demo123')
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/v1/auth/login') && response.ok(),
    ),
    page.getByRole('button', { name: '登录' }).click(),
  ])
}

async function apiRequest(path, method = 'GET', body = null) {
  return page.evaluate(
    async ({ path, method, body }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const response = await fetch(path, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!response.ok) {
        throw new Error(`${method} ${path} ${response.status}: ${await response.text()}`)
      }
      return (await response.json()).data
    },
    { path, method, body },
  )
}

try {
  await login()

  const customer = await apiRequest('/api/v1/masterdata/customers', 'POST', {
    code: customerCode,
    cn_name: customerName,
    en_name: `Sales Chain Customer ${runId}`,
    country: 'Germany',
    address: 'Hamburg Trade Center',
    website: 'https://example.com/sales-chain',
    status: 'active',
    contacts: [
      {
        name: 'Anna Schmidt',
        title: 'Sourcing Manager',
        email: 'anna.chain@example.com',
        phone: '+49-40-0000',
        is_primary: true,
      },
    ],
    credit_profile: {
      credit_grade: 'A',
      credit_limit: '50000',
      currency: 'USD',
      payment_terms: 'T/T 30 days',
      risk_note: '销售主线闭环测试客户',
    },
  })

  const quotation = await apiRequest('/api/v1/sales/quotations', 'POST', {
    code: quoteNo,
    quote_date: '2026-07-01',
    customer_id: customer.id,
    customer_name: customer.cn_name,
    sales_user_id: 'u-001',
    sales_user_name: '演示业务主管',
    currency: 'USD',
    trade_term: 'FOB Ningbo',
    valid_until: '2026-07-15',
    description: '销售主线闭环报价',
    lines: [
      {
        product_id: 'product-bag',
        product_code: 'BAG-40',
        product_name: 'Eco Shopping Bag',
        specification: '40x35cm',
        model: 'BAG-40',
        quantity: '1000',
        unit: 'pcs',
        unit_price: '1.25',
        freight_method: 'sea',
        freight_amount: '120.00',
        purchase_reference_supplier_name: '华东包装制品厂',
        purchase_reference_price: '0.82',
        remark: '销售主线闭环测试',
      },
    ],
  })

  await apiRequest(`/api/v1/sales/quotations/${quotation.id}/submit`, 'POST')
  await apiRequest(`/api/v1/sales/quotations/${quotation.id}/approve`, 'POST', {
    reviewer_name: '演示业务主管',
    approved_at: '2026-07-02',
  })
  const generated = await apiRequest(
    `/api/v1/sales/quotations/${quotation.id}/confirm-contract`,
    'POST',
    {
      confirmed_at: '2026-07-03',
      contract_no: contractNo,
    },
  )

  await apiRequest(`/api/v1/sales/contracts/${generated.contract_id}/submit`, 'POST')
  await apiRequest(`/api/v1/sales/contracts/${generated.contract_id}/approve`, 'POST', {
    reviewer_name: '演示业务主管',
    approved_at: '2026-07-06',
  })

  const shipment = await apiRequest('/api/v1/sales/shipments/from-contracts', 'POST', {
    code: shipmentNo,
    shipment_date: '2026-08-18',
    planned_ship_date: '2026-08-20',
    shipping_method: 'sea',
    port_of_loading: 'Ningbo',
    port_of_destination: 'Hamburg',
    vessel_name: 'COSCO Star',
    container_no: `CONT-${runId}`,
    booking_no: `BOOK-${runId}`,
    document_owner_name: '单证部',
    estimated_payable_amount: '200.00',
    remarks: '销售主线闭环出货',
    selections: [{ contract_id: generated.contract_id, quantity: '300' }],
  })
  await apiRequest(`/api/v1/sales/shipments/${shipment.id}/submit`, 'POST')
  await apiRequest(`/api/v1/sales/shipments/${shipment.id}/approve`, 'POST', {
    reviewer_name: '演示业务主管',
    approved_at: '2026-08-19',
  })

  const customerListResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/masterdata/customers') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.goto(new URL('/masterdata/customers', frontendUrl).toString())
  await customerListResponse
  await page.getByText(customerCode).first().waitFor()
  await page.getByText(customerName).first().waitFor()
  await page.getByText(quoteNo).first().waitFor()
  await page.getByText(contractNo).first().waitFor()
  await page.getByText(shipmentNo).first().waitFor()

  const transactionTexts = await page
    .locator('.masterdata-detail-panel')
    .filter({ hasText: '业务记录' })
    .innerText()

  assert.ok(transactionTexts.includes(quoteNo), 'customer transactions should show quotation')
  assert.ok(transactionTexts.includes(contractNo), 'customer transactions should show contract')
  assert.ok(transactionTexts.includes(shipmentNo), 'customer transactions should show shipment')
  assert.ok(transactionTexts.includes(`出口报价 ${quoteNo}`), 'quotation summary should render')
  assert.ok(transactionTexts.includes(`出口合同 ${contractNo}`), 'contract summary should render')
  assert.ok(transactionTexts.includes(`出货明细 ${shipmentNo}`), 'shipment summary should render')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Sales customer chain E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
