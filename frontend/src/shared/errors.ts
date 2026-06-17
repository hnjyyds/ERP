import { Modal } from 'antd'

/**
 * 统一的接口错误对象。
 *
 * 关键点：构造时 `super(friendlyMessage)`，因此 `error.message` 本身就是
 * 用户友好文案。这样即使某个 catch 没改到、仍读取 `caught.message`，
 * 拿到的也是友好文案而非后端技术文案，向后兼容。
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

/** 居中的错误弹窗（用于失败提示） */
export function showErrorDialog(error: unknown, fallback = '操作未成功，请稍后重试'): void {
  Modal.error({
    title: '操作未成功',
    content: resolveContent(error, fallback),
    centered: true,
    okText: '知道了',
  })
}

/** 居中的提醒弹窗（用于前端必填/格式校验提示） */
export function showWarningDialog(content: string, title = '请完善信息'): void {
  Modal.warning({
    title,
    content,
    centered: true,
    okText: '知道了',
  })
}

/** catch 专用糖：与原有 catch 文案参数对齐，便于批量替换 */
export const showError = (error: unknown, fallback?: string) => showErrorDialog(error, fallback)
