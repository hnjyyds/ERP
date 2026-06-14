import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-finance.png')
const runId = Date.now()
const contractNo = `EC-FIN-E2E-${runId}`
const shipmentNo = `SP-FIN-E2E-${runId}`
const invoiceNoticeNo = `CD-FIN-E2E-${runId}`
const sampleRequestNo = `SR-FIN-E2E-${runId}`
const partnerCode = `P-FIN-E2E-${runId}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })

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

  const seeded = await page.evaluate(
    async ({ contractNo, shipmentNo, invoiceNoticeNo, sampleRequestNo, partnerCode }) => {
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
            contract_date: '2026-12-03',
            customer_id: 'customer-euro-home',
            customer_name: '欧陆家居用品有限公司',
            sales_user_id: 'u-001',
            sales_user_name: '演示业务主管',
            currency: 'USD',
            trade_term: 'FOB Ningbo',
            planned_ship_date: '2026-12-20',
            payment_terms: '30% T/T in advance, balance before shipment',
            source_quotation_id: `q-${contractNo.slice(-18)}`,
            source_quotation_no: `QT-${contractNo}`,
            remarks: '财务总览端到端前置合同',
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
                remark: '财务总览合同',
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
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-12-05' }),
        }),
      )

      const shipment = await expectOk(
        await fetch('/api/v1/sales/shipments/from-contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: shipmentNo,
            shipment_date: '2026-12-18',
            planned_ship_date: '2026-12-20',
            shipping_method: 'sea',
            port_of_loading: 'Ningbo',
            port_of_destination: 'Hamburg',
            vessel_name: 'COSCO Star',
            container_no: `CONT-${shipmentNo}`,
            booking_no: `BOOK-${shipmentNo}`,
            document_owner_name: '单证部',
            estimated_payable_amount: '40.00',
            remarks: '财务总览端到端出运',
            selections: [{ contract_id: contract.id, quantity: '10' }],
          }),
        }),
      )

      const noticeList = await expectOk(
        await fetch('/api/v1/purchase/invoice-notices/from-customs-declaration', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            customs_declaration_id: `cd-${invoiceNoticeNo}`,
            customs_declaration_no: invoiceNoticeNo,
            declaration_date: '2026-12-22',
            notice_date: '2026-12-23',
            currency: 'CNY',
            remarks: '财务总览端到端开票通知',
            lines: [
              {
                supplier_id: 'supplier-pack-a',
                supplier_name: '华东包装制品厂',
                purchase_contract_id: `pc-${invoiceNoticeNo}`,
                purchase_contract_no: `PC-${invoiceNoticeNo}`,
                product_id: 'product-bag',
                product_code: 'BAG-40',
                product_name: 'Eco Shopping Bag',
                customs_name: '环保购物袋',
                invoice_name: '无纺布购物袋',
                quantity: '100',
                unit: 'pcs',
                amount: '300.00',
                remark: '财务总览供应商开票',
              },
            ],
          }),
        }),
      )
      const notice = noticeList.items[0]
      await expectOk(
        await fetch(`/api/v1/purchase/invoice-notices/${notice.id}/send`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ sender_name: '演示业务主管', sent_at: '2026-12-24' }),
        }),
      )

      const sampleRequest = await expectOk(
        await fetch('/api/v1/sample/requests', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: sampleRequestNo,
            request_date: '2026-12-10',
            customer_id: 'customer-euro-home',
            customer_name: '欧陆家居用品有限公司',
            product_id: 'product-bag',
            product_code: 'BAG-40',
            product_name: 'Eco Shopping Bag',
            supplier_id: 'supplier-pack',
            supplier_name: '华东包装制品厂',
            sales_user_id: 'u-001',
            sales_user_name: '演示业务主管',
            destination: 'factory',
            requirements: '财务总览端到端样品费测试。',
            due_date: '2026-12-16',
            lines: [
              {
                product_id: 'product-bag',
                product_code: 'BAG-40',
                product_name: 'Eco Shopping Bag',
                specification: '40x35cm',
                quantity: '3',
                unit: 'pcs',
                requirement: '绿色样、自然色各一。',
              },
            ],
          }),
        }),
      )
      const fee = await expectOk(
        await fetch(`/api/v1/sample/requests/${sampleRequest.id}/fees`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            fee_type: 'sample_making',
            amount: '50.00',
            currency: 'USD',
            payee_type: 'supplier',
            payee_name: '华东包装制品厂',
            remark: '财务总览端到端样品费',
          }),
        }),
      )
      await expectOk(
        await fetch(`/api/v1/sample/requests/${sampleRequest.id}/fees/${fee.id}/payment-request`, {
          method: 'POST',
          headers,
        }),
      )

      await expectOk(
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

      return { shipmentId: shipment.id }
    },
    { contractNo, shipmentNo, invoiceNoticeNo, sampleRequestNo, partnerCode },
  )

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
  const overviewResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/v1/finance/overview' &&
      response.request().method() === 'GET' &&
      response.ok()
    )
  })
  await financeLink.click()
  const overviewResponse = await overviewResponsePromise
  const overview = (await overviewResponse.json()).data

  assert.ok(
    overview.shipment_profit_items.some((item) => item.id === seeded.shipmentId),
    'finance overview should include the seeded shipment profit row',
  )
  assert.ok(overview.summary.shipment_count >= 1, 'finance overview should include shipment count')
  assert.ok(overview.summary.partner_count >= 1, 'finance overview should include partner count')
  assert.ok(
    overview.invoice_notice_statuses.some(
      (item) => item.status === 'sent' && item.currency === 'CNY' && Number(item.amount) >= 300,
    ),
    'finance overview should include sent CNY invoice notice amount',
  )
  assert.ok(
    overview.sample_fee_statuses.some(
      (item) => item.status === 'requested' && item.currency === 'USD' && Number(item.amount) >= 50,
    ),
    'finance overview should include requested USD sample fee amount',
  )

  await page.getByRole('heading', { name: '财务管理和利润概览' }).waitFor()
  await page.getByText('出运利润明细').waitFor()
  await page.getByText('分币种汇总').waitFor()
  await page.getByText('开票和付款状态').waitFor()
  await page.getByText('合作伙伴费用入口').waitFor()
  await page.getByText(shipmentNo).waitFor()
  await page.getByText('USD 120.00').first().waitFor()
  await page.getByText('USD 80.00').first().waitFor()
  await page.getByText('66.67%').first().waitFor()
  await page.getByText('已发送').first().waitFor()
  await page.getByText('已申请').first().waitFor()

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Finance E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
