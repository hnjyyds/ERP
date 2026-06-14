import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-reporting-approvals.png')
const runId = Date.now()
const exportPendingNo = `EC-REPORT-E2E-PENDING-${runId}`
const exportApprovedNo = `EC-REPORT-E2E-APPROVED-${runId}`
const purchasePendingNo = `PC-REPORT-E2E-PENDING-${runId}`

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

  const loginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await loginResponse
  await page.getByText('演示业务主管').waitFor()

  const fixtures = await page.evaluate(
    async ({ exportPendingNo, exportApprovedNo, purchasePendingNo }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      async function expectOk(response) {
        if (!response.ok) throw new Error(await response.text())
        return (await response.json()).data
      }

      async function createSubmittedExportContract(code) {
        const contract = await expectOk(
          await fetch('/api/v1/sales/contracts', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              code,
              contract_date: '2027-02-01',
              customer_id: 'customer-euro-home',
              customer_name: '欧陆家居用品有限公司',
              sales_user_id: 'u-001',
              sales_user_name: '演示业务主管',
              currency: 'USD',
              trade_term: 'FOB Ningbo',
              planned_ship_date: '2027-03-01',
              payment_terms: '30% T/T in advance, balance before shipment',
              source_quotation_id: null,
              source_quotation_no: null,
              remarks: '经理查询端到端出口合同',
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
                  remark: '经理查询端到端合同',
                },
              ],
            }),
          }),
        )
        return expectOk(
          await fetch(`/api/v1/sales/contracts/${contract.id}/submit`, {
            method: 'POST',
            headers,
          }),
        )
      }

      async function createSubmittedPurchaseContract(code) {
        const contract = await expectOk(
          await fetch('/api/v1/purchase/contracts', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              code,
              contract_date: '2027-02-03',
              supplier_id: 'supplier-pack-a',
              supplier_name: '华东包装制品厂',
              buyer_user_id: 'u-001',
              buyer_user_name: '演示业务主管',
              currency: 'USD',
              delivery_date: '2027-02-25',
              payment_terms: '30% 预付，70% 出货前',
              source_type: 'stock_purchase',
              remarks: '经理查询端到端采购合同',
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
                  remark: '经理查询端到端采购',
                },
              ],
            }),
          }),
        )
        return expectOk(
          await fetch(`/api/v1/purchase/contracts/${contract.id}/submit`, {
            method: 'POST',
            headers,
          }),
        )
      }

      const pendingExport = await createSubmittedExportContract(exportPendingNo)
      const approvedExport = await createSubmittedExportContract(exportApprovedNo)
      await expectOk(
        await fetch(`/api/v1/sales/contracts/${approvedExport.id}/approve`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2027-02-06' }),
        }),
      )
      const pendingPurchase = await createSubmittedPurchaseContract(purchasePendingNo)

      return {
        pendingExport,
        approvedExport,
        pendingPurchase,
      }
    },
    { exportPendingNo, exportApprovedNo, purchasePendingNo },
  )

  assert.equal(fixtures.pendingExport.code, exportPendingNo)
  assert.equal(fixtures.approvedExport.code, exportApprovedNo)
  assert.equal(fixtures.pendingPurchase.code, purchasePendingNo)

  const pendingQuery = page.waitForResponse((response) =>
    response.url().includes('/api/v1/reporting/approvals') && response.ok(),
  )
  await page.getByRole('link', { name: '经理查询' }).click()
  await pendingQuery
  await page.getByRole('heading', { name: '经理查询和审批统计' }).waitFor()
  const approvalPanel = page.locator('.reporting-approval-list-panel')
  await approvalPanel.getByText(exportPendingNo).waitFor()
  await approvalPanel.getByText(purchasePendingNo).waitFor()

  const purchaseQuery = page.waitForResponse((response) =>
    response.url().includes('/api/v1/reporting/approvals') &&
    response.url().includes('document_type=purchase_contract') &&
    response.url().includes('status=submitted') &&
    response.ok(),
  )
  await approvalPanel.getByLabel('单据类型').selectOption('purchase_contract')
  await approvalPanel.getByLabel('审批状态').selectOption('submitted')
  await approvalPanel.getByRole('button', { name: '查询', exact: true }).click()
  await purchaseQuery
  await approvalPanel.getByText(purchasePendingNo).waitFor()

  const approvedQuery = page.waitForResponse((response) =>
    response.url().includes('/api/v1/reporting/approvals') &&
    response.url().includes('document_type=export_contract') &&
    response.url().includes('status=approved') &&
    response.ok(),
  )
  await approvalPanel.getByLabel('单据类型').selectOption('export_contract')
  await approvalPanel.getByLabel('审批状态').selectOption('approved')
  await approvalPanel.getByLabel('申请人标识').fill('u-001')
  await approvalPanel.getByLabel('开始日期').fill('2027-02-06')
  await approvalPanel.getByLabel('结束日期').fill('2027-02-06')
  await approvalPanel.getByRole('button', { name: '查询', exact: true }).click()
  await approvedQuery
  await approvalPanel.getByText(exportApprovedNo).waitFor()

  await page.screenshot({ path: screenshotPath, fullPage: true })
} finally {
  await browser.close()
}

console.log(`Reporting approvals E2E passed. Screenshot: ${screenshotPath}`)
