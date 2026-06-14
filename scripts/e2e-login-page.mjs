import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-login-page.png')

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

try {
  await page.goto(frontendUrl)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('heading', { name: '登录工作台' }).waitFor()
  await page.getByText('D-DUTCH', { exact: true }).waitFor()
  await page.getByText('新裴贸易', { exact: true }).waitFor()
  await page.getByRole('heading', { name: '精品外贸供应链工作台' }).waitFor()
  await page.getByText('出口业务', { exact: true }).waitFor()
  await page.getByText('采购跟单', { exact: true }).waitFor()
  await page.screenshot({ path: screenshotPath, fullPage: true })

  await page.getByLabel('用户名').fill('demo')
  await page.getByLabel('密码').fill('wrong-password')
  const failedLogin = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.status() === 401,
  )
  await page.getByRole('button', { name: '登录' }).click()
  await failedLogin
  await page.getByText('登录未完成').waitFor()

  await page.getByLabel('密码').fill('demo123')
  const successfulLogin = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await successfulLogin
  await page.getByText('演示业务主管').waitFor()
  assert.ok(await page.getByText('工作桌面').count(), 'login should enter the workspace')
} finally {
  await browser.close()
}

console.log(`Login page E2E passed. Screenshot: ${screenshotPath}`)
