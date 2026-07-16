import type { CSSProperties } from 'react'

interface FireballEffectProps {
  className?: string
}

export function FireballEffect({ className }: FireballEffectProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="fb-core" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#fff9c4" />
          <stop offset="50%" stopColor="#ffcc00" />
          <stop offset="75%" stopColor="#ff6600" />
          <stop offset="100%" stopColor="#cc2200" />
        </radialGradient>
        <radialGradient id="fb-outer" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#ff440000" />
          <stop offset="85%" stopColor="#ff660088" />
          <stop offset="100%" stopColor="#ff220044" />
        </radialGradient>
        <filter id="fb-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <filter id="fb-turbulence">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="2">
            <animate attributeName="baseFrequency" dur="0.4s" values="0.06;0.12;0.06" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="8" />
        </filter>
      </defs>

      {/* Outer fire halo */}
      <circle cx="60" cy="60" r="52" fill="url(#fb-outer)" className="fb-halo" />

      {/* Animated flame tongues */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <ellipse
          key={deg}
          cx="60"
          cy="60"
          rx="8"
          ry="28"
          fill="#ff7700"
          opacity="0.7"
          className="fb-tongue"
          style={{ '--r': `${deg}deg` } as CSSProperties}
        />
      ))}

      {/* Main fire body */}
      <circle cx="60" cy="60" r="36" fill="url(#fb-core)" filter="url(#fb-turbulence)" className="fb-body" />

      {/* Hot core */}
      <circle cx="52" cy="50" r="14" fill="#fffef0" opacity="0.9" className="fb-inner" />
      <circle cx="56" cy="46" r="6" fill="#ffffff" />

      {/* Trailing embers */}
      <circle cx="30" cy="75" r="4" fill="#ffaa00" className="fb-ember fb-ember-1" />
      <circle cx="20" cy="90" r="3" fill="#ff6600" className="fb-ember fb-ember-2" />
      <circle cx="40" cy="95" r="2.5" fill="#ffcc00" className="fb-ember fb-ember-3" />
    </svg>
  )
}
