#!/usr/bin/env node
/**
 * 视觉回归：截图 + 计算样式 + 像素差比对。
 *
 * 用法（在 frontend/ 下执行）：
 *   node scripts/visual-regression/run.mjs capture --out .visual-regression/baseline
 *   node scripts/visual-regression/run.mjs capture --out .visual-regression/current
 *   node scripts/visual-regression/run.mjs compare
 *
 * 依赖：playwright-core（或 playwright）与一个 Chromium。
 * 均可通过环境变量指定，详见同目录 README.md。
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { STYLE_PROPS, buildScenarios } from './scenarios.mjs'

const require = createRequire(import.meta.url)

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i]
    if (!item.startsWith('--')) {
      args._.push(item)
      continue
    }
    const key = item.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      args[key] = next
      i += 1
    } else {
      args[key] = true
    }
  }
  return args
}

function resolvePlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    'playwright-core',
    'playwright',
    path.join(
      os.homedir(),
      '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core',
    ),
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      return require(candidate)
    } catch {
      // 继续尝试下一个
    }
  }
  throw new Error(
    '未找到 playwright-core。请先 `npm i -D playwright-core`，或设置 PLAYWRIGHT_MODULE=/path/to/playwright-core。',
  )
}

function resolveChromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH
  const cacheRoots = [
    path.join(os.homedir(), 'Library/Caches/ms-playwright'),
    path.join(os.homedir(), '.cache/ms-playwright'),
  ]
  for (const root of cacheRoots) {
    if (!fs.existsSync(root)) continue
    const versions = fs
      .readdirSync(root)
      .filter((item) => item.startsWith('chromium-'))
      .sort()
      .reverse()
    for (const version of versions) {
      const base = path.join(root, version)
      const platformDirs = fs.existsSync(base) ? fs.readdirSync(base) : []
      for (const dir of platformDirs) {
        const exe = path.join(
          base,
          dir,
          'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        )
        if (fs.existsSync(exe)) return exe
        const linuxExe = path.join(base, dir, 'chrome-linux/chrome')
        if (fs.existsSync(linuxExe)) return linuxExe
      }
    }
  }
  return undefined
}

async function launchBrowser() {
  const { chromium } = resolvePlaywright()
  const executablePath = resolveChromiumExecutable()
  return chromium.launch({ executablePath, headless: true })
}

async function loginForToken(baseUrl, apiBase, username, password) {
  const response = await fetch(`${baseUrl}${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept-Language': 'zh-CN' },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) {
    throw new Error(
      `登录失败（${response.status}）。请确认后端已启动，且账号密码正确；可用 --user/--password 或 VISUAL_USER/VISUAL_PASSWORD 指定。`,
    )
  }
  const payload = await response.json()
  const session = payload.data ?? payload
  if (!session.access_token) throw new Error('登录响应缺少 access_token')
  return session.access_token
}

async function fetchJson(url, token) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`${url} 返回 ${response.status}`)
  const payload = await response.json()
  return payload.data ?? payload
}

async function resolveDetailIds(baseUrl, apiBase, token) {
  const ids = {}
  const pick = async (key, url, field) => {
    try {
      const payload = await fetchJson(url, token)
      const first = payload.items?.[0]
      if (first?.[field]) ids[key] = first[field]
    } catch (error) {
      console.warn(`[skip] 无法解析 ${key}: ${error.message}`)
    }
  }
  await pick('productId', `${baseUrl}${apiBase}/masterdata/products?limit=1`, 'id')
  await pick('inboundOrderId', `${baseUrl}${apiBase}/warehouse/inbound-orders?limit=1`, 'id')
  await pick('contractId', `${baseUrl}${apiBase}/sales/contracts`, 'id')
  return ids
}

/** 在页面内执行：收集元素计算样式与几何信息，以及样式表清单。 */
function collectStyles() {
  const props = [
    'display',
    'position',
    'color',
    'backgroundColor',
    'borderTopColor',
    'borderTopWidth',
    'borderRadius',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'paddingTop',
    'paddingLeft',
    'marginTop',
    'marginBottom',
    'height',
    'width',
    'boxShadow',
    'gap',
    'gridTemplateColumns',
    'flexDirection',
    'opacity',
    'transform',
    'overflowX',
    'minHeight',
  ]

  const keyOf = (el) => {
    const parts = []
    let node = el
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      let part = node.tagName.toLowerCase()
      // React/antd 自动生成的 id（_r_1_、:r1:）每次渲染都会变，不能进入元素键。
      if (node.id && !/^(_r_|:r)/.test(node.id)) part += `#${node.id}`
      const cls = (node.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 4)
      if (cls.length) part += `.${cls.join('.')}`
      const siblings = node.parentElement
        ? Array.from(node.parentElement.children).filter((child) => child.tagName === node.tagName)
        : []
      if (siblings.length > 1) part += `:nth(${siblings.indexOf(node)})`
      parts.unshift(part)
      node = node.parentElement
    }
    return parts.join('>')
  }

  const elements = {}
  for (const el of Array.from(document.querySelectorAll('body *')).slice(0, 2500)) {
    if (el.closest('script,style,noscript')) continue
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) continue
    const computed = getComputedStyle(el)
    const entry = {}
    for (const prop of props) entry[prop] = computed[prop]
    entry.__rect = [
      Math.round(rect.x),
      Math.round(rect.y),
      Math.round(rect.width),
      Math.round(rect.height),
    ]
    elements[keyOf(el)] = entry
  }

  const sheets = Array.from(document.styleSheets).map((sheet) => {
    let rules = 0
    try {
      rules = sheet.cssRules.length
    } catch {
      rules = -1
    }
    return { href: sheet.href ? sheet.href.split('/').pop() : 'inline', rules }
  })

  return {
    url: `${location.pathname}${location.search}`,
    title: document.title,
    bodyFont: getComputedStyle(document.body).fontFamily,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    sheets,
    elements,
  }
}

async function capture(args) {
  const baseUrl = (
    args['base-url'] ??
    process.env.VISUAL_BASE_URL ??
    'http://127.0.0.1:5181'
  ).replace(/\/$/, '')
  const apiBase = args['api-base'] ?? process.env.VISUAL_API_BASE ?? '/api/v1'
  const outDir = path.resolve(process.cwd(), args.out ?? '.visual-regression/current')
  const username = args.user ?? process.env.VISUAL_USER ?? 'admin'
  const password = args.password ?? process.env.VISUAL_PASSWORD ?? 'admin123'
  const only = args.only
    ? new Set(
        String(args.only)
          .split(',')
          .map((item) => item.trim()),
      )
    : null

  fs.mkdirSync(outDir, { recursive: true })
  console.log(`capture -> ${outDir} (${baseUrl})`)

  const token = await loginForToken(baseUrl, apiBase, username, password)
  const detailIds = await resolveDetailIds(baseUrl, apiBase, token)
  const scenarios = buildScenarios(detailIds).filter((item) => !only || only.has(item.name))

  const browser = await launchBrowser()
  const failures = []
  try {
    for (const scenario of scenarios) {
      const viewport = scenario.viewport ?? { width: 1440, height: 900 }
      const context = await browser.newContext({
        viewport,
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
        deviceScaleFactor: 1,
      })
      if (scenario.auth !== false) {
        await context.addInitScript(
          (value) => localStorage.setItem('xinpei_access_token', value),
          token,
        )
      }
      const page = await context.newPage()
      const errors = []
      const pageErrors = []
      page.on('pageerror', (error) => {
        pageErrors.push(`pageerror: ${error.message}`)
        errors.push(`pageerror: ${error.message}`)
      })
      page.on('requestfailed', (request) =>
        errors.push(`requestfailed: ${request.url().slice(0, 160)}`),
      )

      try {
        await page.goto(`${baseUrl}${scenario.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 45000,
        })
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
        await page.evaluate(() => document.fonts.ready.catch(() => {}))
        await page.waitForTimeout(400)
        // 页面被 ErrorBoundary 兜住时，截图仍会“成功”，但等于没有任何覆盖，直接判失败。
        // 只匹配 ErrorBoundary 的 section[role=alert]，避免误伤页面内的非致命 actionError。
        if (await page.locator('section.dashboard-feedback.error[role="alert"]').count()) {
          throw new Error('页面渲染失败（命中 PageErrorBoundary），该场景未实际覆盖')
        }
        if (scenario.clickTestId) {
          await page
            .locator(`[data-testid="${scenario.clickTestId}"]`)
            .first()
            .click({ timeout: 8000 })
          await page.waitForSelector('.ant-modal-body', { timeout: 8000 })
          await page.waitForTimeout(600)
        }
        await page.addStyleTag({
          content:
            '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}.ant-spin-dot{animation:none!important}',
        })
        await page.waitForTimeout(250)
        await page.screenshot({ path: path.join(outDir, `${scenario.name}.png`) })
        const snapshot = await page.evaluate(collectStyles)
        snapshot.scenario = scenario.name
        snapshot.errors = errors
        fs.writeFileSync(
          path.join(outDir, `${scenario.name}.json`),
          JSON.stringify(snapshot, null, 1),
        )
        const count = Object.keys(snapshot.elements).length
        console.log(
          `  ${scenario.name.padEnd(28)} elements=${String(count).padStart(4)} errors=${errors.length}`,
        )
        if (pageErrors.length) failures.push(`${scenario.name}: ${pageErrors.length} 个页面错误`)
      } catch (error) {
        failures.push(`${scenario.name}: ${error.message}`)
        console.error(`  ${scenario.name} 失败: ${error.message}`)
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }

  if (failures.length) {
    console.error(`\n有 ${failures.length} 个场景未正常完成：`)
    for (const item of failures) console.error(`  - ${item}`)
    process.exitCode = 1
  } else {
    console.log(`\n完成：${scenarios.length} 个场景。`)
  }
}

async function comparePixels(page, baselineBuffer, currentBuffer) {
  return page.evaluate(
    async ({ a, b }) => {
      const load = (src) =>
        new Promise((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = () => reject(new Error('图片解码失败'))
          image.src = src
        })
      const [imageA, imageB] = await Promise.all([
        load(`data:image/png;base64,${a}`),
        load(`data:image/png;base64,${b}`),
      ])
      if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
        return {
          sizeMismatch: true,
          widthA: imageA.width,
          heightA: imageA.height,
          widthB: imageB.width,
          heightB: imageB.height,
          changed: 0,
          total: 0,
          bbox: null,
          png: null,
        }
      }
      const width = imageA.width
      const height = imageA.height
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const read = (image) => {
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(image, 0, 0)
        return ctx.getImageData(0, 0, width, height).data
      }
      const dataBaseline = read(imageA)
      const dataCurrent = read(imageB)
      const diff = ctx.createImageData(width, height)
      const out = diff.data
      let changed = 0
      let minX = width
      let minY = height
      let maxX = -1
      let maxY = -1
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = (y * width + x) * 4
          const delta = Math.max(
            Math.abs(dataBaseline[index] - dataCurrent[index]),
            Math.abs(dataBaseline[index + 1] - dataCurrent[index + 1]),
            Math.abs(dataBaseline[index + 2] - dataCurrent[index + 2]),
          )
          out[index] = 255
          out[index + 1] = 255
          out[index + 2] = 255
          out[index + 3] = 255
          if (delta >= 8) {
            changed += 1
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
            out[index] = 255
            out[index + 1] = 0
            out[index + 2] = 0
            out[index + 3] = 255
          }
        }
      }
      let png = null
      if (changed > 0) {
        ctx.putImageData(diff, 0, 0)
        png = canvas.toDataURL('image/png')
      }
      return {
        sizeMismatch: false,
        widthA: width,
        heightA: height,
        widthB: width,
        heightB: height,
        changed,
        total: width * height,
        bbox: changed > 0 ? [minX, minY, maxX, maxY] : null,
        png,
      }
    },
    {
      a: baselineBuffer.toString('base64'),
      b: currentBuffer.toString('base64'),
    },
  )
}

async function compare(args) {
  const baselineDir = path.resolve(process.cwd(), args.baseline ?? '.visual-regression/baseline')
  const currentDir = path.resolve(process.cwd(), args.current ?? '.visual-regression/current')
  const pixelThreshold = Number(args['max-pixel-ratio'] ?? process.env.VISUAL_MAX_PIXEL_RATIO ?? 0)
  const diffDir = path.resolve(process.cwd(), args['diff-dir'] ?? '.visual-regression/diff')
  const only = args.only
    ? new Set(
        String(args.only)
          .split(',')
          .map((item) => item.trim()),
      )
    : null

  if (!fs.existsSync(baselineDir)) {
    throw new Error(
      `基线目录不存在：${baselineDir}（先执行 capture --out .visual-regression/baseline）`,
    )
  }
  if (!fs.existsSync(currentDir)) {
    throw new Error(
      `当前目录不存在：${currentDir}（先执行 capture --out .visual-regression/current）`,
    )
  }

  const names = fs
    .readdirSync(currentDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
    .filter((name) => !only || only.has(name))
    .sort()

  // 旧快照可能把自动生成 id 写进元素键，比对前统一去掉。
  const normalizeKeys = (elements) => {
    const result = {}
    for (const [key, value] of Object.entries(elements ?? {})) {
      result[key.replace(/#(_r_[a-z0-9_]+|:r[a-z0-9]+:)/g, '')] = value
    }
    return result
  }

  const browser = await launchBrowser()
  const page = await browser.newPage()
  await page.goto('about:blank')

  let failedScenarios = 0
  const problems = []

  try {
    for (const name of names) {
      const currentJson = JSON.parse(fs.readFileSync(path.join(currentDir, `${name}.json`), 'utf8'))
      const baselinePath = path.join(baselineDir, `${name}.json`)
      if (!fs.existsSync(baselinePath)) {
        problems.push(`${name}: 基线缺失该场景`)
        failedScenarios += 1
        continue
      }
      const baselineJson = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))

      const baselineElements = normalizeKeys(baselineJson.elements)
      const currentElements = normalizeKeys(currentJson.elements)
      const onlyCurrent = Object.keys(currentElements).filter((key) => !(key in baselineElements))
      const onlyBaseline = Object.keys(baselineElements).filter((key) => !(key in currentElements))

      const diffs = []
      if (baselineJson.bodyFont !== currentJson.bodyFont) {
        diffs.push({
          key: 'body',
          prop: 'fontFamily',
          baseline: baselineJson.bodyFont,
          current: currentJson.bodyFont,
        })
      }
      if (baselineJson.bodyBg !== currentJson.bodyBg) {
        diffs.push({
          key: 'body',
          prop: 'backgroundColor',
          baseline: baselineJson.bodyBg,
          current: currentJson.bodyBg,
        })
      }
      for (const key of Object.keys(currentElements)) {
        if (!(key in baselineElements)) continue
        const currentEntry = currentElements[key]
        const baselineEntry = baselineElements[key]
        for (const prop of STYLE_PROPS) {
          if (currentEntry[prop] !== baselineEntry[prop]) {
            diffs.push({ key, prop, baseline: baselineEntry[prop], current: currentEntry[prop] })
          }
        }
        const currentRect = currentEntry.__rect
        const baselineRect = baselineEntry.__rect
        if (JSON.stringify(currentRect) !== JSON.stringify(baselineRect)) {
          diffs.push({ key, prop: 'rect', baseline: baselineRect, current: currentRect })
        }
      }

      let pixel = null
      const baselinePng = path.join(baselineDir, `${name}.png`)
      const currentPng = path.join(currentDir, `${name}.png`)
      if (fs.existsSync(baselinePng) && fs.existsSync(currentPng)) {
        pixel = await comparePixels(page, fs.readFileSync(baselinePng), fs.readFileSync(currentPng))
        if (pixel.png) {
          fs.mkdirSync(diffDir, { recursive: true })
          fs.writeFileSync(
            path.join(diffDir, `${name}-diff.png`),
            Buffer.from(pixel.png.split(',')[1], 'base64'),
          )
        }
      }

      const pixelRatio = pixel && pixel.total ? pixel.changed / pixel.total : 0
      const scenarioFailed =
        onlyCurrent.length > 0 ||
        onlyBaseline.length > 0 ||
        diffs.length > 0 ||
        Boolean(pixel?.sizeMismatch) ||
        pixelRatio > pixelThreshold

      console.log('='.repeat(70))
      console.log(`SCENARIO ${name}${scenarioFailed ? '  [FAIL]' : '  [OK]'}`)
      if (onlyCurrent.length || onlyBaseline.length) {
        console.log(`  元素键不一致：仅当前 ${onlyCurrent.length}，仅基线 ${onlyBaseline.length}`)
        for (const key of onlyCurrent.slice(0, 3)) console.log(`    + ${key.slice(-140)}`)
        for (const key of onlyBaseline.slice(0, 3)) console.log(`    - ${key.slice(-140)}`)
      }
      if (diffs.length) {
        const grouped = new Map()
        for (const item of diffs) {
          if (!grouped.has(item.prop)) grouped.set(item.prop, [])
          grouped.get(item.prop).push(item)
        }
        console.log(`  计算样式差异：${diffs.length}`)
        for (const [prop, items] of [...grouped.entries()].sort(
          (a, b) => b[1].length - a[1].length,
        )) {
          console.log(`    ${prop.padEnd(22)} ${items.length}`)
          for (const item of items.slice(0, 3)) {
            console.log(`      ${item.key.slice(-120)}`)
            console.log(`        基线=${JSON.stringify(item.baseline)}`)
            console.log(`        当前=${JSON.stringify(item.current)}`)
          }
        }
      }
      if (pixel) {
        if (pixel.sizeMismatch) {
          console.log(
            `  截图尺寸不同：基线 ${pixel.widthA}x${pixel.heightA}，当前 ${pixel.widthB}x${pixel.heightB}`,
          )
        } else {
          console.log(
            `  像素差：${pixel.changed} / ${pixel.total}（${(pixelRatio * 100).toFixed(4)}%）bbox=${JSON.stringify(pixel.bbox)}`,
          )
        }
      }
      if (scenarioFailed) failedScenarios += 1
    }
  } finally {
    await page.close()
    await browser.close()
  }

  console.log('='.repeat(70))
  if (problems.length) {
    for (const item of problems) console.log(`  ${item}`)
  }
  if (failedScenarios > 0) {
    console.log(`FAIL：${failedScenarios} / ${names.length} 个场景存在视觉差异。`)
    process.exitCode = 1
  } else {
    console.log(`PASS：${names.length} 个场景计算样式与截图完全一致。`)
  }
}

const args = parseArgs(process.argv.slice(2))
const command = args._[0] ?? 'capture'

try {
  if (command === 'capture') {
    await capture(args)
  } else if (command === 'compare') {
    await compare(args)
  } else {
    console.error(`未知命令：${command}（可选 capture / compare）`)
    process.exitCode = 2
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 2
}
