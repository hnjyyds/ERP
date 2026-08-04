import { mkdir, rename, rm, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { basename, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(
  '/Users/dev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const runId = process.env.RUN_ID ?? '20260804C'
const artifactRoot = resolve(`artifacts/full-role-workflow-${runId}`)
const outputRoot = resolve(artifactRoot, 'final')
const screenshotRoot = resolve(outputRoot, 'screenshots')
const rawWarehouse = resolve(
  artifactRoot,
  '.raw-05-warehouse/page@e8ddb238edc1c67aa5ff56194e468ad6.webm',
)

const jobs = [
  {
    output: '01-sales-manager-full.webm',
    segments: [
      { file: '01-sales-manager.webm', rate: 0.65 },
      { file: '01b-sales-contract-approval.webm', rate: 0.75 },
    ],
  },
  {
    output: '02-purchase-full.webm',
    segments: [{ file: '02-purchase.webm', rate: 0.65 }],
  },
  {
    output: '03-admin-full.webm',
    segments: [
      { file: '03-admin-assign.webm', rate: 0.65 },
      { file: '05b-admin-inbound-approval.webm', rate: 0.55 },
    ],
  },
  {
    output: '04-qc-full.webm',
    segments: [{ file: '04-qc.webm', rate: 0.42 }],
  },
  {
    output: '05-warehouse-full.webm',
    segments: [
      { path: rawWarehouse, start: 0, end: 8, rate: 0.55 },
      { file: '05-warehouse.webm', rate: 0.65 },
    ],
  },
  {
    output: '06-finance-full.webm',
    segments: [{ file: '06-finance.webm', rate: 0.5 }],
  },
  {
    output: '07-finance-manager-full.webm',
    segments: [{ file: '07-finance-manager.webm', rate: 0.5 }],
  },
]

await mkdir(screenshotRoot, { recursive: true })

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
})

async function videoMetadata(page, sourcePath) {
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'commit' })
  await page.locator('video').waitFor()
  return page.locator('video').evaluate(
    (video) =>
      new Promise((resolveMetadata) => {
        const done = () =>
          resolveMetadata({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          })
        if (video.readyState >= 1) done()
        else video.addEventListener('loadedmetadata', done, { once: true })
      }),
  )
}

async function styleVideo(page) {
  await page.locator('video').evaluate((video) => {
    document.documentElement.style.background = '#f6f8fb'
    document.body.style.margin = '0'
    document.body.style.overflow = 'hidden'
    video.controls = false
    video.muted = true
    video.style.display = 'block'
    video.style.width = '100vw'
    video.style.height = '100vh'
    video.style.objectFit = 'contain'
    video.style.background = '#f6f8fb'
  })
}

async function playSegment(page, segment) {
  const sourcePath = segment.path ?? resolve(artifactRoot, segment.file)
  const metadata = await videoMetadata(page, sourcePath)
  const start = segment.start ?? 0
  const end = Math.min(segment.end ?? metadata.duration, metadata.duration)
  await styleVideo(page)
  await page.waitForTimeout(700)
  await page.locator('video').evaluate(
    (video, options) =>
      new Promise((resolvePlayback, rejectPlayback) => {
        const finish = () => {
          video.pause()
          video.removeEventListener('timeupdate', onTimeUpdate)
          video.removeEventListener('ended', finish)
          resolvePlayback()
        }
        const onTimeUpdate = () => {
          if (video.currentTime >= options.end - 0.04) finish()
        }
        video.currentTime = options.start
        video.playbackRate = options.rate
        video.addEventListener('timeupdate', onTimeUpdate)
        video.addEventListener('ended', finish, { once: true })
        video.play().catch(rejectPlayback)
      }),
    { start, end, rate: segment.rate ?? 1 },
  )
  await page.waitForTimeout(900)
  return { source: basename(sourcePath), start, end, rate: segment.rate ?? 1 }
}

async function compose(job) {
  const rawRoot = resolve(outputRoot, `.raw-${job.output}`)
  await rm(rawRoot, { recursive: true, force: true })
  await mkdir(rawRoot, { recursive: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: rawRoot,
      size: { width: 1440, height: 900 },
    },
  })
  const page = await context.newPage()
  const played = []
  for (const segment of job.segments) played.push(await playSegment(page, segment))
  const video = page.video()
  await context.close()
  const rawPath = await video.path()
  const outputPath = resolve(outputRoot, job.output)
  await rm(outputPath, { force: true })
  await rename(rawPath, outputPath)
  const fileStat = await stat(outputPath)
  console.log(JSON.stringify({ output: outputPath, bytes: fileStat.size, played }))
  return outputPath
}

async function captureEvidence(outputPath) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const metadata = await videoMetadata(page, outputPath)
  await styleVideo(page)
  const points = [0.12, 0.5, 0.88]
  for (const [index, point] of points.entries()) {
    await page.locator('video').evaluate(
      (video, time) =>
        new Promise((resolveSeek, rejectSeek) => {
          const timeout = window.setTimeout(
            () => rejectSeek(new Error(`Timed out seeking to ${time}`)),
            5000,
          )
          const done = () => {
            window.setTimeout(() => {
              window.clearTimeout(timeout)
              resolveSeek()
            }, 350)
          }
          video.pause()
          video.addEventListener('seeked', done, { once: true })
          video.currentTime = time
        }),
      metadata.duration * point,
    )
    await page.screenshot({
      path: resolve(screenshotRoot, `${basename(outputPath, '.webm')}-${index + 1}.png`),
    })
  }
  await page.close()
  console.log(
    JSON.stringify({
      verified: outputPath,
      duration: metadata.duration,
      dimensions: `${metadata.width}x${metadata.height}`,
    }),
  )
}

try {
  for (const job of jobs) {
    const outputPath = process.env.VERIFY_ONLY
      ? resolve(outputRoot, job.output)
      : await compose(job)
    await captureEvidence(outputPath)
  }
} finally {
  await browser.close()
}
