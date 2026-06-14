import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-purchase-inquiries.png')
const runId = Date.now()
const inquiryNo = `PI-E2E-${runId}`
const sampleCode = `SM-PI-E2E-${runId}`
const quoteNo = `QT-PI-E2E-${runId}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1850 } })

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

  await page.evaluate(async ({ sampleCode }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const response = await fetch('/api/v1/sample/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        code: sampleCode,
        sample_type: 'confirm_sample',
        status: 'registered',
        product_id: 'product-bag',
        product_code: 'BAG-40',
        product_name: 'Eco Shopping Bag',
        customer_id: null,
        customer_name: null,
        supplier_id: 'supplier-pack-a',
        supplier_name: '华东包装制品厂',
        supplier_sku: 'PACK-A-40',
        received_at: '2026-07-28',
        submitted_at: null,
        quantity: '3',
        unit: 'pcs',
        description: '采购询价前供应商样品',
        images: [],
      }),
    })
    if (!response.ok) throw new Error(await response.text())
  }, { sampleCode })

  const inquiryMenu = page.getByLabel('主导航').getByRole('link', { name: '采购询价' })
  await inquiryMenu.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/purchase/inquiries' &&
        response.request().method() === 'GET' &&
        response.ok()
      )
    }),
    inquiryMenu.click(),
  ])
  await page.getByRole('heading', { name: '采购询价和供应商报价' }).waitFor()

  const formPanel = page.locator('.product-form-panel')
  await formPanel.getByLabel('询价单号', { exact: true }).fill(inquiryNo)
  await formPanel.getByLabel('询价日期', { exact: true }).fill('2026-08-01')
  await formPanel.getByLabel('业务员标识', { exact: true }).fill('u-001')
  await formPanel.getByLabel('业务员', { exact: true }).fill('演示业务主管')
  await formPanel.getByLabel('商品标识', { exact: true }).fill('product-bag')
  await formPanel.getByLabel('商品编号', { exact: true }).fill('BAG-40')
  await formPanel.getByLabel('商品名称', { exact: true }).fill('Eco Shopping Bag')
  await formPanel.getByLabel('规格', { exact: true }).fill('40x35cm')
  await formPanel.getByLabel('型号', { exact: true }).fill('BAG-40')
  await formPanel.getByLabel('询价数量', { exact: true }).fill('1000')
  await formPanel.getByLabel('单位', { exact: true }).fill('pcs')
  await formPanel.getByLabel('询价备注', { exact: true }).fill('环保袋供应商询价')

  const createInquiryResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/purchase/inquiries') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await formPanel.getByRole('button', { name: '新增采购询价' }).click()
  await createInquiryResponse
  await page.getByText(inquiryNo).first().waitFor()
  await page.getByRole('cell', { name: '草稿' }).first().waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '询价明细' })
  await detailPanel.getByRole('button', { name: '载入编辑' }).click()
  await formPanel.getByRole('heading', { name: '编辑采购询价' }).waitFor()
  await formPanel.getByLabel('业务员标识', { exact: true }).fill('u-002')
  await formPanel.getByLabel('业务员', { exact: true }).fill('采购专员')
  await formPanel.getByLabel('询价数量', { exact: true }).fill('1200')
  await formPanel.getByLabel('询价备注', { exact: true }).fill('编辑后的环保袋采购询价')
  const updateInquiryResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/v1/purchase/inquiries/`) &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '保存草稿编辑' }).click()
  await updateInquiryResponse
  await detailPanel.getByText('采购专员').waitFor()
  await detailPanel.getByRole('cell', { name: '1200' }).waitFor()

  const supplierQuotationTable = detailPanel
    .locator('.accessory-heading')
    .filter({ hasText: '供应商报价比较' })
    .locator('xpath=following-sibling::table[1]')
  const supplierSampleTable = detailPanel
    .locator('.accessory-heading')
    .filter({ hasText: '供应商样品关联' })
    .locator('xpath=following-sibling::table[1]')
  await detailPanel.getByLabel('模板名称', { exact: true }).fill('标准采购询价模板')
  await detailPanel.getByLabel('收件邮箱', { exact: true }).fill('supplier@example.com')
  const templateResponse = page.waitForResponse((response) =>
    response.url().includes('/send-template') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '发送询价模板' }).click()
  await templateResponse
  await detailPanel.getByText('询价模板预览').waitFor()
  await detailPanel.getByText('Eco Shopping Bag').first().waitFor()

  await detailPanel.getByLabel('供应商标识', { exact: true }).fill('supplier-pack-a')
  await detailPanel.getByLabel('供应商名称', { exact: true }).fill('华东包装制品厂')
  await detailPanel.getByLabel('报价日期', { exact: true }).fill('2026-08-02')
  await detailPanel.getByLabel('单价', { exact: true }).fill('0.78')
  await detailPanel.getByLabel('币种', { exact: true }).fill('USD')
  await detailPanel.getByLabel('交期天数', { exact: true }).fill('18')
  await detailPanel.getByLabel('最小起订量', { exact: true }).fill('800')
  await detailPanel.getByLabel('可提供样品', { exact: true }).check()
  await detailPanel.getByLabel('报价备注', { exact: true }).fill('含环保包装')
  const quoteAResponse = page.waitForResponse((response) =>
    response.url().includes('/quotations') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await detailPanel.getByRole('button', { name: '登记供应商报价' }).click()
  await quoteAResponse
  await detailPanel.getByText('已报价 / 2026-08-01').waitFor()
  await supplierQuotationTable
    .getByRole('row')
    .filter({ hasText: '华东包装制品厂' })
    .filter({ hasText: 'USD 0.78' })
    .filter({ hasText: '有样品' })
    .waitFor()
  await supplierSampleTable.getByRole('cell', { name: sampleCode }).waitFor()

  await detailPanel.getByLabel('供应商标识', { exact: true }).fill('supplier-pack-b')
  await detailPanel.getByLabel('供应商名称', { exact: true }).fill('宁波成品包装厂')
  await detailPanel.getByLabel('报价日期', { exact: true }).fill('2026-08-02')
  await detailPanel.getByLabel('单价', { exact: true }).fill('0.82')
  await detailPanel.getByLabel('交期天数', { exact: true }).fill('15')
  await detailPanel.getByLabel('最小起订量', { exact: true }).fill('1000')
  await detailPanel.getByLabel('可提供样品', { exact: true }).uncheck()
  await detailPanel.getByLabel('报价备注', { exact: true }).fill('交期更短')
  const quoteBResponse = page.waitForResponse((response) =>
    response.url().includes('/quotations') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await detailPanel.getByRole('button', { name: '登记供应商报价' }).click()
  await quoteBResponse
  await supplierQuotationTable
    .getByRole('row')
    .filter({ hasText: '宁波成品包装厂' })
    .filter({ hasText: 'USD 0.82' })
    .waitFor()

  await page.evaluate(async ({ quoteNo }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    const response = await fetch('/api/v1/sales/quotations', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: quoteNo,
        quote_date: '2026-08-03',
        customer_id: 'customer-euro-home',
        customer_name: '欧陆家居用品有限公司',
        sales_user_id: 'u-001',
        sales_user_name: '演示业务主管',
        currency: 'USD',
        trade_term: 'FOB Ningbo',
        valid_until: '2026-08-20',
        description: '采购询价参考价联动',
        lines: [
          {
            product_id: 'product-bag',
            product_code: 'BAG-40',
            product_name: 'Eco Shopping Bag',
            specification: '40x35cm',
            model: 'BAG-40',
            quantity: '1000',
            unit: 'pcs',
            unit_price: '1.30',
            freight_method: 'sea',
            freight_amount: '120.00',
            purchase_reference_supplier_name: '华东包装制品厂',
            purchase_reference_price: '0.78',
            remark: '引用采购询价价',
          },
        ],
      }),
    })
    if (!response.ok) throw new Error(await response.text())
  }, { quoteNo })

  const quotationMenu = page.getByLabel('主导航').getByRole('link', { name: '出口报价' })
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/v1/sales/quotations') &&
      response.request().method() === 'GET' &&
      response.ok(),
    ),
    quotationMenu.click(),
  ])
  await page.getByRole('heading', { name: '出口报价和历史参考' }).waitFor()
  await page.getByText(quoteNo).first().waitFor()
  const quotationDetail = page.locator('.product-detail-panel').filter({ hasText: '报价单明细' })
  const purchaseReferenceTable = quotationDetail
    .locator('.accessory-heading')
    .filter({ hasText: '采购询价参考' })
    .locator('xpath=following-sibling::table[1]')
  await quotationDetail.getByText('采购询价参考', { exact: true }).waitFor()
  await purchaseReferenceTable
    .getByRole('row')
    .filter({ has: page.getByRole('cell', { name: inquiryNo, exact: true }) })
    .filter({ hasText: 'USD 0.78' })
    .waitFor()

  assert.ok((await page.getByText(inquiryNo).count()) >= 1, 'purchase inquiry should be visible')
  assert.ok((await page.getByText('华东包装制品厂').count()) >= 1, 'supplier quote should be visible')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Purchase inquiries E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
