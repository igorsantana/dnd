import { useState } from 'react'
import { PLAYER_PROFILES } from '../data/profiles'
import { pt } from '../i18n/pt'
import { profileToSnesColor, snesTextClass } from '../lib/snes'
import { AvatarFrame } from './AvatarFrame'
import { InspirationScreen } from './save/InspirationScreen'

export type SharedPageId = 'notes' | 'bag'

interface ProfilePickerProps {
  onSelect: (profileId: string) => void
  onSelectShared: (page: SharedPageId) => void
}

const SHARED_TILES: {
  id: SharedPageId
  brand: string
  title: string
  image: string
}[] = [
  {
    id: 'notes',
    brand: pt.profiles.notesTileBrand,
    title: pt.profiles.notesTile,
    image: '/sprites/magic-scroll.png',
  },
  {
    id: 'bag',
    brand: pt.profiles.bagTileBrand,
    title: pt.profiles.bagTile,
    image: '/sprites/boi-bag-backpack.png',
  },
]

export function ProfilePicker({ onSelect, onSelectShared }: ProfilePickerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showRecap, setShowRecap] = useState(false)

  if (showRecap) {
    return <InspirationScreen onBack={() => setShowRecap(false)} />
  }

  return (
    <div className="app-shell profile-page min-h-screen bg-black flex flex-col items-center">
      <div className="profile-title-row">
        <h1 className="snes-container-title has-galaxy-underline text-center profile-title max-w-3xl">
          {pt.profiles.title}
        </h1>
        <button
          type="button"
          className="snes-button has-plumber-bg profile-recap-btn"
          onClick={() => setShowRecap(true)}
        >
          <img src="/sprites/recap-news.png" alt="" className="profile-recap-icon" />
          <span>{pt.profiles.recapNews}</span>
        </button>
      </div>

      <section className="profile-section">
        <div className="profile-grid profile-grid-characters">
          {PLAYER_PROFILES.map((profile) => {
            const isHovered = hoveredId === profile.id
            const snesColor = profileToSnesColor(profile.id)

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile.id)}
                onMouseEnter={() => setHoveredId(profile.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`profile-card ${isHovered ? 'scale-105' : ''} transition-transform`}
              >
                <AvatarFrame
                  src={profile.image}
                  alt={`${profile.playerName} — ${profile.characterName}`}
                  size="profile"
                />

                <div className="profile-card-text">
                  <p className={snesTextClass(snesColor)}>{profile.characterName}</p>
                  <p className="text-galaxy-color opacity-80">{profile.classLabel}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="profile-section profile-utilities">
        <h2 className="snes-container-title has-galaxy-underline profile-section-title">
          {pt.profiles.utilitiesTitle}
        </h2>
        <div className="profile-grid profile-grid-utilities">
          {SHARED_TILES.map((tile) => {
            const isHovered = hoveredId === tile.id
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => onSelectShared(tile.id)}
                onMouseEnter={() => setHoveredId(tile.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`profile-card profile-card-shared ${isHovered ? 'scale-105' : ''} transition-transform`}
              >
                <AvatarFrame src={tile.image} alt={tile.title} size="profile" />
                <div className="profile-card-text">
                  <p className={isHovered ? 'text-white' : 'text-galaxy-color'}>{tile.brand}</p>
                  <p className={snesTextClass('galaxy')}>{tile.title}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <p className="profile-subtitle text-galaxy-color">{pt.profiles.subtitle}</p>
    </div>
  )
}
