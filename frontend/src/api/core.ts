import {
  ApiError,
  friendlyMessageFor,
  type ApiErrorDetail,
} from '@/shared/errors'
import { getRuntimeSettings } from '@/app/pages/appHelpers'

export interface ApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T
  error: { code: string; message: string; details?: ApiErrorDetail[] } | null
}

type ApiErrorBody = Partial<ApiResponse<unknown>> & {
  detail?: string | Array<{ msg?: string }>
}

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const authExpiredEventName = 'xinpei-auth-expired'

let authToken = localStorage.getItem('xinpei_access_token') ?? ''

export function setAuthToken(token: string): void {
  authToken = token
  localStorage.setItem('xinpei_access_token', token)
}

export function clearAuthToken(): void {
  authToken = ''
  localStorage.removeItem('xinpei_access_token')
}

export function hasAuthToken(): boolean {
  return authToken.length > 0
}

function notifyAuthExpired(): void {
  if (!authToken) return
  clearAuthToken()
  window.dispatchEvent(new Event(authExpiredEventName))
}

export async function readApiError(
  response: Response,
): Promise<{ code: string; message: string; details: ApiErrorDetail[] }> {
  try {
    const body = (await response.json()) as ApiErrorBody
    const code = body.error?.code ?? body.code ?? 'UNKNOWN'
    const details = body.error?.details ?? []
    if (body.error?.message) return { code, message: body.error.message, details }
    if (body.message) return { code, message: body.message, details }
    if (typeof body.detail === 'string') return { code, message: body.detail, details }
    if (Array.isArray(body.detail)) {
      const message = body.detail
        .map((item) => item.msg)
        .filter((value): value is string => Boolean(value))
        .join('; ')
      return { code, message, details }
    }
    return { code, message: '', details }
  } catch {
    return { code: 'UNKNOWN', message: '', details: [] }
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': getRuntimeSettings().language,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const { code, message, details } = await readApiError(response)
    if (response.status === 401) {
      notifyAuthExpired()
    }
    const friendlyMessage =
      code === 'VALIDATION_ERROR' && details.length === 0 && message.trim()
        ? message.trim()
        : friendlyMessageFor(code, message)
    throw new ApiError(
      friendlyMessage,
      code,
      message,
      response.status,
      details,
    )
  }

  const body = (await response.json()) as ApiResponse<T>
  if (!body.success || body.error) {
    const code = body.error?.code ?? body.code ?? 'UNKNOWN'
    const message = body.error?.message ?? body.message ?? ''
    throw new ApiError(friendlyMessageFor(code, message), code, message)
  }
  return body.data
}
