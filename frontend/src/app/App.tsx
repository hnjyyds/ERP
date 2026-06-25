import React, { Component, Suspense, useEffect, useMemo, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { ConfigProvider, Skeleton } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'

import {
  type AppLanguage,
  type AppTimeZone,
  type AuthSession,
  type Dashboard,
  type I18nConfig,
  type MenuItem,
  clearAuthToken,
  getCurrentSession,
  getDashboard,
  getI18nConfig,
  hasAuthToken,
  setAuthToken,
  authExpiredEventName,
} from '../api'
import {
  dashboardPath,
  detailRootPath,
  organizationUsersPath,
  productPath,
  customerPath,
  supplierPath,
  partnerPath,
  documentPartyPath,
  sampleRequestPath,
  sampleRecordPath,
  sampleDeliveryPath,
  exportQuotationPath,
  exportContractPath,
  shipmentPath,
  purchaseInquiryPath,
  purchaseContractPath,
  purchaseInvoiceNoticePath,
  followupPath,
  qualityInspectionPath,
  warehouseInboundPlanPath,
  warehouseInboundOrderPath,
  warehouseOutboundPlanPath,
  warehouseOutboundOrderPath,
  financePath,
  reportingPath,
} from './routes'
import { showError } from '../shared/errors'
import {
  BarChart3,
  ClipboardCheck,
  Coins,
  LayoutDashboard,
  LockKeyhole,
  Package,
  Settings,
  ShieldCheck,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

import { AppSidebar } from './components/sidebar/AppSidebar'
import { AppTopbar } from './components/topbar/AppTopbar'
import { SettingsModal } from './components/settings/SettingsModal'
import { AppRouter } from './components/router/AppRouter'

type AppSettings = {
  language: AppLanguage
  timeZone: AppTimeZone
}

// ─── Error Boundary ──────────────────────────────────────────────────────────

type PageErrorBoundaryProps = { children: ReactNode; pageKey: string }
type PageErrorBoundaryState = { message: string }

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { message: '' }

  static getDerivedStateFromError(error: unknown): PageErrorBoundaryState {
    return { message: error instanceof Error ? error.message : '页面渲染失败' }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('Page render failed', error, errorInfo)
  }

  componentDidUpdate(prev: PageErrorBoundaryProps) {
    if (prev.pageKey !== this.props.pageKey && this.state.message) {
      this.setState({ message: '' })
    }
  }

  render() {
    if (this.state.message) {
      return (
        <section className="dashboard-feedback error" role="alert">
          页面加载失败：{this.state.message}
        </section>
      )
    }
    return this.props.children
  }
}

// ─── i18n (minimal, keeps existing pages compiling) ──────────────────────────

const fallbackI18nConfig: I18nConfig = {
  default_language: 'zh-CN',
  supported_languages: [
    { code: 'zh-CN', label: '中文', description: 'UTC+8 / Asia Shanghai', time_zone: 'Asia/Shanghai' },
    { code: 'en-US', label: 'English', description: 'UTC', time_zone: 'UTC' },
  ],
  messages: { 'zh-CN': {}, 'en-US': {} },
  path_labels: {},
  page_titles: {},
  sidebar_groups: {},
}

function normalizeSettings(value: Partial<AppSettings> | null, config = fallbackI18nConfig): AppSettings {
  const langs = new Set(config.supported_languages.map((o) => o.code))
  const lang = (value?.language && langs.has(value.language) ? value.language : config.default_language) as AppLanguage
  const tz = config.supported_languages.find((o) => o.code === lang)?.time_zone ?? (lang === 'en-US' ? 'UTC' : 'Asia/Shanghai')
  return { language: lang, timeZone: tz as AppTimeZone }
}

const zh: Record<string, string> = {
  'settings.open': '系统设置', 'settings.title': '系统设置', 'settings.account': '账号',
  'settings.language': '语言', 'settings.timeZone': '时区', 'settings.timeZoneHint': '用于展示时间与提醒',
  'settings.logout': '退出登录',
  'common.close': '关闭', 'common.create': '新建', 'common.delete': '删除', 'common.refresh': '刷新',
  'common.viewAll': '查看全部', 'common.notSet': '未设置', 'common.none': '无',
  'access.deniedTitle': '暂无访问权限', 'access.deniedDescription': '当前账号未开通该模块，请联系管理员。',
  'page.businessModule': '业务模块', 'page.personalWorkbench': '个人工作台',
  'app.brandName': '新裴贸易', 'app.productName': '业务管理系统',
  'dashboard.aria': '工作台', 'dashboard.announcement': '公告', 'dashboard.todo': '待办',
  'dashboard.unreadNotifications': '未读消息', 'dashboard.todaySchedule': '今日日程',
  'dashboard.addTodo': '新增待办', 'dashboard.addSchedule': '新增日程',
  'dashboard.publishAnnouncement': '发布公告', 'dashboard.myTodos': '我的待办',
  'dashboard.messages': '消息', 'dashboard.mySchedule': '我的日程',
  'dashboard.companyAnnouncements': '公司公告',
  'dashboard.noTodos': '暂无待办', 'dashboard.noNotifications': '暂无消息',
  'dashboard.noSchedules': '暂无日程', 'dashboard.noAnnouncements': '暂无公告',
  'dashboard.goHandle': '去处理', 'dashboard.handle': '处理', 'dashboard.read': '已读',
  'dashboard.publish': '发布', 'dashboard.add': '新增',
  'dashboard.title': '标题', 'dashboard.content': '内容',
  'dashboard.start': '开始', 'dashboard.end': '结束', 'dashboard.note': '备注',
  'dashboard.assignees': '指派人', 'dashboard.assigneeRequired': '请选择指派人',
  'dashboard.selectAssignees': '选择指派人',
  'dashboard.todoCreated': '待办已创建', 'dashboard.todoRequired': '请填写待办标题和内容',
  'dashboard.createdAt': '创建时间',
  'dashboard.scheduleDetail': '日程详情', 'dashboard.deleteSchedule': '删除日程',
  'dashboard.deleteScheduleTitle': '确认删除', 'dashboard.deleteScheduleConfirm': '确定要删除这条日程吗？',
  'dashboard.scheduleCreated': '日程已创建', 'dashboard.scheduleDeleted': '日程已删除',
  'dashboard.scheduleRequired': '请填写日程标题', 'dashboard.scheduleTimeInvalid': '结束时间不能早于开始时间',
  'dashboard.announcementDeniedTitle': '权限不足', 'dashboard.announcementDenied': '仅超级管理员可以发布公告',
  'dashboard.announcementRequired': '请填写公告标题和内容', 'dashboard.announcementCreated': '公告已发布',
  'dashboard.notificationHandled': '消息已处理', 'dashboard.operationFailed': '操作失败',
  'dashboard.deadline': '截止时间', 'dashboard.noNote': '无备注',
  'dashboard.pendingConfirm': '待确认', 'dashboard.countdownPrefix': '剩余',
  'dashboard.inProgress': '进行中', 'dashboard.ended': '已结束',
  'dashboard.minutes': '分钟', 'dashboard.hours': '小时', 'dashboard.days': '天',
  'dashboard.minutesShort': '分', 'dashboard.hoursShort': '时',
  'dashboard.daysShort': '天', 'dashboard.secondsShort': '秒',
  'status.completed': '已完成', 'status.pending': '待处理',
  'severity.high': '高', 'severity.urgent': '紧急', 'severity.warning': '警告',
  'todo.approval': '审批', 'todo.followup': '跟单', 'todo.manual': '手动',
  'todo.system': '系统', 'todo.assignedToMe': '别人给我的', 'todo.selfCreated': '我创建的',
}
const en: Record<string, string> = {
  'settings.open': 'Settings', 'settings.title': 'Settings', 'settings.account': 'Account',
  'settings.language': 'Language', 'settings.timeZone': 'Time zone', 'settings.timeZoneHint': 'Used for reminders and display',
  'settings.logout': 'Logout',
  'common.close': 'Close', 'common.create': 'Create', 'common.delete': 'Delete', 'common.refresh': 'Refresh',
  'common.viewAll': 'View all', 'common.notSet': 'Not set', 'common.none': 'None',
  'access.deniedTitle': 'No access', 'access.deniedDescription': 'You do not have access to this module. Contact an admin.',
  'page.businessModule': 'Business module', 'page.personalWorkbench': 'Personal workbench',
  'app.brandName': 'Xinpei Trade', 'app.productName': 'Business Management',
  'dashboard.aria': 'Dashboard', 'dashboard.announcement': 'Announcements', 'dashboard.todo': 'Tasks',
  'dashboard.unreadNotifications': 'Unread', 'dashboard.todaySchedule': 'Today',
  'dashboard.addTodo': 'New task', 'dashboard.addSchedule': 'New event',
  'dashboard.publishAnnouncement': 'Publish', 'dashboard.myTodos': 'My tasks',
  'dashboard.messages': 'Messages', 'dashboard.mySchedule': 'My schedule',
  'dashboard.companyAnnouncements': 'Announcements',
  'dashboard.noTodos': 'No tasks', 'dashboard.noNotifications': 'No messages',
  'dashboard.noSchedules': 'No events', 'dashboard.noAnnouncements': 'No announcements',
  'dashboard.goHandle': 'Handle', 'dashboard.handle': 'Handle', 'dashboard.read': 'Read',
  'dashboard.publish': 'Publish', 'dashboard.add': 'Add',
  'dashboard.title': 'Title', 'dashboard.content': 'Content',
  'dashboard.start': 'Start', 'dashboard.end': 'End', 'dashboard.note': 'Note',
  'dashboard.assignees': 'Assignees', 'dashboard.assigneeRequired': 'Select at least one assignee',
  'dashboard.selectAssignees': 'Select assignees',
  'dashboard.todoCreated': 'Task created', 'dashboard.todoRequired': 'Enter a task title and content',
  'dashboard.createdAt': 'Created at',
  'dashboard.scheduleDetail': 'Event detail', 'dashboard.deleteSchedule': 'Delete event',
  'dashboard.deleteScheduleTitle': 'Confirm delete', 'dashboard.deleteScheduleConfirm': 'Delete this event?',
  'dashboard.scheduleCreated': 'Event created', 'dashboard.scheduleDeleted': 'Event deleted',
  'dashboard.scheduleRequired': 'Enter an event title', 'dashboard.scheduleTimeInvalid': 'End time must be after start time',
  'dashboard.announcementDeniedTitle': 'Permission denied', 'dashboard.announcementDenied': 'Only super admins can publish announcements',
  'dashboard.announcementRequired': 'Enter an announcement title and content', 'dashboard.announcementCreated': 'Announcement published',
  'dashboard.notificationHandled': 'Message handled', 'dashboard.operationFailed': 'Operation failed',
  'dashboard.deadline': 'Deadline', 'dashboard.noNote': 'No note',
  'dashboard.pendingConfirm': 'Pending', 'dashboard.countdownPrefix': '',
  'dashboard.inProgress': 'In progress', 'dashboard.ended': 'Ended',
  'dashboard.minutes': 'minutes', 'dashboard.hours': 'hours', 'dashboard.days': 'days',
  'dashboard.minutesShort': 'm', 'dashboard.hoursShort': 'h',
  'dashboard.daysShort': 'd', 'dashboard.secondsShort': 's',
  'status.completed': 'Completed', 'status.pending': 'Pending',
  'severity.high': 'High', 'severity.urgent': 'Urgent', 'severity.warning': 'Warning',
  'todo.approval': 'Approval', 'todo.followup': 'Follow-up', 'todo.manual': 'Manual',
  'todo.system': 'System', 'todo.assignedToMe': 'Assigned to me', 'todo.selfCreated': 'Created by me',
}

export function t(key: string, settings: AppSettings = normalizeSettings(null)) {
  return (settings.language === 'en-US' ? en[key] : zh[key]) ?? key
}

// ─── Lazy Login ──────────────────────────────────────────────────────────────

const LoginPage = React.lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))

// ─── App ─────────────────────────────────────────────────────────────────────

const sidebarNavGroups: Array<{
  id: string
  label: string
  icon: LucideIcon
  paths: string[]
}> = [
  {
    id: 'masterdata',
    label: '基础资料',
    icon: Package,
    paths: [productPath, supplierPath, customerPath, partnerPath, documentPartyPath],
  },
  {
    id: 'workflow',
    label: '订单 Workflow',
    icon: ClipboardCheck,
    paths: [exportContractPath, purchaseContractPath, exportQuotationPath, shipmentPath],
  },
  {
    id: 'taskCenter',
    label: 'QC / 跟单',
    icon: ShieldCheck,
    paths: [qualityInspectionPath, followupPath, sampleRecordPath, sampleRequestPath, sampleDeliveryPath],
  },
  {
    id: 'warehouse',
    label: '仓库',
    icon: Warehouse,
    paths: [
      warehouseInboundOrderPath,
      warehouseInboundPlanPath,
      warehouseOutboundPlanPath,
      warehouseOutboundOrderPath,
    ],
  },
  {
    id: 'finance',
    label: '财务经营',
    icon: BarChart3,
    paths: [financePath, reportingPath],
  },
  {
    id: 'system',
    label: '系统设置',
    icon: Settings,
    paths: [organizationUsersPath],
  },
  {
    id: 'legacyPurchase',
    label: '暂缓模块',
    icon: LockKeyhole,
    paths: [purchaseInquiryPath, purchaseInvoiceNoticePath],
  },
]

function getSidebarMenuGroups(menus: MenuItem[]) {
  const menuByPath = new Map(menus.map((item) => [item.path, item]))
  const groupedPaths = new Set<string>()
  const groups = sidebarNavGroups
    .map((group) => {
      const items = group.paths
        .map((path) => menuByPath.get(path))
        .filter((item): item is MenuItem => Boolean(item))
      items.forEach((item) => groupedPaths.add(item.path))
      return { ...group, items }
    })
    .filter((group) => group.items.length > 0)
  const otherItems = menus.filter((item) => item.path !== dashboardPath && !groupedPaths.has(item.path))
  if (otherItems.length === 0) return groups
  return [
    ...groups,
    {
      id: 'other',
      label: '其他',
      icon: LayoutDashboard,
      paths: [],
      items: otherItems,
    },
  ]
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [activePath, setActivePath] = useState<string>(() => window.location.pathname || dashboardPath)
  const [booting, setBooting] = useState(true)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [error, setError] = useState('')
  const [i18nConfig, setI18nConfig] = useState<I18nConfig>(fallbackI18nConfig)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => normalizeSettings(null))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsAvatarDraft, setSettingsAvatarDraft] = useState<any>(null)
  const [savingSettingsAvatar, setSavingSettingsAvatar] = useState(false)

  const antdLocale = appSettings.language === 'en-US' ? enUS : zhCN

  // ── helpers ──────────────────────────────────────────────────────────────

  function replaceRoute(path: string) {
    if (window.location.pathname !== path) window.history.replaceState({}, '', path)
    setActivePath(path)
  }

  function navigate(path: string) {
    if (path === activePath) return
    window.history.pushState({}, '', path)
    setActivePath(path)
  }

  function redirectToLogin(message?: string) {
    clearAuthToken()
    setSession(null)
    setDashboard(null)
    if (message) setError(message)
    replaceRoute('/login')
  }

  // ── bootstrap: check token → fetch session ──────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      // 1. fetch i18n config
      try {
        const cfg = await getI18nConfig()
        if (cancelled) return
        setI18nConfig(cfg)
        setAppSettings((cur) => normalizeSettings(cur, cfg))
      } catch { /* use fallback */ }

      // 2. no token → login
      if (!hasAuthToken()) {
        replaceRoute('/login')
        setBooting(false)
        return
      }

      // 3. has token → fetch session
      try {
        const res = await getCurrentSession()
        if (cancelled) return
        const s: AuthSession = {
          access_token: localStorage.getItem('yuanjing_access_token') ?? '',
          token_type: 'bearer',
          user: res.user,
          menus: res.menus,
        }
        setSession(s)
      } catch (e) {
        if (!cancelled) redirectToLogin(e instanceof Error ? e.message : '登录状态已失效')
      } finally {
        if (!cancelled) setBooting(false)
      }
    }

    void bootstrap()
    return () => { cancelled = true }
  }, [])

  // ── auth expired listener ────────────────────────────────────────────────

  useEffect(() => {
    const handler = () => redirectToLogin('登录状态已失效')
    window.addEventListener(authExpiredEventName, handler)
    return () => window.removeEventListener(authExpiredEventName, handler)
  }, [])

  // ── browser back/forward ─────────────────────────────────────────────────

  useEffect(() => {
    const onPop = () => setActivePath(window.location.pathname || dashboardPath)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // ── load dashboard on navigation ─────────────────────────────────────────

  useEffect(() => {
    if (!session) return
    void loadDashboard()
  }, [session, activePath])

  async function loadDashboard() {
    setLoadingDashboard(true)
    try {
      setDashboard(await getDashboard())
    } catch (e) {
      showError(e, '加载失败')
    } finally {
      setLoadingDashboard(false)
    }
  }

  // ── derived ──────────────────────────────────────────────────────────────

  const sidebarMenuGroups = useMemo(() => getSidebarMenuGroups(session?.menus ?? []), [session?.menus])

  const activeMenu = useMemo(() => {
    return session?.menus?.find((m) => m.path === activePath) ?? null
  }, [session, activePath])

  // ── renders ──────────────────────────────────────────────────────────────

  // 1. booting → skeleton
  if (booting) {
    return (
      <ConfigProvider locale={antdLocale}>
        <main className="login-shell">
          <section className="login-panel" aria-label="loading">
            <Skeleton active paragraph={{ rows: 4 }} />
          </section>
        </main>
      </ConfigProvider>
    )
  }

  // 2. no session → login
  if (!session) {
    return (
      <ConfigProvider locale={antdLocale}>
        <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
          <LoginPage
            error={error}
            onLogin={(s) => {
              setSession(s)
              replaceRoute(dashboardPath)
            }}
          />
        </Suspense>
      </ConfigProvider>
    )
  }

  // 3. logged in → shell
  return (
    <ConfigProvider locale={antdLocale}>
      <main className={activePath === dashboardPath ? 'react-shell react-shell-home' : 'react-shell'}>
        <AppSidebar
          activePath={activePath}
          dashboardMenu={session.menus.find((m) => m.path === dashboardPath) ?? null}
          sidebarMenuGroups={sidebarMenuGroups}
          onNavigate={navigate}
        />
        <section className="react-workspace">
          <AppTopbar
            activePath={activePath}
            activeMenu={activeMenu}
            error={error}
            onOpenSettings={() => setSettingsOpen(true)}
          />
          <AppRouter
            activePath={activePath}
            session={session}
            dashboard={dashboard}
            loadingDashboard={loadingDashboard}
            activeMenu={activeMenu}
            onNavigate={navigate}
            onRefreshDashboard={async () => { await loadDashboard() }}
            canNavigatePath={() => true}
          />
        </section>
      </main>

      <SettingsModal
        open={settingsOpen}
        session={session}
        i18nConfig={i18nConfig}
        appSettings={appSettings}
        settingsAvatarDraft={settingsAvatarDraft}
        savingSettingsAvatar={savingSettingsAvatar}
        onClose={() => setSettingsOpen(false)}
        onLogout={() => {
          clearAuthToken()
          setSession(null)
          setDashboard(null)
          replaceRoute('/login')
        }}
        onChangeLanguage={(lang) => setAppSettings((prev) => normalizeSettings({ ...prev, language: lang }, i18nConfig))}
        onChangeAvatarDraft={setSettingsAvatarDraft}
        onSaveAvatar={() => {}}
      />
    </ConfigProvider>
  )
}
