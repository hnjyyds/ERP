import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-outbound-orders.png')
const runId = Date.now()
const exportContractNo = `EC-OO-E2E-${runId}`
const purchaseContractNo = `PC-OO-E2E-${runId}`
const shipmentNo = `SP-OO-E2E-${runId}`
const outboundOrderNo = `OO-E2E-${runId}`
const productId = `product-oo-${runId}`
const productCode = `BAG-OO-${runId}`
const productName = `Outbound Bag ${runId}`

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

  const loginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await loginResponse

  const fixtures = await page.evaluate(
    async ({ exportContractNo, purchaseContractNo, shipmentNo, productId, productCode, productName }) => {
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

      const exportContract = await request('/api/v1/sales/contracts', {
        method: 'POST',
        body: JSON.stringify({
          code: exportContractNo,
          contract_date: '2026-10-01',
          customer_id: 'customer-euro-home',
          customer_name: '欧陆家居用品有限公司',
          sales_user_id: 'u-001',
          sales_user_name: '演示业务主管',
          currency: 'USD',
          trade_term: 'FOB Ningbo',
          planned_ship_date: '2026-10-30',
          payment_terms: '30% T/T in advance, balance before shipment',
          source_quotation_id: `q-${exportContractNo.slice(-18)}`,
          source_quotation_no: `QT-${exportContractNo}`,
          remarks: '货物出库 E2E 前置出口合同',
          lines: [
            {
              product_id: productId,
              product_code: productCode,
              product_name: productName,
              specification: '40x35cm',
              model: productCode,
              quantity: '300',
              unit: 'pcs',
              unit_price: '1.40',
              purchased_quantity: '0',
              shipped_quantity: '0',
              image_url: 'https://example.test/product.png',
              remark: '货物出库 E2E 商品',
            },
          ],
        }),
      })
      await request(`/api/v1/sales/contracts/${exportContract.id}/submit`, { method: 'POST' })
      const approvedExport = await request(`/api/v1/sales/contracts/${exportContract.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-10-02' }),
      })
      const exportLine = approvedExport.lines[0]

      const purchaseContract = await request('/api/v1/purchase/contracts', {
        method: 'POST',
        body: JSON.stringify({
          code: purchaseContractNo,
          contract_date: '2026-10-03',
          supplier_id: 'supplier-pack-a',
          supplier_name: '华东包装制品厂',
          buyer_user_id: 'u-001',
          buyer_user_name: '演示业务主管',
          currency: 'USD',
          delivery_date: '2026-10-20',
          payment_terms: '30% 预付，70% 出货前',
          source_type: 'export_contract',
          remarks: '货物出库 E2E 前置采购合同',
          lines: [
            {
              product_id: productId,
              product_code: productCode,
              product_name: productName,
              specification: '40x35cm',
              model: productCode,
              quantity: '300',
              unit: 'pcs',
              unit_price: '1.20',
              source_export_contract_id: approvedExport.id,
              source_export_contract_no: approvedExport.code,
              source_export_contract_line_id: exportLine.id,
              remark: '货物出库 E2E 采购明细',
            },
          ],
        }),
      })
      await request(`/api/v1/purchase/contracts/${purchaseContract.id}/submit`, { method: 'POST' })
      const approvedPurchase = await request(`/api/v1/purchase/contracts/${purchaseContract.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-10-03' }),
      })

      const inboundPlans = await request(`/api/v1/warehouse/inbound-plans?q=${encodeURIComponent(purchaseContractNo)}`)
      const inboundPlan = inboundPlans.items[0]
      await request('/api/v1/quality/inspections', {
        method: 'POST',
        body: JSON.stringify({
          code: `QC-OO-E2E-${approvedPurchase.id.slice(0, 8)}`,
          purchase_contract_id: approvedPurchase.id,
          inspected_at: '2026-10-18',
          result: 'passed',
          inspector_id: 'u-qc-001',
          inspector_name: 'QC 张工',
          issue_summary: null,
          attachment_group_id: 'attach-qc-oo-e2e',
          lines: [
            {
              purchase_contract_line_id: approvedPurchase.lines[0].id,
              product_id: productId,
              product_code: productCode,
              product_name: productName,
              inspected_quantity: '300',
              failed_quantity: '0',
              unit: 'pcs',
              result: 'passed',
              remark: '首检通过',
            },
          ],
          issues: [],
        }),
      })
      const inboundOrder = await request('/api/v1/warehouse/inbound-orders/from-plan', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: inboundPlan.id,
          code: `IO-${purchaseContractNo}`,
          inbound_mode: 'formal',
          inbound_at: '2026-10-20',
          warehouse_id: 'wh-ningbo',
          warehouse_name: '宁波总仓',
          location_id: 'loc-fg-01',
          location_name: '成品区 A-01',
          operator_name: '仓库主管',
          lines: [],
        }),
      })
      await request(`/api/v1/warehouse/inbound-orders/${inboundOrder.id}/submit`, { method: 'POST' })
      await request(`/api/v1/warehouse/inbound-orders/${inboundOrder.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-10-20' }),
      })

      const shipment = await request('/api/v1/sales/shipments/from-contracts', {
        method: 'POST',
        body: JSON.stringify({
          code: shipmentNo,
          shipment_date: '2026-10-25',
          planned_ship_date: '2026-10-30',
          shipping_method: 'sea',
          port_of_loading: 'Ningbo',
          port_of_destination: 'Hamburg',
          vessel_name: 'COSCO E2E',
          container_no: `CONT-${shipmentNo.slice(-12)}`,
          booking_no: `BOOK-${shipmentNo.slice(-12)}`,
          document_owner_name: '单证部',
          estimated_payable_amount: '420.00',
          remarks: '货物出库 E2E 发货计划',
          selections: [{ contract_id: approvedExport.id, quantity: '300' }],
        }),
      })
      await request(`/api/v1/sales/shipments/${shipment.id}/submit`, { method: 'POST' })
      const approvedShipment = await request(`/api/v1/sales/shipments/${shipment.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-10-26' }),
      })

      const outboundPlan = await request('/api/v1/warehouse/outbound-plans/from-shipment', {
        method: 'POST',
        body: JSON.stringify({
          shipment_plan_id: approvedShipment.id,
          outbound_type: 'finished_goods_outbound',
          planned_date: '2026-10-30',
        }),
      })
      const scheduledPlan = await request(`/api/v1/warehouse/outbound-plans/${outboundPlan.id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({
          planned_date: '2026-10-30',
          warehouse_id: 'wh-ningbo',
          warehouse_name: '宁波总仓',
          location_id: 'loc-fg-01',
          location_name: '成品区 A-01',
          operator_name: '仓库主管',
        }),
      })

      const balanceBefore = await request(
        `/api/v1/warehouse/inbound-orders/inventory-balances?q=${encodeURIComponent(productCode)}`,
      )
      return { exportContract: approvedExport, purchaseContract: approvedPurchase, shipment: approvedShipment, outboundPlan: scheduledPlan, balanceBefore }
    },
    { exportContractNo, purchaseContractNo, shipmentNo, productId, productCode, productName },
  )

  assert.equal(fixtures.outboundPlan.status, 'scheduled')
  assert.equal(fixtures.balanceBefore.items[0].available_quantity, '300')

  const outboundOrderMenu = page.getByLabel('主导航').getByRole('link', { name: '货物出库' })
  await outboundOrderMenu.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/warehouse/outbound-orders' &&
        response.request().method() === 'GET' &&
        response.ok()
      )
    }),
    outboundOrderMenu.click(),
  ])
  await page.getByRole('heading', { name: '货物出库和出库记录' }).waitFor()

  const formPanel = page.locator('.product-form-panel').filter({ hasText: '从出库计划生成' })
  await formPanel.locator('#outbound-order-plan-id').selectOption(fixtures.outboundPlan.id)
  await formPanel.locator('#outbound-order-code').fill(outboundOrderNo)
  await formPanel.locator('#outbound-order-mode').selectOption('formal')
  await formPanel.locator('#outbound-order-date').fill('2026-10-30')

  const generateResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/warehouse/outbound-orders/from-plan') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await formPanel.getByRole('button', { name: '生成出库单' }).click()
  await generateResponse
  await page.getByText(`已生成出库单 ${outboundOrderNo}`).waitFor()

  const listPanel = page.locator('.product-list-panel')
  await listPanel.getByRole('cell', { name: outboundOrderNo, exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '草稿', exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '正式出库', exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '300.00', exact: true }).waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '出库明细和库存流水' })
  const outboundLinesTable = detailPanel.locator('table').nth(0)
  const balanceTable = detailPanel.locator('table').nth(1)
  const ledgerTable = detailPanel.locator('table').nth(2)
  const outboundProductRow = outboundLinesTable.getByRole('row', {
    name: new RegExp(`${productCode} ${productName}.*300 pcs`),
  })
  await outboundProductRow.waitFor()

  const submitResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/warehouse/outbound-orders/') &&
    response.url().endsWith('/submit') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '提交审批' }).click()
  await submitResponse
  await page.getByText(`${outboundOrderNo} 已提交审批`).waitFor()

  await formPanel.locator('#outbound-reviewer-name').fill('演示业务主管')
  await formPanel.locator('#outbound-approved-at').fill('2026-10-30')
  const approveResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/warehouse/outbound-orders/') &&
    response.url().endsWith('/approve') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '审批出库' }).click()
  await approveResponse

  await page.getByText(`${outboundOrderNo} 已正式出库，库存和采购跟单已回写`).waitFor()
  await detailPanel.getByText('已出库').waitFor()
  const balanceProductRow = balanceTable.getByRole('row', {
    name: new RegExp(`${productCode} ${productName}.*0 pcs`),
  })
  await balanceProductRow.waitFor()
  assert.equal((await balanceProductRow.getByRole('cell').nth(2).textContent())?.trim(), '0 pcs')
  await ledgerTable.getByRole('cell', { name: '出库 / 可用', exact: true }).waitFor()

  const apiCheck = await page.evaluate(async ({ outboundOrderNo, productCode }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const [ordersResponse, balancesResponse] = await Promise.all([
      fetch(`/api/v1/warehouse/outbound-orders?q=${encodeURIComponent(outboundOrderNo)}&status=approved`, { headers }),
      fetch(`/api/v1/warehouse/inbound-orders/inventory-balances?q=${encodeURIComponent(productCode)}`, { headers }),
    ])
    if (!ordersResponse.ok) throw new Error(await ordersResponse.text())
    if (!balancesResponse.ok) throw new Error(await balancesResponse.text())
    return {
      order: (await ordersResponse.json()).data.items[0],
      balance: (await balancesResponse.json()).data.items[0],
    }
  }, { outboundOrderNo, productCode })

  assert.equal(apiCheck.order.status, 'approved')
  assert.equal(apiCheck.order.lines[0].quantity, '300')
  assert.equal(apiCheck.balance.available_quantity, '0')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Outbound order E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
