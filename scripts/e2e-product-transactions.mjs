import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-product-transactions.png')
const runId = Date.now()
const productCode = `P-TXN-${runId}`
const quotationNo = `QT-P-TXN-${runId}`
const exportContractNo = `EC-P-TXN-${runId}`
const shipmentNo = `SP-P-TXN-${runId}`
const inquiryNo = `PI-P-TXN-${runId}`
const purchaseContractNo = `PC-P-TXN-${runId}`
const inspectionNo = `QC-P-TXN-${runId}`
const inboundOrderNo = `IO-P-TXN-${runId}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })

async function login() {
  await page.goto(frontendUrl)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await page.getByLabel('用户名').waitFor()
  await page.getByLabel('用户名').fill('demo')
  await page.getByLabel('密码').fill('demo123')
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/v1/auth/login') && response.ok(),
    ),
    page.getByRole('button', { name: '登录' }).click(),
  ])
}

async function apiRequest(path, method = 'GET', body = null) {
  return page.evaluate(
    async ({ path, method, body }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const response = await fetch(path, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!response.ok) {
        throw new Error(`${method} ${path} ${response.status}: ${await response.text()}`)
      }
      return (await response.json()).data
    },
    { path, method, body },
  )
}

try {
  await login()

  const product = await apiRequest('/api/v1/masterdata/products', 'POST', {
    code: productCode,
    cn_name: `商品业务记录-${runId}`,
    en_name: `Product Transaction ${runId}`,
    specification: '45x38cm',
    model: 'TXN-BAG',
    customs_code: '4202920000',
    tax_rate: '0.13',
    rebate_rate: '0.09',
    package_info: '100 pcs/carton',
    unit: 'pcs',
    image_url: null,
    status: 'active',
    accessories: [
      {
        accessory_name: '棉绳',
        unit_consumption: '0.45',
        unit: 'm',
        default_supplier_name: '端到端辅料供应商',
        purchase_split_rule: 'by_supplier',
      },
    ],
  })

  await apiRequest('/api/v1/sales/quotations', 'POST', {
    code: quotationNo,
    quote_date: '2026-07-01',
    customer_id: `customer-${runId}`,
    customer_name: `商品交易客户-${runId}`,
    sales_user_id: 'u-001',
    sales_user_name: '演示业务主管',
    currency: 'USD',
    trade_term: 'FOB Ningbo',
    valid_until: '2026-07-15',
    description: '商品业务记录报价',
    lines: [
      {
        product_id: product.id,
        product_code: product.code,
        product_name: product.en_name,
        specification: product.specification,
        model: product.model,
        quantity: '1000',
        unit: product.unit,
        unit_price: '1.25',
        freight_method: 'sea',
        freight_amount: '120.00',
        purchase_reference_supplier_name: '端到端辅料供应商',
        purchase_reference_price: '0.82',
        remark: '商品业务记录报价',
      },
    ],
  })

  const exportContract = await apiRequest('/api/v1/sales/contracts', 'POST', {
    code: exportContractNo,
    contract_date: '2026-07-03',
    customer_id: `customer-${runId}`,
    customer_name: `商品交易客户-${runId}`,
    sales_user_id: 'u-001',
    sales_user_name: '演示业务主管',
    currency: 'USD',
    trade_term: 'FOB Ningbo',
    planned_ship_date: '2026-08-10',
    payment_terms: '30% T/T',
    source_quotation_id: null,
    source_quotation_no: quotationNo,
    remarks: '商品业务记录出口合同',
    lines: [
      {
        product_id: product.id,
        product_code: product.code,
        product_name: product.en_name,
        specification: product.specification,
        model: product.model,
        quantity: '1000',
        unit: product.unit,
        unit_price: '1.40',
        purchased_quantity: '0',
        shipped_quantity: '0',
        image_url: null,
        remark: '商品业务记录出口合同',
      },
    ],
  })
  await apiRequest(`/api/v1/sales/contracts/${exportContract.id}/submit`, 'POST')
  await apiRequest(`/api/v1/sales/contracts/${exportContract.id}/approve`, 'POST', {
    reviewer_name: '演示业务主管',
    approved_at: '2026-07-06',
  })

  await apiRequest('/api/v1/sales/shipments/from-contracts', 'POST', {
    code: shipmentNo,
    shipment_date: '2026-08-18',
    planned_ship_date: '2026-08-20',
    shipping_method: 'sea',
    port_of_loading: 'Ningbo',
    port_of_destination: 'Hamburg',
    vessel_name: 'COSCO Star',
    container_no: `CONT-P-${runId}`,
    booking_no: `BOOK-P-${runId}`,
    document_owner_name: '单证部',
    estimated_payable_amount: '200.00',
    remarks: '商品业务记录出货',
    selections: [{ contract_id: exportContract.id, quantity: '300' }],
  })

  await apiRequest('/api/v1/purchase/inquiries', 'POST', {
    code: inquiryNo,
    inquiry_date: '2026-08-01',
    buyer_user_id: 'u-001',
    buyer_user_name: '演示业务主管',
    remarks: '商品业务记录采购询价',
    lines: [
      {
        product_id: product.id,
        product_code: product.code,
        product_name: product.en_name,
        specification: product.specification,
        model: product.model,
        quantity: '500',
        unit: product.unit,
      },
    ],
  })

  const purchaseContract = await apiRequest('/api/v1/purchase/contracts', 'POST', {
    code: purchaseContractNo,
    contract_date: '2026-08-05',
    supplier_id: `supplier-${runId}`,
    supplier_name: `商品交易供应商-${runId}`,
    buyer_user_id: 'u-001',
    buyer_user_name: '演示业务主管',
    currency: 'USD',
    delivery_date: '2026-08-28',
    payment_terms: '30% 预付，70% 出货前',
    source_type: 'stock_purchase',
    remarks: '商品业务记录采购合同',
    lines: [
      {
        product_id: product.id,
        product_code: product.code,
        product_name: product.en_name,
        specification: product.specification,
        model: product.model,
        quantity: '500',
        unit: product.unit,
        unit_price: '0.82',
        source_export_contract_id: null,
        source_export_contract_no: null,
        source_export_contract_line_id: null,
        remark: '商品业务记录采购合同',
      },
    ],
  })
  await apiRequest(`/api/v1/purchase/contracts/${purchaseContract.id}/submit`, 'POST')
  await apiRequest(`/api/v1/purchase/contracts/${purchaseContract.id}/approve`, 'POST', {
    reviewer_name: '演示业务主管',
    approved_at: '2026-08-05',
  })

  const plans = await apiRequest(
    `/api/v1/warehouse/inbound-plans?purchase_contract_id=${purchaseContract.id}`,
  )
  const inboundPlan = plans.items[0]

  await apiRequest('/api/v1/quality/inspections', 'POST', {
    code: inspectionNo,
    purchase_contract_id: purchaseContract.id,
    inspected_at: '2026-08-19',
    result: 'passed',
    inspector_id: 'u-qc-001',
    inspector_name: 'QC 张工',
    issue_summary: null,
    attachment_group_id: `attach-p-${runId}`,
    lines: [
      {
        purchase_contract_line_id: purchaseContract.lines[0].id,
        product_id: product.id,
        product_code: product.code,
        product_name: product.en_name,
        inspected_quantity: '500',
        failed_quantity: '0',
        unit: product.unit,
        result: 'passed',
        remark: '商品业务记录全检通过',
      },
    ],
    issues: [],
  })

  const inboundOrder = await apiRequest('/api/v1/warehouse/inbound-orders/from-plan', 'POST', {
    plan_id: inboundPlan.id,
    code: inboundOrderNo,
    inbound_mode: 'formal',
    inbound_at: '2026-08-30',
    warehouse_id: 'wh-ningbo',
    warehouse_name: '宁波总仓',
    location_id: 'loc-a-01',
    location_name: 'A-01',
    operator_name: '仓库主管',
    lines: [],
  })
  await apiRequest(`/api/v1/warehouse/inbound-orders/${inboundOrder.id}/submit`, 'POST')
  await apiRequest(`/api/v1/warehouse/inbound-orders/${inboundOrder.id}/approve`, 'POST', {
    reviewer_name: '演示业务主管',
    approved_at: '2026-08-30',
  })

  await page.goto(new URL('/masterdata/products', frontendUrl).toString())
  await page.getByText(productCode).first().waitFor()
  await page.getByText(quotationNo).first().waitFor()
  await page.getByText(exportContractNo).first().waitFor()
  await page.getByText(shipmentNo).first().waitFor()
  await page.getByText(inquiryNo).first().waitFor()
  await page.getByText(purchaseContractNo).first().waitFor()
  await page.getByText(inboundOrderNo).first().waitFor()

  const detailText = await page.locator('.detail-panel').innerText()
  assert.ok(detailText.includes('业务记录'), 'product detail should render business records')
  assert.ok(detailText.includes(`出口报价 ${quotationNo}`), 'quotation summary should render')
  assert.ok(detailText.includes(`出口合同 ${exportContractNo}`), 'export contract summary should render')
  assert.ok(detailText.includes(`出货明细 ${shipmentNo}`), 'shipment summary should render')
  assert.ok(detailText.includes(`采购询价 ${inquiryNo}`), 'purchase inquiry summary should render')
  assert.ok(detailText.includes(`采购合同 ${purchaseContractNo}`), 'purchase contract summary should render')
  assert.ok(detailText.includes(`库存流水 ${inboundOrderNo}`), 'inventory ledger summary should render')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Product transactions E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
