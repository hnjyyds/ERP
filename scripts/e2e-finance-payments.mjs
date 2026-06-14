import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-finance-payments.png')
const runId = Date.now()
const declarationNo = `CD-AP-E2E-${runId}`
const taxInvoiceNo = `VAT-AP-E2E-${runId}`
const supplierInvoiceNo = `SI-AP-E2E-${runId}`
const paymentRequestNo = `PR-AP-E2E-${runId}`
const purchaseContractId = `pc-ap-e2e-${runId}`
const purchaseContractNo = `PC-AP-E2E-${runId}`

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

  const notice = await page.evaluate(
    async ({ declarationNo, taxInvoiceNo, purchaseContractId, purchaseContractNo }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      async function expectOk(response) {
        if (!response.ok) throw new Error(await response.text())
        return (await response.json()).data
      }

      const generated = await expectOk(
        await fetch('/api/v1/purchase/invoice-notices/from-customs-declaration', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            customs_declaration_id: `cd-${declarationNo}`,
            customs_declaration_no: declarationNo,
            declaration_date: '2026-09-03',
            notice_date: '2026-09-04',
            currency: 'CNY',
            remarks: '付款管理端到端供应商发票前置数据',
            lines: [
              {
                supplier_id: 'supplier-pack-a',
                supplier_name: '华东包装制品厂',
                purchase_contract_id: purchaseContractId,
                purchase_contract_no: purchaseContractNo,
                product_id: 'product-bag',
                product_code: 'BAG-40',
                product_name: 'Eco Shopping Bag',
                customs_name: '环保购物袋',
                invoice_name: '无纺布购物袋',
                quantity: '1000',
                unit: 'pcs',
                amount: '3200.00',
                remark: '付款管理端到端供应商开票',
              },
            ],
          }),
        }),
      )

      const invoiceNotice = generated.items[0]
      return expectOk(
        await fetch(`/api/v1/purchase/invoice-notices/${invoiceNotice.id}/receive-tax-invoice`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ tax_invoice_no: taxInvoiceNo, received_at: '2026-09-09' }),
        }),
      )
    },
    { declarationNo, taxInvoiceNo, purchaseContractId, purchaseContractNo },
  )

  assert.equal(notice.status, 'received')
  assert.equal(notice.total_amount, '3200.00')

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
  await page.getByText('供应商发票列表').waitFor()
  await page.getByText('供应商发票登记').waitFor()
  await page.getByText('付款申请和审批').waitFor()
  await page.getByText('应付账款查询').waitFor()

  const supplierInvoiceForm = page.locator('.finance-payment-form-panel')
  await supplierInvoiceForm.getByLabel('供应商发票号').fill(supplierInvoiceNo)
  await supplierInvoiceForm.getByLabel('发票日期').fill('2026-09-09')
  await supplierInvoiceForm.getByLabel('供应商标识').fill(notice.supplier_id)
  await supplierInvoiceForm.getByLabel('供应商名称').fill(notice.supplier_name)
  await supplierInvoiceForm.getByLabel('开票通知标识').fill(notice.id)
  await supplierInvoiceForm.getByLabel('开票通知编号').fill(notice.code)
  await supplierInvoiceForm.getByLabel('采购合同标识').fill(purchaseContractId)
  await supplierInvoiceForm.getByLabel('采购合同号').fill(purchaseContractNo)
  await supplierInvoiceForm.getByLabel('发票金额').fill('3200.00')
  await supplierInvoiceForm.getByLabel('币种').fill('CNY')
  await supplierInvoiceForm.getByLabel('到期日').fill('2026-09-20')
  await supplierInvoiceForm.getByLabel('备注').fill('供应商税票登记端到端')

  const createSupplierInvoiceResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/finance/supplier-invoices') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await supplierInvoiceForm.getByRole('button', { name: '登记供应商发票' }).click()
  const supplierInvoice = (await (await createSupplierInvoiceResponse).json()).data
  assert.equal(supplierInvoice.invoice_no, supplierInvoiceNo)
  assert.equal(supplierInvoice.status, 'unpaid')
  await page.getByText(supplierInvoiceNo).first().waitFor()
  await page.locator('.finance-payment-list-panel .ant-tag').filter({ hasText: '未付款' }).first().waitFor()

  const paymentPanel = page.locator('.finance-payment-request-panel')
  await paymentPanel.getByLabel('付款申请号').fill(paymentRequestNo)
  await paymentPanel.getByLabel('供应商发票标识').fill(supplierInvoice.id)
  await paymentPanel.getByLabel('付款类别').selectOption('goods_payment')
  await paymentPanel.getByLabel('申请日期').fill('2026-09-10')
  await paymentPanel.getByLabel('申请金额').fill('1200.00')
  await paymentPanel.getByLabel('币种').fill('CNY')
  await paymentPanel.getByLabel('申请备注').fill('首笔货款端到端')

  const createPaymentRequestResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/finance/payment-requests') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await paymentPanel.getByRole('button', { name: '新增付款申请' }).click()
  const paymentRequest = (await (await createPaymentRequestResponse).json()).data
  assert.equal(paymentRequest.request_no, paymentRequestNo)
  assert.equal(paymentRequest.status, 'submitted')
  await paymentPanel.getByText(paymentRequestNo).waitFor()
  await paymentPanel.getByText(paymentRequestNo).click()

  await paymentPanel.getByLabel('审批金额').fill('1200.00')
  await paymentPanel.getByLabel('审批日期').fill('2026-09-11')
  await paymentPanel.getByLabel('审批人').fill('演示财务')
  await paymentPanel.getByLabel('付款账号').fill('BOC 8888')
  await paymentPanel.getByLabel('审批备注').fill('财务审批并付款')

  const approvePaymentResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/v1/finance/payment-requests/${paymentRequest.id}/approve`) &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await paymentPanel.getByRole('button', { name: '审批付款' }).click()
  const approvedRequest = (await (await approvePaymentResponse).json()).data
  assert.equal(approvedRequest.status, 'approved')
  assert.equal(approvedRequest.paid_amount, '1200.00')
  await paymentPanel.locator('.ant-tag').filter({ hasText: '已审批' }).first().waitFor()

  const payablePanel = page.locator('.finance-payable-panel')
  await payablePanel.getByLabel('采购合同号').fill(purchaseContractNo)
  const payableResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/v1/finance/payables' &&
      url.searchParams.get('purchase_contract_no') === purchaseContractNo &&
      response.ok()
    )
  })
  await payablePanel.getByRole('button', { name: '查询' }).click()
  const payables = (await (await payableResponse).json()).data
  assert.equal(payables.total, 1)
  assert.equal(payables.items[0].invoice_no, supplierInvoiceNo)
  assert.equal(payables.items[0].paid_amount, '1200.00')
  assert.equal(payables.items[0].payable_amount, '2000.00')
  assert.equal(payables.items[0].status, 'partial')

  await payablePanel.getByText(supplierInvoiceNo).waitFor()
  await payablePanel.getByText('CNY 2,000.00').waitFor()
  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Finance payments E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
