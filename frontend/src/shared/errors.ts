import { Modal as _Modal, message } from 'antd'

import { getRuntimeSettings } from '../app/pages/appHelpers'
import { translate, type TranslationKey } from '../locales'

export type ApiErrorDetail = {
  field: string
  message: string
  type?: string
}

/**
 * 统一的接口错误对象。
 *
 * 关键点：构造时 `super(friendlyMessage)`，因此 `error.message` 本身就是
 * 用户友好文案，界面层读取 `caught.message` 时不会暴露后端技术文案。
 */
export class ApiError extends Error {
  code: string
  friendlyMessage: string
  rawMessage: string
  status?: number
  details: ApiErrorDetail[]

  constructor(
    friendlyMessage: string,
    code: string,
    rawMessage: string,
    status?: number,
    details: ApiErrorDetail[] = [],
  ) {
    super(friendlyMessage)
    this.name = 'ApiError'
    this.code = code
    this.friendlyMessage = friendlyMessage
    this.rawMessage = rawMessage
    this.status = status
    this.details = details
  }
}

/** 错误码 → 用户友好文案 key（覆盖后端泛化/技术文案） */
const ERROR_MESSAGE_KEYS: Record<string, TranslationKey> = {
  VALIDATION_ERROR: 'common.error.validation',
  BAD_REQUEST: 'common.error.badRequest',
  CONFLICT: 'common.error.conflict',
  PERMISSION_DENIED: 'common.error.permissionDenied',
  NOT_FOUND: 'common.error.notFound',
  TOKEN_EXPIRED: 'common.error.tokenExpired',
  UNAUTHORIZED: 'common.error.unauthorized',
  TOO_MANY_REQUESTS: 'common.error.tooManyRequests',
  SERVER_ERROR: 'common.error.server',
  SERVICE_UNAVAILABLE: 'common.error.serviceUnavailable',
  GATEWAY_TIMEOUT: 'common.error.gatewayTimeout',
  NETWORK_ERROR: 'common.error.network',
}

function tr(key: TranslationKey) {
  return translate(getRuntimeSettings().language, key)
}

/** 这些错误码的后端 message 通常是友好的业务文案，优先透传 */
const PREFER_BACKEND_MESSAGE = new Set(['BUSINESS_ERROR', 'CONFLICT'])

/** 根据错误码与后端原始 message，解析出最终展示给用户的友好文案 */
export function friendlyMessageFor(code: string, backendMessage: string): string {
  const trimmed = backendMessage?.trim() ?? ''
  if (PREFER_BACKEND_MESSAGE.has(code) && trimmed) return trimmed
  if (ERROR_MESSAGE_KEYS[code]) return tr(ERROR_MESSAGE_KEYS[code])
  if (trimmed) return trimmed
  return tr('common.error.server')
}

/** 从任意捕获到的异常中取出可展示的友好文案 */
function resolveContent(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.friendlyMessage || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}

/** 错误 toast 提示（3 秒自动消失） */
export function showErrorDialog(error: unknown, fallback = tr('common.error.actionFailed')): void {
  message.error(resolveContent(error, fallback), 3)
}

/** 警告 toast 提示（3 秒自动消失） */
export function showWarningDialog(content: string, _title?: string): void {
  message.warning(content, 3)
}

/** catch 专用糖：与原有 catch 文案参数对齐，便于批量替换 */
/** 成功 toast 提示（3 秒自动消失） */
export function showSuccess(content: string): void {
  message.success(content, 3)
}

export const showError = (error: unknown, fallback?: string) => showErrorDialog(error, fallback)
