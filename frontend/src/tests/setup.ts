import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// ── Fetch mock (prevent real network calls in tests) ─────────────
global.fetch = vi.fn().mockResolvedValue(
  new Response(JSON.stringify({ success: true, data: { data: [], total: 0 } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }),
)

// ── HTMLCanvasElement mock (lottie-web) ───────────────────────────
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType: string) => {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      rect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clip: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createPattern: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0), width: 0, height: 0, colorSpace: 'srgb' })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0), width: 0, height: 0, colorSpace: 'srgb' })),
      setTransform: vi.fn(),
      transform: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      getTransform: vi.fn(() => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })),
      drawFocusIfNeeded: vi.fn(),
      ellipse: vi.fn(),
      isPointInPath: vi.fn(() => false),
      isPointInStroke: vi.fn(() => false),
    }
  }
  return null
}) as typeof HTMLCanvasElement.prototype.getContext

// ── Ant Design 兼容 ──────────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ── Ant Design getPopupContainer 兼容 ─────────────────────────────
const origCreateRange = document.createRange
document.createRange = () => {
  const range = origCreateRange.call(document)
  range.getBoundingClientRect = () => ({
    x: 0, y: 0, width: 0, height: 0,
    top: 0, right: 0, bottom: 0, left: 0,
    toJSON: () => ({}),
  })
  range.getClientRects = () => ({
    item: () => null,
    length: 0,
    [Symbol.iterator]: function* () {},
  })
  return range
}

// ── ResizeObserver / IntersectionObserver ─────────────────────────
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

class IntersectionObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  root: Element | null = null
  rootMargin = ''
  thresholds: ReadonlyArray<number> = []
  takeRecords = () => []
}
window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver

// ── API mock（自动包含所有真实导出 + 列表函数默认返回空数据）──
vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>()
  // 把所有 list* / get* / export* 函数 mock 为返回空数据，避免页面的 useEffect 发起真实请求
  const safeDefaults: Record<string, () => Promise<unknown>> = {}
  for (const key of Object.keys(actual)) {
    const fn = (actual as Record<string, unknown>)[key]
    if (typeof fn === 'function') {
      if (key.startsWith('list') || key.startsWith('get') || key.startsWith('export') || key === 'uploadImage' || key === 'downloadFile') {
        safeDefaults[key] = () => Promise.resolve({ data: [], items: [], total: 0 })
      }
    }
  }
  return { ...actual, ...safeDefaults }
})
