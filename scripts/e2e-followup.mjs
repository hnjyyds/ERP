import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-followup.png')
const runId = Date.now()
const purchaseContractNo = `PC-FUP-E2E-${runId}`
const sampleCode = `SM-FUP-E2E-${runId}`
const qcRecordId = `qc-fup-${runId}`

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
    async ({ purchaseContractNo, sampleCode }) => {
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
          remarks: '采购跟单 E2E 合同',
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
              remark: '跟单节点测试',
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

      await request('/api/v1/sample/records', {
        method: 'POST',
        body: JSON.stringify({
          code: sampleCode,
          sample_type: 'confirm_sample',
          status: 'registered',
          product_id: 'product-bag',
          product_code: 'BAG-40',
          product_name: 'Eco Shopping Bag',
          customer_id: null,
          customer_name: null,
          supplier_id: 'supplier-pack-a',
          supplier_name: '华东包装制品厂',
          supplier_sku: 'PACK-A-40',
          purchase_contract_id: contract.id,
          purchase_contract_no: contract.code,
          source_type: null,
          source_id: null,
          source_code: null,
          source_note: null,
          received_at: '2026-08-07',
          submitted_at: '2026-08-08',
          quantity: '3',
          unit: 'pcs',
          description: '确认样提交',
          images: [],
        }),
      })

      return { contract }
    },
    { purchaseContractNo, sampleCode },
  )

  const followupMenu = page.getByLabel('主导航').getByRole('link', { name: '采购跟单' })
  await followupMenu.waitFor({ state: 'visible' })
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
  const filterResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/v1/followup/plans' &&
      url.searchParams.get('q') === purchaseContractNo &&
      response.ok()
    )
  })
  await listPanel.getByRole('button', { name: '查询' }).click()
  await filterResponse
  await page.getByText(purchaseContractNo).first().waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '节点进度查询' })
  await detailPanel.getByRole('row').filter({ hasText: '合同下单确立' }).first().waitFor()
  await detailPanel.getByRole('row').filter({ hasText: '确认样提交' }).first().waitFor()
  await detailPanel.getByRole('row').filter({ hasText: 'QC 查验' }).first().waitFor()
  await listPanel.getByRole('row').filter({ hasText: purchaseContractNo }).filter({ hasText: '1/6' }).waitFor()

  const sampleSyncResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/followup/sample-events') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '同步样品事件' }).click()
  await sampleSyncResponse
  await page.getByText('已同步样品跟单事件').waitFor()
  await detailPanel
    .getByRole('row')
    .filter({ hasText: '确认样提交' })
    .filter({ hasText: '2026-08-08' })
    .filter({ hasText: '样品事件' })
    .waitFor()

  const formPanel = page.locator('.product-form-panel')
  await formPanel.locator('#followup-source-contract-id').fill(fixtures.contract.id)
  await formPanel.locator('#followup-source-node').selectOption('quality_inspection')
  await formPanel.locator('#followup-source-type').selectOption('quality_inspection')
  await formPanel.locator('#followup-source-id').fill(qcRecordId)
  await formPanel.locator('#followup-actual-date').fill('2026-08-19')
  await formPanel.locator('#followup-source-summary').fill('QC 查验通过')
  const sourceResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/followup/source-events') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await formPanel.getByRole('button', { name: '回写实际日期' }).click()
  await sourceResponse
  await page.getByText('已回写节点 QC 查验').waitFor()
  await detailPanel
    .getByRole('row')
    .filter({ hasText: 'QC 查验' })
    .filter({ hasText: '2026-08-19' })
    .filter({ hasText: '已完成' })
    .waitFor()

  await detailPanel.getByLabel('扫描日期', { exact: true }).fill('2026-09-05')
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/v1/followup/overdue-nodes') &&
      response.url().includes('as_of=2026-09-05') &&
      response.ok(),
    ),
    detailPanel.locator('form.inline-search').getByRole('button', { name: '扫描' }).click(),
  ])
  await page.getByText('已扫描').waitFor()
  await detailPanel.getByRole('row').filter({ hasText: purchaseContractNo }).filter({ hasText: '入库' }).waitFor()

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Followup E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
