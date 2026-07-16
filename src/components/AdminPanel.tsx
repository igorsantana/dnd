import { useEffect, useState } from 'react'
import type { Character } from '../types/character'
import { downloadJson, loadAllCharacters } from '../lib/storage'
import { fetchCharactersFromCloud, mergeCharacterLists } from '../lib/remote-storage'
import { clearSession } from '../lib/auth'
import { pt } from '../i18n/pt'
import { PrimaryButton, SectionTitle } from './ui'
import { CharacterSummary } from './CharacterSummary'

export function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [characters, setCharacters] = useState<Character[]>(loadAllCharacters)
  const [selected, setSelected] = useState<Character | null>(null)
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'loading' | 'ok' | 'offline'>('idle')
  const t = pt.admin

  async function syncFromCloud() {
    setCloudStatus('loading')
    const { characters: remote, available } = await fetchCharactersFromCloud()
    const local = loadAllCharacters()
    const merged = mergeCharacterLists(local, remote)
    setCharacters(merged)
    setCloudStatus(available ? 'ok' : 'offline')
    if (selected) {
      const updated = merged.find((c) => c.id === selected.id || c.profileId === selected.profileId)
      setSelected(updated ?? null)
    }
  }

  useEffect(() => {
    void syncFromCloud()
  }, [])

  function handleExportOne(character: Character) {
    downloadJson(`${character.name.replace(/\s+/g, '-').toLowerCase()}.json`, character)
  }

  function handleLogout() {
    clearSession()
    onLogout()
  }

  return (
    <div className="app-shell admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <h1 className="snes-container-title has-galaxy-underline admin-title">{t.title}</h1>
          <p className="text-nature-color admin-cloud-status">
            {cloudStatus === 'ok' ? t.cloudSynced : cloudStatus === 'offline' ? t.cloudOffline : t.cloudHint}
          </p>
          <button
            type="button"
            onClick={() => void syncFromCloud()}
            className="snes-link text-ocean-color admin-refresh"
            disabled={cloudStatus === 'loading'}
          >
            {cloudStatus === 'loading' ? t.cloudLoading : t.cloudRefresh}
          </button>
        </div>

        <section className="admin-roster">
          <SectionTitle color="galaxy">{t.characters(characters.length)}</SectionTitle>
          {characters.length === 0 ? (
            <p className="text-galaxy-color admin-hint">{t.noCharacters}</p>
          ) : (
            <ul className="admin-character-list">
              {characters.map((character) => (
                <li key={character.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(character)}
                    className={`snes-container snes-panel has-grey-bg admin-character-card ${
                      selected?.id === character.id ? 'is-selected' : ''
                    }`}
                  >
                    <span className={selected?.id === character.id ? 'text-white' : 'text-galaxy-color'}>
                      {character.name}
                    </span>
                    <span className="text-galaxy-color admin-character-meta">
                      {character.class} {character.level && `· ${t.level} ${character.level}`}
                      {character.playerName && ` · ${character.playerName}`}
                    </span>
                    <span className="text-galaxy-color admin-character-date">
                      {t.updated} {new Date(character.updatedAt).toLocaleString('pt-BR')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button type="button" onClick={handleLogout} className="snes-link text-galaxy-color admin-logout">
          {t.logout}
        </button>
      </aside>

      <main className="admin-main">
        {selected ? (
          <>
            <div className="admin-detail-actions">
              <PrimaryButton onClick={() => handleExportOne(selected)} color="galaxy">
                {t.exportCharacter}
              </PrimaryButton>
            </div>
            <CharacterSummary character={selected} />
          </>
        ) : (
          <div className="admin-empty snes-container has-grey-bg">
            <p className="text-galaxy-color">{t.selectCharacter}</p>
          </div>
        )}
      </main>
    </div>
  )
}
