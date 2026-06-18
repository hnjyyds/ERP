import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-partners.png')
const partnerCode = `P-E2E-${Date.now()}`

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1180 } })

function waitForPartners(method, matcher = () => true) {
  return page.waitForResponse((response) => {
    const request = response.request()
    return (
      response.url().includes('/api/v1/masterdata/partners') &&
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

async function chooseSelect(dialog, labelText, optionText) {
  await dialog
    .locator('label')
    .filter({ hasText: labelText })
    .first()
    .locator('.ant-select')
    .click()
  const dropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last()
  await dropdown.getByText(optionText, { exact: true }).click()
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

  const listResponse = waitForPartners('GET')
  await page.goto(new URL('/masterdata/partners', frontendUrl).toString())
  await listResponse
  await page.getByRole('heading', { name: '合作伙伴', exact: true }).waitFor()

  await page.getByRole('button', { name: '新增合作伙伴' }).click()
  const createDialog = await activeDialog()
  await createDialog.getByLabel('编号', { exact: true }).fill(partnerCode)
  await createDialog.getByLabel('中文名称', { exact: true }).fill('端到端国际货代')
  await createDialog.getByLabel('英文名称', { exact: true }).fill('E2E Global Forwarding')
  await chooseSelect(createDialog, '合作伙伴类型', '货代公司')
  await createDialog.getByLabel('国家/地区', { exact: true }).fill('China')
  await createDialog.getByLabel('网站', { exact: true }).fill('https://example.com/e2e-partner')
  await createDialog.getByLabel('地址', { exact: true }).fill('Shanghai Port Service Center')
  await createDialog.getByLabel('姓名', { exact: true }).fill('Grace Lin')
  await createDialog.getByLabel('职务', { exact: true }).fill('Operation Manager')
  await createDialog.getByLabel('邮箱', { exact: true }).fill('grace.e2e@example.com')
  await createDialog.getByLabel('电话', { exact: true }).fill('+86-21-0000')

  const createResponse = waitForPartners('POST', (response) =>
    response.url().endsWith('/api/v1/masterdata/partners') && response.status() === 201,
  )
  await createDialog.getByRole('button', { name: '新增合作伙伴' }).click()
  await createResponse

  await page.getByText(partnerCode).first().waitFor()
  await page.getByText('端到端国际货代').first().waitFor()
  await page.getByText('Grace Lin').first().waitFor()
  await page.getByText('货代公司').first().waitFor()

  await page.getByRole('button', { name: '新增联系人' }).click()
  const addContactDialog = await activeDialog()
  await addContactDialog.getByLabel('姓名', { exact: true }).fill('Mia Chen')
  await addContactDialog.getByLabel('职务', { exact: true }).fill('Account Executive')
  await addContactDialog.getByLabel('邮箱', { exact: true }).fill('mia.e2e@example.com')
  await addContactDialog.getByLabel('电话', { exact: true }).fill('+65-6000-0000')

  const createContactResponse = waitForPartners('POST', (response) =>
    response.url().includes('/contacts') && response.status() === 201,
  )
  const refreshAfterCreateContact = waitForPartners('GET')
  await addContactDialog.getByRole('button', { name: '新增联系人' }).click()
  await createContactResponse
  await refreshAfterCreateContact
  await page.getByText('Mia Chen').first().waitFor()

  const miaCard = page.locator('.contact-card').filter({ hasText: 'Mia Chen' }).first()
  await miaCard.locator('button').first().click()
  const editContactDialog = await activeDialog()
  await editContactDialog.getByLabel('姓名', { exact: true }).fill('Mia Chen Updated')
  await editContactDialog.getByLabel('职务', { exact: true }).fill('Senior Account Executive')

  const updateContactResponse = waitForPartners('PUT', (response) => response.url().includes('/contacts/'))
  const refreshAfterUpdateContact = waitForPartners('GET')
  await editContactDialog.getByRole('button', { name: '保存联系人' }).click()
  await updateContactResponse
  await refreshAfterUpdateContact
  await page.getByText('Mia Chen Updated').first().waitFor()

  const updatedCard = page.locator('.contact-card').filter({ hasText: 'Mia Chen Updated' }).first()
  await updatedCard.locator('button').nth(1).click()
  const deleteDialog = await activeDialog()
  const deleteContactResponse = waitForPartners('DELETE', (response) => response.url().includes('/contacts/'))
  const refreshAfterDeleteContact = waitForPartners('GET')
  await deleteDialog.locator('button').filter({ hasText: '删' }).last().click()
  await deleteContactResponse
  await refreshAfterDeleteContact
  await page.waitForFunction((name) => !document.body.innerText.includes(name), 'Mia Chen Updated')

  assert.equal(
    await page.locator('.contact-card').filter({ hasText: 'Mia Chen Updated' }).count(),
    0,
    'deleting a partner contact should remove the visible contact card',
  )

  await page.getByRole('button', { name: '停用' }).click()
  const deactivateDialog = await activeDialog()
  const deactivateResponse = waitForPartners(
    'DELETE',
    (response) => !response.url().includes('/contacts/'),
  )
  await deactivateDialog.locator('button').filter({ hasText: '停' }).last().click()
  await deactivateResponse
  await page.getByText('合作伙伴已停用').waitFor()
  await page.locator('.entity-detail-hero').getByText('停用').waitFor()

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Partners E2E passed. Screenshot: ${screenshotPath}`)
} finally {
  await browser.close()
}
