import { useEffect, useState } from 'react'
import type { Character } from '../types/character'
import { mergeCharacterDefaults } from '../types/character'
import { downloadJson, loadAllCharacters, saveCharacter } from '../lib/storage'
import {
  fetchCharactersFromCloud,
  mergeCharacterLists,
  pushCharacterToCloud,
} from '../lib/remote-storage'
import { clearSession } from '../lib/auth'
import { applyLevelUpToCharacter, buildLevelUpPreview } from '../lib/level-up'
import { saveLevelUpEvent } from '../lib/level-up-store'
import { parseLevel } from '../lib/class-features'
import { pt } from '../i18n/pt'
import { getProfileById, PLAYER_PROFILES } from '../data/profiles'
import { PrimaryButton, SectionTitle } from './ui'
import { CharacterSummary } from './CharacterSummary'
import { ConfirmModal } from './ConfirmModal'

function normalizeCharacter(character: Character): Character {
  const profile =
    (character.profileId ? getProfileById(character.profileId) : undefined) ??
    PLAYER_PROFILES.find(
      (entry) =>
        entry.characterName.toLowerCase() === character.name.trim().toLowerCase() &&
        entry.playerName.toLowerCase() === character.playerName.trim().toLowerCase(),
    )

  if (!profile) return character
  return mergeCharacterDefaults(
    character,
    profile.characterClass,
    profile.classLabel,
    profile.subclassLabel,
    profile.subclassId,
  )
}

function needsCloudMigration(source: Character, normalized: Character): boolean {
  if ((!source.spellAttackBonus && Boolean(normalized.spellAttackBonus)) ||
    (!source.spellSaveDC && Boolean(normalized.spellSaveDC)) ||
    (source.attacks?.length ?? 0) !== normalized.attacks.length) {
    return true
  }
  if (source.subclass !== normalized.subclass) return true
  if (source.background !== normalized.background) return true
  if (JSON.stringify(source.spells ?? []) !== JSON.stringify(normalized.spells ?? [])) {
    return true
  }
  if (JSON.stringify(source.magicItems ?? []) !== JSON.stringify(normalized.magicItems ?? [])) {
    return true
  }
  const sourceStyle = source.classFeatures?.fightingStyle ?? ''
  const nextStyle = normalized.classFeatures?.fightingStyle ?? ''
  if (sourceStyle !== nextStyle) return true
  const sourceChoices = JSON.stringify(source.classFeatures?.choices ?? {})
  const nextChoices = JSON.stringify(normalized.classFeatures?.choices ?? {})
  return sourceChoices !== nextChoices
}

function normalizeCharacters(characters: Character[]): Character[] {
  return characters.map(normalizeCharacter)
}

export function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [characters, setCharacters] = useState<Character[]>(() =>
    normalizeCharacters(loadAllCharacters()),
  )
  const [selected, setSelected] = useState<Character | null>(null)
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'loading' | 'ok' | 'offline'>('idle')
  const [confirmLevelUp, setConfirmLevelUp] = useState(false)
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null)
  const t = pt.admin
  const lt = pt.levelUp
  const cloudUnavailableText = import.meta.env.DEV ? t.cloudLocal : t.cloudOffline

  const sharedLevel = characters.length
    ? Math.min(...characters.map((c) => parseLevel(c.level)))
    : 5
  const nextLevel = Math.min(20, sharedLevel + 1)

  function handleConfirmLevelUp() {
    const previews = characters.map((character) => {
      const profile =
        (character.profileId ? getProfileById(character.profileId) : undefined) ??
        PLAYER_PROFILES.find(
          (entry) =>
            entry.characterName.toLowerCase() === character.name.trim().toLowerCase() &&
            entry.playerName.toLowerCase() === character.playerName.trim().toLowerCase(),
        )
      const characterClass = profile?.characterClass ?? 'fighter'
      const subclassId = profile?.subclassId
      return buildLevelUpPreview(character, characterClass, subclassId)
    })

    const updated = characters.map((character) => {
      const profile =
        (character.profileId ? getProfileById(character.profileId) : undefined) ??
        PLAYER_PROFILES.find(
          (entry) =>
            entry.characterName.toLowerCase() === character.name.trim().toLowerCase() &&
            entry.playerName.toLowerCase() === character.playerName.trim().toLowerCase(),
        )
      const characterClass = profile?.characterClass ?? 'fighter'
      const next = applyLevelUpToCharacter(character, characterClass)
      return saveCharacter(next)
    })

    saveLevelUpEvent(previews)
    setCharacters(normalizeCharacters(updated))
    if (selected) {
      const refreshed = updated.find(
        (c) => c.id === selected.id || c.profileId === selected.profileId,
      )
      setSelected(refreshed ? normalizeCharacter(refreshed) : null)
    }
    setConfirmLevelUp(false)
    setLevelUpMessage(lt.done(updated.length))
  }

  async function syncFromCloud() {
    setCloudStatus('loading')
    const { characters: remote, available } = await fetchCharactersFromCloud()
    const local = loadAllCharacters()
    const merged = normalizeCharacters(mergeCharacterLists(local, remote))
    setCharacters(merged)
    setCloudStatus(available ? 'ok' : 'offline')
    if (selected) {
      const updated = merged.find((c) => c.id === selected.id || c.profileId === selected.profileId)
      setSelected(updated ?? null)
    }

    // Persist migrated spellcasting, subclass labels, and feature choices.
    await Promise.all(
      merged.map(async (character) => {
        const source = remote.find(
          (entry) => entry.id === character.id || entry.profileId === character.profileId,
        )
        if (!source) return
        if (needsCloudMigration(source, character)) {
          await pushCharacterToCloud(character)
        }
      }),
    )
  }

  useEffect(() => {
    void syncFromCloud()
  }, [])

  function handleExportOne(character: Character) {
    const profile = character.profileId ? getProfileById(character.profileId) : undefined
    const exportedCharacter = {
      ...character,
      ...(profile && { profileImageUrl: new URL(profile.image, window.location.origin).href }),
    }

    downloadJson(`${character.name.replace(/\s+/g, '-').toLowerCase()}.json`, exportedCharacter)
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
            {cloudStatus === 'ok'
              ? t.cloudSynced
              : cloudStatus === 'offline'
                ? cloudUnavailableText
                : t.cloudHint}
          </p>
          <button
            type="button"
            onClick={() => void syncFromCloud()}
            className="snes-link text-ocean-color admin-refresh"
            disabled={cloudStatus === 'loading'}
          >
            {cloudStatus === 'loading' ? t.cloudLoading : t.cloudRefresh}
          </button>
          <PrimaryButton
            type="button"
            color="ember"
            className="admin-level-up-btn"
            disabled={characters.length === 0}
            onClick={() => setConfirmLevelUp(true)}
          >
            {t.levelUpAll}
          </PrimaryButton>
          {levelUpMessage && (
            <p className="text-nature-color admin-level-up-msg" role="status">
              {levelUpMessage}
            </p>
          )}
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

      {confirmLevelUp && (
        <ConfirmModal
          title={lt.confirmTitle}
          body={lt.confirmBody(sharedLevel, nextLevel, characters.length)}
          confirmLabel={lt.confirm}
          cancelLabel={lt.cancel}
          onConfirm={handleConfirmLevelUp}
          onCancel={() => setConfirmLevelUp(false)}
        />
      )}
    </div>
  )
}
