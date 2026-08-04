import assert from 'node:assert/strict'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:8080/'
const runId = process.env.RUN_ID ?? Date.now().toString().slice(-8)
const startStage = Number(process.env.START_STAGE ?? '1')
const artifactRoot = resolve(`artifacts/full-role-workflow-${runId}`)
const screenshotRoot = resolve(artifactRoot, 'screenshots')
const evidencePath = resolve(artifactRoot, 'evidence.json')

const ids = {
  productCode: `FULL-BAG-${runId}`,
  customerCode: `FULL-C-${runId}`,
  quotationNo: `FULL-QT-${runId}`,
  exportContractNo: `FULL-EC-${runId}`,
  purchaseContractNo: `FULL-PC-${runId}`,
  qualityTaskNo: `FULL-QC-${runId}`,
  inboundOrderNo: `FULL-IO-${runId}`,
  supplierInvoiceNo: `FULL-SI-${runId}`,
  paymentRequestNo: `FULL-PR-${runId}`,
  invoiceNoticeNo: `FULL-PIN-${runId}`,
}

await mkdir(screenshotRoot, { recursive: true })

const browser = await chromium.launch({
  channel: 'chrome',
  headless: false,
  args: [
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=CalculateNativeWinOcclusion',
  ],
})

let evidence = {
  runId,
  frontendUrl,
  ids,
  roles: {},
  created: {},
}

if (startStage > 1) {
  try {
    evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
  } catch {
    // An interrupted first stage has no evidence file yet; reload its persisted records below.
  }
}

async function hold(page, milliseconds = 1100) {
  await page.waitForTimeout(milliseconds)
}

async function login(page, username, password) {
  await page.goto(frontendUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => window.localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '登陆' }).waitFor()
  await page.getByLabel('用户名').fill(username)
  await page.getByLabel('密码').fill(password)
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await responsePromise
  await page.waitForURL((url) => url.pathname !== '/login')
  await page.getByText('工作台', { exact: true }).first().waitFor()
  await hold(page)
}

async function api(page, path, { method = 'GET', body } = {}) {
  return page.evaluate(
    async ({ path, method, body }) => {
      const token = window.localStorage.getItem('yuanjing_access_token')
      const response = await fetch(path, {
        method,
        headers: {
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(`${method} ${path} -> ${response.status}: ${JSON.stringify(payload)}`)
      }
      return payload?.data
    },
    { path, method, body },
  )
}

async function screenshot(page, role, step) {
  evidence.roles[role] ??= { screenshotMarkers: [] }
  evidence.roles[role].screenshotMarkers ??= []
  evidence.roles[role].screenshotMarkers.push(step)
  const path = resolve(screenshotRoot, `${role}-${step}.png`)
  await page.screenshot({ path })
  return path
}

async function recordRole(role, username, password, action) {
  const rawDir = resolve(artifactRoot, `.raw-${role}`)
  await mkdir(rawDir, { recursive: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: rawDir, size: { width: 1440, height: 900 } },
  })
  const page = await context.newPage()
  const consoleErrors = []
  const requestFailures = []
  const serverErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))
  page.on('requestfailed', (request) => {
    requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`)
  })

  const video = page.video()
  try {
    await login(page, username, password)
    await screenshot(page, role, '01-login')
    await action(page)
    await hold(page, 1600)
  } finally {
    await context.close()
  }

  const rawPath = await video.path()
  const finalPath = resolve(artifactRoot, `${role}.webm`)
  await rename(rawPath, finalPath)
  evidence.roles[role] = {
    ...evidence.roles[role],
    finalPath,
    consoleErrors,
    requestFailures,
    serverErrors,
  }
  assert.deepEqual(serverErrors, [], `${role} encountered server errors`)
  assert.deepEqual(requestFailures, [], `${role} encountered failed requests`)
  assert.deepEqual(consoleErrors, [], `${role} encountered browser errors`)
  await writeFile(evidencePath, JSON.stringify(evidence, null, 2))
  return finalPath
}

async function seedProduct() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  try {
    await login(page, 'demo', 'demo123')
    const product = await api(page, '/api/v1/masterdata/products', {
      method: 'POST',
      body: {
        code: ids.productCode,
        cn_name: '全链路环保购物袋',
        en_name: 'Full Workflow Eco Shopping Bag',
        specification: '40x35cm',
        model: 'BAG-40',
        customs_code: '4202920000',
        tax_rate: '0.13',
        rebate_rate: '0.09',
        package_info: '100 pcs/carton',
        unit: 'pcs',
        image_url: null,
        accessories: [
          {
            accessory_name: '全链路棉绳',
            unit_consumption: '0.50',
            unit: 'm',
            default_supplier_name: '全链路辅料供应商',
            purchase_split_rule: 'by_supplier',
          },
        ],
      },
    })
    evidence.created.product = product
    return product
  } finally {
    await context.close()
  }
}

async function loadExistingSalesChain() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  try {
    await login(page, 'admin', 'admin123')
    const products = await api(page, `/api/v1/masterdata/products?q=${encodeURIComponent(ids.productCode)}`)
    const customers = await api(page, `/api/v1/masterdata/customers?q=${encodeURIComponent(ids.customerCode)}`)
    const quotations = await api(page, `/api/v1/sales/quotations?q=${encodeURIComponent(ids.quotationNo)}`)
    const contracts = await api(page, `/api/v1/sales/contracts?q=${encodeURIComponent(ids.exportContractNo)}`)
    evidence.created.product = products.items.find((item) => item.code === ids.productCode)
    evidence.created.customer = customers.items.find((item) => item.code === ids.customerCode)
    evidence.created.quotation = quotations.items.find((item) => item.code === ids.quotationNo)
    evidence.created.exportContract = contracts.items.find(
      (item) => item.code === ids.exportContractNo || item.contract_no === ids.exportContractNo,
    )
    assert.ok(evidence.created.product, 'existing product not found')
    assert.ok(evidence.created.exportContract, 'existing export contract not found')
    await writeFile(evidencePath, JSON.stringify(evidence, null, 2))
    return evidence.created.product
  } finally {
    await context.close()
  }
}

let product
if (evidence.created.product) {
  product = evidence.created.product
} else if (startStage === 1) {
  product = await seedProduct()
} else {
  product = await loadExistingSalesChain()
}

if (startStage <= 1) {
await recordRole('01-sales-manager', 'demo', 'demo123', async (page) => {
  await page.goto(`${frontendUrl}masterdata/customers`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '客户资料' }).waitFor()
  await page.getByRole('button', { name: '新增客户' }).click()
  const customerModal = page.locator('.ant-modal').filter({ hasText: '新增客户' })
  await customerModal.getByLabel('编号').fill(ids.customerCode)
  await customerModal.getByLabel('中文名称').fill('全链路测试客户')
  await customerModal.getByLabel('英文名称').fill('Full Workflow Test Customer')
  await customerModal.getByLabel('国家/地区').fill('Germany')
  await customerModal.getByLabel('网站').fill('https://example.test/full-workflow')
  await customerModal.getByLabel('地址').fill('Berlin Test Trade Center')
  await customerModal.getByLabel('授信额度').fill('100000')
  await customerModal.getByLabel('币种').fill('USD')
  await customerModal.getByLabel('账期').fill('30 days after shipment')
  await customerModal.getByLabel('姓名').fill('Anna Demo')
  await customerModal.getByLabel('职务').fill('Purchasing Manager')
  await customerModal.getByLabel('邮箱').fill(`anna.${runId}@example.test`)
  await customerModal.getByLabel('电话').fill('+49-30-000000')
  const customerResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/masterdata/customers') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
  )
  await customerModal.getByRole('button', { name: '新增客户' }).click()
  const customerResponse = await customerResponsePromise
  evidence.created.customer = (await customerResponse.json()).data
  await page.getByText(ids.customerCode).first().waitFor()
  await screenshot(page, '01-sales-manager', '02-customer-created')
  await hold(page)

  await page.goto(`${frontendUrl}sales/quotations`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '新增出口报价' }).waitFor()
  const quotationForm = page.locator('.product-form-panel form')
  await quotationForm.getByLabel('报价单号').fill(ids.quotationNo)
  await quotationForm.getByLabel('报价日期').fill('2026-08-04')
  const customerSelect = quotationForm.locator('.ant-select').first()
  await customerSelect.click()
  await customerSelect.getByRole('combobox').fill(ids.customerCode)
  await page.getByText(new RegExp(ids.customerCode)).last().click()
  await quotationForm.getByLabel('业务员').fill('演示业务主管')
  await quotationForm.getByLabel('币种').fill('USD')
  await quotationForm.getByLabel('贸易条款').fill('FOB Ningbo')
  await quotationForm.getByLabel('有效期').fill('2026-08-20')
  await quotationForm.getByLabel('报价描述').fill('首期交付全链路业务验证')
  await quotationForm.getByLabel('商品标识').fill(product.id)
  await quotationForm.getByLabel('商品编号').fill(product.code)
  await quotationForm.getByLabel('商品名称').fill(product.en_name)
  await quotationForm.getByLabel('规格').fill(product.specification)
  await quotationForm.getByLabel('型号').fill(product.model)
  await quotationForm.getByLabel('数量').fill('1000')
  await quotationForm.getByLabel('单位').fill('pcs')
  await quotationForm.getByLabel('销售单价').fill('1.50')
  await quotationForm.getByLabel('运费').fill('120.00')
  await quotationForm.getByLabel('采购参考供应商').fill('全链路辅料供应商')
  await quotationForm.getByLabel('采购参考价').fill('0.50')
  await quotationForm.getByLabel('明细备注').fill('QC 通过后安排宁波仓入库')
  const quotationResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/sales/quotations') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
  )
  await quotationForm.getByRole('button', { name: '新增出口报价' }).click()
  const quotationResponse = await quotationResponsePromise
  evidence.created.quotation = (await quotationResponse.json()).data
  await page.getByText(ids.quotationNo).first().waitFor()
  await screenshot(page, '01-sales-manager', '03-quotation-created')
  await hold(page)

  const quotationRow = page.locator('tr').filter({ hasText: ids.quotationNo })
  await quotationRow.getByRole('button', { name: '查看详情' }).click()
  await page.getByRole('heading', { name: '报价单明细' }).waitFor()
  await screenshot(page, '01-sales-manager', '04-quotation-detail')
  const submitResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/submit') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: '提交审批' }).click()
  assert.equal((await submitResponsePromise).status(), 200)
  await page.getByText('待审批').first().waitFor()
  await hold(page)

  const approveResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/approve') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: '审批通过' }).click()
  assert.equal((await approveResponsePromise).status(), 200)
  await page.getByText('已审批').first().waitFor()
  await screenshot(page, '01-sales-manager', '05-quotation-approved')
  await hold(page)

  const confirmForm = page.locator('form.accessory-form')
  await confirmForm.getByLabel('确认日期').fill('2026-08-04')
  await confirmForm.getByLabel('合同号').fill(ids.exportContractNo)
  const contractResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/confirm-contract') && response.request().method() === 'POST',
  )
  await confirmForm.getByRole('button', { name: '生成出口合同' }).click()
  const contractResponse = await contractResponsePromise
  assert.equal(contractResponse.status(), 200)
  evidence.created.exportContract = (await contractResponse.json()).data
  await page.getByText(ids.exportContractNo).first().waitFor()
  await screenshot(page, '01-sales-manager', '06-export-contract-generated')
})
}

if (
  startStage === 2 &&
  evidence.created.exportContract?.approval_status !== 'approved'
) {
  await recordRole('01b-sales-contract-approval', 'demo', 'demo123', async (page) => {
    await page.goto(`${frontendUrl}sales/contracts`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: '订单 Workflow' }).waitFor()
    await page.getByLabel('合同搜索').fill(ids.exportContractNo)
    await page.getByLabel('合同搜索').press('Enter')
    const row = page.locator('tr').filter({ hasText: ids.exportContractNo })
    await row.getByRole('button', { name: '查看详情' }).click()
    await page.getByRole('heading', { name: '合同明细' }).waitFor()
    await screenshot(page, '01b-sales-contract-approval', '02-contract-draft')
    const submitPromise = page.waitForResponse(
      (response) => response.url().includes('/submit') && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: '提交审批' }).click()
    assert.equal((await submitPromise).status(), 200)
    await page.getByText('待审批').first().waitFor()
    await hold(page)
    const approvePromise = page.waitForResponse(
      (response) => response.url().includes('/approve') && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: '审批通过' }).click()
    const approveResponse = await approvePromise
    assert.equal(approveResponse.status(), 200)
    evidence.created.exportContract = (await approveResponse.json()).data
    await page.getByText('已审批').first().waitFor()
    await screenshot(page, '01b-sales-contract-approval', '03-contract-approved')
  })
}

if (startStage <= 2) {
await recordRole('02-purchase', 'purchase', 'purchase123', async (page) => {
  await page.goto(`${frontendUrl}purchase/contracts`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '采购合同和工厂履约' }).waitFor()
  await page.getByRole('button', { name: '从出口合同生成' }).click()
  const contractModal = page.locator('.ant-modal').filter({ hasText: '从出口合同生成采购合同' })
  const generateForm = contractModal.locator('form').filter({ hasText: '从已审批出口合同生成' })
  await generateForm.getByLabel('采购合同号', { exact: true }).fill(ids.purchaseContractNo)
  await generateForm.getByLabel('合同日期', { exact: true }).fill('2026-08-04')
  await generateForm
    .getByLabel('出口合同 ID A', { exact: true })
    .fill(evidence.created.exportContract.id)
  await generateForm.getByLabel('供应商标识', { exact: true }).fill('supplier-full-workflow')
  await generateForm.getByLabel('供应商', { exact: true }).fill('全链路辅料供应商')
  await generateForm.getByLabel('币种', { exact: true }).fill('USD')
  await generateForm.getByLabel('交货日期', { exact: true }).fill('2026-08-18')
  await generateForm.getByLabel('配件单价', { exact: true }).fill('0.22')
  await generateForm.getByLabel('付款条款', { exact: true }).fill('30% advance, 70% after QC')
  await generateForm.getByLabel('生成备注', { exact: true }).fill('由全链路出口合同生成')
  await generateForm.getByLabel('QC 负责人').click()
  await generateForm.getByRole('combobox').last().fill('qc')
  await page.getByText(/演示 QC 专员/).last().click()
  await screenshot(page, '02-purchase', '02-contract-ready')
  const createPromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/purchase/contracts/generate-from-export-contracts') &&
      response.request().method() === 'POST',
  )
  await generateForm.getByRole('button', { name: '生成采购合同' }).click()
  const createResponse = await createPromise
  assert.equal(createResponse.status(), 201)
  evidence.created.purchaseContract = (await createResponse.json()).data
  await page.getByText(ids.purchaseContractNo).first().waitFor()
  await screenshot(page, '02-purchase', '03-contract-generated')
  await hold(page)

  const contractRow = page.locator('tr').filter({ hasText: ids.purchaseContractNo })
  await contractRow.getByRole('button', { name: '查看详情' }).click()
  await page.getByRole('heading', { name: '采购合同明细' }).waitFor()
  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '采购合同明细' })
  const reviewerSelect = detailPanel.getByRole('combobox', { name: '审批人' })
  await reviewerSelect.click()
  await page.getByText(/演示管理员/).last().click()
  await screenshot(page, '02-purchase', '04-reviewer-selected')
  const submitPromise = page.waitForResponse(
    (response) => response.url().includes('/submit') && response.request().method() === 'POST',
  )
  await detailPanel.getByRole('button', { name: '提交采购合同' }).click()
  assert.equal((await submitPromise).status(), 200)
  await page.getByText('待审批').first().waitFor()
  await hold(page)
  await screenshot(page, '02-purchase', '05-contract-submitted')
})
}

if (startStage <= 2) {
await recordRole('02b-purchase-approval', 'admin', 'admin123', async (page) => {
  await page.goto(`${frontendUrl}purchase/contracts`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '采购合同和工厂履约' }).waitFor()
  await page.getByLabel('合同搜索').fill(ids.purchaseContractNo)
  await page.getByLabel('合同搜索').press('Enter')
  const row = page.locator('tr').filter({ hasText: ids.purchaseContractNo })
  await row.getByRole('button', { name: '查看详情' }).click()
  await page.getByRole('heading', { name: '采购合同明细' }).waitFor()
  await screenshot(page, '02b-purchase-approval', '02-pending')
  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '采购合同明细' })
  await detailPanel.getByRole('button', { name: '审批采购合同' }).click()
  const approvalModal = page.locator('.ant-modal').filter({ hasText: '采购合同审批' })
  await approvalModal.getByLabel('审批日期', { exact: true }).fill('2026-08-04')
  await screenshot(page, '02b-purchase-approval', '03-approval-ready')
  const approvePromise = page.waitForResponse(
    (response) => response.url().includes('/approve') && response.request().method() === 'POST',
  )
  await approvalModal.getByRole('button', { name: '审批采购合同' }).click()
  assert.equal((await approvePromise).status(), 200)
  await page.getByText('已审批').first().waitFor()
  await screenshot(page, '02b-purchase-approval', '04-approved')
})
}

if (startStage <= 3) {
await recordRole('03-admin-assign', 'admin', 'admin123', async (page) => {
  await page.goto(`${frontendUrl}quality/inspections`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'QC 任务中心' }).waitFor()
  await hold(page, 3000)
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('新增 QC 单'),
    )
    if (!(button instanceof HTMLButtonElement)) throw new Error('新增 QC 单按钮不存在')
    button.click()
  })
  const modal = page.locator('.ant-modal').filter({ hasText: '新增 QC 任务' })
  await modal.getByLabel('QC 任务单号').fill(ids.qualityTaskNo)

  const contractCombo = modal.getByRole('combobox', { name: '采购合同' })
  await contractCombo.click()
  await contractCombo.fill(ids.purchaseContractNo)
  await page.getByText(new RegExp(ids.purchaseContractNo)).last().click()
  await modal.getByLabel('排期时间').fill('2026-08-05T09:00')
  const inspectorCombo = modal.getByRole('combobox', { name: '负责人' })
  await inspectorCombo.click()
  await inspectorCombo.fill('qc')
  await page.getByText(/演示 QC 专员/).last().click()
  await modal.getByLabel('任务说明').fill('重点检查包装、数量和棉绳装配，完成后通知宁波仓入库')
  await screenshot(page, '03-admin-assign', '02-qc-task-ready')
  const createPromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/quality/inspections') &&
      response.request().method() === 'POST',
  )
  await modal.getByRole('button', { name: '创建 QC 任务' }).click()
  const createResponse = await createPromise
  assert.equal(createResponse.status(), 201)
  evidence.created.qualityTask = (await createResponse.json()).data
  await page.getByText(ids.qualityTaskNo).first().waitFor()
  await page.getByText('待查验').first().waitFor()
  await screenshot(page, '03-admin-assign', '03-qc-task-assigned')
})
}

if (startStage <= 4) {
await recordRole('04-qc', 'qc', 'qc123', async (page) => {
  await page.goto(`${frontendUrl}quality/tasks`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '我的 QC 任务' }).waitFor()
  await hold(page, 2000)
  await page.getByLabel('任务搜索').fill(ids.qualityTaskNo)
  await page.getByLabel('任务搜索').press('Enter')
  const row = page.locator('tr').filter({ hasText: ids.qualityTaskNo })
  if ((await row.getByRole('button', { name: '开始查验' }).count()) > 0) {
    await row.getByText('待查验').waitFor()
    await screenshot(page, '04-qc', '02-pending-task')
    const startPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/v1/quality/inspections/${evidence.created.qualityTask.id}`) &&
        response.request().method() === 'PUT',
    )
    await row.getByRole('button', { name: '开始查验' }).click()
    assert.equal((await startPromise).status(), 200)
  }
  await row.getByText('查验中').waitFor()
  await screenshot(page, '04-qc', '03-in-progress')
  await hold(page)

  await row.getByRole('button', { name: '登记结果' }).click()
  const modal = page.locator('.ant-modal').filter({ hasText: ids.qualityTaskNo })
  await modal.getByLabel('商品名称').waitFor()
  await page.waitForFunction(
    () => document.querySelector('#quality-task-product-name')?.value?.length > 0,
  )
  await modal.getByLabel('实际查验日期').fill('2026-08-05')
  await modal.getByLabel('不良数量').fill('0')
  await modal.getByLabel('明细备注').fill('数量、包装、辅料均符合合同要求')
  await screenshot(page, '04-qc', '04-result-ready')
  const completePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/v1/quality/inspections/${evidence.created.qualityTask.id}`) &&
      response.request().method() === 'PUT',
  )
  await modal.getByRole('button', { name: '完成 QC 查验' }).click()
  assert.equal((await completePromise).status(), 200)
  await row.getByText('已完成').waitFor()
  await row.getByText('通过').waitFor()
  await screenshot(page, '04-qc', '05-completed')
})
}

if (startStage <= 5) {
await recordRole('05-warehouse', 'warehouse', 'warehouse123', async (page) => {
  await page.goto(`${frontendUrl}warehouse/inbound-plans`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '入库计划' }).waitFor()
  await hold(page, 2000)
  const plans = await api(
    page,
    `/api/v1/warehouse/inbound-plans?purchase_contract_id=${evidence.created.purchaseContract.id}`,
  )
  evidence.created.inboundPlan = plans.items.find(
    (item) => item.purchase_contract_id === evidence.created.purchaseContract.id,
  )
  assert.ok(evidence.created.inboundPlan, 'purchase approval did not create an inbound plan')
  const planRow = page.locator('tr').filter({ hasText: evidence.created.inboundPlan.code })
  if (evidence.created.inboundPlan.status === 'planned') {
    await planRow.click()
    await page.getByRole('button', { name: '生成/排库位' }).click()
    const planModal = page.locator('.ant-modal').filter({ hasText: '入库计划生成和排库位' })
    await planModal.getByRole('button', { name: '保存库位安排' }).waitFor({ state: 'visible' })
    await planModal.locator('#inbound-schedule-date').fill('2026-08-06')
    await planModal.locator('#inbound-warehouse-id').fill('wh-ningbo')
    await planModal.locator('#inbound-warehouse-name').fill('宁波总仓')
    await planModal.locator('#inbound-location-id').fill('loc-full-a01')
    await planModal.locator('#inbound-location-name').fill('FULL-A-01')
    await planModal.locator('#inbound-operator-name').fill('演示仓库主管')
    await screenshot(page, '05-warehouse', '02-plan-ready')
    const schedulePromise = page.waitForResponse(
      (response) => response.url().includes('/schedule') && response.request().method() === 'POST',
    )
    await planModal.getByRole('button', { name: '保存库位安排' }).click()
    const scheduleResponse = await schedulePromise
    assert.equal(scheduleResponse.status(), 200)
    evidence.created.inboundPlan = (await scheduleResponse.json()).data
    await page.getByText('已安排 宁波总仓 / FULL-A-01').waitFor()
    await screenshot(page, '05-warehouse', '03-plan-scheduled')
    await page.keyboard.press('Escape')
    await hold(page)
  } else {
    await planRow.getByText('已排库位').waitFor()
    await screenshot(page, '05-warehouse', '03-plan-scheduled')
  }

  await page.goto(`${frontendUrl}warehouse/inbound-orders`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '入仓和库存确认' }).waitFor()
  await hold(page, 2000)
  const existingOrders = await api(
    page,
    `/api/v1/warehouse/inbound-orders?q=${encodeURIComponent(ids.inboundOrderNo)}`,
  )
  const existingOrder = existingOrders.items.find((item) => item.code === ids.inboundOrderNo)
  if (existingOrder) {
    evidence.created.inboundOrder = existingOrder
    await page.locator('tr').filter({ hasText: ids.inboundOrderNo }).click()
  }
  await page.getByRole('button', { name: '生成/审批入库单' }).click()
  const orderModal = page.locator('.ant-modal').filter({ hasText: '入库单生成和审批' })
  if (!existingOrder) {
    await orderModal.getByRole('combobox', { name: '入库计划' }).click()
    await page.getByText(new RegExp(evidence.created.inboundPlan.code)).last().click()
    await orderModal.locator('#inbound-order-code').fill(ids.inboundOrderNo)
    await orderModal.locator('#inbound-order-date').fill('2026-08-06')
    await orderModal.locator('#inbound-order-warehouse-id').fill('wh-ningbo')
    await orderModal.locator('#inbound-order-warehouse-name').fill('宁波总仓')
    await orderModal.locator('#inbound-order-location-id').fill('loc-full-a01')
    await orderModal.locator('#inbound-order-location-name').fill('FULL-A-01')
    await orderModal.locator('#inbound-order-operator').fill('演示仓库主管')
    const orderPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/warehouse/inbound-orders/from-plan') &&
        response.request().method() === 'POST',
    )
    await orderModal.getByRole('button', { name: '生成入库单' }).click()
    const orderResponse = await orderPromise
    assert.equal(orderResponse.status(), 201)
    evidence.created.inboundOrder = (await orderResponse.json()).data
  }

  const reviewerCombo = orderModal.getByRole('combobox', { name: '审批人' })
  await page.waitForFunction(() => {
    const input = document.querySelector('#inbound-order-reviewer')
    return input instanceof HTMLInputElement && !input.disabled
  })
  await reviewerCombo.click()
  await reviewerCombo.fill('admin')
  await hold(page, 1200)
  await page.locator('.ant-select-item-option').filter({ hasText: '演示管理员' }).click()
  await orderModal.getByText(/演示管理员/).first().waitFor()
  await orderModal.locator('#inbound-order-approved-at').fill('2026-08-06')
  await screenshot(page, '05-warehouse', '04-order-draft')
  const submitPromise = page.waitForResponse(
    (response) => response.url().includes('/submit') && response.request().method() === 'POST',
  )
  await orderModal.getByRole('button', { name: '提交审批' }).click()
  const submitResponse = await submitPromise
  assert.equal(submitResponse.status(), 200)
  evidence.created.inboundOrder = (await submitResponse.json()).data
  await orderModal.getByText(/等待.*演示管理员.*审批/).waitFor()
  await screenshot(page, '05-warehouse', '05-submitted-for-approval')
})

await recordRole('05b-admin-inbound-approval', 'admin', 'admin123', async (page) => {
  await page.goto(`${frontendUrl}warehouse/inbound-orders`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '入仓和库存确认' }).waitFor()
  await hold(page, 2000)
  await page.getByLabel('入库搜索').fill(ids.inboundOrderNo)
  await page.getByLabel('入库搜索').press('Enter')
  const row = page.locator('tr').filter({ hasText: ids.inboundOrderNo })
  await row.getByText('待审批').waitFor()
  await row.click()
  await page.getByRole('button', { name: '生成/审批入库单' }).click()
  const modal = page.locator('.ant-modal').filter({ hasText: '入库单生成和审批' })
  await modal.getByText(/演示管理员/).waitFor()
  await modal.locator('#inbound-order-approved-at').fill('2026-08-06')
  await screenshot(page, '05b-admin-inbound-approval', '02-ready')
  const approvePromise = page.waitForResponse(
    (response) => response.url().includes('/approve') && response.request().method() === 'POST',
  )
  await modal.getByRole('button', { name: '审批入库' }).click()
  const approveResponse = await approvePromise
  assert.equal(approveResponse.status(), 200)
  evidence.created.inboundOrder = (await approveResponse.json()).data
  await page.getByText(new RegExp(`${ids.inboundOrderNo}.*正式入库`)).waitFor()
  await screenshot(page, '05b-admin-inbound-approval', '03-stock-posted')
})
}

async function seedInvoiceNotice(page) {
  const generated = await api(page, '/api/v1/purchase/invoice-notices/from-customs-declaration', {
    method: 'POST',
    body: {
      customs_declaration_id: `cd-${ids.invoiceNoticeNo}`,
      customs_declaration_no: ids.invoiceNoticeNo,
      declaration_date: '2026-08-06',
      notice_date: '2026-08-07',
      currency: 'CNY',
      remarks: '全链路付款前置开票通知',
      lines: [
        {
          supplier_id: 'supplier-full-workflow',
          supplier_name: '全链路辅料供应商',
          purchase_contract_id: evidence.created.purchaseContract.id,
          purchase_contract_no: ids.purchaseContractNo,
          product_id: product.id,
          product_code: product.code,
          product_name: product.en_name,
          customs_name: '环保购物袋辅料',
          invoice_name: '全链路棉绳',
          quantity: '500',
          unit: 'm',
          amount: '3200.00',
          remark: '全链路财务付款',
        },
      ],
    },
  })
  const notice = generated.items[0]
  const received = await api(
    page,
    `/api/v1/purchase/invoice-notices/${notice.id}/receive-tax-invoice`,
    {
      method: 'POST',
      body: { tax_invoice_no: `VAT-${ids.invoiceNoticeNo}`, received_at: '2026-08-07' },
    },
  )
  evidence.created.invoiceNotice = received
  return received
}

if (startStage <= 6 && !evidence.created.invoiceNotice) {
  const financeSeedContext = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const financeSeedPage = await financeSeedContext.newPage()
  try {
    await login(financeSeedPage, 'purchase', 'purchase123')
    await seedInvoiceNotice(financeSeedPage)
    await writeFile(evidencePath, JSON.stringify(evidence, null, 2))
  } finally {
    await financeSeedContext.close()
  }
}

if (startStage <= 6) {
await recordRole('06-finance', 'finance', 'finance123', async (page) => {
  const notice = evidence.created.invoiceNotice
  await page.goto(`${frontendUrl}finance/payments`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '付款管理' }).waitFor()
  await hold(page, 2000)
  const existingInvoices = await api(
    page,
    `/api/v1/finance/supplier-invoices?q=${encodeURIComponent(ids.supplierInvoiceNo)}`,
  )
  const existingInvoice = existingInvoices.items.find(
    (item) => item.invoice_no === ids.supplierInvoiceNo,
  )
  if (existingInvoice) {
    evidence.created.supplierInvoice = existingInvoice
  } else {
    await page.getByRole('button', { name: '发票登记' }).click()
    const modal = page.locator('.ant-modal').filter({ hasText: '供应商发票登记' })
    await modal.getByLabel('供应商发票号').fill(ids.supplierInvoiceNo)
    await modal.getByLabel('发票日期').fill('2026-08-07')
    await modal.getByLabel('供应商标识').fill(notice.supplier_id)
    await modal.getByLabel('供应商名称').fill(notice.supplier_name)
    await modal.getByLabel('开票通知标识').fill(notice.id)
    await modal.getByLabel('开票通知编号').fill(notice.code)
    await modal.getByLabel('采购合同标识').fill(evidence.created.purchaseContract.id)
    await modal.getByLabel('采购合同号').fill(ids.purchaseContractNo)
    await modal.getByLabel('发票金额').fill('3200.00')
    await modal.getByLabel('币种').fill('CNY')
    await modal.getByLabel('到期日').fill('2026-08-20')
    await modal.getByLabel('备注').fill('QC 通过并入库后的首笔供应商付款')
    await screenshot(page, '06-finance', '02-invoice-ready')
    const invoicePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/finance/supplier-invoices') &&
        response.request().method() === 'POST',
    )
    await modal.getByRole('button', { name: '登记供应商发票' }).click()
    const invoiceResponse = await invoicePromise
    assert.equal(invoiceResponse.status(), 201)
    evidence.created.supplierInvoice = (await invoiceResponse.json()).data
  }
  await page.getByText(ids.supplierInvoiceNo).first().waitFor()
  await screenshot(page, '06-finance', '03-invoice-created')
  await page
    .locator('.finance-payment-list-panel tr')
    .filter({ hasText: ids.supplierInvoiceNo })
    .click()
  await page.getByRole('heading', { name: '付款申请和审批' }).waitFor()

  const panel = page.locator('.finance-payment-request-panel')
  await panel.getByLabel('付款申请号').fill(ids.paymentRequestNo)
  await panel.getByLabel('申请日期').fill('2026-08-08')
  await panel.getByLabel('申请金额').fill('1200.00')
  await panel.getByLabel('币种').fill('CNY')
  await panel.getByLabel('申请备注').fill('首笔货款申请，提交财务主管审批')
  await screenshot(page, '06-finance', '04-payment-request-ready')
  const requestPromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/finance/payment-requests') &&
      response.request().method() === 'POST',
  )
  await panel.getByRole('button', { name: '新增付款申请' }).click()
  const requestResponse = await requestPromise
  assert.equal(requestResponse.status(), 201)
  evidence.created.paymentRequest = (await requestResponse.json()).data
  await panel.getByText(ids.paymentRequestNo).waitFor()
  await panel.getByText('申请人不能审批自己的付款申请').waitFor()
  await screenshot(page, '06-finance', '05-payment-request-submitted')
})
}

if (startStage <= 7) {
await recordRole('07-finance-manager', 'finance_manager', 'finance-manager123', async (page) => {
  await page.goto(`${frontendUrl}finance/payments`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '付款管理' }).waitFor()
  await page.getByLabel('发票搜索').fill(ids.supplierInvoiceNo)
  await page.getByLabel('发票搜索').press('Enter')
  const invoiceRow = page
    .locator('.finance-payment-list-panel tr')
    .filter({ hasText: ids.supplierInvoiceNo })
  await invoiceRow.getByText(ids.supplierInvoiceNo).waitFor()
  await screenshot(page, '07-finance-manager', '02-pending-invoice')
  await invoiceRow.click()
  const panel = page.locator('.finance-payment-request-panel')
  await panel.getByText(ids.paymentRequestNo).waitFor()
  await panel.locator('tr').filter({ hasText: ids.paymentRequestNo }).click()
  await panel.getByLabel('审批金额').fill('1200.00')
  await panel.getByLabel('审批日期').fill('2026-08-08')
  await panel.getByLabel('付款账号').fill('BOC 8888')
  await panel.getByLabel('审批备注').fill('单据、入库和 QC 已核验，批准首笔货款')
  await screenshot(page, '07-finance-manager', '03-approval-ready')
  const approvePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith(
        `/api/v1/finance/payment-requests/${evidence.created.paymentRequest.id}/approve`,
      ) && response.request().method() === 'POST',
  )
  await panel.getByRole('button', { name: '审批付款' }).click()
  const approveResponse = await approvePromise
  assert.equal(approveResponse.status(), 200)
  evidence.created.paymentRequest = (await approveResponse.json()).data
  await panel.getByText('已审批').first().waitFor()
  await screenshot(page, '07-finance-manager', '04-approved')
})
}

await writeFile(evidencePath, JSON.stringify(evidence, null, 2))
await browser.close()

console.log(JSON.stringify({ artifactRoot, ids, created: evidence.created }, null, 2))
