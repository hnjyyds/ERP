import { type AppLanguage, type AppTimeZone, type I18nConfig } from '@/api'
import { translate, type TranslationKey, type TranslationParams } from '@/locales'
import { getRuntimeSettings } from './pages/appHelpers'

export type { TranslationKey, TranslationParams }

export type AppSettings = {
  language: AppLanguage
  timeZone: AppTimeZone
}

export const fallbackI18nConfig: I18nConfig = {
  default_language: 'zh-CN',
  supported_languages: [
    {
      code: 'zh-CN',
      label: '中文',
      description: 'UTC+8 / Asia Shanghai',
      time_zone: 'Asia/Shanghai',
    },
    { code: 'en-US', label: 'English', description: 'UTC', time_zone: 'UTC' },
  ],
  messages: { 'zh-CN': {}, 'en-US': {} },
  path_labels: {},
  page_titles: {},
  sidebar_groups: {},
}

export function normalizeSettings(
  value: Partial<AppSettings> | null,
  config = fallbackI18nConfig,
): AppSettings {
  const langs = new Set(config.supported_languages.map((o) => o.code))
  const lang = (
    value?.language && langs.has(value.language) ? value.language : config.default_language
  ) as AppLanguage
  const tz =
    config.supported_languages.find((o) => o.code === lang)?.time_zone ??
    (lang === 'en-US' ? 'UTC' : 'Asia/Shanghai')
  return { language: lang, timeZone: tz as AppTimeZone }
}

/**
 * 取当前运行时语言下的文案。
 * key 由 locales/zh-CN.json 推导为字面量联合类型，拼写错误或缺失在 tsc 阶段报错。
 */
export function t(key: TranslationKey, params?: TranslationParams) {
  return translate(getRuntimeSettings().language, key, params)
}
