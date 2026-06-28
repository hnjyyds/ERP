import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '../auth/LoginPage'

describe('LoginPage', () => {
  const onLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<LoginPage error="" onLogin={onLogin} />)
    expect(container).toBeTruthy()
  })

  it('renders the login form with username and password fields', () => {
    render(<LoginPage error="" onLogin={onLogin} />)

    expect(screen.getByLabelText('用户名')).toBeInTheDocument()
    expect(screen.getByLabelText('密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /登录/ })).toBeInTheDocument()
  })

  it('shows external error when passed as prop', () => {
    render(<LoginPage error="会话已过期" onLogin={onLogin} />)

    expect(screen.getByText('登录未完成')).toBeInTheDocument()
    expect(screen.getByText('会话已过期')).toBeInTheDocument()
  })

  it('shows validation error when submitting with empty fields', async () => {
    render(<LoginPage error="" onLogin={onLogin} />)

    // Clear the default username
    const usernameInput = screen.getByLabelText('用户名')
    await userEvent.clear(usernameInput)

    const submitButton = screen.getByRole('button', { name: /登录/ })
    await userEvent.click(submitButton)

    expect(screen.getByText('请填写用户名和密码')).toBeInTheDocument()
  })
})
