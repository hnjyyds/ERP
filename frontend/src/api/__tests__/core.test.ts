import { afterEach, describe, expect, it, vi } from 'vitest'

import { getRuntimeSettings, setRuntimeSettings } from '../../app/pages/appHelpers'
import { translate } from '../../locales'
import { ApiError, friendlyMessageFor } from '../../shared/errors'
import { apiBaseUrl, readApiError, request } from '../core'

const originalSettings = { ...getRuntimeSettings() }

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

function successBody(data: unknown) {
  return { success: true, code: 'OK', message: '', data, error: null }
}

describe('request language header', () => {
  afterEach(() => {
    setRuntimeSettings(originalSettings)
    vi.unstubAllGlobals()
  })

  it('sends the current UI language as Accept-Language', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(successBody({})))
    vi.stubGlobal('fetch', fetchMock)
    setRuntimeSettings({ language: 'en-US', timeZone: 'Asia/Shanghai' })

    await request('/probe')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${apiBaseUrl}/probe`)
    expect(init.headers).toMatchObject({ 'Accept-Language': 'en-US' })
  })

  it('follows language changes instead of caching the first value', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(successBody({})))
    vi.stubGlobal('fetch', fetchMock)

    setRuntimeSettings({ language: 'zh-CN', timeZone: 'Asia/Shanghai' })
    await request('/probe')
    setRuntimeSettings({ language: 'en-US', timeZone: 'Asia/Shanghai' })
    await request('/probe')

    const headers = fetchMock.mock.calls.map(
      ([, init]) => (init as RequestInit).headers as Record<string, string>,
    )
    expect(headers[0]['Accept-Language']).toBe('zh-CN')
    expect(headers[1]['Accept-Language']).toBe('en-US')
  })
})

describe('friendlyMessageFor', () => {
  it('maps known error codes to localized copy instead of raw backend text', () => {
    const language = getRuntimeSettings().language

    expect(friendlyMessageFor('NOT_FOUND', 'Entity not found')).toBe(
      translate(language, 'common.error.notFound'),
    )
    expect(friendlyMessageFor('PERMISSION_DENIED', 'permission denied')).toBe(
      translate(language, 'common.error.permissionDenied'),
    )
    expect(friendlyMessageFor('TOKEN_EXPIRED', 'jwt expired')).toBe(
      translate(language, 'common.error.tokenExpired'),
    )
    expect(friendlyMessageFor('SERVER_ERROR', 'internal stack trace')).toBe(
      translate(language, 'common.error.server'),
    )
  })

  it('passes through business and conflict messages, trimmed', () => {
    expect(friendlyMessageFor('BUSINESS_ERROR', '  库存不足  ')).toBe('库存不足')
    expect(friendlyMessageFor('CONFLICT', ' 单号重复 ')).toBe('单号重复')
  })

  it('falls back to backend text for unknown codes and to generic copy when empty', () => {
    const language = getRuntimeSettings().language

    expect(friendlyMessageFor('SOMETHING_NEW', '自定义错误')).toBe('自定义错误')
    expect(friendlyMessageFor('SOMETHING_NEW', '')).toBe(
      translate(language, 'common.error.server'),
    )
    expect(friendlyMessageFor('BUSINESS_ERROR', '   ')).toBe(
      translate(language, 'common.error.server'),
    )
  })
})

describe('request error handling', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('throws ApiError with mapped message, code and status for non-ok responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { code: 'PERMISSION_DENIED', message: 'raw backend text', details: [] } },
          403,
        ),
      ),
    )

    const caught = await request('/secure').catch((error: unknown) => error)

    expect(caught).toBeInstanceOf(ApiError)
    expect(caught).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      friendlyMessage: translate(
        getRuntimeSettings().language,
        'common.error.permissionDenied',
      ),
    })
  })

  it('keeps a friendly backend validation message when there are no field details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { code: 'VALIDATION_ERROR', message: '数量必须大于 0', details: [] } },
          400,
        ),
      ),
    )

    await expect(request('/orders')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      friendlyMessage: '数量必须大于 0',
    })
  })

  it('joins FastAPI detail array messages when reading an error response', async () => {
    const result = await readApiError(
      jsonResponse({ detail: [{ msg: 'field required' }, { msg: '' }, { msg: 'bad value' }] }, 422),
    )

    expect(result).toEqual({
      code: 'UNKNOWN',
      message: 'field required; bad value',
      details: [],
    })
  })
})
