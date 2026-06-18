import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const screenshotPath = resolve('artifacts/e2e-finance-reports.png')

const reportTabs = [
  {
    label: '水单使用明细',
    endpoint: '/api/v1/finance/reports/receipt-usage',
    tableHeader: '水单号',
    requiredKeys: ['rows', 'currency_summaries', 'total_count'],
  },
  {
    label: '银行水单汇总',
    endpoint: '/api/v1/finance/reports/bank-receipt-summary',
    tableHeader: '水单数',
    requiredKeys: ['currency_summaries', 'operator_summaries', 'receipt_count'],
  },
  {
    label: '货款支付情况',
    endpoint: '/api/v1/finance/reports/goods-payment',
    tableHeader: '付款单号',
    requiredKeys: ['rows', 'currency_summaries', 'total_count'],
  },
  {
    label: '费用支付情况',
    endpoint: '/api/v1/finance/reports/fee-payment',
    tableHeader: '付费单号',
    requiredKeys: ['rows', 'currency_summaries', 'total_count'],
  },
  {
    label: '报关回单催收',
    endpoint: '/api/v1/finance/reports/customs-receipt-collection',
    tableHeader: '核销单号',
    requiredKeys: ['rows', 'status_summaries', 'total_count'],
  },
  {
    label: '申报退税统计',
    endpoint: '/api/v1/finance/reports/tax-refund-statistics',
    tableHeader: '核销单数',
    requiredKeys: ['status_summaries', 'currency_totals', 'document_count', 'refund_record_count'],
  },
]

await mkdir(resolve('artifacts'), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })

try {
  await page.goto(frontendUrl)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByText('账号登录').waitFor()
  await page.locator('#login-username').fill('finance')
  await page.locator('#login-password').fill('finance123')

  const loginResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/login') && response.ok(),
  )
  await page.getByRole('button', { name: '登录' }).click()
  await loginResponse
  await page.getByText('财务报表').first().waitFor()

  const firstReportResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === reportTabs[0].endpoint && response.ok()
  })
  await page.goto(new URL('/finance/reports', frontendUrl).toString())
  const firstReport = (await (await firstReportResponse).json()).data
  for (const key of reportTabs[0].requiredKeys) {
    assert.ok(Object.hasOwn(firstReport, key), `${reportTabs[0].label} missing ${key}`)
  }

  await page.getByRole('heading', { name: '财务报表' }).waitFor()
  await page.getByRole('heading', { name: '财务统计报表' }).waitFor()
  await page.getByRole('navigation', { name: '报表切换' }).waitFor()
  await page.getByRole('region', { name: '报表口径说明' }).waitFor()

  await page.getByLabel('起始日期').fill('2026-01-01')
  await page.getByLabel('结束日期').fill('2026-12-31')
  await page.getByLabel('币种').fill('USD')

  for (const report of reportTabs) {
    if (report.label !== reportTabs[0].label) {
      const switchResponse = page.waitForResponse((response) => {
        const url = new URL(response.url())
        return url.pathname === report.endpoint && response.ok()
      })
      await page.getByRole('button', { name: report.label }).click()
      const data = (await (await switchResponse).json()).data
      for (const key of report.requiredKeys) {
        assert.ok(Object.hasOwn(data, key), `${report.label} missing ${key}`)
      }
    }

    await page.getByRole('button', { name: report.label }).waitFor()
    await page.getByRole('columnheader', { name: report.tableHeader }).waitFor()

    const queryResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === report.endpoint &&
        url.searchParams.get('date_from') === '2026-01-01' &&
        url.searchParams.get('date_to') === '2026-12-31' &&
        (report.endpoint.includes('customs-receipt-collection') ||
          url.searchParams.get('currency') === 'USD') &&
        response.ok()
      )
    })
    await page.getByRole('button', { name: '查询' }).click()
    const filteredData = (await (await queryResponse).json()).data
    for (const key of report.requiredKeys) {
      assert.ok(Object.hasOwn(filteredData, key), `${report.label} filtered missing ${key}`)
    }

    const exportResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === `${report.endpoint}/export` &&
        url.searchParams.get('date_from') === '2026-01-01' &&
        url.searchParams.get('date_to') === '2026-12-31' &&
        (report.endpoint.includes('customs-receipt-collection') ||
          url.searchParams.get('currency') === 'USD') &&
        response.ok()
      )
    })
    await page.getByRole('button', { name: '导出 CSV' }).click()
    const exported = (await (await exportResponse).json()).data
    assert.equal(exported.content_type, 'text/csv', `${report.label} export content type`)
    assert.ok(exported.filename.endsWith('.csv'), `${report.label} export filename`)
    assert.ok(exported.content.length > 0, `${report.label} export content`)
  }

  await page.screenshot({ path: screenshotPath, fullPage: true })
} finally {
  await browser.close()
}

console.log(`finance reports e2e passed: ${screenshotPath}`)
