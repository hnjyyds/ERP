import { Banner as SemiBanner, Button as SemiButton, Input as SemiInput } from '@douyinfe/semi-ui'
import { KeyRound, LayoutDashboard, UserRound } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { login, setAuthToken, type AuthSession } from '../../../api'
import { t } from '../../appI18n'

export function LoginPage({
  error,
  onLogin,
}: {
  error: string
  onLogin: (session: AuthSession) => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(error)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const usernameValue = username.trim()
  const missingUsername = usernameValue.length === 0
  const missingPassword = password.length === 0
  const requiredMessage =
    missingUsername && missingPassword
      ? t('auth.validation.credentialsRequired')
      : missingUsername
        ? t('auth.validation.usernameRequired')
        : missingPassword
          ? t('auth.validation.passwordRequired')
          : ''
  const showRequiredMessage = submitAttempted && Boolean(requiredMessage)
  const canSubmit = !submitting

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (requiredMessage) {
      setSubmitAttempted(true)
      setFormError(requiredMessage)
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const nextSession = await login(usernameValue, password)
      setAuthToken(nextSession.access_token)
      onLogin(nextSession)
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : t('auth.message.loginFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-stage" aria-label={t('auth.stageLabel')}>
        <div className="login-intro">
          <div className="login-editorial-brand" aria-label="D-DUTCH">
            D-DUTCH
          </div>

          <figure className="login-editorial-hero">
            <img src="/brand/d-dutch-studio.jpg" alt={t('auth.heroImageAlt')} />
            <figcaption>
              <span>YOUR SOURCING</span>
              <span>PRODUCTION</span>
              <span>PARTNER FOR FASHION ACCESSORIES</span>
            </figcaption>
          </figure>

          <div className="login-editorial-footer">
            <span>BUSINESS ERP</span>
            <div>
              <strong>{t('auth.footerTitle')}</strong>
              <p>{t('auth.footerDescription')}</p>
            </div>
          </div>
        </div>

        <section className="login-panel">
          <div className="login-panel-heading">
            <p className="eyebrow">{t('auth.subtitle')}</p>
            <h2>{t('auth.title')}</h2>
          </div>

          {formError ? (
            <SemiBanner
              bordered
              className="login-error"
              description={formError}
              title={t('auth.errorTitle')}
              type="danger"
            />
          ) : null}

          <form className="login-form" onSubmit={submit}>
            <label htmlFor="login-username">
              {t('auth.field.username')}
              <SemiInput
                id="login-username"
                autoComplete="username"
                prefix={<UserRound aria-hidden="true" size={16} />}
                showClear
                size="large"
                value={username}
                onChange={(value) => {
                  setUsername(value)
                  setFormError('')
                }}
              />
            </label>
            <label htmlFor="login-password">
              {t('auth.field.password')}
              <SemiInput
                id="login-password"
                autoComplete="current-password"
                mode="password"
                prefix={<KeyRound aria-hidden="true" size={16} />}
                size="large"
                value={password}
                onChange={(value) => {
                  setPassword(value)
                  setFormError('')
                }}
              />
            </label>
            {showRequiredMessage ? <p className="login-form-hint">{requiredMessage}</p> : null}
            <SemiButton
              block
              className="login-submit"
              disabled={!canSubmit}
              htmlType="submit"
              icon={<LayoutDashboard size={16} />}
              loading={submitting}
              size="large"
              theme="solid"
              type="primary"
            >
              {t('auth.action.login')}
            </SemiButton>
          </form>
        </section>
      </section>
    </main>
  )
}
