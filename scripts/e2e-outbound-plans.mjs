import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-outbound-plans.png')
const runId = Date.now()
const contractNo = `EC-OUT-E2E-${runId}`
const shipmentNo = `SP-OUT-E2E-${runId}`

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

  const fixtures = await page.evaluate(
    async ({ contractNo, shipmentNo }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      async function request(path, init = {}) {
        const response = await fetch(path, { ...init, headers })
        if (!response.ok) throw new Error(await response.text())
        return (await response.json()).data
      }

      const contract = await request('/api/v1/sales/contracts', {
        method: 'POST',
        body: JSON.stringify({
          code: contractNo,
          contract_date: '2026-09-01',
          customer_id: 'customer-euro-home',
          customer_name: '欧陆家居用品有限公司',
          sales_user_id: 'u-001',
          sales_user_name: '演示业务主管',
          currency: 'USD',
          trade_term: 'FOB Ningbo',
          planned_ship_date: '2026-09-25',
          payment_terms: '30% T/T in advance, balance before shipment',
          source_quotation_id: `q-${contractNo.slice(-18)}`,
          source_quotation_no: `QT-${contractNo}`,
          remarks: '出库计划 E2E 前置合同',
          lines: [
            {
              product_id: 'product-bag',
              product_code: 'BAG-40',
              product_name: 'Eco Shopping Bag',
              specification: '40x35cm',
              model: 'BAG-40',
              quantity: '420',
              unit: 'pcs',
              unit_price: '1.40',
              purchased_quantity: '420',
              shipped_quantity: '0',
              image_url: 'https://example.test/product.png',
              remark: '出库计划 E2E 商品',
            },
          ],
        }),
      })

      await request(`/api/v1/sales/contracts/${contract.id}/submit`, { method: 'POST' })
      await request(`/api/v1/sales/contracts/${contract.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          reviewer_name: '演示业务主管',
          approved_at: '2026-09-02',
        }),
      })

      const shipment = await request('/api/v1/sales/shipments/from-contracts', {
        method: 'POST',
        body: JSON.stringify({
          code: shipmentNo,
          shipment_date: '2026-09-10',
          planned_ship_date: '2026-09-28',
          shipping_method: 'sea',
          port_of_loading: 'Ningbo',
          port_of_destination: 'Hamburg',
          vessel_name: 'COSCO E2E',
          container_no: `CONT-${shipmentNo.slice(-12)}`,
          booking_no: `BOOK-${shipmentNo.slice(-12)}`,
          document_owner_name: '单证部',
          estimated_payable_amount: '600.00',
          remarks: '出库计划 E2E 发货计划',
          selections: [{ contract_id: contract.id, quantity: '360' }],
        }),
      })

      await request(`/api/v1/sales/shipments/${shipment.id}/submit`, { method: 'POST' })
      const approvedShipment = await request(`/api/v1/sales/shipments/${shipment.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          reviewer_name: '演示业务主管',
          approved_at: '2026-09-11',
        }),
      })

      const approvedList = await request(
        `/api/v1/sales/shipments?q=${encodeURIComponent(shipmentNo)}&approval_status=approved`,
      )
      return { contract, shipment: approvedShipment, approvedList }
    },
    { contractNo, shipmentNo },
  )

  assert.equal(fixtures.shipment.code, shipmentNo)
  assert.equal(fixtures.shipment.approval_status, 'approved')
  assert.equal(fixtures.shipment.lines[0].quantity, '360')
  assert.equal(fixtures.approvedList.items[0].code, shipmentNo)

  const outboundMenu = page.getByLabel('主导航').getByRole('link', { name: '出库计划' })
  await outboundMenu.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/warehouse/outbound-plans' &&
        response.request().method() === 'GET' &&
        response.ok()
      )
    }),
    outboundMenu.click(),
  ])
  await page.getByRole('heading', { name: '出库计划和待出库清单' }).waitFor()

  const formPanel = page.locator('.product-form-panel').filter({ hasText: '从发货计划生成' })
  await formPanel.locator('#outbound-plan-shipment-id').selectOption(fixtures.shipment.id)
  await formPanel.locator('#outbound-plan-type').selectOption('finished_goods_outbound')
  await formPanel.locator('#outbound-plan-date').fill('2026-09-26')

  const createPlanResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/warehouse/outbound-plans/from-shipment') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await formPanel.getByRole('button', { name: '生成出库计划' }).click()
  await createPlanResponse

  const planCode = `OP-${shipmentNo}`
  await page.getByText(`已生成出库计划 ${planCode}`).waitFor()

  const listPanel = page.locator('.product-list-panel')
  await listPanel.getByRole('cell', { name: planCode, exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '待安排', exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '成品出库', exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '2026-09-26', exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '360.00', exact: true }).waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '待出库清单' })
  await detailPanel.getByText(`发货计划 / ${shipmentNo}`).waitFor()
  await detailPanel.getByText('Eco Shopping Bag').waitFor()
  await detailPanel.getByRole('cell', { name: '360 pcs', exact: true }).waitFor()
  await detailPanel.getByRole('cell', { name: '待出库', exact: true }).waitFor()

  await formPanel.locator('#outbound-schedule-date').fill('2026-09-27')
  await formPanel.locator('#outbound-warehouse-id').fill('wh-ningbo')
  await formPanel.locator('#outbound-warehouse-name').fill('宁波总仓')
  await formPanel.locator('#outbound-location-id').fill('loc-fg-b02')
  await formPanel.locator('#outbound-location-name').fill('成品区 B-02')
  await formPanel.locator('#outbound-operator-name').fill('仓库主管')

  const scheduleResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/warehouse/outbound-plans/') &&
    response.url().endsWith('/schedule') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '保存库位安排' }).click()
  await scheduleResponse

  await page.getByText('已安排 宁波总仓 / 成品区 B-02').waitFor()
  await detailPanel.getByText('已排库位').waitFor()
  await detailPanel.getByText('宁波总仓 / 成品区 B-02').waitFor()

  const apiCheck = await page.evaluate(async ({ shipmentNo }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await fetch(`/api/v1/warehouse/outbound-plans?q=${encodeURIComponent(shipmentNo)}`, {
      headers,
    })
    if (!response.ok) throw new Error(await response.text())
    return (await response.json()).data.items[0]
  }, { shipmentNo })

  assert.equal(apiCheck.code, planCode)
  assert.equal(apiCheck.status, 'scheduled')
  assert.equal(apiCheck.outbound_type, 'finished_goods_outbound')
  assert.equal(apiCheck.source_type, 'shipment_plan')
  assert.equal(apiCheck.warehouse_name, '宁波总仓')
  assert.equal(apiCheck.location_name, '成品区 B-02')
  assert.equal(apiCheck.lines[0].product_name, 'Eco Shopping Bag')
  assert.equal(apiCheck.lines[0].planned_quantity, '360')
  assert.equal(apiCheck.lines[0].outbound_quantity, '0')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Outbound plan E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
