import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-inbound-orders.png')
const runId = Date.now()
const purchaseContractNo = `PC-IO-E2E-${runId}`
const failedPurchaseContractNo = `PC-IO-BLOCK-${runId}`
const inboundOrderNo = `IO-E2E-${runId}`
const productCode = `BAG-E2E-${runId}`
const productName = `Inbound Test Bag ${runId}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 2100 } })

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
    async ({ purchaseContractNo, productCode, productName }) => {
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

      const contract = await request('/api/v1/purchase/contracts', {
        method: 'POST',
        body: JSON.stringify({
          code: purchaseContractNo,
          contract_date: '2026-08-05',
          supplier_id: 'supplier-pack-a',
          supplier_name: '华东包装制品厂',
          buyer_user_id: 'u-001',
          buyer_user_name: '演示业务主管',
          currency: 'USD',
          delivery_date: '2026-08-30',
          payment_terms: '30% 预付，70% 出货前',
          source_type: 'stock_purchase',
          remarks: '货物入库 E2E 合同',
          lines: [
            {
              product_id: 'product-bag',
              product_code: productCode,
              product_name: productName,
              specification: '40x35cm',
              model: 'BAG-40',
              quantity: '1000',
              unit: 'pcs',
              unit_price: '1.20',
              source_export_contract_id: null,
              source_export_contract_no: null,
              source_export_contract_line_id: null,
              remark: '货物入库 E2E 商品',
            },
          ],
        }),
      })

      await request(`/api/v1/purchase/contracts/${contract.id}/submit`, { method: 'POST' })
      await request(`/api/v1/purchase/contracts/${contract.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          reviewer_name: '演示业务主管',
          approved_at: '2026-08-05',
        }),
      })

      const plans = await request(`/api/v1/warehouse/inbound-plans?q=${purchaseContractNo}`)
      const plan = plans.items[0]
      await request(`/api/v1/warehouse/inbound-plans/${plan.id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({
          planned_date: '2026-08-30',
          warehouse_id: 'wh-ningbo',
          warehouse_name: '宁波总仓',
          location_id: 'loc-a-01',
          location_name: 'A-01',
          operator_name: '仓库主管',
        }),
      })

      await request('/api/v1/quality/inspections', {
        method: 'POST',
        body: JSON.stringify({
          code: `QC-IO-E2E-${Date.now()}`,
          purchase_contract_id: contract.id,
          inspected_at: '2026-08-19',
          result: 'passed',
          inspector_id: 'u-qc-001',
          inspector_name: 'QC 张工',
          issue_summary: null,
          attachment_group_id: 'attach-qc-e2e',
          lines: [
            {
              purchase_contract_line_id: contract.lines[0].id,
              product_id: 'product-bag',
              product_code: productCode,
              product_name: productName,
              inspected_quantity: '120',
              failed_quantity: '0',
              unit: 'pcs',
              result: 'passed',
              remark: '首检通过',
            },
          ],
          issues: [],
        }),
      })

      return { contract, plan }
    },
    { purchaseContractNo, productCode, productName },
  )

  assert.ok(fixtures.plan)
  assert.equal(fixtures.plan.purchase_contract_no, purchaseContractNo)

  const inboundMenu = page.getByLabel('主导航').getByRole('link', { name: '货物入库' })
  await inboundMenu.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/warehouse/inbound-orders' &&
        response.request().method() === 'GET' &&
        response.ok()
      )
    }),
    inboundMenu.click(),
  ])
  await page.getByRole('heading', { name: '货物入库和库存台账' }).waitFor()

  const formPanel = page.locator('.product-form-panel')
  await formPanel.locator('#inbound-order-plan-id').selectOption(fixtures.plan.id)
  await formPanel.locator('#inbound-order-code').fill(inboundOrderNo)
  await formPanel.locator('#inbound-order-mode').selectOption('formal')
  await formPanel.locator('#inbound-order-date').fill('2026-08-30')
  await formPanel.locator('#inbound-order-warehouse-id').fill('wh-ningbo')
  await formPanel.locator('#inbound-order-warehouse-name').fill('宁波总仓')
  await formPanel.locator('#inbound-order-location-id').fill('loc-a-01')
  await formPanel.locator('#inbound-order-location-name').fill('A-01')
  await formPanel.locator('#inbound-order-operator').fill('仓库主管')

  const generateResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/warehouse/inbound-orders/from-plan') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await formPanel.getByRole('button', { name: '生成入库单' }).click()
  await generateResponse
  await page.getByText(`已生成入库单 ${inboundOrderNo}`).waitFor()
  await page.getByRole('cell', { name: inboundOrderNo, exact: true }).waitFor()
  await page.getByRole('cell', { name: '草稿', exact: true }).waitFor()

  const submitResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/warehouse/inbound-orders/') &&
    response.url().endsWith('/submit') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '提交审批' }).click()
  await submitResponse
  await page.getByText(`${inboundOrderNo} 已提交审批`).waitFor()
  await page.getByRole('cell', { name: '待审批', exact: true }).waitFor()

  await formPanel.locator('#inbound-order-reviewer').fill('演示业务主管')
  await formPanel.locator('#inbound-order-approved-at').fill('2026-08-30')
  const approveResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/warehouse/inbound-orders/') &&
    response.url().endsWith('/approve') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '审批入库' }).click()
  await approveResponse
  await page.getByText(`${inboundOrderNo} 已正式入库，库存和采购跟单已回写`).waitFor()
  await page.getByRole('cell', { name: '已审批', exact: true }).waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '明细和库存' })
  await detailPanel.getByText(productName).first().waitFor()
  await detailPanel.getByText('1000 pcs').first().waitFor()
  await detailPanel.getByText('1000 pcs').nth(1).waitFor()
  await detailPanel.getByRole('cell', { name: inboundOrderNo, exact: true }).waitFor()

  const apiCheck = await page.evaluate(
    async ({ purchaseContractNo, inboundOrderNo, productCode }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      async function request(path) {
        const response = await fetch(path, { headers })
        if (!response.ok) throw new Error(await response.text())
        return (await response.json()).data
      }

      const orders = await request(`/api/v1/warehouse/inbound-orders?q=${inboundOrderNo}`)
      const order = orders.items[0]
      const balances = await request(
        `/api/v1/warehouse/inbound-orders/inventory-balances?q=${productCode}`,
      )
      const ledgers = await request(
        `/api/v1/warehouse/inbound-orders/inventory-ledgers?source_id=${order.id}`,
      )
      const plans = await request(`/api/v1/warehouse/inbound-plans?q=${purchaseContractNo}`)
      const followups = await request(`/api/v1/followup/plans?q=${purchaseContractNo}`)
      return {
        order,
        balance: balances.items[0],
        ledger: ledgers.items[0],
        plan: plans.items[0],
        inboundNode: followups.items[0].nodes.find(
          (node) => node.node_code === 'inbound_completed',
        ),
      }
    },
    { purchaseContractNo, inboundOrderNo, productCode },
  )

  assert.equal(apiCheck.order.status, 'approved')
  assert.equal(apiCheck.order.lines[0].stock_status, 'available')
  assert.equal(apiCheck.balance.available_quantity, '1000')
  assert.equal(apiCheck.balance.pending_inspection_quantity, '0')
  assert.equal(apiCheck.ledger.quantity, '1000')
  assert.equal(apiCheck.ledger.stock_status, 'available')
  assert.equal(apiCheck.plan.status, 'closed')
  assert.equal(apiCheck.plan.lines[0].received_quantity, '1000')
  assert.equal(apiCheck.inboundNode.status, 'completed')
  assert.equal(apiCheck.inboundNode.actual_date, '2026-08-30')

  const blockedStatus = await page.evaluate(
    async ({ failedPurchaseContractNo }) => {
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

      const contract = await request('/api/v1/purchase/contracts', {
        method: 'POST',
        body: JSON.stringify({
          code: failedPurchaseContractNo,
          contract_date: '2026-08-05',
          supplier_id: 'supplier-pack-a',
          supplier_name: '华东包装制品厂',
          buyer_user_id: 'u-001',
          buyer_user_name: '演示业务主管',
          currency: 'USD',
          delivery_date: '2026-08-30',
          payment_terms: '30% 预付，70% 出货前',
          source_type: 'stock_purchase',
          remarks: 'QC 拦截 E2E 合同',
          lines: [
            {
              product_id: 'product-block',
              product_code: 'BAG-BLOCK',
              product_name: 'Blocked Shopping Bag',
              specification: '40x35cm',
              model: 'BAG-BLOCK',
              quantity: '1000',
              unit: 'pcs',
              unit_price: '1.20',
              source_export_contract_id: null,
              source_export_contract_no: null,
              source_export_contract_line_id: null,
              remark: 'QC 拦截商品',
            },
          ],
        }),
      })
      await request(`/api/v1/purchase/contracts/${contract.id}/submit`, { method: 'POST' })
      await request(`/api/v1/purchase/contracts/${contract.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          reviewer_name: '演示业务主管',
          approved_at: '2026-08-05',
        }),
      })
      const plans = await request(`/api/v1/warehouse/inbound-plans?q=${failedPurchaseContractNo}`)
      await request('/api/v1/quality/inspections', {
        method: 'POST',
        body: JSON.stringify({
          code: `QC-IO-BLOCK-${Date.now()}`,
          purchase_contract_id: contract.id,
          inspected_at: '2026-08-19',
          result: 'failed',
          inspector_id: 'u-qc-001',
          inspector_name: 'QC 张工',
          issue_summary: '抽检不合格',
          attachment_group_id: 'attach-qc-block',
          lines: [
            {
              purchase_contract_line_id: contract.lines[0].id,
              product_id: 'product-block',
              product_code: 'BAG-BLOCK',
              product_name: 'Blocked Shopping Bag',
              inspected_quantity: '120',
              failed_quantity: '20',
              unit: 'pcs',
              result: 'failed',
              remark: '抽检不合格',
            },
          ],
          issues: [],
        }),
      })
      const order = await request('/api/v1/warehouse/inbound-orders/from-plan', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: plans.items[0].id,
          code: `IO-BLOCK-${Date.now()}`,
          inbound_mode: 'formal',
          inbound_at: '2026-08-30',
          warehouse_id: 'wh-ningbo',
          warehouse_name: '宁波总仓',
          location_id: 'loc-a-02',
          location_name: 'A-02',
          operator_name: '仓库主管',
          lines: [],
        }),
      })
      await request(`/api/v1/warehouse/inbound-orders/${order.id}/submit`, { method: 'POST' })
      const approve = await fetch(`/api/v1/warehouse/inbound-orders/${order.id}/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reviewer_name: '演示业务主管',
          approved_at: '2026-08-30',
        }),
      })
      return approve.status
    },
    { failedPurchaseContractNo },
  )

  assert.equal(blockedStatus, 422)

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Inbound order E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
