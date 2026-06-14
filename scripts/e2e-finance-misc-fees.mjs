import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-finance-misc-fees.png')
const runId = Date.now()
const contractNo = `EC-MISC-E2E-${runId}`
const shipmentNo = `SP-MISC-E2E-${runId}`
const miscFeeCode = `MISC-E2E-${runId}`
const allocationNo = `MFA-E2E-${runId}`

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
            contract_date: '2026-12-01',
            customer_id: 'customer-euro-home',
            customer_name: '欧陆家居用品有限公司',
            sales_user_id: 'u-001',
            sales_user_name: '演示业务主管',
            currency: 'USD',
            trade_term: 'FOB Ningbo',
            planned_ship_date: '2026-12-25',
            payment_terms: '30% T/T in advance, balance before shipment',
            source_quotation_id: `quotation-${contractNo}`,
            source_quotation_no: `QT-${contractNo}`,
            remarks: '杂费管理端到端前置出口合同',
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
                remark: '杂费管理端到端合同',
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
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-12-02' }),
        }),
      )

      const shipment = await expectOk(
        await fetch('/api/v1/sales/shipments/from-contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: shipmentNo,
            shipment_date: '2026-12-20',
            planned_ship_date: '2026-12-25',
            shipping_method: 'sea',
            port_of_loading: 'Ningbo',
            port_of_destination: 'Hamburg',
            vessel_name: 'COSCO Star',
            container_no: `CONT-${shipmentNo}`,
            booking_no: `BOOK-${shipmentNo}`,
            document_owner_name: '单证部',
            estimated_payable_amount: '420.00',
            remarks: '杂费管理端到端前置出货单',
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
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-12-21' }),
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
  await page.getByRole('heading', { name: '杂费项目配置' }).waitFor()
  await page.getByText('新增杂费项目').waitFor()
  await page.getByText('单票杂费分摊').waitFor()
  await page.getByText('杂费分摊查询').waitFor()

  const itemForm = page.locator('.finance-misc-form-panel')
  await itemForm.getByLabel('项目编码').fill(miscFeeCode)
  await itemForm.getByLabel('项目名称').fill('办公费用')
  await itemForm.getByLabel('项目分类').selectOption('office')
  await itemForm.getByLabel('默认分摊方式').selectOption('manual')
  await itemForm.getByLabel('备注').fill('办公费用项目端到端')

  const createItemResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/finance/misc-fee-items') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await itemForm.getByRole('button', { name: '保存项目' }).click()
  const miscFeeItem = (await (await createItemResponse).json()).data
  assert.equal(miscFeeItem.code, miscFeeCode)
  assert.equal(miscFeeItem.status, 'active')
  await page
    .locator('.finance-misc-list-panel')
    .getByRole('button', { name: miscFeeCode, exact: true })
    .waitFor()

  const allocationPanel = page.locator('.finance-misc-allocation-panel')
  await allocationPanel.getByLabel('分摊单号').fill(allocationNo)
  await allocationPanel.getByLabel('项目标识').fill(miscFeeItem.id)
  await allocationPanel.getByLabel('出运单标识').fill(shipment.id)
  await allocationPanel.getByLabel('出运单号').fill(shipment.code)
  await allocationPanel.getByLabel('业务员标识').fill('u-001')
  await allocationPanel.getByLabel('业务员姓名').fill('演示业务主管')
  await allocationPanel.getByLabel('分摊日期').fill('2026-12-22')
  await allocationPanel.getByRole('textbox', { name: '金额', exact: true }).fill('36.00')
  await allocationPanel.getByLabel('币种').fill('USD')
  await allocationPanel.getByLabel('分摊方式').selectOption('manual')
  await allocationPanel.getByLabel('分摊依据').fill('按本票业务实际占用分摊')
  await allocationPanel.getByLabel('备注').fill('办公费用分摊端到端')

  const allocationResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/finance/misc-fee-allocations') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await allocationPanel.getByRole('button', { name: '保存分摊' }).click()
  const allocation = (await (await allocationResponse).json()).data
  assert.equal(allocation.allocation_no, allocationNo)
  assert.equal(allocation.amount, '36.00')
  assert.equal(allocation.shipment_no, shipment.code)

  const summaryPanel = page.locator('.finance-misc-summary-panel')
  await summaryPanel.getByLabel('出运单号').fill(shipment.code)
  const summaryResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/v1/finance/misc-fee-allocations/summary' &&
      url.searchParams.get('shipment_no') === shipment.code &&
      response.ok()
    )
  })
  await summaryPanel.getByRole('button', { name: '查询' }).click()
  const summary = (await (await summaryResponse).json()).data
  assert.equal(summary.total, 1)
  assert.equal(summary.total_allocated_amount, '36.00')
  assert.equal(summary.items[0].allocation_no, allocationNo)

  await summaryPanel.getByText(allocationNo).waitFor()
  await summaryPanel.getByRole('cell', { name: 'USD 36.00' }).waitFor()

  const updatedShipment = await page.evaluate(async ({ shipmentId }) => {
    async function expectOk(response) {
      if (!response.ok) throw new Error(await response.text())
      return (await response.json()).data
    }

    const session = await expectOk(
      await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'demo', password: 'demo123' }),
      }),
    )
    return expectOk(
      await fetch(`/api/v1/sales/shipments/${shipmentId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }),
    )
  }, { shipmentId: shipment.id })
  assert.equal(updatedShipment.finance_overview.profit_amount, '144.00')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Finance misc fees E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
