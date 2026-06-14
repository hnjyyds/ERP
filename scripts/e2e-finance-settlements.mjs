import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-finance-settlements.png')
const runId = Date.now()
const contractNo = `EC-SETTLE-E2E-${runId}`
const shipmentNo = `SP-SETTLE-E2E-${runId}`
const settlementNo = `FS-SETTLE-E2E-${runId}`
const manualCostNo = `MC-SETTLE-E2E-${runId}`
const miscFeeCode = `MISC-SETTLE-E2E-${runId}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 2000 } })

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
    async ({ contractNo, shipmentNo, runId }) => {
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
            contract_date: '2027-01-01',
            customer_id: 'customer-euro-home',
            customer_name: '欧陆家居用品有限公司',
            sales_user_id: 'u-001',
            sales_user_name: '演示业务主管',
            currency: 'USD',
            trade_term: 'FOB Ningbo',
            planned_ship_date: '2027-01-20',
            payment_terms: '30% T/T in advance, balance before shipment',
            source_quotation_id: `q-${runId}`,
            source_quotation_no: `QT-${contractNo}`,
            remarks: '财务结算端到端前置出口合同',
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
                remark: '财务结算端到端合同',
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
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2027-01-02' }),
        }),
      )

      const shipment = await expectOk(
        await fetch('/api/v1/sales/shipments/from-contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: shipmentNo,
            shipment_date: '2027-01-15',
            planned_ship_date: '2027-01-20',
            shipping_method: 'sea',
            port_of_loading: 'Ningbo',
            port_of_destination: 'Hamburg',
            vessel_name: 'COSCO Star',
            container_no: `CONT-${shipmentNo}`,
            booking_no: `BOOK-${shipmentNo}`,
            document_owner_name: '单证部',
            estimated_payable_amount: '420.00',
            remarks: '财务结算端到端前置出货单',
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
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2027-01-16' }),
        }),
      )
    },
    { contractNo, shipmentNo, runId },
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

  const financeFixtures = await page.evaluate(
    async ({ miscFeeCode, runId, shipment }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      async function expectOk(response) {
        if (!response.ok) throw new Error(await response.text())
        return (await response.json()).data
      }

      const document = await expectOk(
        await fetch('/api/v1/finance/verification-documents', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            document_no: `VD-SETTLE-E2E-${runId}`,
            received_at: '2027-01-17',
            owner_user_id: 'u-001',
            owner_user_name: '演示业务主管',
            shipment_plan_id: shipment.id,
            shipment_no: shipment.code,
            customer_name: shipment.customer_name,
            currency: 'USD',
            refundable_amount: '96.00',
            valid_until: '2027-02-16',
            remark: '结算端到端核销单',
          }),
        }),
      )
      await expectOk(
        await fetch(`/api/v1/finance/verification-documents/${document.id}/customs-receipt`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            customs_declaration_no: `CD-SETTLE-E2E-${runId}`,
            customs_receipt_no: `CR-SETTLE-E2E-${runId}`,
            received_at: '2027-01-18',
          }),
        }),
      )
      await expectOk(
        await fetch(`/api/v1/finance/verification-documents/${document.id}/verify`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            verification_no: `VERIFY-SETTLE-E2E-${runId}`,
            verified_at: '2027-01-19',
          }),
        }),
      )
      await expectOk(
        await fetch(`/api/v1/finance/verification-documents/${document.id}/tax-refunds`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            refund_no: `TR-SETTLE-E2E-${runId}`,
            refunded_at: '2027-01-20',
            amount: '96.00',
            currency: 'USD',
          }),
        }),
      )

      const miscFeeItem = await expectOk(
        await fetch('/api/v1/finance/misc-fee-items', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: miscFeeCode,
            name: '结算办公费用',
            category: 'office',
            default_allocation_method: 'manual',
            is_active: true,
          }),
        }),
      )
      await expectOk(
        await fetch('/api/v1/finance/misc-fee-allocations', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            allocation_no: `MFA-SETTLE-BEFORE-${runId}`,
            item_id: miscFeeItem.id,
            shipment_plan_id: shipment.id,
            shipment_no: shipment.code,
            sales_user_id: 'u-001',
            sales_user_name: '演示业务主管',
            allocated_at: '2027-01-21',
            amount: '36.00',
            currency: 'USD',
            allocation_method: 'manual',
            basis: '结算日前办公费用',
          }),
        }),
      )
      await expectOk(
        await fetch('/api/v1/finance/misc-fee-allocations', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            allocation_no: `MFA-SETTLE-AFTER-${runId}`,
            item_id: miscFeeItem.id,
            shipment_plan_id: shipment.id,
            shipment_no: shipment.code,
            sales_user_id: 'u-001',
            sales_user_name: '演示业务主管',
            allocated_at: '2027-01-25',
            amount: '12.00',
            currency: 'USD',
            allocation_method: 'manual',
            basis: '结算日后办公费用',
          }),
        }),
      )
      return { miscFeeItem }
    },
    { miscFeeCode, runId, shipment },
  )

  assert.equal(financeFixtures.miscFeeItem.code, miscFeeCode)

  const financeLink = page.getByLabel('主导航').getByRole('link', { name: '财务管理' })
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/v1/finance/overview') && response.ok(),
    ),
    financeLink.click(),
  ])
  await page.getByRole('heading', { name: '财务管理和利润概览' }).waitFor()
  await page.getByRole('heading', { name: '财务结算列表' }).waitFor()
  await page.getByRole('heading', { name: '单票结算锁定' }).waitFor()
  await page.getByRole('heading', { name: '手工成本关联' }).waitFor()
  await page.getByRole('heading', { name: '利润核算表' }).waitFor()

  const settlementPanel = page.locator('.finance-settlement-form-panel')
  await settlementPanel.getByLabel('结算单号').fill(settlementNo)
  await settlementPanel.getByLabel('出运单 ID').fill(shipment.id)
  await settlementPanel.getByLabel('出运单号').fill(shipment.code)
  await settlementPanel.getByLabel('结算日期').fill('2027-01-22')
  await settlementPanel.getByLabel('备注').fill('锁定单票利润端到端')

  const settlementResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/finance/settlements') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await settlementPanel.getByRole('button', { name: '锁定结算' }).click()
  const settlement = (await (await settlementResponse).json()).data
  assert.equal(settlement.settlement_no, settlementNo)
  assert.equal(settlement.sales_income, '600.00')
  assert.equal(settlement.purchase_cost_amount, '420.00')
  assert.equal(settlement.tax_refund_amount, '96.00')
  assert.equal(settlement.misc_fee_amount, '36.00')
  assert.equal(settlement.gross_profit, '240.00')
  assert.equal(settlement.gross_profit_rate, '40.00')
  const costTypes = new Set(settlement.cost_items.map((item) => item.cost_type))
  for (const expectedType of ['sales_income', 'purchase_cost', 'tax_refund', 'misc_fee']) {
    assert.equal(costTypes.has(expectedType), true)
  }

  await page.locator('.finance-settlement-list-panel').getByText(settlementNo).waitFor()
  await page.locator('.finance-manual-cost-panel').getByText(settlementNo).waitFor()

  const manualCostPanel = page.locator('.finance-manual-cost-panel')
  await manualCostPanel.getByLabel('成本单号').fill(manualCostNo)
  await manualCostPanel.getByLabel('成本类型').selectOption('other_cost')
  await manualCostPanel.getByLabel('成本日期').fill('2027-01-22')
  await manualCostPanel.getByLabel('金额').fill('18.00')
  await manualCostPanel.getByLabel('币种').fill('USD')
  await manualCostPanel.getByLabel('来源单号').fill('OFFICE-ADJ-E2E')
  await manualCostPanel.getByLabel('原因').fill('补录单票其他成本')
  await manualCostPanel.getByLabel('备注').fill('手工成本端到端')

  const manualCostResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/v1/finance/settlements/${settlement.id}/manual-costs`) &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await manualCostPanel.getByRole('button', { name: '关联成本' }).click()
  const updated = (await (await manualCostResponse).json()).data
  assert.equal(updated.manual_cost_amount, '18.00')
  assert.equal(updated.gross_profit, '222.00')
  assert.equal(updated.gross_profit_rate, '37.00')
  assert.equal(
    updated.cost_items.find((item) => item.cost_type === 'other_cost').source_no,
    'OFFICE-ADJ-E2E',
  )

  const profitPanel = page.locator('.finance-profit-calculation-panel')
  await profitPanel.getByLabel('出运单号').fill(shipment.code)
  const profitResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/v1/finance/profit-calculations' &&
      url.searchParams.get('shipment_no') === shipment.code &&
      response.ok()
    )
  })
  await profitPanel.getByRole('button', { name: '查询' }).click()
  const profits = (await (await profitResponse).json()).data
  assert.equal(profits.total, 1)
  assert.equal(profits.items[0].settlement_no, settlementNo)
  assert.equal(profits.items[0].gross_profit, '222.00')

  await profitPanel.getByText(settlementNo).waitFor()
  await profitPanel.getByRole('cell', { name: 'USD 222.00' }).first().waitFor()

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Finance settlements E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
