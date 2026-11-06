import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ConfigProvider, Skeleton } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'

import {
  type AuthSession,
  type Dashboard,
  type I18nConfig,
  authExpiredEventName,
  clearAuthToken,
  getCurrentSession,
  getDashboard,
  getI18nConfig,
  hasAuthToken,
} from '../api'
import { canAccessPath, dashboardPath, loginPath } from './routes'
import { showError } from '../shared/errors'
import type { UserAvatarPickerValue } from '../shared/ui'
import { fallbackI18nConfig, normalizeSettings } from './appI18n'
import { setRuntimeSettings, type AppSettings } from './pages/appHelpers'
import { AppShell } from './components/shell/AppShell'
import { getSidebarMenuGroups } from './components/sidebar/sidebarNavigation'

// ─── Lazy Login ──────────────────────────────────────────────────────────────

const LoginPage = React.lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)

// ─── Settings persistence ────────────────────────────────────────────────────

const settingsStorageKey = 'xinpei_app_settings'

function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(settingsStorageKey)
    if (!raw) return normalizeSettings(null)
    return normalizeSettings(JSON.parse(raw) as Partial<AppSettings>)
  } catch {
    return normalizeSettings(null)
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [activePath, setActivePath] = useState<string>(
    () => window.location.pathname || dashboardPath,
  )
  const [booting, setBooting] = useState(true)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [error, setError] = useState('')
  const [i18nConfig, setI18nConfig] = useState<I18nConfig>(fallbackI18nConfig)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const initial = loadStoredSettings()
    setRuntimeSettings(initial)
    return initial
  })
  const appSettingsRef = useRef(appSettings)
  appSettingsRef.current = appSettings
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsAvatarDraft, setSettingsAvatarDraft] = useState<UserAvatarPickerValue | null>(null)
  const [savingSettingsAvatar] = useState(false)

  const antdLocale = appSettings.language === 'en-US' ? enUS : zhCN

  useEffect(() => {
    localStorage.setItem(settingsStorageKey, JSON.stringify(appSettings))
  }, [appSettings])

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
    setSettingsOpen(false)
    setSettingsAvatarDraft(null)
    setError(message ?? '')
    replaceRoute('/login')
  }

  function logout() {
    clearAuthToken()
    setSession(null)
    setDashboard(null)
    setSettingsOpen(false)
    setSettingsAvatarDraft(null)
    setError('')
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
        const next = normalizeSettings(appSettingsRef.current, cfg)
        setRuntimeSettings(next)
        setAppSettings(next)
      } catch {
        /* use fallback */
      }

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
          access_token: localStorage.getItem('xinpei_access_token') ?? '',
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
    return () => {
      cancelled = true
    }
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

  useEffect(() => {
    if (session && activePath === loginPath) replaceRoute(dashboardPath)
  }, [activePath, session])

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

  const sidebarMenuGroups = useMemo(
    () => getSidebarMenuGroups(session?.menus ?? []),
    [session?.menus],
  )

  const activeMenu = useMemo(() => {
    return (
      [...(session?.menus ?? [])]
        .sort((left, right) => right.path.length - left.path.length)
        .find(
          (menu) =>
            menu.path === activePath ||
            activePath.startsWith(`${menu.path === dashboardPath ? '' : menu.path}/`),
        ) ?? null
    )
  }, [session, activePath])

  const canNavigatePath = (path: string) =>
    canAccessPath(path, session?.menus.map((menu) => menu.path) ?? [])

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
              setSettingsOpen(false)
              setSettingsAvatarDraft(null)
              setError('')
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
      <AppShell
        activePath={activePath}
        session={session}
        dashboard={dashboard}
        loadingDashboard={loadingDashboard}
        activeMenu={activeMenu}
        error={error}
        sidebarMenuGroups={sidebarMenuGroups}
        canNavigatePath={canNavigatePath}
        onNavigate={navigate}
        onRefreshDashboard={async () => {
          await loadDashboard()
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        settings={{
          open: settingsOpen,
          session,
          i18nConfig,
          appSettings,
          settingsAvatarDraft,
          savingSettingsAvatar,
          onClose: () => setSettingsOpen(false),
          onLogout: logout,
          onChangeLanguage: (lang) => {
            const next = normalizeSettings({ ...appSettings, language: lang }, i18nConfig)
            setRuntimeSettings(next)
            setAppSettings(next)
          },
          onChangeAvatarDraft: setSettingsAvatarDraft,
          onSaveAvatar: () => {},
        }}
      />
    </ConfigProvider>
  )
}
