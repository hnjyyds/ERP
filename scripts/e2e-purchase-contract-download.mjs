import assert from 'node:assert/strict'
import { readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:8080/'
const outputPath = resolve('/tmp', 'purchase-contract-browser-download.xls')
const browser = await chromium.launch({
  channel: 'chrome',
  headless: false,
  args: [
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=CalculateNativeWinOcclusion',
  ],
})
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()

async function login() {
  await page.goto(new URL('/login', frontendUrl).toString(), { waitUntil: 'domcontentloaded' })
  await page.getByLabel('用户名').fill('admin')
  await page.getByLabel('密码').fill('admin123')
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith('/api/v1/auth/login') && response.ok()),
    page.getByRole('button', { name: '登录' }).click(),
  ])
  await page.waitForURL((url) => url.pathname !== '/login')
}

async function api(path) {
  return page.evaluate(async (requestPath) => {
    const token = window.localStorage.getItem('yuanjing_access_token')
    const response = await fetch(requestPath, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(payload)}`)
    return payload.data
  }, path)
}

try {
  await login()
  const contracts = await api('/api/v1/purchase/contracts?limit=1')
  const contract = contracts.items[0]
  assert.ok(contract?.id, 'a purchase contract is required for browser download verification')

  await page.goto(
    new URL(`/purchase/contracts/${contract.id}`, frontendUrl).toString(),
    { waitUntil: 'domcontentloaded' },
  )
  const generateButton = page.getByRole('button', { name: '用合同模板生成' })
  await generateButton.waitFor()
  const downloadPromise = page.waitForEvent('download')
  await generateButton.click()
  const download = await downloadPromise
  await download.saveAs(outputPath)

  const header = Array.from((await readFile(outputPath)).subarray(0, 8))
  assert.deepEqual(header, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
  console.log(JSON.stringify({ contract: contract.code, filename: download.suggestedFilename(), header }))
} finally {
  await context.close()
  await browser.close()
  await rm(outputPath, { force: true })
}
