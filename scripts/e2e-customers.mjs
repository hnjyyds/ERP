import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-customers.png')
const customerCode = `C-E2E-${Date.now()}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1180 } })

function waitForCustomers(method, matcher = () => true) {
  return page.waitForResponse((response) => {
    const request = response.request()
    return (
      response.url().includes('/api/v1/masterdata/customers') &&
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

  const listResponse = waitForCustomers('GET')
  await page.goto(new URL('/masterdata/customers', frontendUrl).toString())
  await listResponse
  await page.getByRole('heading', { name: '客户资料', exact: true }).waitFor()

  await page.getByRole('button', { name: '新增客户' }).click()
  const createDialog = await activeDialog()
  await createDialog.getByLabel('编号', { exact: true }).fill(customerCode)
  await createDialog.getByLabel('中文名称', { exact: true }).fill('端到端欧洲客户')
  await createDialog.getByLabel('英文名称', { exact: true }).fill('E2E Europe Buyer')
  await createDialog.getByLabel('国家/地区', { exact: true }).fill('Germany')
  await createDialog.getByLabel('网站', { exact: true }).fill('https://example.com/e2e-buyer')
  await createDialog.getByLabel('地址', { exact: true }).fill('Hamburg Trade Center')
  await createDialog.getByLabel('授信额度', { exact: true }).fill('50000')
  await createDialog.getByLabel('币种', { exact: true }).fill('USD')
  await createDialog.getByLabel('账期', { exact: true }).fill('T/T 30 days')
  await createDialog.getByLabel('姓名', { exact: true }).fill('Anna Schmidt')
  await createDialog.getByLabel('职务', { exact: true }).fill('Sourcing Manager')
  await createDialog.getByLabel('邮箱', { exact: true }).fill('anna.e2e@example.com')
  await createDialog.getByLabel('电话', { exact: true }).fill('+49-40-1234')

  const createResponse = waitForCustomers('POST', (response) =>
    response.url().endsWith('/api/v1/masterdata/customers') && response.status() === 201,
  )
  await createDialog.getByRole('button', { name: '新增客户' }).click()
  await createResponse

  await page.getByText(customerCode).first().waitFor()
  await page.getByText('端到端欧洲客户').first().waitFor()
  await page.getByText('Anna Schmidt').first().waitFor()

  await page.getByRole('button', { name: '新增联系人' }).click()
  const addContactDialog = await activeDialog()
  await addContactDialog.getByLabel('姓名', { exact: true }).fill('Bob Carter')
  await addContactDialog.getByLabel('职务', { exact: true }).fill('Import Director')
  await addContactDialog.getByLabel('邮箱', { exact: true }).fill('bob.e2e@example.com')
  await addContactDialog.getByLabel('电话', { exact: true }).fill('+1-212-0000')

  const createContactResponse = waitForCustomers('POST', (response) =>
    response.url().includes('/contacts') && response.status() === 201,
  )
  const refreshAfterCreateContact = waitForCustomers('GET')
  await addContactDialog.getByRole('button', { name: '新增联系人' }).click()
  await createContactResponse
  await refreshAfterCreateContact
  await page.getByText('Bob Carter').first().waitFor()

  const bobCard = page.locator('.contact-card').filter({ hasText: 'Bob Carter' }).first()
  await bobCard.locator('button').first().click()
  const editContactDialog = await activeDialog()
  await editContactDialog.getByLabel('姓名', { exact: true }).fill('Robert Carter')
  await editContactDialog.getByLabel('职务', { exact: true }).fill('Senior Import Director')

  const updateContactResponse = waitForCustomers('PUT', (response) => response.url().includes('/contacts/'))
  const refreshAfterUpdateContact = waitForCustomers('GET')
  await editContactDialog.getByRole('button', { name: '保存联系人' }).click()
  await updateContactResponse
  await refreshAfterUpdateContact
  await page.getByText('Robert Carter').first().waitFor()

  const robertCard = page.locator('.contact-card').filter({ hasText: 'Robert Carter' }).first()
  await robertCard.locator('button').nth(1).click()
  const deleteDialog = await activeDialog()
  const deleteContactResponse = waitForCustomers('DELETE', (response) => response.url().includes('/contacts/'))
  const refreshAfterDeleteContact = waitForCustomers('GET')
  await deleteDialog.locator('button').filter({ hasText: '删' }).last().click()
  await deleteContactResponse
  await refreshAfterDeleteContact
  await page.waitForFunction((name) => !document.body.innerText.includes(name), 'Robert Carter')

  assert.equal(
    await page.locator('.contact-card').filter({ hasText: 'Robert Carter' }).count(),
    0,
    'deleting a customer contact should remove the visible contact card',
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Customers E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
