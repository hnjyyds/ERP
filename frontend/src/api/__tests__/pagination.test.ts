import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiBaseUrl } from '../core'
import { listProducts } from '../masterdata-products'
import { listSampleRequests } from '../sample'

const fetchMock = vi.fn()

function calledUrl(): string {
  return fetchMock.mock.calls[0][0] as string
}

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      code: 'OK',
      message: '',
      data: { items: [], total: 0 },
      error: null,
    }),
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => vi.unstubAllGlobals())

describe('listProducts pagination params', () => {
  it('omits the query string when no filters are provided', async () => {
    await listProducts()

    expect(calledUrl()).toBe(`${apiBaseUrl}/masterdata/products`)
  })

  it('serializes q, limit and offset in a stable order', async () => {
    await listProducts({ q: 'bag', limit: 50, offset: 100 })

    expect(calledUrl()).toBe(`${apiBaseUrl}/masterdata/products?q=bag&limit=50&offset=100`)
  })

  it('keeps zero values instead of dropping them', async () => {
    await listProducts({ limit: 0, offset: 0 })

    expect(calledUrl()).toBe(`${apiBaseUrl}/masterdata/products?limit=0&offset=0`)
  })

  it('drops empty-string filters but still sends pagination', async () => {
    await listProducts({ q: '', limit: 20, offset: 0 })

    expect(calledUrl()).toBe(`${apiBaseUrl}/masterdata/products?limit=20&offset=0`)
  })
})

describe('listSampleRequests pagination params', () => {
  it('omits the query string when no filters are provided', async () => {
    await listSampleRequests()

    expect(calledUrl()).toBe(`${apiBaseUrl}/sample/requests`)
  })

  it('serializes every supported filter together with pagination', async () => {
    await listSampleRequests({
      q: 'cable',
      status: 'pending',
      customer_id: 'customer-1',
      date_from: '2026-08-01',
      date_to: '2026-08-31',
      limit: 50,
      offset: 100,
    })

    expect(calledUrl()).toBe(
      `${apiBaseUrl}/sample/requests?q=cable&status=pending&customer_id=customer-1` +
        '&date_from=2026-08-01&date_to=2026-08-31&limit=50&offset=100',
    )
  })

  it('drops empty-string filters but keeps pagination', async () => {
    await listSampleRequests({ status: '', customer_id: '', limit: 20, offset: 40 })

    expect(calledUrl()).toBe(`${apiBaseUrl}/sample/requests?limit=20&offset=40`)
  })
})
