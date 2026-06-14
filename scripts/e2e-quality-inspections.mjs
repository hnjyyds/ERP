import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-quality-inspections.png')
const runId = Date.now()
const purchaseContractNo = `PC-QC-E2E-${runId}`
const qualityCode = `QC-E2E-${runId}`

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
    async ({ purchaseContractNo }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      async function request(path, init) {
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
          remarks: 'QC 查验 E2E 合同',
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
              remark: 'QC 查验商品',
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

      return { contract }
    },
    { purchaseContractNo },
  )

  const qualityMenu = page.getByLabel('主导航').getByRole('link', { name: 'QC 查验' })
  await qualityMenu.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/quality/inspections' &&
        response.request().method() === 'GET' &&
        response.ok()
      )
    }),
    qualityMenu.click(),
  ])
  await page.getByRole('heading', { name: 'QC 查验和入库判定' }).waitFor()

  const formPanel = page.locator('.product-form-panel')
  await formPanel.getByRole('button', { name: '新建 QC 单' }).click()
  await formPanel.locator('#quality-code').fill(qualityCode)
  await formPanel.locator('#quality-contract-id').fill(fixtures.contract.id)
  await formPanel.locator('#quality-inspected-at').fill('2026-08-19')
  await formPanel.locator('#quality-result').selectOption('passed')
  await formPanel.locator('#quality-inspector-name').fill('QC 张工')
  await formPanel.locator('#quality-attachment-group').fill('attach-qc-e2e')
  await formPanel.locator('#quality-line-id').fill(fixtures.contract.lines[0].id)
  await formPanel.locator('#quality-product-code').fill('BAG-40')
  await formPanel.locator('#quality-product-name').fill('Eco Shopping Bag')
  await formPanel.locator('#quality-inspected-quantity').fill('120')
  await formPanel.locator('#quality-failed-quantity').fill('0')
  await formPanel.locator('#quality-unit').fill('pcs')
  await formPanel.locator('#quality-line-result').selectOption('passed')
  await formPanel.locator('#quality-line-remark').fill('首检通过')

  const createInspectionResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/quality/inspections') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await formPanel.getByRole('button', { name: '新增 QC 查验' }).click()
  await createInspectionResponse
  await page.getByText('QC 节点已回写采购跟单').waitFor()
  await page.getByText(qualityCode).first().waitFor()
  await page.getByText('QC 已通过').waitFor()

  const followupCheck = await page.evaluate(async ({ purchaseContractNo }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await fetch(`/api/v1/followup/plans?q=${purchaseContractNo}`, { headers })
    if (!response.ok) throw new Error(await response.text())
    const body = await response.json()
    return body.data.items[0]
  }, { purchaseContractNo })
  const qcNode = followupCheck.nodes.find((node) => node.node_code === 'quality_inspection')
  assert.equal(qcNode.actual_date, '2026-08-19')
  assert.equal(qcNode.source_record_type, 'quality_inspection')

  const followupMenu = page.getByLabel('主导航').getByRole('link', { name: '采购跟单' })
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/followup/plans' &&
        response.request().method() === 'GET' &&
        response.ok()
      )
    }),
    followupMenu.click(),
  ])
  await page.getByRole('heading', { name: '采购跟单和逾期预警' }).waitFor()

  const listPanel = page.locator('.product-list-panel')
  await listPanel.getByLabel('计划搜索', { exact: true }).fill(purchaseContractNo)
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/followup/plans' &&
        url.searchParams.get('q') === purchaseContractNo &&
        response.ok()
      )
    }),
    listPanel.getByRole('button', { name: '查询' }).click(),
  ])
  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '节点进度查询' })
  await detailPanel
    .getByRole('row')
    .filter({ hasText: 'QC 查验' })
    .filter({ hasText: '2026-08-19' })
    .filter({ hasText: '已完成' })
    .waitFor()

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Quality inspection E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
