import {
  Banner as SemiBanner,
  Button as SemiButton,
  Input as SemiInput,
} from '@douyinfe/semi-ui'
import { KeyRound, LayoutDashboard, UserRound } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { login, setAuthToken, type AuthSession } from '../../../api'

export function LoginPage({
  error,
  onLogin,
}: {
  error: string
  onLogin: (session: AuthSession) => void
}) {
  const [username, setUsername] = useState('superadmin')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(error)
  const usernameValue = username.trim()
  const missingUsername = usernameValue.length === 0
  const missingPassword = password.length === 0
  const requiredMessage =
    missingUsername && missingPassword
      ? '请填写用户名和密码'
      : missingUsername
        ? '请填写用户名'
        : missingPassword
          ? '请填写密码'
          : ''
  const canSubmit = !requiredMessage && !submitting

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (requiredMessage) {
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
      setFormError(caught instanceof Error ? caught.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-stage" aria-label="新裴贸易业务管理系统登录">
        <div className="login-intro">
          <div className="login-editorial-brand" aria-label="D-DUTCH">
            D-DUTCH
          </div>

          <figure className="login-editorial-hero">
            <img src="/brand/d-dutch-studio.jpg" alt="D-DUTCH 样品展示空间" />
            <figcaption>
              <span>YOUR SOURCING</span>
              <span>PRODUCTION</span>
              <span>PARTNER FOR FASHION ACCESSORIES</span>
            </figcaption>
          </figure>

          <div className="login-editorial-footer">
            <span>BUSINESS ERP</span>
            <div>
              <strong>外贸业务管理后台</strong>
              <p>样品、销售、采购、仓库、财务与审批统一协作</p>
            </div>
          </div>
        </div>

        <section className="login-panel">
          <div className="login-panel-heading">
            <p className="eyebrow">账号登录</p>
            <h2>登陆</h2>
          </div>

          {formError ? (
            <SemiBanner
              bordered
              className="login-error"
              description={formError}
              title="登录未完成"
              type="danger"
            />
          ) : null}

          <form className="login-form" onSubmit={submit}>
            <label htmlFor="login-username">
              用户名
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
              密码
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
            {requiredMessage ? <p className="login-form-hint">{requiredMessage}</p> : null}
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
              登录
            </SemiButton>
          </form>
        </section>
      </section>
    </main>
  )
}
