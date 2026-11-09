/**
 * 兼容入口：通用页面工具按职责拆分到 `./helpers/*`，此文件仅做统一 re-export，
 * 保持既有 `@/app/pages/appHelpers` 导入路径与导出名不变。
 *
 * - runtimeSettings：语言/时区运行时单例（`t()` 与日期格式化调用时读取，切换即时生效）
 * - permissions：权限判断
 * - dates：日期时间解析/格式化
 * - formats：金额、数量、百分比等展示格式化
 * - pageTitle：页面标题解析
 * - statusTags：状态/级别标签
 * - navigation：页面导航相关类型
 */
export {
  getRuntimeSettings,
  setRuntimeSettings,
  type AppSettings,
} from './helpers/runtimeSettings'
export {
  superAdminPermission,
  canCreateAnnouncement,
  canApproveAssignedRecord,
} from './helpers/permissions'
export {
  timeZoneOffsetMinutes,
  dateTimeLocalValue,
  parseDateTimeLocal,
  dateTimeLocalToIso,
  normalizeApiDateValue,
  parseApiDate,
  dateParts,
  formatDate,
  formatDateTime,
  formatTime,
  dateInputValue,
  todayInputValue,
  daysFromTodayInputValue,
} from './helpers/dates'
export {
  formatMoney,
  formatFinanceAmount,
  nullableText,
  formatQuantity,
  trimDecimal,
  emptyToNull,
  formatPercent,
  partnerTypeLabel,
} from './helpers/formats'
export { pageTitle } from './helpers/pageTitle'
export { statusTag, severityTag } from './helpers/statusTags'
export type {
  NavigateToModule,
  ModuleNavigationProps,
  RoutedDetailPageProps,
} from './helpers/navigation'
