import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-finance-tax-refunds.png')
const runId = Date.now()
const contractNo = `EC-TAX-E2E-${runId}`
const shipmentNo = `SP-TAX-E2E-${runId}`
const documentNo = `VD-TAX-E2E-${runId}`
const customsDeclarationNo = `CD-TAX-E2E-${runId}`
const customsReceiptNo = `CR-TAX-E2E-${runId}`
const verificationNo = `VERIFY-TAX-E2E-${runId}`
const refundNo = `TR-TAX-E2E-${runId}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1900 } })

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

  const shipment = await page.evaluate(
    async ({ contractNo, shipmentNo }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      async function expectOk(response) {
        if (!response.ok) throw new Error(await response.text())
        return (await response.json()).data
      }

      const contract = await expectOk(
        await fetch('/api/v1/sales/contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: contractNo,
            contract_date: '2026-11-01',
            customer_id: 'customer-euro-home',
            customer_name: '欧陆家居用品有限公司',
            sales_user_id: 'u-001',
            sales_user_name: '演示业务主管',
            currency: 'USD',
            trade_term: 'FOB Ningbo',
            planned_ship_date: '2026-11-30',
            payment_terms: '30% T/T in advance, balance before shipment',
            source_quotation_id: `quotation-${contractNo}`,
            source_quotation_no: `QT-${contractNo}`,
            remarks: '核销退税端到端前置合同',
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
                remark: '核销退税端到端合同',
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
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-11-02' }),
        }),
      )

      const shipment = await expectOk(
        await fetch('/api/v1/sales/shipments/from-contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: shipmentNo,
            shipment_date: '2026-11-25',
            planned_ship_date: '2026-11-30',
            shipping_method: 'sea',
            port_of_loading: 'Ningbo',
            port_of_destination: 'Hamburg',
            vessel_name: 'COSCO Star',
            container_no: `CONT-${shipmentNo}`,
            booking_no: `BOOK-${shipmentNo}`,
            document_owner_name: '单证部',
            estimated_payable_amount: '420.00',
            remarks: '核销退税端到端前置出货单',
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
      return expectOk(
        await fetch(`/api/v1/sales/shipments/${shipment.id}/approve`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-11-26' }),
        }),
      )
    },
    { contractNo, shipmentNo },
  )

  assert.equal(shipment.code, shipmentNo)
  assert.equal(shipment.approval_status, 'approved')

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
  await page.getByRole('heading', { name: '核销单列表' }).waitFor()
  await page.getByText('核销单领用').waitFor()
  await page.getByText('回单、核销和退税登记').waitFor()
  await page.getByText('核销单使用情况查询').waitFor()

  const documentForm = page.locator('.finance-tax-form-panel')
  await documentForm.getByLabel('核销单号').fill(documentNo)
  await documentForm.getByLabel('领用日期').fill('2026-11-27')
  await documentForm.getByLabel('出运单标识').fill(shipment.id)
  await documentForm.getByLabel('出运单号').fill(shipment.code)
  await documentForm.getByLabel('业务员标识').fill('u-001')
  await documentForm.getByLabel('业务员姓名').fill('演示业务主管')
  await documentForm.getByLabel('客户名称').fill(shipment.customer_name)
  await documentForm.getByLabel('有效期至').fill('2026-12-27')
  await documentForm.getByLabel('可退税金额').fill('96.00')
  await documentForm.getByLabel('币种').fill('USD')
  await documentForm.getByLabel('备注').fill('核销单领用端到端')

  const createDocumentResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/finance/verification-documents') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await documentForm.getByRole('button', { name: '领用核销单' }).click()
  const document = (await (await createDocumentResponse).json()).data
  assert.equal(document.document_no, documentNo)
  assert.equal(document.status, 'issued')
  assert.equal(document.reminder_date, '2026-12-20')
  await page.getByText(documentNo).first().waitFor()

  const processPanel = page.locator('.finance-tax-process-panel')
  await processPanel.getByLabel('报关单号').fill(customsDeclarationNo)
  await processPanel.getByLabel('回单号').fill(customsReceiptNo)
  await processPanel.getByLabel('回单日期').fill('2026-11-28')
  await processPanel.getByLabel('回单备注').fill('报关回单登记端到端')

  const customsResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/v1/finance/verification-documents/${document.id}/customs-receipt`) &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await processPanel.getByRole('button', { name: '登记回单' }).click()
  const customsRegistered = (await (await customsResponse).json()).data
  assert.equal(customsRegistered.status, 'customs_receipt_registered')
  assert.equal(customsRegistered.customs_receipt_no, customsReceiptNo)

  await processPanel.getByLabel('核销编号').fill(verificationNo)
  await processPanel.getByLabel('核销日期').fill('2026-12-01')
  await processPanel.getByLabel('核销备注').fill('核销登记端到端')

  const verifyResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/v1/finance/verification-documents/${document.id}/verify`) &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await processPanel.getByRole('button', { name: '登记核销' }).click()
  const verified = (await (await verifyResponse).json()).data
  assert.equal(verified.status, 'verified')
  assert.equal(verified.verification_no, verificationNo)
  assert.equal(verified.reminder_status, 'done')

  await processPanel.getByLabel('退税编号').fill(refundNo)
  await processPanel.getByLabel('退税日期').fill('2026-12-08')
  await processPanel.getByLabel('退税金额').fill('96.00')
  await processPanel.getByLabel('币种').fill('USD')
  await processPanel.getByLabel('银行水单号').fill(`BR-${refundNo}`)
  await processPanel.getByLabel('退税备注').fill('退税登记端到端')

  const refundResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/v1/finance/verification-documents/${document.id}/tax-refunds`) &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await processPanel.getByRole('button', { name: '登记退税' }).click()
  const refunded = (await (await refundResponse).json()).data
  assert.equal(refunded.status, 'refunded')
  assert.equal(refunded.refunded_amount, '96.00')
  assert.equal(refunded.refunds[0].refund_no, refundNo)
  await processPanel.getByText('已退税').waitFor()

  const usagePanel = page.locator('.finance-tax-usage-panel')
  await usagePanel.getByLabel('出运单号').fill(shipment.code)
  const usageResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/v1/finance/verification-usage' &&
      url.searchParams.get('shipment_no') === shipment.code &&
      response.ok()
    )
  })
  await usagePanel.getByRole('button', { name: '查询' }).click()
  const usage = (await (await usageResponse).json()).data
  assert.equal(usage.total, 1)
  assert.equal(usage.items[0].document_no, documentNo)
  assert.equal(usage.items[0].status, 'refunded')
  assert.equal(usage.items[0].refunded_amount, '96.00')

  await usagePanel.getByText(documentNo).waitFor()
  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Finance tax refunds E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
