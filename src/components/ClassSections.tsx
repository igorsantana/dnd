import type { CharacterClass, SubclassId } from '../data/profiles'
import type { Character, ClassFeatures } from '../types/character'
import type { ClassFeatureDef } from '../data/class-features'
import { isCasterClass } from '../lib/classes'
import {
  bardicInspirationDie,
  bardicInspirationUses,
  classLevelForFeatures,
  effectiveMaxChoices,
  getAttacksPerTurn,
  parseLevel,
  resolveFeatures,
  resolveWarlockFeatures,
  songOfRestDie,
} from '../lib/class-features'
import { proficiencyBonusForLevel } from '../data/spell-slots'
import { pt } from '../i18n/pt'
import { SpellPicker } from './SpellPicker'
import { ChoicePicker } from './ChoicePicker'
import { SectionTitle, Field, TextArea, CheckboxField, EditableValue, StatDisplay } from './ui'

interface ClassSectionsSharedProps {
  characterClass: CharacterClass
  subclassId?: SubclassId
  character: Character
  warlockLevel?: number
  onUpdateSpells: (spells: Character['spells']) => void
  onUpdateSpellSlots: (slots: Character['spellSlots']) => void
  onUpdateClassFeatures: (features: ClassFeatures) => void
  onUpdateSpellcasting: (
    field: 'spellAttackBonus' | 'spellSaveDC',
    value: string,
  ) => void
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

export function SpellcastingSections({
  characterClass,
  character,
  warlockLevel = 0,
  onUpdateSpells,
  onUpdateSpellSlots,
  onUpdateSpellcasting,
}: Pick<
  ClassSectionsSharedProps,
  | 'characterClass'
  | 'character'
  | 'warlockLevel'
  | 'onUpdateSpells'
  | 'onUpdateSpellSlots'
  | 'onUpdateSpellcasting'
>) {
  const t = pt.classes
  if (!isCasterClass(characterClass)) return null

  const includeWarlock = warlockLevel > 0
  const cantrips = character.spells.filter((s) => s.isCantrip)
  const leveledSpells = character.spells.filter((s) => !s.isCantrip)

  function updateSlotTotal(level: string, value: string) {
    onUpdateSpellSlots({
      ...character.spellSlots,
      [level]: {
        ...character.spellSlots[level],
        total: value,
        used: character.spellSlots[level]?.used ?? '0',
      },
    })
  }

  const slotEntries = Object.entries(character.spellSlots).sort(
    ([a], [b]) => Number(a) - Number(b),
  )

  return (
    <>
      <div className="sheet-section">
        <SectionTitle>{t.spellcasting}</SectionTitle>
        <div className="field-grid field-grid-2">
          <EditableValue
            label={t.spellAttackBonus}
            value={character.spellAttackBonus}
            onChange={(value) => onUpdateSpellcasting('spellAttackBonus', value)}
            placeholder="+7"
          />
          <EditableValue
            label={t.spellSaveDC}
            value={character.spellSaveDC}
            onChange={(value) => onUpdateSpellcasting('spellSaveDC', value)}
            placeholder="15"
            type="number"
          />
        </div>
      </div>

      <div className="sheet-section">
        <SectionTitle>{t.spellSlots}</SectionTitle>
        <div className="spell-slots-row">
          {slotEntries.map(([level, slot]) => (
            <div key={level} className="spell-slot-group">
              <EditableValue
                label={t.slotLevel(Number(level))}
                value={slot.total}
                onChange={(v) => updateSlotTotal(level, v)}
                type="number"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="sheet-section spell-columns">
        <div>
          <SectionTitle>{t.cantrips}</SectionTitle>
          <SpellPicker
            characterClass={characterClass}
            includeWarlock={includeWarlock}
            selected={cantrips}
            cantripsOnly
            showPrepared={false}
            onChange={(next) => onUpdateSpells([...next, ...leveledSpells])}
          />
        </div>

        <div>
          <SectionTitle>
            {characterClass === 'wizard' ? t.preparedSpells : t.knownSpells}
          </SectionTitle>
          <SpellPicker
            characterClass={characterClass}
            includeWarlock={includeWarlock}
            selected={leveledSpells}
            cantripsOnly={false}
            showPrepared={characterClass === 'wizard'}
            onChange={(next) => onUpdateSpells([...cantrips, ...next])}
          />
        </div>
      </div>
    </>
  )
}

export function ClassFeatureSection({
  characterClass,
  subclassId,
  character,
  warlockLevel = 0,
  onUpdateClassFeatures,
}: Pick<
  ClassSectionsSharedProps,
  | 'characterClass'
  | 'subclassId'
  | 'character'
  | 'warlockLevel'
  | 'onUpdateClassFeatures'
>) {
  const t = pt.classes
  const classLevel = classLevelForFeatures(character, characterClass)
  const features = resolveFeatures(characterClass, subclassId, classLevel)
  const warlockFeatures = warlockLevel > 0 ? resolveWarlockFeatures(warlockLevel) : []
  const attacksPerTurn = getAttacksPerTurn(characterClass, classLevel)
  const showAttacksPerTurn = characterClass === 'fighter' || characterClass === 'ranger'
  const choices = character.classFeatures.choices ?? {}

  function updateFeature(key: keyof ClassFeatures, value: string | boolean) {
    onUpdateClassFeatures({ ...character.classFeatures, [key]: value })
  }

  function updateChoices(choiceKey: string, next: string[]) {
    const updatedChoices = { ...choices, [choiceKey]: next }
    const patch: ClassFeatures = {
      ...character.classFeatures,
      choices: updatedChoices,
    }
    if (choiceKey === 'fightingStyle') {
      patch.fightingStyle = next[0] ?? ''
    }
    if (choiceKey === 'favoredEnemy') {
      patch.favoredEnemy = next.join(', ')
    }
    if (choiceKey === 'favoredTerrain') {
      patch.favoredTerrain = next.join(', ')
    }
    onUpdateClassFeatures(patch)
  }

  function renderFeature(feature: ClassFeatureDef) {
    if (feature.id === 'bardicInspiration') {
      const die = bardicInspirationDie(classLevel)
      const uses = bardicInspirationUses(character.abilities.charisma)
      return (
        <div key={feature.id} className="feature-block">
          <StatDisplay
            label={featureLabel(feature)}
            value={`${uses}× ${die}`}
            detail={featureDetail(feature)}
          />
        </div>
      )
    }

    if (feature.id === 'songOfRest') {
      const die = songOfRestDie(classLevel)
      return (
        <div key={feature.id} className="feature-block">
          <StatDisplay
            label={featureLabel(feature)}
            value={die}
            detail={featureDetail(feature)}
          />
        </div>
      )
    }

    if (feature.id === 'jackOfAllTrades') {
      const halfProf = Math.floor(Number.parseInt(proficiencyBonusForLevel(parseLevel(character.level)).replace('+', ''), 10) / 2)
      return (
        <div key={feature.id} className="feature-block">
          <StatDisplay
            label={featureLabel(feature)}
            value={`+${halfProf}`}
            detail={featureDetail(feature)}
          />
        </div>
      )
    }

    if (feature.kind === 'value') {
      const key = feature.valueKey
      if (!key || key === 'choices' || key === 'ritualCasting') return null
      const value = String(character.classFeatures[key] ?? '')
      return (
        <div key={feature.id} className="feature-block">
          <Field
            label={featureLabel(feature)}
            value={value}
            onChange={(v) => updateFeature(key, v)}
            placeholder={featureDetail(feature)}
          />
          {featureDetail(feature) && (
            <p className="text-galaxy-color feature-detail">{featureDetail(feature)}</p>
          )}
        </div>
      )
    }

    if (feature.kind === 'info') {
      if (feature.id === 'ritualCasting') return null
      return (
        <div key={feature.id} className="feature-block">
          <p className="sheet-label">{featureLabel(feature)}</p>
          {featureDetail(feature) && (
            <p className="text-galaxy-color feature-detail feature-detail-flush">{featureDetail(feature)}</p>
          )}
        </div>
      )
    }

    if (feature.kind === 'choice') {
      if (!feature.choiceKey || !feature.options || !feature.maxChoices) return null
      return (
        <div key={feature.id} className="feature-block">
          <ChoicePicker
            label={featureLabel(feature)}
            options={feature.options}
            selected={choices[feature.choiceKey] ?? []}
            maxChoices={effectiveMaxChoices(feature, classLevel)}
            onChange={(next) => updateChoices(feature.choiceKey!, next)}
          />
          {featureDetail(feature) && (
            <p className="text-galaxy-color feature-detail">{featureDetail(feature)}</p>
          )}
        </div>
      )
    }

    return null
  }

  if (
    !showAttacksPerTurn &&
    features.length === 0 &&
    warlockFeatures.length === 0 &&
    characterClass !== 'wizard'
  ) {
    return null
  }

  return (
    <div className="sheet-section">
      <SectionTitle>{t.classFeatures}</SectionTitle>

      {showAttacksPerTurn && (
        <div className="feature-block">
          <StatDisplay label={t.attacksPerTurn} value={String(attacksPerTurn)} />
        </div>
      )}

      {features.map((feature) => renderFeature(feature))}

      {characterClass === 'wizard' && (
        <div className="feature-block field-grid field-grid-2">
          <CheckboxField
            label={t.ritualCasting}
            checked={character.classFeatures.ritualCasting ?? false}
            onChange={(v) => updateFeature('ritualCasting', v)}
          />
          <TextArea
            label={t.spellbookNotes}
            value={character.classFeatures.spellbookNotes ?? ''}
            onChange={(v) => updateFeature('spellbookNotes', v)}
            rows={2}
          />
        </div>
      )}

      {warlockFeatures.length > 0 && (
        <div className="feature-block warlock-feature">
          <p className="sheet-label warlock-feature-title">{t.warlockFeatures}</p>
          <div className="field-grid field-grid-2">
            <Field
              label={t.warlockPatron}
              value={character.classFeatures.warlockPatron ?? ''}
              onChange={(v) => updateFeature('warlockPatron', v)}
              placeholder={t.warlockPatronPlaceholder}
            />
            <Field
              label={t.pactMagicSlots}
              value={character.classFeatures.pactMagicSlots ?? ''}
              onChange={(v) => updateFeature('pactMagicSlots', v)}
              placeholder={t.pactMagicSlotsPlaceholder}
            />
          </div>
          <TextArea
            label={t.warlockNotes}
            value={character.classFeatures.warlockNotes ?? ''}
            onChange={(v) => updateFeature('warlockNotes', v)}
            rows={2}
            placeholder={t.warlockNotesPlaceholder}
          />
        </div>
      )}

      {warlockFeatures.map((feature) => (
        <div key={feature.id} className="feature-block warlock-feature">
          <p className="sheet-label warlock-feature-label">{featureLabel(feature)}</p>
          {featureDetail(feature) && (
            <p className="feature-detail feature-detail-flush warlock-feature-detail">
              {featureDetail(feature)}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

/** @deprecated Prefer SpellcastingSections + ClassFeatureSection for layout control */
export function ClassSections(props: ClassSectionsSharedProps) {
  return (
    <>
      <SpellcastingSections {...props} />
      <ClassFeatureSection {...props} />
    </>
  )
}
