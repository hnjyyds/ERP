import { Modal, message } from 'antd'

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

  constructor(friendlyMessage: string, code: string, rawMessage: string, status?: number) {
    super(friendlyMessage)
    this.name = 'ApiError'
    this.code = code
    this.friendlyMessage = friendlyMessage
    this.rawMessage = rawMessage
    this.status = status
  }
}

/** 错误码 → 用户友好文案（覆盖后端泛化/技术文案） */
export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: '信息填写不完整或格式有误，请检查后重试',
  BAD_REQUEST: '请求有误，请检查填写内容后重试',
  CONFLICT: '该记录已存在或状态冲突，请刷新后重试',
  PERMISSION_DENIED: '您没有权限执行该操作',
  NOT_FOUND: '未找到相关记录，可能已被删除',
  TOKEN_EXPIRED: '登录已过期，请重新登录',
  UNAUTHORIZED: '请先登录后再操作',
  TOO_MANY_REQUESTS: '操作过于频繁，请稍后再试',
  SERVER_ERROR: '系统繁忙，请稍后重试',
  SERVICE_UNAVAILABLE: '服务暂不可用，请稍后重试',
  GATEWAY_TIMEOUT: '网络超时，请稍后重试',
  NETWORK_ERROR: '网络连接异常，请检查网络后重试',
}

/** 这些错误码的后端 message 通常是友好的业务文案，优先透传 */
const PREFER_BACKEND_MESSAGE = new Set(['BUSINESS_ERROR', 'CONFLICT'])

/** 根据错误码与后端原始 message，解析出最终展示给用户的友好文案 */
export function friendlyMessageFor(code: string, backendMessage: string): string {
  const trimmed = backendMessage?.trim() ?? ''
  if (PREFER_BACKEND_MESSAGE.has(code) && trimmed) return trimmed
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
  if (trimmed) return trimmed
  return ERROR_MESSAGES.SERVER_ERROR
}

/** 从任意捕获到的异常中取出可展示的友好文案 */
function resolveContent(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.friendlyMessage || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}

/** 错误 toast 提示（3 秒自动消失） */
export function showErrorDialog(error: unknown, fallback = '操作未成功，请稍后重试'): void {
  message.error(resolveContent(error, fallback), 3)
}

/** 警告 toast 提示（3 秒自动消失） */
export function showWarningDialog(content: string, _title = '请完善信息'): void {
  message.warning(content, 3)
}

/** catch 专用糖：与原有 catch 文案参数对齐，便于批量替换 */
/** 成功 toast 提示（3 秒自动消失） */
export function showSuccess(content: string): void {
  message.success(content, 3)
}

export const showError = (error: unknown, fallback?: string) => showErrorDialog(error, fallback)
