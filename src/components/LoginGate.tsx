import { useEffect, useRef, useState, type FormEvent } from 'react'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import type { Engine, ISourceOptions } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'
import { authenticate, setSessionRole, type AuthRole } from '../lib/auth'
import { pt } from '../i18n/pt'
import { PrimaryButton } from './ui'

const LOGIN_PARTICLES: ISourceOptions = {
  fullScreen: { enable: false },
  fpsLimit: 60,
  detectRetina: true,
  particles: {
    number: {
      value: 22,
      density: { enable: false },
    },
    color: {
      value: ['#ff3f91', '#ffe066', '#55f7ff', '#7dff65', '#c46bff'],
    },
    shape: {
      type: ['circle', 'star'],
    },
    opacity: {
      value: { min: 0.25, max: 0.9 },
      animation: {
        enable: true,
        speed: 1.6,
        sync: false,
      },
    },
    size: {
      value: { min: 1, max: 4 },
      animation: {
        enable: true,
        speed: 3,
        sync: false,
      },
    },
    move: {
      enable: true,
      speed: { min: 0.2, max: 0.8 },
      direction: 'none',
      random: true,
      straight: false,
      outModes: { default: 'bounce' },
    },
    twinkle: {
      particles: {
        enable: true,
        frequency: 0.08,
        opacity: 1,
        color: { value: '#ffffff' },
      },
    },
  },
}

async function initializeLoginParticles(engine: Engine) {
  await loadSlim(engine)
}

function LoginMinotaur() {
  return (
    <div className="login-minotaur-scene" aria-hidden="true">
      <Particles
        id="login-minotaur-particles"
        className="login-minotaur-particles"
        options={LOGIN_PARTICLES}
      />
      <img className="login-minotaur" src="/sprites/minotaur-dance.gif" alt="" />
    </div>
  )
}

function IdleLogo() {
  const stageRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    const logo = logoRef.current
    if (!stage || !logo) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      logo.classList.add('is-reduced-motion')
      return
    }

    let frame = 0
    let previous = performance.now()
    let x = stage.clientWidth * 0.12
    let y = stage.clientHeight * 0.08
    let velocityX = 0.115
    let velocityY = 0.09
    let hue = Math.floor(Math.random() * 360)

    const clampPosition = () => {
      x = Math.max(0, Math.min(x, stage.clientWidth - logo.offsetWidth))
      y = Math.max(0, Math.min(y, stage.clientHeight - logo.offsetHeight))
    }

    const animate = (now: number) => {
      const elapsed = Math.min(now - previous, 32)
      previous = now
      x += velocityX * elapsed
      y += velocityY * elapsed

      const maxX = Math.max(0, stage.clientWidth - logo.offsetWidth)
      const maxY = Math.max(0, stage.clientHeight - logo.offsetHeight)
      let bounced = false

      if (x <= 0 || x >= maxX) {
        x = Math.max(0, Math.min(x, maxX))
        velocityX *= -1
        bounced = true
      }
      if (y <= 0 || y >= maxY) {
        y = Math.max(0, Math.min(y, maxY))
        velocityY *= -1
        bounced = true
      }
      if (bounced) {
        hue = (hue + 67 + Math.floor(Math.random() * 80)) % 360
        logo.style.setProperty('--idle-logo-hue', `${hue}deg`)
        logo.classList.remove('did-bounce')
        void logo.offsetWidth
        logo.classList.add('did-bounce')
      }

      logo.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
      frame = requestAnimationFrame(animate)
    }

    const observer = new ResizeObserver(clampPosition)
    observer.observe(stage)
    frame = requestAnimationFrame(animate)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={stageRef} className="login-idle-stage" aria-hidden="true">
      <div ref={logoRef} className="login-idle-logo">
        <img src="/sprites/high-priest-pipe.png" alt="" />
      </div>
    </div>
  )
}

export function LoginGate({ onLogin }: { onLogin: (role: AuthRole) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const isIdle = password.length === 0

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
    <ParticlesProvider init={initializeLoginParticles}>
      <div className={`app-shell login-page min-h-screen bg-black flex items-center justify-center ${isIdle ? 'is-idle' : ''}`}>
        {isIdle && <IdleLogo />}
        <div className="login-page-inner">
          <header className="login-page-header">
            <h1 className="snes-container-title has-galaxy-underline">{pt.appTitle}</h1>
            <p className="text-galaxy-color login-page-subtitle">{pt.login.subtitle}</p>
            <p className="login-danger">
              <span className="login-danger-symbol" aria-hidden="true" />
              {pt.login.nextSession}
              <span className="login-danger-symbol" aria-hidden="true" />
            </p>
            <p className="login-rumor">{pt.login.rumor}</p>
          </header>

          <form onSubmit={handleSubmit} className="snes-container snes-panel login-panel has-grey-bg">
            {isIdle && <LoginMinotaur />}
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
    </ParticlesProvider>
  )
}
