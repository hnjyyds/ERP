import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-organization-company.png')
const pageScreenshotPath = resolve('artifacts/e2e-organization-users-page.png')

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1728, height: 1000 } })

const success = (data) => ({
  success: true,
  code: 'SUCCESS',
  message: '请求成功',
  data,
  error: null,
})

const currentUser = {
  id: 'u-admin',
  username: 'admin',
  display_name: '演示管理员',
  department_name: '管理部',
  avatar_type: 'preset',
  avatar_value: 'person-business-08',
  roles: ['超级管理员'],
  permissions: ['dashboard:view', 'system:super_admin'],
}

const menus = [
  {
    id: 'menu-dashboard',
    label: '工作桌面',
    path: '/',
    icon: 'calendar-clock',
    required_permission: 'dashboard:view',
    sort_order: 10,
  },
  {
    id: 'menu-organization-users',
    label: '组织管理',
    path: '/organization/users',
    icon: 'users',
    required_permission: 'system:super_admin',
    sort_order: 12,
  },
]

const departments = [
  { id: 'dept-admin', name: '管理部', parent_id: null, sort_order: 10 },
  { id: 'dept-sales', name: '业务部', parent_id: null, sort_order: 20 },
  { id: 'dept-finance', name: '财务部', parent_id: null, sort_order: 30 },
]

const permissions = [
  { id: 'perm-dashboard-view', code: 'dashboard:view', name: '查看工作桌面', category: 'functional' },
  { id: 'perm-system-super-admin', code: 'system:super_admin', name: '超级管理员', category: 'functional' },
]

const roles = [
  {
    id: 'role-admin',
    name: '超级管理员',
    code: 'super_admin',
    data_scope: 'all',
    permissions,
  },
]

const company = {
  name: '新裴贸易有限公司',
  name_en: 'D-Dutch Trading Co., Ltd.',
  letterhead: 'D-DUTCH',
  address: '上海市浦东新区示例路 88 号',
  address_en: 'No. 88 Example Road, Pudong, Shanghai',
  phone: '021-88888888',
  fax: null,
  email: 'ops@example.com',
  website: 'https://example.com',
  tax_no: '91310000EXAMPLE',
  bank_name: '中国银行上海分行',
  bank_account: '6222000000000000',
  bank_swift: 'BKCHCNBJ300',
  logo: null,
  updated_at: '2026-06-17T10:00:00Z',
}

await page.route('**/api/v1/auth/me', async (route) => {
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ user: currentUser, menus })) })
})
await page.route('**/api/v1/system/i18n', async (route) => route.continue())
await page.route('**/api/v1/organization/options', async (route) => {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(success({ departments, roles, permissions })),
  })
})
await page.route('**/api/v1/organization/users', async (route) => {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(
      success({
        users: [
          {
            id: 'u-admin',
            username: 'admin',
            display_name: '演示管理员',
            department_id: 'dept-admin',
            department_name: '管理部',
            avatar_type: 'preset',
            avatar_value: 'person-business-08',
            roles,
            is_active: true,
            created_at: '2026-06-17T09:00:00Z',
            password_set: true,
          },
        ],
      }),
    ),
  })
})
await page.route('**/api/v1/organization/company', async (route) => {
  if (route.request().method() === 'PATCH') {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(success({ ...company, updated_at: '2026-06-17T11:00:00Z' })),
    })
    return
  }
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success(company)) })
})

try {
  await page.goto(frontendUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => window.localStorage.setItem('yuanjing_access_token', 'e2e-admin-token'))
  await page.goto(new URL('/organization/users', frontendUrl).toString())
  await page.getByRole('heading', { name: '公司信息' }).waitFor()
  await page.getByRole('button', { name: '编辑公司信息' }).waitFor()
  await page.getByRole('heading', { name: '部门管理' }).waitFor()
  await page.getByRole('heading', { name: '角色管理' }).waitFor()

  assert.equal(
    await page.locator('.organization-company input').count(),
    0,
    'company form fields should not be rendered inline on the organization page',
  )
  assert.ok(
    await page.locator('.organization-company-summary').isVisible(),
    'company summary should be visible before opening the editor',
  )

  const companyBox = await page.locator('.organization-company').boundingBox()
  assert.ok(companyBox, 'company information card should have a layout box')
  assert.ok(
    companyBox.height < 190,
    `company information card should stay compact, got ${companyBox.height}px`,
  )

  const detailMetrics = await page.evaluate(() => {
    const detail = document.querySelector('.organization-detail')
    const detailGrid = document.querySelector('.organization-detail-grid')
    const actions = document.querySelector('.organization-actions')
    const detailRect = detail?.getBoundingClientRect()
    const gridRect = detailGrid?.getBoundingClientRect()
    const actionsRect = actions?.getBoundingClientRect()
    return {
      detailHeight: detailRect?.height ?? 0,
      gridHeight: gridRect?.height ?? 0,
      actionsBottom: actionsRect?.bottom ?? 0,
      viewportHeight: window.innerHeight,
    }
  })
  assert.ok(
    detailMetrics.gridHeight <= 130,
    `user detail grid should stay compact, got ${detailMetrics.gridHeight}px`,
  )
  assert.ok(
    detailMetrics.actionsBottom <= detailMetrics.viewportHeight,
    `user detail actions should be visible in one viewport, got bottom ${detailMetrics.actionsBottom}px`,
  )
  await page.screenshot({ path: pageScreenshotPath, fullPage: true })

  await page.getByRole('button', { name: '编辑公司信息' }).click()
  const dialog = page.getByRole('dialog', { name: '编辑公司信息' })
  await dialog.waitFor()
  await dialog.getByLabel('公司名称 *').waitFor()
  await dialog.getByLabel('英文名称').waitFor()
  await dialog.getByRole('button', { name: '保存公司信息' }).waitFor()
  await page.waitForTimeout(600)

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Organization company E2E passed. Screenshots: ${pageScreenshotPath}, ${screenshotPath}`)
} finally {
  await browser.close()
}
