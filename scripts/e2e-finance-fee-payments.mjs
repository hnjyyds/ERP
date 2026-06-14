import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-finance-fee-payments.png')
const runId = Date.now()
const partnerCode = `P-FEE-E2E-${runId}`
const contractNo = `EC-FEE-E2E-${runId}`
const shipmentNo = `SP-FEE-E2E-${runId}`
const feeInvoiceNo = `PFI-FEE-E2E-${runId}`
const feePaymentRequestNo = `FPR-FEE-E2E-${runId}`

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

  const businessLoginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await businessLoginResponse

  const setup = await page.evaluate(
    async ({ partnerCode, contractNo, shipmentNo }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      async function expectOk(response) {
        if (!response.ok) throw new Error(await response.text())
        return (await response.json()).data
      }

      const partner = await expectOk(
        await fetch('/api/v1/masterdata/partners', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: partnerCode,
            cn_name: '远航国际货代',
            en_name: 'Ocean Link Forwarding',
            partner_type: 'freight_forwarder',
            country: 'China',
            address: 'Shanghai Port Service Center',
            website: 'https://example.com/ocean-link',
            status: 'active',
            contacts: [
              {
                name: 'Grace Lin',
                title: 'Operation Manager',
                email: 'grace@example.com',
                phone: '+86-21-0000',
                is_primary: true,
              },
            ],
          }),
        }),
      )

      const contract = await expectOk(
        await fetch('/api/v1/sales/contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: contractNo,
            contract_date: '2026-10-01',
            customer_id: 'customer-euro-home',
            customer_name: '欧陆家居用品有限公司',
            sales_user_id: 'u-001',
            sales_user_name: '演示业务主管',
            currency: 'USD',
            trade_term: 'FOB Ningbo',
            planned_ship_date: '2026-10-30',
            payment_terms: '30% T/T in advance, balance before shipment',
            source_quotation_id: `quotation-${contractNo}`,
            source_quotation_no: `QT-${contractNo}`,
            remarks: '付费管理端到端前置出口合同',
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
                remark: '付费管理端到端合同',
              },
            ],
          }),
        }),
      )

      await expectOk(
        await fetch(`/api/v1/sales/contracts/${contract.id}/submit`, {
          method: 'POST',
          headers,
        }),
      )
      await expectOk(
        await fetch(`/api/v1/sales/contracts/${contract.id}/approve`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-10-02' }),
        }),
      )

      const shipment = await expectOk(
        await fetch('/api/v1/sales/shipments/from-contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: shipmentNo,
            shipment_date: '2026-10-25',
            planned_ship_date: '2026-10-30',
            shipping_method: 'sea',
            port_of_loading: 'Ningbo',
            port_of_destination: 'Hamburg',
            vessel_name: 'COSCO Star',
            container_no: `CONT-${shipmentNo}`,
            booking_no: `BOOK-${shipmentNo}`,
            document_owner_name: '单证部',
            estimated_payable_amount: '420.00',
            remarks: '付费管理端到端前置出货单',
            selections: [{ contract_id: contract.id, quantity: '50' }],
          }),
        }),
      )

      await expectOk(
        await fetch(`/api/v1/sales/shipments/${shipment.id}/submit`, {
          method: 'POST',
          headers,
        }),
      )
      const approvedShipment = await expectOk(
        await fetch(`/api/v1/sales/shipments/${shipment.id}/approve`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-10-26' }),
        }),
      )

      return { partner, shipment: approvedShipment }
    },
    { partnerCode, contractNo, shipmentNo },
  )

  assert.equal(setup.partner.code, partnerCode)
  assert.equal(setup.shipment.code, shipmentNo)
  assert.equal(setup.shipment.approval_status, 'approved')

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
  await page.getByRole('heading', { name: '合作伙伴费用发票' }).waitFor()
  await page.getByText('费用发票登记').waitFor()
  await page.getByText('付费申请和审批').waitFor()
  await page.getByText('应付费用查询').waitFor()

  const feeInvoiceForm = page.locator('.finance-fee-form-panel')
  await feeInvoiceForm.getByLabel('费用发票号').fill(feeInvoiceNo)
  await feeInvoiceForm.getByLabel('发票日期').fill('2026-10-27')
  await feeInvoiceForm.getByLabel('合作伙伴标识').fill(setup.partner.id)
  await feeInvoiceForm.getByLabel('合作伙伴名称').fill(setup.partner.cn_name)
  await feeInvoiceForm.getByLabel('合作伙伴类型').selectOption('freight_forwarder')
  await feeInvoiceForm.getByLabel('费用类型').selectOption('freight')
  await feeInvoiceForm.getByLabel('出运单标识').fill(setup.shipment.id)
  await feeInvoiceForm.getByLabel('出运单号').fill(setup.shipment.code)
  await feeInvoiceForm.getByLabel('业务员标识').fill('u-001')
  await feeInvoiceForm.getByLabel('业务员姓名').fill('演示业务主管')
  await feeInvoiceForm.getByLabel('发票金额').fill('980.00')
  await feeInvoiceForm.getByLabel('币种').fill('USD')
  await feeInvoiceForm.getByLabel('到期日').fill('2026-11-05')
  await feeInvoiceForm.getByLabel('备注').fill('货代运费发票端到端')

  const createFeeInvoiceResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/finance/partner-fee-invoices') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await feeInvoiceForm.getByRole('button', { name: '登记费用发票' }).click()
  const feeInvoice = (await (await createFeeInvoiceResponse).json()).data
  assert.equal(feeInvoice.invoice_no, feeInvoiceNo)
  assert.equal(feeInvoice.status, 'unpaid')
  assert.equal(feeInvoice.fee_type, 'freight')
  await page.getByText(feeInvoiceNo).first().waitFor()
  await page.locator('.finance-fee-list-panel .ant-tag').filter({ hasText: '未付款' }).first().waitFor()

  const feePaymentPanel = page.locator('.finance-fee-request-panel')
  await feePaymentPanel.getByLabel('付费申请号').fill(feePaymentRequestNo)
  await feePaymentPanel.getByLabel('费用发票标识').fill(feeInvoice.id)
  await feePaymentPanel.getByLabel('申请日期').fill('2026-10-28')
  await feePaymentPanel.getByLabel('申请金额').fill('400.00')
  await feePaymentPanel.getByLabel('币种').fill('USD')
  await feePaymentPanel.getByLabel('申请备注').fill('首笔货代费端到端')

  const createFeePaymentRequestResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/finance/fee-payment-requests') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await feePaymentPanel.getByRole('button', { name: '新增付费申请' }).click()
  const feePaymentRequest = (await (await createFeePaymentRequestResponse).json()).data
  assert.equal(feePaymentRequest.request_no, feePaymentRequestNo)
  assert.equal(feePaymentRequest.status, 'submitted')
  await feePaymentPanel.getByText(feePaymentRequestNo).waitFor()
  await feePaymentPanel.getByText(feePaymentRequestNo).click()

  await feePaymentPanel.getByLabel('审批金额').fill('400.00')
  await feePaymentPanel.getByLabel('审批日期').fill('2026-10-29')
  await feePaymentPanel.getByLabel('审批人').fill('演示财务')
  await feePaymentPanel.getByLabel('付款账号').fill('BOC 8899')
  await feePaymentPanel.getByLabel('审批备注').fill('财务审批付费')

  const approveFeePaymentResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/v1/finance/fee-payment-requests/${feePaymentRequest.id}/approve`) &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await feePaymentPanel.getByRole('button', { name: '审批付费' }).click()
  const approvedRequest = (await (await approveFeePaymentResponse).json()).data
  assert.equal(approvedRequest.status, 'approved')
  assert.equal(approvedRequest.paid_amount, '400.00')
  await feePaymentPanel.locator('.ant-tag').filter({ hasText: '已审批' }).first().waitFor()

  const feePayablePanel = page.locator('.finance-fee-payable-panel')
  await feePayablePanel.getByLabel('出运单号').fill(setup.shipment.code)
  const feePayableResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/v1/finance/fee-payables' &&
      url.searchParams.get('shipment_no') === setup.shipment.code &&
      response.ok()
    )
  })
  await feePayablePanel.getByRole('button', { name: '查询' }).click()
  const feePayables = (await (await feePayableResponse).json()).data
  assert.equal(feePayables.total, 1)
  assert.equal(feePayables.items[0].invoice_no, feeInvoiceNo)
  assert.equal(feePayables.items[0].paid_amount, '400.00')
  assert.equal(feePayables.items[0].payable_amount, '580.00')
  assert.equal(feePayables.items[0].status, 'partial')

  await feePayablePanel.getByText(feeInvoiceNo).waitFor()
  await feePayablePanel.getByText('USD 580.00').waitFor()
  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Finance fee payments E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
