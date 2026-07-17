import type { ReactNode } from 'react'
import type { Character, ClassFeatures } from '../types/character'
import { getProfileById, PLAYER_PROFILES, type CharacterClass, type SubclassId } from '../data/profiles'
import {
  choiceLabels,
  getAttacksPerTurn,
  resolveFeatures,
} from '../lib/class-features'
import type { ClassFeatureDef } from '../data/class-features'
import { pt } from '../i18n/pt'
import { PixelScrollList, SectionTitle } from './ui'

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

function SummarySection({
  title,
  children,
  empty,
}: {
  title: string
  children: ReactNode
  empty?: boolean
}) {
  if (empty) return null
  return (
    <section className="admin-summary-section">
      <SectionTitle color="galaxy">{title}</SectionTitle>
      <div className="admin-summary-section-body">{children}</div>
    </section>
  )
}

function SummaryField({ label, value }: { label: string; value: string }) {
  if (!hasText(value)) return null
  return (
    <div className="admin-summary-field">
      <span className="admin-summary-label">{label}</span>
      <span className="admin-summary-value">{value}</span>
    </div>
  )
}

function featureLabel(feature: ClassFeatureDef): string {
  const labels = pt.features as Record<string, string>
  return labels[feature.labelKey] ?? feature.labelKey
}

function featureDetail(feature: ClassFeatureDef): string | undefined {
  if (!feature.detailKey) return undefined
  const labels = pt.features as Record<string, string>
  return labels[feature.detailKey]
}

function resolveProfileClass(character: Character): {
  characterClass?: CharacterClass
  subclassId?: SubclassId
} {
  const profile =
    (character.profileId ? getProfileById(character.profileId) : undefined) ??
    PLAYER_PROFILES.find(
      (entry) =>
        entry.characterName.toLowerCase() === character.name.trim().toLowerCase() &&
        entry.playerName.toLowerCase() === character.playerName.trim().toLowerCase(),
    )
  if (profile) {
    return { characterClass: profile.characterClass, subclassId: profile.subclassId }
  }
  return {}
}

function classFeatureRows(
  features: ClassFeatures,
  characterClass: CharacterClass | undefined,
  subclassId: SubclassId | undefined,
  level: string,
): { label: string; value: string }[] {
  const t = pt.classes
  const rows: { label: string; value: string }[] = []
  const choices = features.choices ?? {}

  if (characterClass === 'fighter' || characterClass === 'ranger') {
    rows.push({
      label: t.attacksPerTurn,
      value: String(getAttacksPerTurn(characterClass, level)),
    })
  }

  if (!characterClass) {
    // Fallback for unknown characters: legacy scalar fields only (skip Extra Attack)
    const push = (label: string, value: string | boolean | undefined) => {
      if (typeof value === 'boolean') {
        if (value) rows.push({ label, value: 'Sim' })
        return
      }
      if (hasText(value)) rows.push({ label, value: value! })
    }
    push(t.fightingStyle, features.fightingStyle)
    push(t.secondWind, features.secondWind)
    push(t.actionSurge, features.actionSurgeUses)
    push(t.bardicInspiration, features.bardicInspirationDie)
    push(t.bardicInspirationUses, features.bardicInspirationUses)
    push(t.jackOfAllTrades, features.jackOfAllTrades)
    push(t.favoredEnemy, features.favoredEnemy)
    push(t.favoredTerrain, features.favoredTerrain)
    push(t.arcaneRecovery, features.arcaneRecovery)
    push(t.ritualCasting, features.ritualCasting)
    push(t.spellbookNotes, features.spellbookNotes)
    return rows
  }

  const resolved = resolveFeatures(characterClass, subclassId, level)

  for (const feature of resolved) {
    if (feature.id === 'ritualCasting') {
      if (features.ritualCasting) {
        rows.push({ label: featureLabel(feature), value: 'Sim' })
      }
      continue
    }

    if (feature.kind === 'value' && feature.valueKey && feature.valueKey !== 'choices') {
      const value = features[feature.valueKey]
      if (typeof value === 'boolean') {
        if (value) rows.push({ label: featureLabel(feature), value: 'Sim' })
      } else if (hasText(value)) {
        rows.push({
          label: featureLabel(feature),
          value: [value!, featureDetail(feature)].filter(Boolean).join(' · '),
        })
      }
      continue
    }

    if (feature.kind === 'info') {
      rows.push({ label: featureLabel(feature), value: featureDetail(feature) ?? 'Ativo' })
      continue
    }

    if (feature.kind === 'choice' && feature.choiceKey) {
      const selected = choices[feature.choiceKey] ?? []
      if (selected.length === 0) continue
      rows.push({
        label: featureLabel(feature),
        value: choiceLabels(feature, selected).join(', '),
      })
    }
  }

  if (characterClass === 'wizard' && hasText(features.spellbookNotes)) {
    rows.push({ label: t.spellbookNotes, value: features.spellbookNotes! })
  }

  return rows
}

function formatCurrency(c: Character['currency']): string {
  const parts: string[] = []
  if (hasText(c.platinum) && c.platinum !== '0') parts.push(`${c.platinum} pl`)
  if (hasText(c.gold) && c.gold !== '0') parts.push(`${c.gold} po`)
  if (hasText(c.electrum) && c.electrum !== '0') parts.push(`${c.electrum} pe`)
  if (hasText(c.silver) && c.silver !== '0') parts.push(`${c.silver} pp`)
  if (hasText(c.copper) && c.copper !== '0') parts.push(`${c.copper} pc`)
  return parts.length ? parts.join(' · ') : '0'
}

export function CharacterSummary({ character }: { character: Character }) {
  const t = pt.sheet
  const tc = pt.classes
  const ta = pt.admin
  const { abilities } = character
  const { characterClass, subclassId } = resolveProfileClass(character)

  const cantrips = character.spells.filter((s) => s.isCantrip)
  const spells = character.spells.filter((s) => !s.isCantrip)
  const featureRows = classFeatureRows(
    character.classFeatures,
    characterClass,
    subclassId,
    character.level,
  )
  const slotLevels = Object.keys(character.spellSlots).sort((a, b) => Number(a) - Number(b))

  const visibleAttacks = character.attacks.filter((a) => hasText(a.name))
  const visibleMagicItems = character.magicItems.filter((i) => hasText(i.name))
  const visibleInventory = character.inventory.filter((i) => hasText(i.name))
  const hasAttacks = visibleAttacks.length > 0
  const hasMagicItems = visibleMagicItems.length > 0
  const hasInventory = visibleInventory.length > 0
  const hasSlots = slotLevels.some((lvl) => {
    const slot = character.spellSlots[lvl]
    return hasText(slot?.total) && slot.total !== '0'
  })

  return (
    <div className="admin-summary">
      <header className="admin-summary-header">
        <h2 className="snes-container-title text-white">{character.name}</h2>
        <p className="text-galaxy-color admin-summary-subtitle">
          {character.playerName && `${character.playerName} · `}
          {character.class}
          {character.subclass && ` · ${character.subclass}`}
          {character.level && ` · ${t.fields.level} ${character.level}`}
        </p>
        <p className="text-galaxy-color admin-summary-updated">
          {ta.updated} {new Date(character.updatedAt).toLocaleString('pt-BR')}
        </p>
      </header>

      <SummarySection title={t.identity}>
        <div className="admin-summary-grid">
          <SummaryField label={t.fields.race} value={character.race} />
          <SummaryField label={t.fields.subclass} value={character.subclass} />
          <SummaryField label={t.fields.background} value={character.background} />
          <SummaryField label={t.fields.alignment} value={character.alignment} />
        </div>
      </SummarySection>

      <SummarySection title={t.abilities}>
        <div className="admin-summary-abilities">
          {(
            [
              ['FOR', abilities.strength],
              ['DES', abilities.dexterity],
              ['CON', abilities.constitution],
              ['INT', abilities.intelligence],
              ['SAB', abilities.wisdom],
              ['CAR', abilities.charisma],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="admin-summary-ability">
              <span className="admin-summary-ability-label">{label}</span>
              <span className="admin-summary-ability-value">{value || '—'}</span>
            </div>
          ))}
        </div>
      </SummarySection>

      <SummarySection
        title={t.combat}
        empty={
          !hasText(character.hpCurrent) &&
          !hasText(character.hpMax) &&
          !hasText(character.armorClass) &&
          !hasText(character.initiative) &&
          !hasText(character.speed) &&
          !hasText(character.proficiencyBonus)
        }
      >
        <div className="admin-summary-grid">
          <SummaryField
            label={t.fields.hpCurrent}
            value={
              hasText(character.hpCurrent) || hasText(character.hpMax)
                ? `${character.hpCurrent || '?'} / ${character.hpMax || '?'}`
                : ''
            }
          />
          <SummaryField label={t.fields.armorClass} value={character.armorClass} />
          <SummaryField label={t.fields.speed} value={character.speed} />
          <SummaryField label={t.fields.initiative} value={character.initiative} />
          <SummaryField label={t.fields.proficiencyBonus} value={character.proficiencyBonus} />
        </div>
      </SummarySection>

      <SummarySection
        title={tc.spellcasting}
        empty={
          !hasText(character.spellAttackBonus) &&
          !hasText(character.spellSaveDC)
        }
      >
        <div className="admin-summary-grid">
          <SummaryField
            label={tc.spellAttackBonus}
            value={character.spellAttackBonus ?? ''}
          />
          <SummaryField
            label={tc.spellSaveDC}
            value={character.spellSaveDC ?? ''}
          />
        </div>
      </SummarySection>

      <SummarySection title={t.attacks} empty={!hasAttacks}>
        <PixelScrollList count={visibleAttacks.length}>
          <ul className="admin-summary-list">
            {visibleAttacks.map((a) => (
              <li key={a.id} className="admin-summary-list-item">
                <span className="text-white">{a.name}</span>
                <span className="text-galaxy-color">
                  {[a.bonus, a.damage, a.damageType].filter(hasText).join(' · ')}
                </span>
                {hasText(a.notes) && <span className="text-galaxy-color opacity-70">{a.notes}</span>}
              </li>
            ))}
          </ul>
        </PixelScrollList>
      </SummarySection>

      <SummarySection title={tc.cantrips} empty={cantrips.length === 0}>
        <PixelScrollList count={cantrips.length}>
          <ul className="admin-summary-list">
            {cantrips.map((s) => (
              <li key={s.id} className="admin-summary-list-item">
                <span className="text-white">{s.name}</span>
                <span className="text-galaxy-color">{s.school}</span>
                {hasText(s.notes) && <span className="text-galaxy-color opacity-70">{s.notes}</span>}
              </li>
            ))}
          </ul>
        </PixelScrollList>
      </SummarySection>

      <SummarySection
        title={characterClass === 'wizard' ? tc.preparedSpells : tc.knownSpells}
        empty={spells.length === 0}
      >
        <PixelScrollList count={spells.length}>
          <ul className="admin-summary-list">
            {spells.map((s) => (
              <li key={s.id} className="admin-summary-list-item">
                <span className="text-white">
                  {s.name}
                  {hasText(s.level) && ` (${s.level})`}
                </span>
                <span className="text-galaxy-color">
                  {[s.school, s.prepared ? tc.prepared : ''].filter(Boolean).join(' · ')}
                </span>
                {hasText(s.notes) && <span className="text-galaxy-color opacity-70">{s.notes}</span>}
              </li>
            ))}
          </ul>
        </PixelScrollList>
      </SummarySection>

      <SummarySection title={tc.spellSlots} empty={!hasSlots}>
        <div className="admin-summary-slots">
          {slotLevels.map((lvl) => {
            const slot = character.spellSlots[lvl]
            if (!slot || !hasText(slot.total) || slot.total === '0') return null
            return (
              <div key={lvl} className="admin-summary-slot">
                <span className="text-galaxy-color">{tc.slotLevel(Number(lvl))}</span>
                <span className="text-white">
                  {Number(slot.total) - Number(slot.used || 0)} / {slot.total}
                </span>
              </div>
            )
          })}
        </div>
      </SummarySection>

      <SummarySection title={ta.classFeatures} empty={featureRows.length === 0}>
        <PixelScrollList count={featureRows.length}>
          <div className="admin-summary-grid">
            {featureRows.map((row) => (
              <SummaryField key={`${row.label}-${row.value}`} label={row.label} value={row.value} />
            ))}
          </div>
        </PixelScrollList>
      </SummarySection>

      <SummarySection title={t.magicItems} empty={!hasMagicItems}>
        <PixelScrollList count={visibleMagicItems.length}>
          <ul className="admin-summary-list">
            {visibleMagicItems.map((i) => (
              <li key={i.id} className="admin-summary-list-item">
                <span className="text-white">
                  {i.name}
                  {i.attuned ? ` (${t.fields.attuned})` : ''}
                </span>
                {hasText(i.description) && (
                  <span className="text-galaxy-color opacity-80">{i.description}</span>
                )}
              </li>
            ))}
          </ul>
        </PixelScrollList>
      </SummarySection>

      <SummarySection title={t.currency}>
        <p className="text-white admin-summary-currency">{formatCurrency(character.currency)}</p>
      </SummarySection>

      <SummarySection title={t.inventory} empty={!hasInventory}>
        <PixelScrollList count={visibleInventory.length}>
          <ul className="admin-summary-list">
            {visibleInventory.map((i) => (
              <li key={i.id} className="admin-summary-list-item">
                <span className="text-white">
                  {i.name}
                  {hasText(i.quantity) && i.quantity !== '1' ? ` ×${i.quantity}` : ''}
                </span>
                {hasText(i.notes) && <span className="text-galaxy-color opacity-70">{i.notes}</span>}
              </li>
            ))}
          </ul>
        </PixelScrollList>
      </SummarySection>

      <SummarySection title={t.notes} empty={!hasText(character.notes)}>
        <p className="text-galaxy-color admin-summary-notes">{character.notes}</p>
      </SummarySection>
    </div>
  )
}
