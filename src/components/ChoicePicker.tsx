import { useMemo, useState } from 'react'
import type { FeatureOption } from '../data/class-features'
import { pt } from '../i18n/pt'
import { useSnesAccent } from '../contexts/SnesAccentContext'
import { snesButtonClass } from '../lib/snes'

interface ChoicePickerProps {
  label: string
  options: FeatureOption[]
  selected: string[]
  maxChoices: number
  onChange: (next: string[]) => void
  searchPlaceholder?: string
}

export function ChoicePicker({
  label,
  options,
  selected,
  maxChoices,
  onChange,
  searchPlaceholder,
}: ChoicePickerProps) {
  const [query, setQuery] = useState('')
  const accent = useSnesAccent()
  const t = pt.features
  const searchId = `choice-${label.replace(/\s+/g, '-').toLowerCase()}`

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const atCap = selected.length >= maxChoices
  const trimmedQuery = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!trimmedQuery) return []
    return options.filter(
      (o) =>
        !selectedSet.has(o.id) &&
        (o.label.toLowerCase().includes(trimmedQuery) ||
          o.id.toLowerCase().includes(trimmedQuery)),
    )
  }, [options, selectedSet, trimmedQuery])

  function add(id: string) {
    if (selectedSet.has(id) || atCap) return
    onChange([...selected, id])
    setQuery('')
  }

  function remove(id: string) {
    onChange(selected.filter((s) => s !== id))
  }

  const selectedOptions = selected
    .map((id) => options.find((o) => o.id === id))
    .filter((o): o is FeatureOption => Boolean(o))

  return (
    <div className="spell-picker choice-picker">
      <div className="sheet-field">
        <label className="sheet-label" htmlFor={searchId}>
          {label}
          <span className="choice-picker-count">
            {' '}
            ({selected.length}/{maxChoices})
          </span>
        </label>
        <div className="snes-input">
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder ?? t.searchChoices}
            disabled={atCap}
          />
        </div>
      </div>

      <div className="spell-picker-options">
        {filtered.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => add(entry.id)}
            className={`snes-pill ${snesButtonClass(accent)} snes-pill-muted`}
          >
            {entry.label}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-galaxy-color spell-picker-hint">
            {trimmedQuery
              ? t.noChoicesFound
              : atCap
                ? `${selected.length}/${maxChoices}`
                : t.searchChoicesHint ?? t.searchChoices}
          </p>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <ul className="spell-picker-selected">
          {selectedOptions.map((entry) => (
            <li key={entry.id} className="spell-picker-chip">
              <span className={`snes-pill ${snesButtonClass(accent)}`}>{entry.label}</span>
              <span className="spell-picker-chip-actions">
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
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
