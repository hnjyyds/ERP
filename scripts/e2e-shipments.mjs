import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-shipments.png')
const runId = Date.now()
const contractNoA = `EC-SHIP-E2E-A-${runId}`
const contractNoB = `EC-SHIP-E2E-B-${runId}`
const shipmentNo = `SP-E2E-${runId}`
const containerNo = `CONT-E2E-${runId}`
const bookingNo = `BOOK-E2E-${runId}`

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

  const [contractA, contractB] = await page.evaluate(async ({ contractNoA, contractNoB }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    async function createApprovedContract(payload) {
      const createResponse = await fetch('/api/v1/sales/contracts', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      if (!createResponse.ok) throw new Error(await createResponse.text())
      const contract = (await createResponse.json()).data

      const submitResponse = await fetch(`/api/v1/sales/contracts/${contract.id}/submit`, {
        method: 'POST',
        headers,
      })
      if (!submitResponse.ok) throw new Error(await submitResponse.text())

      const approveResponse = await fetch(`/api/v1/sales/contracts/${contract.id}/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-07-06' }),
      })
      if (!approveResponse.ok) throw new Error(await approveResponse.text())
      return (await approveResponse.json()).data
    }

    const basePayload = {
      contract_date: '2026-07-03',
      customer_id: 'customer-euro-home',
      customer_name: '欧陆家居用品有限公司',
      sales_user_id: 'u-001',
      sales_user_name: '演示业务主管',
      currency: 'USD',
      trade_term: 'FOB Ningbo',
      planned_ship_date: '2026-08-10',
      payment_terms: '30% T/T in advance, balance before shipment',
      remarks: '出货明细端到端前置合同',
    }

    const contractA = await createApprovedContract({
      ...basePayload,
      code: contractNoA,
      source_quotation_id: `q-${contractNoA.slice(-18)}`,
      source_quotation_no: `QT-${contractNoA}`,
      lines: [
        {
          product_id: 'product-bag',
          product_code: 'BAG-40',
          product_name: 'Eco Shopping Bag',
          specification: '40x35cm',
          model: 'BAG-40',
          quantity: '1000',
          unit: 'pcs',
          unit_price: '1.40',
          purchased_quantity: '1000',
          shipped_quantity: '250',
          image_url: 'https://example.test/product.png',
          remark: '合并出运合同 A',
        },
      ],
    })

    const contractB = await createApprovedContract({
      ...basePayload,
      code: contractNoB,
      source_quotation_id: `q-${contractNoB.slice(-18)}`,
      source_quotation_no: `QT-${contractNoB}`,
      lines: [
        {
          product_id: 'product-box',
          product_code: 'BOX-20',
          product_name: 'Gift Box',
          specification: '20x20cm',
          model: 'BOX-20',
          quantity: '500',
          unit: 'pcs',
          unit_price: '2.10',
          purchased_quantity: '500',
          shipped_quantity: '0',
          image_url: 'https://example.test/box.png',
          remark: '合并出运合同 B',
        },
      ],
    })

    return [contractA, contractB]
  }, { contractNoA, contractNoB })

  const shipmentMenu = page.getByLabel('主导航').getByRole('link', { name: '出货明细' })
  await shipmentMenu.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/sales/shipments' &&
        response.request().method() === 'GET' &&
        response.ok()
      )
    }),
    shipmentMenu.click(),
  ])
  await page.getByRole('heading', { name: '出货明细和出运计划' }).waitFor()

  const formPanel = page.locator('.product-form-panel').filter({ hasText: '从出口合同生成出货明细' })
  await formPanel.getByLabel('出货单号', { exact: true }).fill(shipmentNo)
  await formPanel.getByLabel('出货日期', { exact: true }).fill('2026-08-18')
  await formPanel.getByLabel('计划出运日', { exact: true }).fill('2026-08-20')
  await formPanel.locator('#shipment-method').selectOption('sea')
  await formPanel.getByLabel('合同标识 A', { exact: true }).fill(contractA.id)
  await formPanel.getByLabel('合同 A 出货数量', { exact: true }).fill('300')
  await formPanel.getByLabel('合同标识 B', { exact: true }).fill(contractB.id)
  await formPanel.getByLabel('合同 B 出货数量', { exact: true }).fill('200')
  await formPanel.getByLabel('起运港', { exact: true }).fill('Ningbo')
  await formPanel.getByLabel('目的港', { exact: true }).fill('Hamburg')
  await formPanel.getByLabel('船名航次', { exact: true }).fill('COSCO Star')
  await formPanel.getByLabel('箱号', { exact: true }).fill(containerNo)
  await formPanel.getByLabel('订舱号', { exact: true }).fill(bookingNo)
  await formPanel.getByLabel('单证负责人', { exact: true }).fill('单证部')
  await formPanel.getByLabel('预计付款成本', { exact: true }).fill('780.00')
  await formPanel.getByLabel('出货备注', { exact: true }).fill('两个出口合同合并出运')

  const createShipmentResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/sales/shipments/from-contracts') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await formPanel.getByRole('button', { name: '生成出货明细' }).click()
  await createShipmentResponse
  await page.getByText(shipmentNo).first().waitFor()
  await page.getByRole('cell', { name: '草稿' }).first().waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '出货明细' })
  await detailPanel.getByText('USD 840.00').first().waitFor()
  await detailPanel.getByText('USD 780.00').first().waitFor()
  await detailPanel.getByText('USD 60.00').first().waitFor()
  await detailPanel.getByText('7.14%').waitFor()
  await detailPanel.getByText('出货提醒', { exact: true }).waitFor()
  await detailPanel.getByRole('cell', { name: '2026-08-13' }).first().waitFor()
  await detailPanel.getByRole('cell', { name: contractNoA }).first().waitFor()
  await detailPanel.getByRole('cell', { name: contractNoB }).first().waitFor()
  await detailPanel.getByText('出口合同出货情况').waitFor()
  await detailPanel.getByText('出口合同采购情况').waitFor()

  const submitShipmentResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/sales/shipments/') &&
    response.url().includes('/submit') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '提交审批' }).click()
  await submitShipmentResponse
  await detailPanel.getByText('待审批 / 2026-08-18').waitFor()

  await detailPanel.getByLabel('审批人', { exact: true }).fill('演示业务主管')
  await detailPanel.getByLabel('审批日期', { exact: true }).fill('2026-08-19')
  const approveShipmentResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/sales/shipments/') &&
    response.url().includes('/approve') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '审批通过' }).click()
  await approveShipmentResponse
  await detailPanel.getByText('已审批 / 2026-08-18').waitFor()
  await detailPanel.getByText('已完成').first().waitFor()

  const refreshedContracts = await page.evaluate(async ({ contractAId, contractBId }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const [responseA, responseB] = await Promise.all([
      fetch(`/api/v1/sales/contracts/${contractAId}`, { headers }),
      fetch(`/api/v1/sales/contracts/${contractBId}`, { headers }),
    ])
    if (!responseA.ok) throw new Error(await responseA.text())
    if (!responseB.ok) throw new Error(await responseB.text())
    return [(await responseA.json()).data, (await responseB.json()).data]
  }, { contractAId: contractA.id, contractBId: contractB.id })

  assert.equal(refreshedContracts[0].statistics.shipped_quantity, '550')
  assert.equal(refreshedContracts[1].statistics.shipped_quantity, '200')
  assert.ok((await page.getByText('出货提醒列表').count()) >= 1, 'reminder list should render')
  assert.ok((await page.getByText('收付款和利润概览').count()) >= 1, 'finance overview should render')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Shipments E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
