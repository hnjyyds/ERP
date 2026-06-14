import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-export-contracts.png')
const runId = Date.now()
const contractNo = `EC-E2E-${runId}`
const quoteNo = `QT-E2E-${runId}`
const historicalQuoteNo = `QT-HIST-E2E-${runId}`
const paymentNo = `AR-E2E-${runId}`
const signatureFileNo = `SIGN-E2E-${runId}`

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

  await page.evaluate(async ({ quoteNo }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    const createResponse = await fetch('/api/v1/sales/quotations', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: quoteNo,
        quote_date: '2026-07-01',
        customer_id: 'customer-euro-home',
        customer_name: '欧陆家居用品有限公司',
        sales_user_id: 'u-001',
        sales_user_name: '演示业务主管',
        currency: 'USD',
        trade_term: 'FOB Ningbo',
        valid_until: '2026-07-15',
        description: '出口合同页历史询报价参考',
        lines: [
          {
            product_id: 'product-bag',
            product_code: 'BAG-40',
            product_name: 'Eco Shopping Bag',
            specification: '40x35cm',
            model: 'BAG-40',
            quantity: '800',
            unit: 'pcs',
            unit_price: '1.32',
            freight_method: 'sea',
            freight_amount: '90.00',
            purchase_reference_supplier_name: '华东包装制品厂',
            purchase_reference_price: '0.80',
            remark: '合同前历史报价',
          },
        ],
      }),
    })
    if (!createResponse.ok) throw new Error(await createResponse.text())
    const quotation = (await createResponse.json()).data
    const submitResponse = await fetch(`/api/v1/sales/quotations/${quotation.id}/submit`, {
      method: 'POST',
      headers,
    })
    if (!submitResponse.ok) throw new Error(await submitResponse.text())
    const approveResponse = await fetch(`/api/v1/sales/quotations/${quotation.id}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-07-02' }),
    })
    if (!approveResponse.ok) throw new Error(await approveResponse.text())
  }, { quoteNo: historicalQuoteNo })

  const contractMenu = page.getByLabel('主导航').getByRole('link', { name: '出口合同' })
  await contractMenu.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/v1/sales/contracts') &&
      response.request().method() === 'GET' &&
      response.ok(),
    ),
    contractMenu.click(),
  ])
  await page.getByRole('heading', { name: '出口合同和履约跟踪' }).waitFor()

  const formPanel = page.locator('.product-form-panel').filter({ hasText: '新增出口合同' })
  await formPanel.getByLabel('合同号', { exact: true }).fill(contractNo)
  await formPanel.getByLabel('合同日期', { exact: true }).fill('2026-07-03')
  await formPanel.getByLabel('客户标识', { exact: true }).fill('customer-euro-home')
  await formPanel.getByLabel('客户名称', { exact: true }).fill('欧陆家居用品有限公司')
  await formPanel.getByLabel('业务员', { exact: true }).fill('演示业务主管')
  await formPanel.getByLabel('币种', { exact: true }).fill('USD')
  await formPanel.getByLabel('贸易条款', { exact: true }).fill('FOB Ningbo')
  await formPanel.getByLabel('计划出运日', { exact: true }).fill('2026-08-10')
  await formPanel.getByLabel('付款条款', { exact: true }).fill('30% T/T in advance, balance before shipment')
  await formPanel.getByLabel('来源报价号', { exact: true }).fill(quoteNo)
  await formPanel.getByLabel('来源报价标识', { exact: true }).fill('quote-e2e-ui')
  await formPanel.getByLabel('合同备注', { exact: true }).fill('出口合同端到端首单')
  await formPanel.getByLabel('商品标识', { exact: true }).fill('product-bag')
  await formPanel.getByLabel('商品编号', { exact: true }).fill('BAG-40')
  await formPanel.getByLabel('商品名称', { exact: true }).fill('Eco Shopping Bag')
  await formPanel.getByLabel('规格', { exact: true }).fill('40x35cm')
  await formPanel.getByLabel('型号', { exact: true }).fill('BAG-40')
  await formPanel.getByLabel('数量', { exact: true }).fill('1000')
  await formPanel.getByLabel('单位', { exact: true }).fill('pcs')
  await formPanel.getByLabel('销售单价', { exact: true }).fill('1.40')
  await formPanel.getByLabel('已采购数量', { exact: true }).fill('400')
  await formPanel.getByLabel('已出货数量', { exact: true }).fill('250')
  await formPanel.getByLabel('商品图片', { exact: true }).fill('https://images.unsplash.com/photo-1542291026-7eec264c27ff')
  await formPanel.getByLabel('明细备注', { exact: true }).fill('首单出口合同')

  const createContractResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/sales/contracts') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await formPanel.getByRole('button', { name: '新增出口合同' }).click()
  await createContractResponse
  await page.getByText(contractNo).first().waitFor()
  await page.getByRole('cell', { name: '草稿' }).first().waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '合同明细' })
  await detailPanel.getByText('USD 1,400.00').first().waitFor()
  await detailPanel.getByText('部分完成').first().waitFor()
  await detailPanel.getByText('历史询报价参考').waitFor()
  await detailPanel.getByRole('cell', { name: historicalQuoteNo }).waitFor()
  await detailPanel.getByRole('button', { name: '载入编辑' }).click()
  await formPanel.getByLabel('付款条款', { exact: true }).fill('LC at sight')
  await formPanel.getByLabel('销售单价', { exact: true }).fill('1.50')
  const updateContractResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/sales/contracts/') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '保存草稿编辑' }).click()
  await updateContractResponse
  await detailPanel.getByText('LC at sight').waitFor()
  await detailPanel.getByText('USD 1,500.00').first().waitFor()

  await detailPanel.getByLabel('回签人', { exact: true }).fill('Anna Schmidt')
  await detailPanel.getByLabel('回签日期', { exact: true }).fill('2026-07-04')
  await detailPanel.getByLabel('回签方式', { exact: true }).fill('email_scan')
  await detailPanel.getByLabel('回签文件号', { exact: true }).fill(signatureFileNo)
  await detailPanel.getByLabel('回签备注', { exact: true }).fill('客户邮件回签')
  const signatureResponse = page.waitForResponse((response) =>
    response.url().includes('/signature') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '登记回签' }).click()
  await signatureResponse
  await detailPanel.getByText(signatureFileNo).waitFor()
  await detailPanel.getByText('已回签').first().waitFor()

  await detailPanel.getByLabel('水单号', { exact: true }).fill(paymentNo)
  await detailPanel.getByLabel('收款日期', { exact: true }).fill('2026-07-05')
  await detailPanel.getByLabel('金额', { exact: true }).fill('300.00')
  await detailPanel.getByLabel('付款方', { exact: true }).fill('Euro Home Retail Ltd.')
  await detailPanel.getByLabel('收款备注', { exact: true }).fill('30% 预收款')
  const paymentResponse = page.waitForResponse((response) =>
    response.url().includes('/advance-payments') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await detailPanel.getByRole('button', { name: '关联预收款' }).click()
  await paymentResponse
  await detailPanel.getByText(paymentNo).waitFor()
  await detailPanel.getByText('USD 300.00').first().waitFor()

  const submitContractResponse = page.waitForResponse((response) =>
    response.url().includes('/submit') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '提交审批' }).click()
  await submitContractResponse
  await page.getByRole('cell', { name: '待审批' }).first().waitFor()

  const approveContractResponse = page.waitForResponse((response) =>
    response.url().includes('/approve') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '审批通过' }).click()
  await approveContractResponse
  await page.getByRole('cell', { name: '已审批' }).first().waitFor()

  const exportResponse = page.waitForResponse((response) =>
    response.url().includes('/export?format=pdf') &&
    response.request().method() === 'GET' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '导出 PDF' }).click()
  const exportResult = await exportResponse
  const exportPayload = await exportResult.json()
  assert.ok(
    exportPayload.data.content.includes('EXPORT CONTRACT'),
    'export payload should include contract preview content',
  )
  await page.getByText(`已生成合同导出预览 ${contractNo}.pdf`).waitFor()
  const exportPreview = detailPanel.locator('.transaction-box pre')
  await exportPreview.waitFor({ state: 'attached' })
  assert.ok(
    (await exportPreview.textContent())?.includes('EXPORT CONTRACT'),
    'export preview should render contract content',
  )

  assert.ok((await page.getByText(contractNo).count()) >= 2, 'contract should appear in page')
  assert.ok((await page.getByText('合同采购情况').count()) >= 1, 'purchase status should show')
  assert.ok((await page.getByText('合同出货情况').count()) >= 1, 'shipment status should show')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Export contracts E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
