import { useEffect, useMemo, useState } from 'react'
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
  /** Render all options as a direct list instead of a search box. */
  inline?: boolean
  /** Option confirmed by typing free text instead of being pushed into the chosen list. */
  customTextOptionId?: string
  /** Persisted free text for the option above. Non-empty means the option is selected (counts as 1 slot). */
  customText?: string
  onCustomText?: (text: string) => void
  customTextPlaceholder?: string
}

export function ChoicePicker({
  label,
  options,
  selected,
  maxChoices,
  onChange,
  searchPlaceholder,
  inline = false,
  customTextOptionId,
  customText = '',
  onCustomText,
  customTextPlaceholder,
}: ChoicePickerProps) {
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState(customText)
  const [editing, setEditing] = useState(false)
  const accent = useSnesAccent()
  const t = pt.features
  const searchId = `choice-${label.replace(/\s+/g, '-').toLowerCase()}`

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const customOption = customTextOptionId
    ? options.find((o) => o.id === customTextOptionId)
    : undefined
  const customSelected = Boolean(customText.trim())
  const usedSlots = selected.length + (customSelected ? 1 : 0)
  const atCap = usedSlots >= maxChoices
  const trimmedQuery = query.trim().toLowerCase()

  useEffect(() => {
    setDraft(customText)
  }, [customText])

  const filtered = useMemo(() => {
    if (!trimmedQuery) return []
    return options.filter((o) => {
      if (o.id === customTextOptionId) return false
      if (selectedSet.has(o.id)) return false
      return (
        o.label.toLowerCase().includes(trimmedQuery) ||
        o.id.toLowerCase().includes(trimmedQuery)
      )
    })
  }, [options, selectedSet, trimmedQuery, customTextOptionId])

  function add(id: string) {
    if (selectedSet.has(id) || atCap) return
    onChange([...selected, id])
    setQuery('')
  }

  function remove(id: string) {
    onChange(selected.filter((s) => s !== id))
  }

  function commitCustomText() {
    onCustomText?.(draft.trim())
  }

  function clearCustomText() {
    onCustomText?.('')
    setDraft('')
    setEditing(false)
  }

  const selectedOptions = selected
    .map((id) => options.find((o) => o.id === id))
    .filter((o): o is FeatureOption => Boolean(o))

  const chips = [
    ...selectedOptions.map((entry) => ({
      key: entry.id,
      label: entry.label,
      onRemove: () => remove(entry.id),
    })),
    ...(customSelected && customOption
      ? [
          {
            key: customOption.id,
            label: `${customOption.label}: ${customText}`,
            onRemove: clearCustomText,
          },
        ]
      : []),
  ]

  if (inline) {
    return (
      <div className="spell-picker choice-picker presence-options-list">
        <p className="sheet-label">
          {label}
          <span className="choice-picker-count"> ({usedSlots}/{maxChoices})</span>
        </p>
        <div className="spell-picker-options">
          {options.map((option) => {
            if (option.id === customTextOptionId) {
              const showInput = customSelected || editing
              return (
                <div key={option.id} className="choice-custom-option">
                  <button
                    type="button"
                    onClick={() => {
                      if (customSelected) {
                        clearCustomText()
                      } else {
                        setEditing(true)
                      }
                    }}
                    disabled={!customSelected && atCap}
                    className={`snes-pill ${snesButtonClass(accent)} ${
                      customSelected ? '' : 'snes-pill-muted'
                    }`}
                  >
                    {option.label}
                  </button>
                  {showInput && (
                    <div className="snes-input choice-custom-input">
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitCustomText}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            commitCustomText()
                            ;(e.target as HTMLInputElement).blur()
                          }
                        }}
                        placeholder={customTextPlaceholder ?? t.customChoice}
                      />
                    </div>
                  )}
                </div>
              )
            }
            const isSelected = selectedSet.has(option.id)
            const disabled = !isSelected && atCap
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => (isSelected ? remove(option.id) : add(option.id))}
                disabled={disabled}
                className={`snes-pill ${snesButtonClass(accent)} ${
                  isSelected ? '' : 'snes-pill-muted'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        {chips.length > 0 && (
          <ul className="spell-picker-selected">
            {chips.map((chip) => (
              <li key={chip.key} className="spell-picker-chip">
                <span className={`snes-pill ${snesButtonClass(accent)}`}>{chip.label}</span>
                <span className="spell-picker-chip-actions">
                  <button
                    type="button"
                    onClick={chip.onRemove}
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
        {!atCap && (
          <div className="snes-input">
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder ?? t.searchChoices}
            />
          </div>
        )}
      </div>

      {!atCap && (
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
          {trimmedQuery && filtered.length === 0 && (
            <p className="text-galaxy-color spell-picker-hint">
              {t.noChoicesFound}
            </p>
          )}
        </div>
      )}

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