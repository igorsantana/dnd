import { useEffect, useState, type CSSProperties } from 'react'
import { MageCaster } from './save/MageCaster'
import { FireballEffect } from './save/FireballEffect'
import { InspirationScreen } from './save/InspirationScreen'

interface SaveCelebrationProps {
  accentColor: string
  onDone: () => void
}

const CELEBRATION_MS = 4800

export function SaveCelebration({ accentColor, onDone }: SaveCelebrationProps) {
  const [phase, setPhase] = useState<'celebration' | 'message'>('celebration')

  useEffect(() => {
    if (phase !== 'celebration') return
    const timer = setTimeout(() => setPhase('message'), CELEBRATION_MS)
    return () => clearTimeout(timer)
  }, [phase])

  if (phase === 'message') {
    return <InspirationScreen onBack={onDone} />
  }

  const embers = Array.from({ length: 24 }, (_, i) => i)
  const style = { '--accent': accentColor } as CSSProperties

  return (
    <div className="save-overlay" aria-live="polite" style={style}>
      <div className="save-scene">
        {/* Dungeon Master pixel sprite */}
        <div className="mage-caster-wrap">
          <MageCaster />
          <div className="fireball-scream">
            <span className="fireball-scream-text">FIREBALL!</span>
          </div>
        </div>

        {/* Fireball projectile */}
        <div className="fireball-projectile">
          <FireballEffect className="fireball-svg" />
        </div>

        {/* Explosion */}
        <div className="explosion-core" />
        <div className="explosion-flash" />
        <div className="explosion-ring explosion-ring-1" />
        <div className="explosion-ring explosion-ring-2" />
        <div className="explosion-ring explosion-ring-3" />

        {embers.map((i) => (
          <span
            key={i}
            className="explosion-ember"
            style={{ '--i': i, '--a': `${(i / 24) * 360}deg` } as CSSProperties}
          />
        ))}

        {/* Smoke wisps */}
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="explosion-smoke" style={{ '--si': i } as CSSProperties} />
        ))}
      </div>

      <p className="save-message">Valeu, ganhou ponto de inspiração</p>
      <div className="save-fade-to-black" aria-hidden />
    </div>
  )
}
