import type { AppTimeZone } from '@/api'

import { getRuntimeSettings, type AppSettings } from './runtimeSettings'

export function timeZoneOffsetMinutes(timeZone: AppTimeZone) {
  return timeZone === 'Asia/Shanghai' ? 8 * 60 : 0
}

export function dateTimeLocalValue(date: Date, settings: AppSettings = getRuntimeSettings()) {
  const zoned = new Date(date.getTime() + timeZoneOffsetMinutes(settings.timeZone) * 60_000)
  return zoned.toISOString().slice(0, 16)
}

export function parseDateTimeLocal(value: string, settings: AppSettings = getRuntimeSettings()) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  const utcMs =
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) -
    timeZoneOffsetMinutes(settings.timeZone) * 60_000
  return new Date(utcMs)
}

export function dateTimeLocalToIso(value: string, settings: AppSettings = getRuntimeSettings()) {
  return parseDateTimeLocal(value, settings)?.toISOString() ?? ''
}

export function normalizeApiDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)) return value
  return `${value}Z`
}

export function parseApiDate(value: string | null) {
  if (!value) return null
  const date = new Date(normalizeApiDateValue(value))
  return Number.isNaN(date.getTime()) ? null : date
}

export function dateParts(value: string | null, settings: AppSettings = getRuntimeSettings()) {
  const date = parseApiDate(value)
  if (!date) return null
  const parts = new Intl.DateTimeFormat(settings.language, {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone: settings.timeZone,
    year: 'numeric',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}`,
  }
}

export function formatDate(value: string | null) {
  return dateParts(value)?.date ?? '-'
}

export function formatDateTime(value: string | null) {
  const parts = dateParts(value)
  return parts ? `${parts.date} ${parts.time}` : '-'
}

export function formatTime(value: string | null) {
  return dateParts(value)?.time ?? '-'
}

export function dateInputValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export function todayInputValue(): string {
  return dateInputValue(new Date())
}

export function daysFromTodayInputValue(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return dateInputValue(date)
}
