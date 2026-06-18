import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-suppliers.png')
const supplierCode = `S-E2E-${Date.now()}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1180 } })

function waitForSuppliers(method, matcher = () => true) {
  return page.waitForResponse((response) => {
    const request = response.request()
    return (
      response.url().includes('/api/v1/masterdata/suppliers') &&
      request.method() === method &&
      response.ok() &&
      matcher(response)
    )
  })
}

async function activeDialog() {
  const dialog = page.getByRole('dialog').last()
  await dialog.waitFor()
  return dialog
}

async function login() {
  await page.goto(frontendUrl)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByLabel('用户名').waitFor()
  await page.getByLabel('用户名').fill('demo')
  await page.getByLabel('密码').fill('demo123')

  const loginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await loginResponse
}

try {
  await login()

  const listResponse = waitForSuppliers('GET')
  await page.goto(new URL('/masterdata/suppliers', frontendUrl).toString())
  await listResponse
  await page.getByRole('heading', { name: '供应商资料', exact: true }).waitFor()

  await page.getByRole('button', { name: '新增供应商' }).click()
  const createDialog = await activeDialog()
  await createDialog.getByLabel('编号', { exact: true }).fill(supplierCode)
  await createDialog.getByLabel('中文名称', { exact: true }).fill('端到端包装供应商')
  await createDialog.getByLabel('英文名称', { exact: true }).fill('E2E Packaging Supplier')
  await createDialog.getByLabel('国家/地区', { exact: true }).fill('China')
  await createDialog.getByLabel('网站', { exact: true }).fill('https://example.com/e2e-supplier')
  await createDialog.getByLabel('地址', { exact: true }).fill('Ningbo Industrial Zone')
  await createDialog.getByLabel('授信额度', { exact: true }).fill('80000')
  await createDialog.getByLabel('币种', { exact: true }).fill('CNY')
  await createDialog.getByLabel('账期', { exact: true }).fill('30% deposit, 70% before shipment')
  await createDialog.getByLabel('姓名', { exact: true }).fill('Li Wei')
  await createDialog.getByLabel('职务', { exact: true }).fill('Sales Manager')
  await createDialog.getByLabel('邮箱', { exact: true }).fill('liwei.e2e@example.com')
  await createDialog.getByLabel('电话', { exact: true }).fill('+86-574-1234')

  const createResponse = waitForSuppliers('POST', (response) =>
    response.url().endsWith('/api/v1/masterdata/suppliers') && response.status() === 201,
  )
  await createDialog.getByRole('button', { name: '新增供应商' }).click()
  await createResponse

  await page.getByText(supplierCode).first().waitFor()
  await page.getByText('端到端包装供应商').first().waitFor()
  await page.getByText('Li Wei').first().waitFor()

  await page.getByRole('button', { name: '新增联系人' }).click()
  const addContactDialog = await activeDialog()
  await addContactDialog.getByLabel('姓名', { exact: true }).fill('Zhang Min')
  await addContactDialog.getByLabel('职务', { exact: true }).fill('Production Planner')
  await addContactDialog.getByLabel('邮箱', { exact: true }).fill('zhang.e2e@example.com')
  await addContactDialog.getByLabel('电话', { exact: true }).fill('+86-574-5678')

  const createContactResponse = waitForSuppliers('POST', (response) =>
    response.url().includes('/contacts') && response.status() === 201,
  )
  const refreshAfterCreateContact = waitForSuppliers('GET')
  await addContactDialog.getByRole('button', { name: '新增联系人' }).click()
  await createContactResponse
  await refreshAfterCreateContact
  await page.getByText('Zhang Min').first().waitFor()

  const zhangCard = page.locator('.contact-card').filter({ hasText: 'Zhang Min' }).first()
  await zhangCard.locator('button').first().click()
  const editContactDialog = await activeDialog()
  await editContactDialog.getByLabel('姓名', { exact: true }).fill('Zhang Min Updated')
  await editContactDialog.getByLabel('职务', { exact: true }).fill('Senior Production Planner')

  const updateContactResponse = waitForSuppliers('PUT', (response) => response.url().includes('/contacts/'))
  const refreshAfterUpdateContact = waitForSuppliers('GET')
  await editContactDialog.getByRole('button', { name: '保存联系人' }).click()
  await updateContactResponse
  await refreshAfterUpdateContact
  await page.getByText('Zhang Min Updated').first().waitFor()

  const updatedCard = page.locator('.contact-card').filter({ hasText: 'Zhang Min Updated' }).first()
  await updatedCard.locator('button').nth(1).click()
  const deleteDialog = await activeDialog()
  const deleteContactResponse = waitForSuppliers('DELETE', (response) => response.url().includes('/contacts/'))
  const refreshAfterDeleteContact = waitForSuppliers('GET')
  await deleteDialog.locator('button').filter({ hasText: '删' }).last().click()
  await deleteContactResponse
  await refreshAfterDeleteContact
  await page.waitForFunction((name) => !document.body.innerText.includes(name), 'Zhang Min Updated')

  assert.equal(
    await page.locator('.contact-card').filter({ hasText: 'Zhang Min Updated' }).count(),
    0,
    'deleting a supplier contact should remove the visible contact card',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Suppliers E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
