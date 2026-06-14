import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-export-quotations.png')
const runId = Date.now()
const quoteNo = `QT-E2E-${runId}`
const contractNo = `EC-E2E-${runId}`
const sampleCode = `SM-QT-E2E-${runId}`
const deliveryCode = `SD-QT-E2E-${runId}`

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
        received_at: '2026-06-22',
        submitted_at: '2026-06-23',
        quantity: '5',
        unit: 'pcs',
        description: '出口报价前置寄样',
        images: [],
      }),
    })
    if (!response.ok) throw new Error(await response.text())
    return (await response.json()).data
  }, { code: sampleCode })

  await page.evaluate(async ({ deliveryCode: code, quoteNo: quotationNo, sampleRecordId, sampleCode: codeOfSample }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    const createResponse = await fetch('/api/v1/sample/deliveries', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code,
        delivery_date: '2026-06-25',
        customer_id: 'customer-euro-home',
        customer_name: '欧陆家居用品有限公司',
        supplier_id: 'supplier-pack',
        supplier_name: '华东包装制品厂',
        factory_id: 'factory-pack',
        factory_name: '华东包装制品厂',
        recipient_name: 'Anna Schmidt',
        recipient_company: 'Euro Home Retail Ltd.',
        recipient_address: 'Hamburg Trade Center',
        express_company: 'DHL',
        tracking_no: `DHL-${quotationNo}`,
        quote_id: 'quote-e2e-ui',
        quote_no: quotationNo,
        remark: '出口报价页寄样关联',
        lines: [
          {
            sample_record_id: sampleRecordId,
            sample_code: codeOfSample,
            sample_type: 'confirm_sample',
            product_id: 'product-bag',
            product_code: 'BAG-40',
            product_name: 'Eco Shopping Bag',
            quantity: '2',
            unit: 'pcs',
            remark: '寄客户确认',
          },
        ],
        fees: [
          {
            fee_type: 'express',
            amount: '18.50',
            currency: 'USD',
            payer_type: 'company',
            remark: 'DHL',
          },
        ],
      }),
    })
    if (!createResponse.ok) throw new Error(await createResponse.text())
    const delivery = (await createResponse.json()).data
    const submitResponse = await fetch(`/api/v1/sample/deliveries/${delivery.id}/submit`, {
      method: 'POST',
      headers,
    })
    if (!submitResponse.ok) throw new Error(await submitResponse.text())
    const approveResponse = await fetch(`/api/v1/sample/deliveries/${delivery.id}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-06-25' }),
    })
    if (!approveResponse.ok) throw new Error(await approveResponse.text())
  }, {
    deliveryCode,
    quoteNo,
    sampleRecordId: sampleRecord.id,
    sampleCode: sampleRecord.code,
  })

  const listResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/sales/quotations') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await page.getByRole('link', { name: '出口报价' }).click()
  await listResponse
  await page.getByRole('heading', { name: '出口报价和历史参考' }).waitFor()

  const formPanel = page.locator('.product-form-panel').filter({ hasText: '新增出口报价' })
  await formPanel.getByLabel('报价单号', { exact: true }).fill(quoteNo)
  await formPanel.getByLabel('报价日期', { exact: true }).fill('2026-07-01')
  await formPanel.getByLabel('客户标识', { exact: true }).fill('customer-euro-home')
  await formPanel.getByLabel('客户名称', { exact: true }).fill('欧陆家居用品有限公司')
  await formPanel.getByLabel('业务员', { exact: true }).fill('演示业务主管')
  await formPanel.getByLabel('币种', { exact: true }).fill('USD')
  await formPanel.getByLabel('贸易条款', { exact: true }).fill('FOB Ningbo')
  await formPanel.getByLabel('有效期', { exact: true }).fill('2026-07-15')
  await formPanel.getByLabel('报价描述', { exact: true }).fill('出口报价端到端首单')
  await formPanel.getByLabel('商品标识', { exact: true }).fill('product-bag')
  await formPanel.getByLabel('商品编号', { exact: true }).fill('BAG-40')
  await formPanel.getByLabel('商品名称', { exact: true }).fill('Eco Shopping Bag')
  await formPanel.getByLabel('规格', { exact: true }).fill('40x35cm')
  await formPanel.getByLabel('型号', { exact: true }).fill('BAG-40')
  await formPanel.getByLabel('数量', { exact: true }).fill('1000')
  await formPanel.getByLabel('单位', { exact: true }).fill('pcs')
  await formPanel.getByLabel('销售单价', { exact: true }).fill('1.25')
  await formPanel.getByLabel('货运方式', { exact: true }).selectOption('sea')
  await formPanel.getByLabel('运费', { exact: true }).fill('120.00')
  await formPanel.getByLabel('采购参考供应商', { exact: true }).fill('华东包装制品厂')
  await formPanel.getByLabel('采购参考价', { exact: true }).fill('0.82')
  await formPanel.getByLabel('明细备注', { exact: true }).fill('首单报价')

  const createQuotationResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/sales/quotations') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await formPanel.getByRole('button', { name: '新增出口报价' }).click()
  await createQuotationResponse
  await page.getByText(quoteNo).first().waitFor()
  await page.getByRole('cell', { name: '草稿' }).first().waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '报价单明细' })
  await detailPanel.getByRole('button', { name: '载入编辑' }).click()
  await formPanel.getByLabel('报价描述', { exact: true }).fill('出口报价端到端草稿编辑')
  const updateQuotationResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/sales/quotations/') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '保存草稿编辑' }).click()
  await updateQuotationResponse
  await detailPanel.getByText('出口报价端到端草稿编辑').waitFor()

  const submitQuotationResponse = page.waitForResponse((response) =>
    response.url().includes('/submit') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '提交审批' }).click()
  await submitQuotationResponse
  await page.getByRole('cell', { name: '待审批' }).first().waitFor()

  const approveQuotationResponse = page.waitForResponse((response) =>
    response.url().includes('/approve') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '审批通过' }).click()
  await approveQuotationResponse
  await page.getByRole('cell', { name: '已审批' }).first().waitFor()
  await detailPanel.getByText('USD 1,370.00').first().waitFor()
  await detailPanel.getByText('历史报价').waitFor()
  await detailPanel.getByText('采购询价参考').waitFor()
  await detailPanel.getByText('寄样关联').waitFor()
  await detailPanel.getByRole('cell', { name: deliveryCode }).waitFor()

  const exportResponse = page.waitForResponse((response) =>
    response.url().includes('/export?format=pdf') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '导出 PDF' }).click()
  await exportResponse
  await detailPanel.getByText('EXPORT QUOTATION').waitFor()

  await detailPanel.getByLabel('合同号', { exact: true }).fill(contractNo)
  const contractResponse = page.waitForResponse((response) =>
    response.url().includes('/confirm-contract') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '生成出口合同' }).click()
  await contractResponse
  await page.getByText(contractNo).first().waitFor()

  assert.ok((await page.getByText(quoteNo).count()) >= 2, 'quotation should appear in page')
  assert.ok((await page.getByText('华东包装制品厂').count()) >= 1, 'purchase reference should show')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Export quotations E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
