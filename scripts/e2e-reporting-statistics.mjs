import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-reporting-statistics.png')
const runId = Date.now()
const exportContractNo = `EC-REPORT-STAT-E2E-${runId}`
const purchaseContractNo = `PC-REPORT-STAT-E2E-${runId}`
const shipmentNo = `SP-REPORT-STAT-E2E-${runId}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })

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
  await page.getByText('演示业务主管').waitFor()

  const fixtures = await page.evaluate(
    async ({ exportContractNo, purchaseContractNo, shipmentNo }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      async function expectOk(response) {
        if (!response.ok) throw new Error(await response.text())
        return (await response.json()).data
      }

      const exportContract = await expectOk(
        await fetch('/api/v1/sales/contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: exportContractNo,
            contract_date: '2027-03-01',
            customer_id: 'customer-euro-home',
            customer_name: '欧陆家居用品有限公司',
            sales_user_id: 'u-001',
            sales_user_name: '演示业务主管',
            currency: 'USD',
            trade_term: 'FOB Ningbo',
            planned_ship_date: '2027-03-25',
            payment_terms: '30% T/T in advance, balance before shipment',
            source_quotation_id: null,
            source_quotation_no: null,
            remarks: '经理统计端到端出口合同',
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
                purchased_quantity: '0',
                shipped_quantity: '0',
                image_url: null,
                remark: '经理统计端到端合同',
              },
            ],
          }),
        }),
      )
      await expectOk(
        await fetch(`/api/v1/sales/contracts/${exportContract.id}/submit`, {
          method: 'POST',
          headers,
        }),
      )
      await expectOk(
        await fetch(`/api/v1/sales/contracts/${exportContract.id}/approve`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2027-03-03' }),
        }),
      )

      const purchaseContract = await expectOk(
        await fetch('/api/v1/purchase/contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: purchaseContractNo,
            contract_date: '2027-03-02',
            supplier_id: 'supplier-pack-a',
            supplier_name: '华东包装制品厂',
            buyer_user_id: 'u-001',
            buyer_user_name: '演示业务主管',
            currency: 'USD',
            delivery_date: '2027-03-28',
            payment_terms: '30% 预付，70% 出货前',
            source_type: 'stock_purchase',
            remarks: '经理统计端到端采购合同',
            lines: [
              {
                product_id: 'accessory-cotton-rope',
                product_code: 'ACC-ROPE',
                product_name: '棉绳',
                specification: '5mm',
                model: 'ROPE-5',
                quantity: '450',
                unit: 'm',
                unit_price: '0.12',
                source_export_contract_id: null,
                source_export_contract_no: null,
                source_export_contract_line_id: null,
                remark: '经理统计端到端采购',
              },
            ],
          }),
        }),
      )
      await expectOk(
        await fetch(`/api/v1/purchase/contracts/${purchaseContract.id}/submit`, {
          method: 'POST',
          headers,
        }),
      )
      await expectOk(
        await fetch(`/api/v1/purchase/contracts/${purchaseContract.id}/approve`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2027-03-04' }),
        }),
      )

      const shipment = await expectOk(
        await fetch('/api/v1/sales/shipments/from-contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: shipmentNo,
            shipment_date: '2027-03-15',
            planned_ship_date: '2027-03-25',
            shipping_method: 'sea',
            port_of_loading: 'Ningbo',
            port_of_destination: 'Hamburg',
            vessel_name: 'COSCO Star',
            container_no: `CONT-${shipmentNo}`,
            booking_no: `BOOK-${shipmentNo}`,
            document_owner_name: '单证部',
            estimated_payable_amount: '320.00',
            remarks: '经理统计端到端出货单',
            selections: [{ contract_id: exportContract.id, quantity: '50' }],
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
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2027-03-16' }),
        }),
      )

      return { exportContract, purchaseContract, approvedShipment }
    },
    { exportContractNo, purchaseContractNo, shipmentNo },
  )

  assert.equal(fixtures.exportContract.code, exportContractNo)
  assert.equal(fixtures.purchaseContract.code, purchaseContractNo)
  assert.equal(fixtures.approvedShipment.code, shipmentNo)

  const initialStatsResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/reporting/statistics') && response.ok(),
  )
  await page.getByRole('link', { name: '经理查询' }).click()
  await initialStatsResponse
  await page.getByRole('heading', { name: '经理查询和审批统计' }).waitFor()

  const filteredStatsResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/reporting/statistics') &&
    response.url().includes('date_from=2027-03-01') &&
    response.url().includes('approval_status=approved') &&
    response.ok(),
  )
  await page.getByLabel('统计开始').fill('2027-03-01')
  await page.getByLabel('统计结束').fill('2027-03-31')
  await page.getByLabel('统计状态').selectOption('approved')
  await page.getByLabel('业务员标识').fill('u-001')
  await page.getByRole('button', { name: '查询统计' }).click()
  await filteredStatsResponse

  await page.getByText(exportContractNo).waitFor()
  await page.getByText(shipmentNo).waitFor()
  await page.getByText('欧陆家居用品有限公司').first().waitFor()
  assert.ok(await page.getByText('USD 1,200.00').count())
  assert.ok(await page.getByText('USD 600.00').count())

  await page.screenshot({ path: screenshotPath, fullPage: true })
} finally {
  await browser.close()
}

console.log(`Reporting statistics E2E passed. Screenshot: ${screenshotPath}`)
