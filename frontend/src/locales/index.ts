import type { AppLanguage } from '../api'
import enUS from './en-US.json'
import zhCN from './zh-CN.json'

export const localeMessages = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

// 把嵌套 JSON 的叶子路径拼成 `a.b.c` 形式的 key。
type Join<Prefix extends string, Key extends string> = Prefix extends '' ? Key : `${Prefix}.${Key}`

type LeafPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? Join<Prefix, K> : LeafPaths<T[K], Join<Prefix, K>>
}[keyof T & string]

/** 所有合法的文案 key，由 zh-CN.json 的结构推导，拼错或缺 key 时 tsc 直接报错。 */
export type TranslationKey = LeafPaths<typeof zhCN>

/** 插值参数，例如 `{ code: 'P-001' }` 对应文案里的 `{code}`。 */
export type TranslationParams = Record<string, string | number>

// 两套语言必须包含完全一致的 key，缺任何一边都在 tsc 阶段报错。
type MissingKeys<Source, Target> = Exclude<LeafPaths<Source>, LeafPaths<Target>>
type AssertNoMissing<T extends never> = T

type _MissingInEnUS = AssertNoMissing<MissingKeys<typeof zhCN, typeof enUS>>
type _MissingInZhCN = AssertNoMissing<MissingKeys<typeof enUS, typeof zhCN>>

function resolveMessage(messages: unknown, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((node, segment) => {
    if (node && typeof node === 'object' && Object.prototype.hasOwnProperty.call(node, segment)) {
      return (node as Record<string, unknown>)[segment]
    }
    return undefined
  }, messages)
  return typeof value === 'string' ? value : undefined
}

function interpolate(template: string, params: TranslationParams): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/**
 * 按语言取文案并做 `{name}` 插值。
 * key 已由类型约束，运行时只保留“当前语言缺失回退中文”的兜底，正常不会触发。
 */
export function translate(
  locale: AppLanguage,
  key: TranslationKey,
  params: TranslationParams = {},
): string {
  const template =
    resolveMessage(localeMessages[locale], key) ??
    resolveMessage(localeMessages['zh-CN'], key) ??
    key
  return interpolate(template, params)
}
