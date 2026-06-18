import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-purchase-contracts.png')
const runId = Date.now()
const productCode = `BAG-PC-E2E-${runId}`
const exportContractNoA = `EC-PC-A-${runId}`
const exportContractNoB = `EC-PC-B-${runId}`
const purchaseContractNo = `PC-E2E-${runId}`
const stockContractNo = `PC-STOCK-${runId}`

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

  const loginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await loginResponse

  const fixtures = await page.evaluate(
    async ({ exportContractNoA, exportContractNoB, productCode }) => {
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

      const product = await request('/api/v1/masterdata/products', {
        method: 'POST',
        body: JSON.stringify({
          code: productCode,
          cn_name: 'E2E 环保购物袋',
          en_name: 'E2E Eco Shopping Bag',
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
              accessory_name: '棉绳',
              unit_consumption: '0.45',
              unit: 'm',
              default_supplier_name: '远景辅料供应商',
              purchase_split_rule: 'by_supplier',
            },
          ],
        }),
      })

      async function createApprovedExportContract(code, quantity, plannedShipDate) {
        const contract = await request('/api/v1/sales/contracts', {
          method: 'POST',
          body: JSON.stringify({
            code,
            contract_date: '2026-08-01',
            customer_id: 'customer-euro-home',
            customer_name: '欧陆家居用品有限公司',
            sales_user_id: 'u-001',
            sales_user_name: '演示业务主管',
            currency: 'USD',
            trade_term: 'FOB Ningbo',
            planned_ship_date: plannedShipDate,
            payment_terms: '30% T/T in advance, balance before shipment',
            source_quotation_id: null,
            source_quotation_no: null,
            remarks: '采购合同 E2E 来源出口合同',
            lines: [
              {
                product_id: product.id,
                product_code: product.code,
                product_name: product.en_name,
                specification: product.specification,
                model: product.model,
                quantity,
                unit: 'pcs',
                unit_price: '1.40',
                purchased_quantity: '0',
                shipped_quantity: '0',
                image_url: null,
                remark: '待采购配件',
              },
            ],
          }),
        })
        await request(`/api/v1/sales/contracts/${contract.id}/submit`, { method: 'POST' })
        return request(`/api/v1/sales/contracts/${contract.id}/approve`, {
          method: 'POST',
          body: JSON.stringify({ reviewer_name: '演示业务主管', approved_at: '2026-08-02' }),
        })
      }

      const contractA = await createApprovedExportContract(exportContractNoA, '1000', '2026-08-20')
      const contractB = await createApprovedExportContract(exportContractNoB, '500', '2026-08-22')

      return {
        product,
        contractA,
        contractB,
      }
    },
    { exportContractNoA, exportContractNoB, productCode },
  )

  const contractMenu = page.getByLabel('主导航').getByRole('link', { name: '采购合同' })
  await contractMenu.waitFor({ state: 'visible' })
  await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/v1/purchase/contracts' &&
        response.request().method() === 'GET' &&
        response.ok()
      )
    }),
    contractMenu.click(),
  ])
  await page.getByRole('heading', { name: '采购合同和付款交货提醒' }).waitFor()

  const formPanel = page.locator('.product-form-panel')
  const generateForm = formPanel.locator('form').filter({ hasText: '从已审批出口合同生成' })
  await generateForm.getByLabel('采购合同号', { exact: true }).fill(purchaseContractNo)
  await generateForm.getByLabel('合同日期', { exact: true }).fill('2026-08-04')
  await generateForm.getByLabel('出口合同 ID A', { exact: true }).fill(fixtures.contractA.id)
  await generateForm.getByLabel('出口合同 ID B', { exact: true }).fill(fixtures.contractB.id)
  await generateForm.getByLabel('供应商标识', { exact: true }).fill('supplier-accessory-a')
  await generateForm.getByLabel('供应商', { exact: true }).fill('远景辅料供应商')
  await generateForm.getByLabel('币种', { exact: true }).fill('USD')
  await generateForm.getByLabel('交货日期', { exact: true }).fill('2026-08-24')
  await generateForm.getByLabel('配件单价', { exact: true }).fill('0.12')
  await generateForm.getByLabel('付款条款', { exact: true }).fill('30% advance, 70% before delivery')
  await generateForm.getByLabel('生成备注', { exact: true }).fill('E2E 多出口合同合并采购')

  const generateResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/purchase/contracts/generate-from-export-contracts') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await generateForm.getByRole('button', { name: '生成采购合同' }).click()
  await generateResponse
  await page.getByText(purchaseContractNo).first().waitFor()

  const detailPanel = page.locator('.product-detail-panel').filter({ hasText: '采购合同明细' })
  await detailPanel.getByText('出口合同生成').first().waitFor()
  await detailPanel.getByText('棉绳').first().waitFor()
  await detailPanel.getByText('675 m').first().waitFor()
  await detailPanel.getByText('USD 81.00').first().waitFor()
  await detailPanel.getByRole('cell', { name: exportContractNoA }).waitFor()
  await detailPanel.getByRole('cell', { name: exportContractNoB }).waitFor()
  await detailPanel.getByText('付款提醒').first().waitFor()
  await detailPanel.getByText('交货提醒').first().waitFor()

  await detailPanel.getByRole('button', { name: '载入编辑' }).click()
  await formPanel.getByRole('heading', { name: '编辑采购合同' }).waitFor()
  const manualForm = formPanel.locator('form').filter({ hasText: '合同商品明细' })
  await manualForm.getByLabel('供应商', { exact: true }).fill('远景辅料供应商-编辑')
  await manualForm.getByLabel('合同备注', { exact: true }).fill('E2E 编辑后的采购合同备注')
  const updateResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/purchase/contracts/') &&
    response.request().method() === 'PUT' &&
    response.ok(),
  )
  await manualForm.getByRole('button', { name: '保存采购合同' }).click()
  await updateResponse
  await detailPanel.getByText('远景辅料供应商-编辑').waitFor()
  await detailPanel.getByText('E2E 编辑后的采购合同备注').waitFor()

  const submitResponse = page.waitForResponse((response) =>
    response.url().includes('/submit') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '提交采购合同' }).click()
  await submitResponse
  await page.getByRole('cell', { name: '待审批' }).first().waitFor()

  await detailPanel.getByLabel('审批人', { exact: true }).fill('演示业务主管')
  await detailPanel.getByLabel('审批日期', { exact: true }).fill('2026-08-05')
  const approveResponse = page.waitForResponse((response) =>
    response.url().includes('/approve') &&
    response.request().method() === 'POST' &&
    response.ok(),
  )
  await detailPanel.getByRole('button', { name: '审批采购合同' }).click()
  await approveResponse
  await page.getByRole('cell', { name: '已审批' }).first().waitFor()

  const purchaseProgress = await page.evaluate(async ({ contractAId, contractBId }) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    async function getContract(contractId) {
      const response = await fetch(`/api/v1/sales/contracts/${contractId}`, { headers })
      if (!response.ok) throw new Error(await response.text())
      return (await response.json()).data
    }
    const contractA = await getContract(contractAId)
    const contractB = await getContract(contractBId)
    return {
      a: contractA.purchase_statuses[0],
      b: contractB.purchase_statuses[0],
    }
  }, { contractAId: fixtures.contractA.id, contractBId: fixtures.contractB.id })

  assert.equal(purchaseProgress.a.purchased_quantity, '1000')
  assert.equal(purchaseProgress.a.status, 'completed')
  assert.equal(purchaseProgress.b.purchased_quantity, '500')
  assert.equal(purchaseProgress.b.status, 'completed')

  await manualForm.getByLabel('合同号', { exact: true }).fill(stockContractNo)
  await manualForm.getByLabel('合同日期', { exact: true }).fill('2026-08-06')
  await manualForm.getByLabel('供应商标识', { exact: true }).fill('supplier-stock-a')
  await manualForm.getByLabel('供应商', { exact: true }).fill('库存备货供应商')
  await manualForm.getByLabel('采购员', { exact: true }).fill('演示业务主管')
  await manualForm.getByLabel('币种', { exact: true }).fill('USD')
  await manualForm.getByLabel('交货日期', { exact: true }).fill('2026-08-28')
  await manualForm.locator('#purchase-contract-source-type').selectOption('stock_purchase')
  await manualForm.getByLabel('付款条款', { exact: true }).fill('Pay after delivery')
  const productPicker = manualForm.locator('.ant-select').filter({ hasText: '从商品资料选择' })
  await productPicker.click()
  await page.getByRole('combobox').last().fill(productCode)
  await page.getByText(`${productCode} / E2E 环保购物袋 / E2E Eco Shopping Bag`).click()
  await manualForm.getByLabel('商品标识', { exact: true }).waitFor()
  await manualForm.getByLabel('商品编号', { exact: true }).fill(`${productCode}-STOCK`)
  await manualForm.getByLabel('商品名称', { exact: true }).fill('库存补货棉绳')
  await manualForm.getByLabel('规格', { exact: true }).fill('5mm')
  await manualForm.getByLabel('型号', { exact: true }).fill('ROPE-5')
  await manualForm.getByLabel('数量', { exact: true }).fill('200')
  await manualForm.getByLabel('单位', { exact: true }).fill('m')
  await manualForm.getByLabel('单价', { exact: true }).fill('0.11')
  await manualForm.getByLabel('行备注', { exact: true }).fill('库存采购入口')
  await manualForm.getByLabel('合同备注', { exact: true }).fill('无出口合同的库存采购')

  const stockResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/purchase/contracts') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  )
  await manualForm.getByRole('button', { name: '新增采购合同' }).click()
  await stockResponse
  await page.getByText(stockContractNo).first().waitFor()
  await detailPanel.getByText('库存采购').first().waitFor()
  await detailPanel.getByText('库存采购或手工采购，无来源出口合同').waitFor()
  await detailPanel.getByText('库存补货棉绳').waitFor()

  assert.ok((await page.getByText(purchaseContractNo).count()) >= 1, 'generated contract should be visible')
  assert.ok((await page.getByText(stockContractNo).count()) >= 1, 'stock purchase contract should be visible')

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Purchase contracts E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
