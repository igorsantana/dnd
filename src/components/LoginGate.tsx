import { useState, type FormEvent } from 'react'
import { authenticate, setSessionRole, type AuthRole } from '../lib/auth'
import { pt } from '../i18n/pt'
import { PrimaryButton } from './ui'

export function LoginGate({ onLogin }: { onLogin: (role: AuthRole) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const role = authenticate(password)
    if (!role) {
      setError(pt.login.error)
      return
    }
    setSessionRole(role)
    onLogin(role)
  }

  return (
    <div className="app-shell login-page min-h-screen bg-black flex items-center justify-center">
      <div className="login-page-inner">
        <header className="login-page-header">
          <h1 className="snes-container-title has-galaxy-underline">{pt.appTitle}</h1>
          <p className="text-galaxy-color login-page-subtitle">{pt.login.subtitle}</p>
        </header>

        <form onSubmit={handleSubmit} className="snes-container snes-panel login-panel has-grey-bg">
          <div className="snes-form-group">
            <label htmlFor="password">{pt.login.password}</label>
            <div className={`snes-input login-input ${error ? 'is-error' : ''}`}>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder={pt.login.passwordPlaceholder}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <p className="text-plumber-color login-error" role="alert">
              {error}
            </p>
          )}

          <PrimaryButton type="submit" color="galaxy" className="w-full text-center login-submit">
            {pt.login.enter}
          </PrimaryButton>
        </form>
      </div>
    </div>
  )
}
