import type { AppLanguage, AppTimeZone } from '@/api'

export type AppSettings = {
  language: AppLanguage
  timeZone: AppTimeZone
}

/**
 * 运行时语言/时区是模块级单例：所有格式化与文案读取必须在调用时取当前值，
 * 不允许在模块加载时缓存，否则切换语言后已挂载页面不会更新。
 */
let runtimeSettings: AppSettings = { language: 'zh-CN', timeZone: 'Asia/Shanghai' }

export function getRuntimeSettings() {
  return runtimeSettings
}

export function setRuntimeSettings(settings: AppSettings) {
  runtimeSettings = settings
}
