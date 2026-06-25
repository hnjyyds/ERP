import { Modal } from 'antd'
import { LogOut } from 'lucide-react'
import type { AppLanguage, AppTimeZone, I18nConfig, AuthSession } from '../../../api'
import { UserAvatar, UserAvatarPicker, type UserAvatarPickerValue } from '../../../shared/ui'
import { t } from '../../App'

type Props = {
  open: boolean
  session: AuthSession
  i18nConfig: I18nConfig
  appSettings: { language: AppLanguage; timeZone: AppTimeZone }
  settingsAvatarDraft: UserAvatarPickerValue | null
  savingSettingsAvatar: boolean
  onClose: () => void
  onLogout: () => void
  onChangeLanguage: (lang: AppLanguage) => void
  onChangeAvatarDraft: (v: UserAvatarPickerValue) => void
  onSaveAvatar: () => void
}

function timeZoneLabel(appSettings: { language: AppLanguage; timeZone: AppTimeZone }, i18nConfig: I18nConfig) {
  return i18nConfig.supported_languages.find((o) => o.code === appSettings.language)?.description ?? (appSettings.timeZone === 'UTC' ? 'UTC' : 'UTC+8 / Asia Shanghai')
}

function joinDisplay(values: string[], language: AppLanguage) {
  return values.join(language === 'en-US' ? ', ' : '、')
}

export function SettingsModal(props: Props) {
  const { open, session, i18nConfig, appSettings, settingsAvatarDraft, savingSettingsAvatar, onClose, onLogout, onChangeLanguage, onChangeAvatarDraft, onSaveAvatar } = props

  return (
    <Modal centered footer={null} open={open} title={t('settings.title')} width={720} onCancel={onClose}>
      <section className="settings-window">
        <div className="settings-window-user">
          <UserAvatar avatarType={session.user.avatar_type} avatarValue={session.user.avatar_value} label={session.user.display_name} size="sm" />
          <div className="user-meta">
            <span>{t('settings.account')}</span>
            <strong>{session.user.display_name}</strong>
            <small>{session.user.department_name} · {joinDisplay(session.user.roles, appSettings.language)}</small>
          </div>
        </div>

        {settingsAvatarDraft ? (
          <div className="settings-avatar-editor">
            <UserAvatarPicker description="保存后会同步到当前账号和待办指派列表。" label={session.user.display_name} value={settingsAvatarDraft} onChange={onChangeAvatarDraft} />
            <button className="secondary-inline" disabled={savingSettingsAvatar} type="button" onClick={onSaveAvatar}>保存头像</button>
          </div>
        ) : null}

        <div className="settings-field">
          <span>{t('settings.language')}</span>
          <div className="settings-language-options">
            {i18nConfig.supported_languages.map((option) => (
              <button className={option.code === appSettings.language ? 'active' : ''} key={option.code} type="button" onClick={() => onChangeLanguage(option.code)}>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-field">
          <span>{t('settings.timeZone')}</span>
          <div className="settings-timezone">
            <strong>{timeZoneLabel(appSettings, i18nConfig)}</strong>
            <small>{t('settings.timeZoneHint')}</small>
          </div>
        </div>

        <div className="modal-actions split">
          <button className="danger-inline" type="button" onClick={onLogout}>
            <LogOut size={15} /> {t('settings.logout')}
          </button>
          <button className="secondary-inline" type="button" onClick={onClose}>{t('common.close')}</button>
        </div>
      </section>
    </Modal>
  )
}
