import { useMemo, useState } from 'react'
import type { CharacterClass } from '../data/profiles'
import type { Spell } from '../types/character'
import type { SpellCatalogEntry } from '../types/spells'
import { searchSpells } from '../lib/spells'
import { pt } from '../i18n/pt'
import { useSnesAccent } from '../contexts/SnesAccentContext'
import { snesButtonClass } from '../lib/snes'

interface SpellPickerProps {
  characterClass: CharacterClass
  selected: Spell[]
  cantripsOnly: boolean
  showPrepared: boolean
  onChange: (spells: Spell[]) => void
}

function catalogToSpell(entry: SpellCatalogEntry, prepared: boolean): Spell {
  return {
    id: crypto.randomUUID(),
    catalogId: entry.id,
    name: entry.name,
    level: String(entry.level),
    school: entry.school,
    notes: '',
    prepared,
    isCantrip: entry.level === 0,
  }
}

export function SpellPicker({
  characterClass,
  selected,
  cantripsOnly,
  showPrepared,
  onChange,
}: SpellPickerProps) {
  const [query, setQuery] = useState('')
  const accent = useSnesAccent()
  const t = pt.classes
  const searchId = cantripsOnly ? 'cantrip-search' : 'spell-search'

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.catalogId ?? s.name)),
    [selected],
  )

  const options = useMemo(() => {
    if (!query.trim()) return []
    return searchSpells(characterClass, query, cantripsOnly)
  }, [characterClass, query, cantripsOnly])

  function toggleSpell(entry: SpellCatalogEntry) {
    const key = entry.id
    if (selectedIds.has(key)) {
      onChange(selected.filter((s) => (s.catalogId ?? s.name) !== key))
      return
    }
    const prepared = showPrepared ? true : false
    onChange([...selected, catalogToSpell(entry, prepared)])
  }

  function togglePrepared(spell: Spell) {
    onChange(
      selected.map((s) => (s.id === spell.id ? { ...s, prepared: !s.prepared } : s)),
    )
  }

  function removeSpell(spell: Spell) {
    onChange(selected.filter((s) => s.id !== spell.id))
  }

  return (
    <div className="spell-picker">
      <div className="sheet-field">
        <label className="sheet-label" htmlFor={searchId}>
          {cantripsOnly ? t.searchCantrips : t.searchSpells}
        </label>
        <div className="snes-input">
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={cantripsOnly ? t.searchCantrips : t.searchSpells}
          />
        </div>
      </div>

      <div className="spell-picker-options">
        {options.map((entry) => {
          const isSelected = selectedIds.has(entry.id)
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => toggleSpell(entry)}
              className={`snes-pill ${snesButtonClass(accent)} ${isSelected ? '' : 'snes-pill-muted'}`}
            >
              {entry.name}
              {!cantripsOnly && entry.level > 0 && (
                <span className="opacity-70"> · {entry.level}º</span>
              )}
            </button>
          )
        })}
        {options.length === 0 && (
          <p className="text-galaxy-color spell-picker-hint">
            {query.trim() ? t.noSpellsFound : cantripsOnly ? t.searchCantripsHint : t.searchSpellsHint}
          </p>
        )}
      </div>

      {selected.length > 0 && (
        <ul className="spell-picker-selected">
          {selected.map((spell) => (
            <li key={spell.id} className="spell-picker-chip">
              <span
                className={`snes-pill ${snesButtonClass(accent)} ${
                  spell.prepared || !showPrepared ? '' : 'snes-pill-muted'
                }`}
              >
                {spell.name}
              </span>
              <span className="spell-picker-chip-actions">
                {showPrepared && (
                  <button
                    type="button"
                    onClick={() => togglePrepared(spell)}
                    className="snes-link text-galaxy-color"
                    title={t.prepared}
                  >
                    P
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeSpell(spell)}
                  className="snes-link text-plumber-color"
                >
                  x
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
