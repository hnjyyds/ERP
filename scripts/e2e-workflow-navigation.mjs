import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-workflow-navigation.png')

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })

const success = (data) => ({
  success: true,
  code: 'SUCCESS',
  message: '请求成功',
  data,
  error: null,
})

async function expectInputValue(page, selector, expectedValue) {
  await page.waitForFunction(
    ({ selector, expectedValue }) =>
      Array.from(document.querySelectorAll(selector)).some((input) => input.value === expectedValue),
    { selector, expectedValue },
  )
}

const currentUser = {
  id: 'u-001',
  username: 'demo',
  display_name: '演示业务主管',
  department_name: '业务部',
  avatar_type: 'preset',
  avatar_value: 'amber-orbit',
  roles: ['业务主管'],
  permissions: [
    'dashboard:view',
    'masterdata:product:view',
    'masterdata:customer:view',
    'masterdata:supplier:view',
    'masterdata:partner:view',
    'masterdata:document_party:view',
    'sample:request:view',
    'sample:record:view',
    'sample:delivery:view',
    'sales:quotation:view',
    'sales:contract:view',
    'sales:shipment:view',
    'purchase:inquiry:view',
    'purchase:contract:view',
    'purchase:invoice_notice:view',
    'followup:plan:view',
    'quality:inspection:view',
    'warehouse:inbound_plan:view',
    'warehouse:inbound_order:view',
    'warehouse:outbound_plan:view',
    'warehouse:outbound_order:view',
    'finance:view',
    'reporting:view',
  ],
}

const menus = [
  ['menu-dashboard', '工作台', '/', 'calendar-clock', 'dashboard:view', 10],
  ['menu-products', '产品资料', '/masterdata/products', 'package', 'masterdata:product:view', 20],
  ['menu-customers', '客户资料', '/masterdata/customers', 'users', 'masterdata:customer:view', 22],
  ['menu-suppliers', '工厂资料', '/masterdata/suppliers', 'factory', 'masterdata:supplier:view', 21],
  ['menu-partners', '合作伙伴', '/masterdata/partners', 'handshake', 'masterdata:partner:view', 84],
  ['menu-document-parties', '单证资料', '/masterdata/document-parties', 'file-stack', 'masterdata:document_party:view', 85],
  ['menu-sample-requests', '打样管理', '/sample/requests', 'flask-conical', 'sample:request:view', 81],
  ['menu-sample-records', '样品登记', '/sample/records', 'images', 'sample:record:view', 82],
  ['menu-sample-deliveries', '寄样管理', '/sample/deliveries', 'send', 'sample:delivery:view', 83],
  ['menu-sales-quotations', '出口报价', '/sales/quotations', 'file-pen-line', 'sales:quotation:view', 80],
  ['menu-sales-contracts', '订单中心', '/sales/contracts', 'file-text', 'sales:contract:view', 30],
  ['menu-sales-shipments', '出货明细', '/sales/shipments', 'send', 'sales:shipment:view', 86],
  ['menu-purchase-inquiries', '采购询价', '/purchase/inquiries', 'search', 'purchase:inquiry:view', 87],
  ['menu-purchase-contracts', '采购合同', '/purchase/contracts', 'file-text', 'purchase:contract:view', 31],
  ['menu-purchase-invoice-notices', '开票通知', '/purchase/invoice-notices', 'file-pen-line', 'purchase:invoice_notice:view', 88],
  ['menu-purchase-followup', '跟单中心', '/purchase/followup', 'check-circle', 'followup:plan:view', 41],
  ['menu-quality-inspections', 'QC 中心', '/quality/inspections', 'clipboard-check', 'quality:inspection:view', 40],
  ['menu-warehouse-inbound-plans', '入库计划', '/warehouse/inbound-plans', 'warehouse', 'warehouse:inbound_plan:view', 89],
  ['menu-warehouse-inbound-orders', '入仓', '/warehouse/inbound-orders', 'warehouse', 'warehouse:inbound_order:view', 50],
  ['menu-warehouse-outbound-plans', '出库计划', '/warehouse/outbound-plans', 'send', 'warehouse:outbound_plan:view', 91],
  ['menu-warehouse-outbound-orders', '货物出库', '/warehouse/outbound-orders', 'send', 'warehouse:outbound_order:view', 92],
  ['menu-finance', '财务摘要', '/finance', 'wallet', 'finance:view', 60],
  ['menu-reporting', '老板看板', '/reporting', 'bar-chart-3', 'reporting:view', 70],
].map(([id, label, path, icon, required_permission, sort_order]) => ({
  id,
  label,
  path,
  icon,
  required_permission,
  sort_order,
}))

const emptyDashboard = {
  announcements: [],
  todos: [],
  notifications: [],
  schedule_events: [],
  shortcuts: [],
  summary: {
    announcement_count: 0,
    todo_count: 0,
    unread_notification_count: 0,
    today_schedule_count: 0,
    shortcut_count: 0,
  },
}

const customers = [
  {
    id: 'customer-euro-home',
    code: 'C-EURO',
    cn_name: '欧洲家居客户',
    en_name: 'Euro Home',
    country: 'DE',
    address: null,
    website: null,
    status: 'active',
    owner_user_id: 'u-001',
    contacts: [],
    primary_contact: null,
    credit_profile: null,
  },
]

let customersRequested = false

await page.route('**/api/v1/auth/me', async (route) => {
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ user: currentUser, menus })) })
})
await page.route('**/api/v1/dashboard', async (route) => {
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success(emptyDashboard)) })
})
await page.route('**/api/v1/sales/contracts**', async (route) => {
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ items: [], total: 0 })) })
})
await page.route('**/api/v1/masterdata/customers**', async (route) => {
  customersRequested = true
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(success({ items: customers, total: customers.length })),
  })
})
await page.route('**/api/v1/quality/inspections**', async (route) => {
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ items: [], total: 0 })) })
})
await page.route('**/api/v1/system/i18n', async (route) => route.continue())

try {
  await page.goto(frontendUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => window.localStorage.setItem('yuanjing_access_token', 'e2e-workflow-token'))
  await page.reload({ waitUntil: 'domcontentloaded' })

  const nav = page.getByLabel('主导航')
  await nav.getByRole('link', { name: '工作台' }).waitFor()
  const groupOrder = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.nav-group-summary')).map((summary) =>
      summary.textContent?.replace(/\s+/g, ' ').trim(),
    ),
  )
  assert.equal(groupOrder[0], '基础资料', 'master data should be the first business group')

  const lockedItems = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button.nav-link-locked')).map((button) => ({
      disabled: button.hasAttribute('disabled'),
      text: button.textContent?.replace(/\s+/g, ' ').trim(),
      title: button.getAttribute('title'),
    })),
  )
  const lockedNames = lockedItems.map((item) => item.text)
  for (const name of ['出口报价', '出货明细', '样品登记', '打样管理', '寄样管理', '合作伙伴', '单证资料']) {
    assert.ok(lockedNames.includes(name), `${name} should render as a locked sidebar item`)
  }
  assert.ok(lockedItems.every((item) => item.disabled), 'all locked sidebar items should be disabled')

  const workflowGroup = nav.locator('.nav-group-summary').filter({ hasText: '订单 Workflow' })
  await workflowGroup.click()
  await nav.getByRole('link', { name: '订单中心' }).click()
  await page.getByRole('heading', { name: '订单 Workflow' }).waitFor()
  assert.ok(customersRequested, 'order page should load customer master data')

  const contractForm = page.locator('.export-contract-page .form-panel .record-form')
  await contractForm.locator('.ant-select').first().click()
  await page.locator('.ant-select-item-option-content').filter({ hasText: 'C-EURO / 欧洲家居客户 / DE' }).click()
  await expectInputValue(page, '.export-contract-page .form-panel input[readonly]', 'customer-euro-home')
  await expectInputValue(page, '.export-contract-page .form-panel input[readonly]', '欧洲家居客户')

  const flowState = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.operation-flow-step')).map((button) => ({
      disabled: button.disabled,
      index: button.querySelector('.operation-flow-index')?.textContent?.trim(),
      label: button.querySelector('.operation-flow-copy strong')?.textContent?.trim(),
      locked: button.classList.contains('operation-flow-step-locked'),
      caption: button.querySelector('.operation-flow-copy small')?.textContent?.trim(),
    })),
  )
  assert.deepEqual(
    flowState.map((item) => [item.index, item.label, item.caption]),
    [
      ['1', '订单中心', '下单时间、客户、产品和交期'],
      ['2', '采购合同', '工厂、价格、质量要求'],
      ['3', 'QC 中心', '材料、样品、过程和终检'],
      ['4', '跟单中心', '节点推进与逾期处理'],
      ['5', '入仓', 'Final QC 后入仓确认'],
      ['6', '财务摘要', '收款、应收应付和利润率'],
    ],
  )
  assert.ok(flowState.every((item) => !item.disabled && !item.locked), 'order workflow steps should be clickable')

  const taskGroup = nav.locator('.nav-group-summary').filter({ hasText: 'QC / 跟单' })
  await taskGroup.click()
  await nav.getByRole('link', { name: 'QC 中心' }).click()
  await page.getByRole('heading', { name: 'QC 任务中心' }).waitFor()

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Workflow navigation E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
