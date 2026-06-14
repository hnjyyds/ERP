import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-inbound-plans.png')
const runId = Date.now()
const purchaseContractNo = `PC-INB-E2E-${runId}`

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

  const fixtures = await page.evaluate(
    async ({ purchaseContractNo }) => {
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
          remarks: '入库计划 E2E 合同',
          lines: [
            {
              product_id: 'product-bag',
              product_code: 'BAG-40',
              product_name: 'Eco Shopping Bag',
              specification: '40x35cm',
              model: 'BAG-40',
              quantity: '1000',
              unit: 'pcs',
              unit_price: '1.20',
              source_export_contract_id: null,
              source_export_contract_no: null,
              source_export_contract_line_id: null,
              remark: '入库计划 E2E 商品',
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
      return { contract, plan: plans.items[0] }
    },
    { purchaseContractNo },
  )

  assert.ok(fixtures.plan)
  assert.equal(fixtures.plan.purchase_contract_no, purchaseContractNo)
  assert.equal(fixtures.plan.status, 'planned')
  assert.equal(fixtures.plan.inbound_type, 'purchase_inbound')
  assert.equal(fixtures.plan.planned_date, '2026-08-30')
  assert.equal(fixtures.plan.lines[0].planned_quantity, '1000')

  const inboundMenu = page.getByLabel('主导航').getByRole('link', { name: '入库计划' })
  await inboundMenu.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/warehouse/inbound-plans' &&
        response.request().method() === 'GET' &&
        response.ok()
      )
    }),
    inboundMenu.click(),
  ])
  await page.getByRole('heading', { name: '入库计划和库位预安排' }).waitFor()

  const listPanel = page.locator('.product-list-panel')
  await listPanel.getByLabel('计划搜索', { exact: true }).fill(purchaseContractNo)
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/warehouse/inbound-plans' &&
        url.searchParams.get('q') === purchaseContractNo &&
        response.ok()
      )
    }),
    listPanel.getByRole('button', { name: '查询' }).click(),
  ])

  await listPanel.getByRole('cell', { name: purchaseContractNo, exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '待安排', exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '采购入库', exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '2026-08-30', exact: true }).waitFor()
  await listPanel.getByRole('cell', { name: '1000.00', exact: true }).waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '计划明细' })
  await detailPanel.getByText('Eco Shopping Bag').waitFor()
  await detailPanel.getByText('1000 pcs').waitFor()
  await detailPanel.getByRole('cell', { name: '待入库', exact: true }).waitFor()

  const formPanel = page.locator('.product-form-panel')
  await formPanel.locator('#inbound-schedule-date').fill('2026-08-28')
  await formPanel.locator('#inbound-warehouse-id').fill('wh-ningbo')
  await formPanel.locator('#inbound-warehouse-name').fill('宁波总仓')
  await formPanel.locator('#inbound-location-id').fill('loc-a-01')
  await formPanel.locator('#inbound-location-name').fill('A-01')
  await formPanel.locator('#inbound-operator-name').fill('仓库主管')

  const scheduleResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/warehouse/inbound-plans/') &&
    response.url().endsWith('/schedule') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '保存库位安排' }).click()
  await scheduleResponse

  await page.getByText('已安排 宁波总仓 / A-01').waitFor()
  await detailPanel.getByText('已排库位').waitFor()
  await detailPanel.getByText('宁波总仓 / A-01').waitFor()

  const apiCheck = await page.evaluate(async ({ purchaseContractNo }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await fetch(`/api/v1/warehouse/inbound-plans?q=${purchaseContractNo}`, {
      headers,
    })
    if (!response.ok) throw new Error(await response.text())
    return (await response.json()).data.items[0]
  }, { purchaseContractNo })

  assert.equal(apiCheck.status, 'scheduled')
  assert.equal(apiCheck.warehouse_name, '宁波总仓')
  assert.equal(apiCheck.location_name, 'A-01')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Inbound plan E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
