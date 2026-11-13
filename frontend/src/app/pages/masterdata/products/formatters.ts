/** 把 0~1 的小数税率格式化为百分比文本，与表单 percentToRate 互为逆运算。 */
export function formatRatePercent(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  const rate = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(rate)) return null
  const percent = Number((rate * 100).toFixed(2))
  return `${percent}%`
}
