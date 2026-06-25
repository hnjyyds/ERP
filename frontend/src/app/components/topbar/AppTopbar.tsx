import { Alert } from 'antd'
import { Settings } from 'lucide-react'
import type { MenuItem } from '../../../api'
import { pageTitle } from '../../pages/appHelpers'
import { t } from '../../App'

type Props = {
  activePath: string
  activeMenu: MenuItem | null
  error: string
  onOpenSettings: () => void
}

export function AppTopbar({ activePath, activeMenu, error, onOpenSettings }: Props) {
  return (
    <>
      <header className="react-topbar">
        <div>
          <p className="eyebrow">{t('page.businessModule')}</p>
          <h1>{pageTitle(activePath, activeMenu)}</h1>
        </div>
        <div className="react-topbar-actions">
          <button aria-label={t('settings.open')} className="topbar-settings-button" title={t('settings.open')} type="button" onClick={onOpenSettings}>
            <Settings size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}
    </>
  )
}
